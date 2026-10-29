import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../web/core.mjs';
import {entrySelection,entryCategoryPicker} from '../web/category-ui.mjs';
import {dropLocation} from '../web/category-drag.mjs';

test('默认分类方案：8 个支出一级、2 个收入一级，名称、顺序与二级关系保持一致',()=>{
  const d=C.fresh();
  assert.deepEqual(d.categories.filter(c=>c.flow==='expense'&&!c.parentID).map(c=>c.name),['餐饮','交通','购物','居家','休闲','健康','其他支出','学习进修']);
  const food=d.categories.find(c=>c.name==='餐饮');
  assert.deepEqual(d.categories.filter(c=>c.parentID===food.id).map(c=>c.name),['买菜做饭','米面粮油','水果','咖啡茶饮','外出美食']);
  assert.equal(d.categories.length,41);
  assert.equal(C.matchIcon('外网会员'),'globe');assert.equal(C.matchIcon('科学上网'),'network');
});
test('编辑二级流水时定位所属一级；切换收支或账本后不残留无效分类',()=>{
  const d=C.fresh(),child=d.categories.find(c=>c.name==='米面粮油');
  const selection=entrySelection(d,d.books[0].id,'expense',child.id);
  assert.equal(selection.category.id,child.id);assert.equal(selection.parent.name,'餐饮');
  const income=entrySelection(d,d.books[0].id,'income',child.id);
  assert.equal(income.category.flow,'income');assert.equal(income.parent.name,'工作收入');
  const second={id:C.uid(),name:'空账本',icon:'book.closed.fill'};d.books.push(second);
  assert.equal(entrySelection(d,second.id,'expense',child.id).category,undefined);
  const picker=entryCategoryPicker(d,d.books[0].id,'expense',child.id);
  assert.ok(picker.includes('aria-label="不细分"'));assert.ok(picker.includes('aria-label="一级分类"'));assert.ok(picker.includes('aria-label="二级分类"'));
});
test('一级移动携带子分类展示顺序；二级换父级、提升保留流水 ID 和总金额',()=>{
  const d=C.sample(),food=d.categories.find(c=>c.name==='餐饮'),transport=d.categories.find(c=>c.name==='交通'),child=d.categories.find(c=>c.name==='外出美食');
  const before=d.entries.map(e=>[e.id,e.categoryID,e.cents]);
  const moved=C.moveCategory(d,transport.id,null,food.id);
  assert.equal(moved.categories.filter(c=>!c.parentID)[0].id,transport.id);
  assert.equal(moved.categories.filter(c=>c.parentID===transport.id).length,4);
  const reparented=C.moveCategory(moved,child.id,transport.id);
  assert.equal(reparented.categories.find(c=>c.id===child.id).parentID,transport.id);
  const promoted=C.moveCategory(reparented,child.id,null,food.id);
  assert.equal(promoted.categories.find(c=>c.id===child.id).parentID,undefined);
  assert.deepEqual(promoted.entries.map(e=>[e.id,e.categoryID,e.cents]),before);
  assert.throws(()=>C.moveCategory(d,food.id,transport.id),/先移走二级分类/);
});
test('拖到二级行上半部放前面，下半部放后面；空父级位置表示提升一级',()=>{
  const row={dataset:{dropParent:'parent',dropBefore:'child',dropAfter:'next'},getBoundingClientRect:()=>({top:100,height:50})};
  assert.deepEqual(dropLocation(row,110),{parentID:'parent',beforeID:'child'});
  assert.deepEqual(dropLocation(row,140),{parentID:'parent',beforeID:'next'});
  assert.deepEqual(dropLocation({dataset:{dropParent:'',dropBefore:'target'},getBoundingClientRect:row.getBoundingClientRect},110),{parentID:null,beforeID:'target'});
});
