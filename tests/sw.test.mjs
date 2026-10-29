import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function worker(root='https://ledger.example/'){
  const listeners={},reads=[],opened=[];
  const cache={match:async url=>{reads.push(url);return url===root?new Response('cached app'):undefined;}};
  const context={URL,Request,Response,caches:{open:async name=>{opened.push(name);return cache;}},fetch:async()=>{throw new Error('network unavailable');},self:{registration:{scope:root},location:{origin:'https://ledger.example'},addEventListener:(type,handler)=>listeners[type]=handler}};
  vm.runInNewContext(readFileSync(new URL('../web/sw.js',import.meta.url),'utf8'),context);
  return {listeners,reads,root,opened};
}
test('离线导航使用未重定向的根页面，兼容 Pages 的 index.html 跳转',async()=>{
  const {listeners,reads,root}=worker();let response;
  listeners.fetch({request:{method:'GET',url:root,mode:'navigate'},respondWith:promise=>response=promise});
  assert.equal(await (await response).text(),'cached app');assert.deepEqual(reads,[root]);
});
test('子目录离线导航返回本目录页面，不与其他安装目录共用程序缓存',async()=>{
  const a=worker('https://ledger.example/first/'),b=worker('https://ledger.example/second/');
  for(const instance of [a,b]){
    let response;
    instance.listeners.fetch({request:{method:'GET',url:instance.root,mode:'navigate'},respondWith:p=>response=p});
    assert.equal(await (await response).text(),'cached app');
    assert.deepEqual(instance.reads,[instance.root]);
  }
  assert.notEqual(a.opened[0],b.opened[0]);
});
test('Service Worker 不接管写入请求或第三方请求',()=>{
  const {listeners,root}=worker();let intercepted=false;
  for(const request of [{method:'POST',url:root},{method:'GET',url:'https://third.example/file.js'}])listeners.fetch({request,respondWith:()=>intercepted=true});
  assert.equal(intercepted,false);
});
