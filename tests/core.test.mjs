import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../web/core.mjs';

test('金额以分解析，拒绝小数溢出、指数和零；大额汇总保持精确',()=>{
  assert.equal(C.parseMoney('12.30'),1230);assert.equal(C.parseMoney('0.01'),1);
  for(const bad of ['0','-1','1.001','1e2','1,000','1000000000','NaN'])assert.equal(C.parseMoney(bad),null);
  const sum=C.sumEntries(Array.from({length:100000},()=>({cents:C.MAX_CENTS,flow:'expense'})),'expense');
  assert.equal(sum,9999999999900000n);assert.equal(C.money(sum,false),'99999999999000.00');
});
test('生成虚构备份并统一 UUID 大小写；导出日期兼容 ISO8601',()=>{
  // Entirely synthetic data: never read a personal backup or external fixture.
  const synthetic=C.sample();
  for(const item of [...synthetic.books,...synthetic.categories,...synthetic.entries]){
    for(const key of ['id','bookID','categoryID','parentID']) if(item[key]) item[key]=item[key].toUpperCase();
  }
  const data=C.validate(synthetic);
  assert.ok(data.entries.every(e=>e.id===e.id.toLowerCase()));
  assert.ok(data.books.length);assert.ok(data.entries.length);
  assert.ok(data.entries.every(e=>/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(e.createdAt)));
  assert.deepEqual(C.validate(JSON.parse(JSON.stringify(data))),data);
});
test('拒绝未知版本、重复编号、无效关系、三级分类和无效日期',()=>{
  let d=C.fresh();assert.throws(()=>C.validate({...d,schemaVersion:2}));
  let copy=C.clone(d);copy.books.push({...copy.books[0]});assert.throws(()=>C.validate(copy));
  copy=C.clone(d);copy.categories[0].bookID=C.uid();assert.throws(()=>C.validate(copy));
  copy=C.clone(d);const children=copy.categories.filter(c=>c.parentID);children[0].parentID=children[1].id;assert.throws(()=>C.validate(copy));
  assert.equal(C.parseDay('2026-02-29'),null);assert.ok(C.parseDay('2024-02-29'));assert.equal(C.parseDay('2026-13-01'),null);
});
test('导入创建独立编号的新账本，保留原记录，超限数据不接纳',()=>{
  const initial=C.sample(),incoming=C.sample(),merged=C.mergeBooks(initial,incoming);
  assert.equal(merged.entries.length,initial.entries.length+incoming.entries.length);
  assert.equal(merged.books.length,4);assert.ok(merged.books[2].name.endsWith('（导入）'));
  assert.equal(new Set(merged.entries.map(e=>e.id)).size,merged.entries.length);
  assert.deepEqual(merged.entries.slice(0,initial.entries.length),initial.entries);
  incoming.entries[0].cents=C.MAX_CENTS+1;assert.throws(()=>C.mergeBooks(initial,incoming));
});
test('周一为每周开始；自然季度、跨年和月末移动正确',()=>{
  assert.deepEqual(C.periodRange('week','2026-11-01'),{start:'2026-10-26',end:'2026-11-02',last:'2026-11-01'});
  assert.equal(C.periodRange('quarter','2026-10-29').start,'2026-10-01');
  assert.equal(C.periodRange('quarter','2026-10-29').end,'2027-01-01');
  assert.equal(C.movePeriod('month','2026-01-31',1),'2026-02-01');
  assert.equal(C.movePeriod('year','2026-10-29',-1),'2025-01-01');
});
test('一级统计包含子分类；二级统计未细分不遗漏，移动保留关联',()=>{
  const d=C.fresh(),parent=d.categories[0],child=d.categories.find(c=>c.parentID===parent.id);
  d.entries=[parent,child].map((c,i)=>({id:C.uid(),bookID:c.bookID,categoryID:c.id,flow:c.flow,cents:(i+1)*100,day:'2026-10-29',note:'',createdAt:'2026-10-29T00:00:00Z'}));
  assert.equal(C.totals(d,d.entries,'expense')[0].cents,300n);
  assert.equal(C.totals(d,d.entries,'expense',true).reduce((s,x)=>s+x.cents,0n),300n);
  assert.ok(C.totals(d,d.entries,'expense',true).some(x=>x.name.includes('未细分')));
  const moved=C.moveCategory(d,child.id,null,parent.id);assert.equal(moved.categories.find(c=>c.id===child.id).parentID,undefined);
  assert.equal(moved.entries[1].categoryID,child.id);
  assert.throws(()=>C.moveCategory(d,parent.id,child.id));
});
test('CSV 转义引号、换行和公式；按备注原样保存',()=>{
  const d=C.sample();d.entries[0].note='=HYPERLINK("test")\n第二行';
  const text=C.csv(d);assert.ok(text.startsWith('\uFEFF'));assert.ok(text.includes('"\'=HYPERLINK(""test"")\n第二行"'));
});
