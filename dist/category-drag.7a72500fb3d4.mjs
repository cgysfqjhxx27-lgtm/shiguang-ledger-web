export function dropLocation(element,clientY){
  const row=element.dataset,rect=element.getBoundingClientRect();
  return {parentID:row.dropParent||null,beforeID:('dropAfter' in row&&clientY>=rect.top+rect.height/2?row.dropAfter:row.dropBefore)||null};
}
// Pointer Events cover mouse, touch and stylus without depending on HTML drag-and-drop on iPhone.
export function attachCategoryDrag(onDrop,canDrag=()=>true){
  let gesture=null,suppressedUntil=0,scrollFrame=0;
  function target(){
    if(!gesture?.active)return;
    const hit=document.elementFromPoint(gesture.x,gesture.y)?.closest('[data-drop-parent]');
    const found=hit?.closest('.category-sort-row[data-drop-parent]')||hit;
    gesture.target?.classList.remove('is-drop-target','drop-after');gesture.target=found;
    if(found){found.classList.add('is-drop-target');if('dropAfter' in found.dataset&&gesture.y>=found.getBoundingClientRect().top+found.getBoundingClientRect().height/2)found.classList.add('drop-after');}
  }
  function scroll(){
    if(!gesture?.active)return;
    const edge=90,delta=gesture.y<edge?-7:gesture.y>innerHeight-edge?7:0;
    if(delta){window.scrollBy(0,delta);target();}
    scrollFrame=requestAnimationFrame(scroll);
  }
  function clear(){
    if(!gesture)return;
    const old=gesture;gesture=null;old.target?.classList.remove('is-drop-target','drop-after');old.row?.classList.remove('is-dragging');old.ghost?.remove();cancelAnimationFrame(scrollFrame);
    try{if(old.handle.hasPointerCapture(old.pointerID))old.handle.releasePointerCapture(old.pointerID);}catch{}
    document.body.classList.remove('category-dragging');
  }
  document.addEventListener('pointerdown',event=>{
    const handle=event.target.closest('[data-drag-id]');if(!handle||!canDrag()||event.button!==0||event.isPrimary===false)return;
    event.preventDefault();gesture={id:handle.dataset.dragId,pointerID:event.pointerId,handle,row:handle.closest('.category-sort-row'),startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,active:false};
    try{handle.setPointerCapture(event.pointerId);}catch{}
  });
  document.addEventListener('pointermove',event=>{
    if(!gesture||event.pointerId!==gesture.pointerID)return;
    gesture.x=event.clientX;gesture.y=event.clientY;
    if(!gesture.active&&Math.hypot(gesture.x-gesture.startX,gesture.y-gesture.startY)>5){
      gesture.active=true;gesture.row?.classList.add('is-dragging');document.body.classList.add('category-dragging');
      const ghost=document.createElement('div');ghost.className='category-drag-ghost';ghost.setAttribute('aria-hidden','true');ghost.textContent=gesture.row?.querySelector('.sort-name')?.textContent||'移动分类';document.body.append(ghost);gesture.ghost=ghost;scroll();
    }
    if(gesture.active){event.preventDefault();gesture.ghost.style.transform=`translate(${gesture.x+12}px,${gesture.y+12}px)`;target();}
  },{passive:false});
  document.addEventListener('pointerup',async event=>{
    if(!gesture||event.pointerId!==gesture.pointerID)return;
    const {id,active,target:destination}=gesture;
    const location=destination&&dropLocation(destination,event.clientY);
    if(active)suppressedUntil=performance.now()+400;
    clear();if(active&&location)await onDrop(id,location.parentID,location.beforeID);
  });
  document.addEventListener('pointercancel',clear);
  document.addEventListener('contextmenu',event=>{if(event.target.closest('[data-drag-id]'))event.preventDefault();});
  window.addEventListener('blur',clear);
  return {suppressClick:()=>performance.now()<suppressedUntil};
}
