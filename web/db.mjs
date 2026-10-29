import {validate,clone} from './core.mjs';
const DB_NAME='shiguang-ledger', DB_VERSION=1;
let opening;
export function openDB() {
  if(!opening) opening=new Promise((resolve,reject)=>{
    if(!globalThis.indexedDB) {reject(new Error('当前浏览器无法保存账本，请使用 Safari 普通浏览模式。'));return;}
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=()=>{ const db=request.result;db.createObjectStore('state');db.createObjectStore('snapshots',{keyPath:'id'}); };
    request.onsuccess=()=>{request.result.onversionchange=()=>{request.result.close();opening=null;};resolve(request.result);};
    request.onerror=()=>{opening=null;reject(request.error);};
    request.onblocked=()=>{reject(new Error('请关闭其他拾光记账窗口后重试。'));opening=null;};
  });
  return opening;
}
function result(request) { return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);}); }
export async function readLedger() { const db=await openDB(); return result(db.transaction('state').objectStore('state').get('ledger')); }
export async function listSnapshots() {
  const db=await openDB(), all=await result(db.transaction('snapshots').objectStore('snapshots').getAll());
  return all.sort((a,b)=>(b.revision||0)-(a.revision||0)||b.createdAt.localeCompare(a.createdAt));
}
// Read/compare/write and snapshot commit in a single transaction. Stale tabs cannot overwrite newer edits.
export async function writeLedger(data,expectedRevision,{preserve=false}={}) {
  const clean=validate(data), db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(['state','snapshots'],'readwrite'), state=tx.objectStore('state'), snapshots=tx.objectStore('snapshots');
    let failure, saved;
    const request=state.get('ledger');
    request.onsuccess=()=>{
      const old=request.result;
      if((old?.revision||0)!==expectedRevision) {failure=new Error('其他窗口已更新账本。请关闭编辑窗口，再点击“重新读取”，确认后重试。');tx.abort();return;}
      if(old) snapshots.put({id:crypto.randomUUID(),createdAt:new Date().toISOString(),revision:old.revision,data:old.data,preserved:preserve});
      saved={revision:expectedRevision+1,data:clean,updatedAt:new Date().toISOString()};state.put(saved,'ledger');
      const all=snapshots.getAll();
      all.onsuccess=()=>all.result.filter(s=>!s.preserved).sort((a,b)=>(b.revision||0)-(a.revision||0)||b.createdAt.localeCompare(a.createdAt)).slice(30).forEach(s=>snapshots.delete(s.id));
    };
    tx.oncomplete=()=>resolve(clone(saved));
    tx.onabort=()=>reject(failure||tx.error||new Error('保存失败，账本未更改。请先导出备份并检查设备空间。'));
    tx.onerror=()=>{ /* onabort reports the transaction failure */ };
  });
}
export async function markExport() {
  const db=await openDB(); return new Promise((resolve,reject)=>{
    const tx=db.transaction('state','readwrite');tx.objectStore('state').put(new Date().toISOString(),'lastExport');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
  });
}
export async function lastExport() { const db=await openDB();return result(db.transaction('state').objectStore('state').get('lastExport')); }
