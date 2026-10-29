import * as C from './core.mjs';
import * as DB from './db.mjs';
import {symbolSVG} from './symbols.mjs';
import {entryForm,entryCategoryPicker,entrySelection,categoryManagement} from './category-ui.mjs';
import {attachCategoryDrag} from './category-drag.mjs';

const VERSION='1.1.0', BUILD='__BUILD_ID__';
const $=selector=>document.querySelector(selector), h=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const paths={records:'M3 4h7v7H3z M14 4h7v4h-7z M3 15h7v5H3z M14 12h7v8h-7z',statistics:'M11 3a9 9 0 1 0 10 10h-10z M15 3v6h6a8 8 0 0 0-6-6z',books:'M4 4h5v16H4z M12 4h3v16h-3z M17 5l3-1 3 15-3 1z',settings:'M4 7h16 M4 17h16 M9 4v6 M16 14v6',plus:'M12 5v14 M5 12h14',chevron:'M9 5l7 7-7 7',search:'M20 20l-5-5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',close:'M6 6l12 12 M6 18L18 6',shield:'M12 3l8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6z M8 12l3 3 5-6',up:'M7 17L17 7 M7 7h10v10',down:'M7 7l10 10 M7 17h10V7',edit:'M15 4l5 5 M4 20l5-1L21 7l-4-4L5 15z',trash:'M4 6h16 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',download:'M12 3v12 M7 10l5 5 5-5 M4 17v4h16v-4',upload:'M12 16V4 M7 9l5-5 5 5 M4 17v4h16v-4',refresh:'M20 8a8 8 0 1 0 0 8 M20 3v5h-5',leaf:'M20 3C8 2 3 7 5 15c7 7 16 0 15-12z M4 21l11-12'};
const icon=(name,extra='')=>`<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}><path d="${paths[name]||paths.leaf}"/></svg>`;
const navs=[['records','明细'],['statistics','统计'],['books','账本'],['settings','设置']];
const state={data:null,revision:0,bookID:'',screen:'records',period:'month',anchor:C.dayString(),query:'',flow:'all',statsFlow:'expense',level:'first',parent:'',chart:'donut',demo:false,error:'',raw:null,saving:false,stale:false,limit:60,online:navigator.onLine,offlineReady:false,swError:'',waiting:null,sw:null,dbError:false};
let toastTimer,confirmAction,importData,channel;
try{channel=new BroadcastChannel('shiguang-ledger');channel.onmessage=()=>{if(!state.demo){state.stale=true;renderBanners();}};}catch{}
const book=()=>state.data?.books.find(b=>b.id===state.bookID)||state.data?.books[0];
const entries=()=>C.periodEntries(state.data,state.bookID,state.period,state.anchor);
const badge=(symbol,flow='')=>`<span class="badge ${flow}">${symbolSVG(symbol)}</span>`;
const opt=(value,label,selected)=>`<option value="${h(value)}" ${value===selected?'selected':''}>${h(label)}</option>`;
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4500);}
function empty(title,description,action='entry',label='记一笔',symbol='🌱'){return `<div class="empty"><div class="empty-icon">${symbol}</div><h3>${h(title)}</h3><p>${h(description)}</p>${action?`<button class="primary" data-action="${action}">${h(label)}</button>`:''}</div>`;}
function showDialog(title,body,className=''){const modal=$('#modal');modal.className=className;document.body.classList.add('modal-open');modal.innerHTML=`<div class="modal-head"><h2 id="modal-title">${h(title)}</h2><button class="icon-button" data-action="close" aria-label="关闭">${icon('close')}</button></div><div class="modal-body">${body}</div>`;if(!modal.open)modal.showModal();}
function closeDialog(){if(!state.saving){$('#modal').close();document.body.classList.remove('modal-open');confirmAction=null;importData=null;}}
function confirmDialog(title,message,callback,label='确认'){confirmAction=callback;showDialog(title,`<p class="settings-note">${h(message)}</p><p class="form-error" role="alert"></p><div class="form-actions"><button class="secondary" data-action="close">取消</button><button class="primary" data-action="confirm">${h(label)}</button></div>`);}
function report(error){const el=$('#modal[open] .form-error');if(el)el.textContent=error.message||String(error);else toast(error.message||String(error));}
function busy(value){state.saving=value;$('#modal')?.querySelectorAll('button,input,select,textarea').forEach(el=>el.disabled=value);}
async function commit(change,{recovery=false}={}){
  if(state.saving) return false;
  if(state.error&&!recovery){report(new Error('为保护账本，已停止写入。请前往设置恢复备份。'));return false;}
  busy(true);
  try{
    let next=C.clone(state.data);const changed=change(next);if(changed) next=changed;next=C.validate(next);
    if(!state.demo){const saved=await DB.writeLedger(next,state.revision,{preserve:recovery});state.revision=saved.revision;state.raw=saved;channel?.postMessage({revision:saved.revision});}
    state.data=next;state.error='';state.stale=false;if(!state.data.books.some(b=>b.id===state.bookID))state.bookID=state.data.books[0].id;
    return true;
  }catch(error){report(error);return false;}finally{busy(false);}
}
function banners(){return `${state.demo?'<div class="banner"><span>✨ 示例模式 · 仅供体验，修改不会保存到正式账本</span><button data-action="demo">开始正式记账</button></div>':''}${state.stale?'<div class="banner warning"><span>其他窗口已更新账本，请重新读取后再编辑。</span><button data-action="reload-data">重新读取</button></div>':''}${state.error?`<div class="banner error"><span>账本暂时无法读取，原数据已保留。${h(state.error)}</span><button data-action="nav" data-screen="settings">恢复备份</button></div>`:''}${state.waiting?'<div class="banner"><span>新版本已下载。保存当前编辑后，可更新程序。</span><button data-action="update">更新并重新打开</button></div>':''}${!state.online?`<div class="banner ${state.offlineReady?'':'warning'}"><span>${state.offlineReady?'已离线 · 可以继续记账，数据保存在本机。':'当前无网络；离线缓存尚未确认，请勿关闭页面。'}</span></div>`:''}`;}
function renderBanners(){const el=$('#banners');if(el)el.innerHTML=banners();const s=$('#network-status');if(s)s.innerHTML=`<span class="dot ${state.online?'':'offline'}"></span>${state.online?'本机保存':state.offlineReady?'离线可用':'已断网'}`;}
function render(){
  if(!state.data)return;
  const title={records:'我的收支',statistics:'收支统计',books:'我的账本',settings:'设置与数据'}[state.screen];
  const subtitle={records:'把每一笔日常，记成生活的模样。',statistics:'看清钱的去向，也看见生活的重心。',books:'为不同的生活，留一本专属账本。',settings:'简单记录，安心保管。'}[state.screen];
  $('#app').innerHTML=`<div class="shell"><aside class="sidebar"><div class="brand"><img src="./icons/icon.svg" alt=""><div><strong>拾光记账</strong><p class="eyebrow">A LITTLE, EVERY DAY</p></div></div><p class="nav-label">我的空间</p><nav class="side-nav" aria-label="主导航">${navs.map(([id,name])=>`<button class="nav-button ${state.screen===id?'active':''}" data-action="nav" data-screen="${id}" ${state.screen===id?'aria-current="page"':''}>${icon(id)}${name}</button>`).join('')}</nav><div class="sidebar-bottom"><button class="primary" data-action="entry" ${state.error?'disabled':''}>${icon('plus')}记一笔</button><div class="sidebar-foot">${icon('shield')}数据保存在本机<br>认真生活，慢慢积累。</div></div></aside><div class="workspace"><header class="topbar"><div><h1>${title}</h1><p class="subtitle">${subtitle}</p></div><div class="top-actions"><span class="status-pill" id="network-status"></span><label class="book-switch"><select data-field="book" aria-label="切换账本">${state.data.books.map(b=>opt(b.id,`${C.emoji(b.icon)} ${b.name}`,state.bookID)).join('')}</select></label></div></header><main class="main"><div id="banners">${banners()}</div><div id="content">${state.error&&state.screen!=='settings'?`<div class="card">${empty('账本已暂停写入','请先导出原始数据，或在设置中选择有效备份恢复。','nav','打开设置','🔒')}</div>`:state.screen==='records'?recordsView():state.screen==='statistics'?statsView():state.screen==='books'?booksView():settingsView()}</div><footer class="page-foot">认真生活，慢慢积累</footer></main></div><nav class="bottom-nav" aria-label="主导航">${navs.map(([id,name],i)=>`${i===2?`<button data-action="entry" aria-label="记一笔" ${state.error?'disabled':''}><span class="add-tab">${icon('plus')}</span><span>记一笔</span></button>`:''}<button data-action="nav" data-screen="${id}" class="${state.screen===id?'active':''}" ${state.screen===id?'aria-current="page"':''}>${icon(id)}${name}</button>`).join('')}</nav></div>`;
  renderBanners();if(state.screen==='settings')refreshSettings();
}
function periodControl(){return `<div class="periodbar"><div class="segments" aria-label="统计周期">${[['day','日'],['week','周'],['month','月'],['quarter','季'],['year','年']].map(([id,title])=>`<button data-action="period" data-period="${id}" class="${state.period===id?'active':''}">${title}</button>`).join('')}</div><div class="date-nav"><button class="icon-button" data-action="previous" aria-label="上一周期">${icon('chevron','style="transform:rotate(180deg)"')}</button><label class="date-label">${h(C.periodLabel(state.period,state.anchor))}<input type="date" min="1900-01-01" max="2200-12-31" value="${state.anchor}" data-field="anchor" aria-label="选择日期"></label><button class="icon-button" data-action="next" aria-label="下一周期">${icon('chevron')}</button><button class="today" data-action="today">今天</button></div></div>`;}
function recordsView(){
  const all=entries(), income=C.sumEntries(all,'income'), expense=C.sumEntries(all,'expense');
  return `${periodControl()}<section class="summary" aria-label="收支汇总"><div class="card balance"><div class="metric-label"><span>本期结余</span><span>${icon('leaf')}</span></div><div class="metric-value num"><span class="currency">¥</span>${C.money(income-expense)}</div><p class="metric-foot">每一份积累，都算数。</p></div><div class="card income"><div class="metric-label"><span>本期收入</span><span class="metric-mini">${icon('down')}</span></div><div class="metric-value num"><span class="currency">¥</span>${C.money(income)}</div><p class="metric-foot">${all.filter(e=>e.flow==='income').length} 笔收入 · 生活的小确幸</p></div><div class="card expense"><div class="metric-label"><span>本期支出</span><span class="metric-mini">${icon('up')}</span></div><div class="metric-value num"><span class="currency">¥</span>${C.money(expense)}</div><p class="metric-foot">${all.filter(e=>e.flow==='expense').length} 笔支出 · 好好照顾生活</p></div></section><section class="card"><div class="section-head"><h2>收支明细</h2><small id="record-count"></small></div><div class="record-tools"><label class="search">${icon('search')}<input type="search" placeholder="搜索备注、分类或金额" aria-label="搜索流水" value="${h(state.query)}" data-field="query"></label><select class="filter" data-field="flow" aria-label="筛选收支">${[['all','全部收支'],['expense','仅支出'],['income','仅收入']].map(([id,name])=>opt(id,name,state.flow)).join('')}</select></div><div id="record-list">${recordList()}</div></section>`;
}
function filteredEntries(){const query=state.query.trim().toLowerCase();return entries().filter(e=>(state.flow==='all'||e.flow===state.flow)&&(!query||`${e.note} ${C.categoryPath(state.data,e.categoryID)} ${C.money(e.cents,false)}`.toLowerCase().includes(query)));}
function recordList(){
  const found=filteredEntries(), visible=found.slice(0,state.limit), groups=new Map();
  visible.forEach(e=>{if(!groups.has(e.day))groups.set(e.day,[]);groups.get(e.day).push(e);});
  if(!found.length)return empty(state.query||state.flow!=='all'?'没有找到匹配的记录':'从今天的第一笔开始',state.query||state.flow!=='all'?'试试其他关键词，或切换日期和收支筛选。':'一杯咖啡，一次通勤，记录生活里的小小日常。',state.query||state.flow!=='all'?'clear-filter':'entry',state.query||state.flow!=='all'?'清除筛选':'记下第一笔')+(!state.query&&state.flow==='all'&&!state.data.entries.length?'<div style="text-align:center;margin-top:-20px;margin-bottom:22px"><button class="text-button" data-action="demo">先体验示例账本 →</button></div>':'');
  return [...groups].map(([day,list])=>{const full=found.filter(e=>e.day===day),income=C.sumEntries(full,'income'),expense=C.sumEntries(full,'expense');return `<div class="day-group"><div class="day-head"><strong>${h(dayLabel(day))}</strong><span>${income?`收入 ${C.money(income)}　`:''}${expense?`支出 ${C.money(expense)}`:''}</span></div>${list.map(e=>{const c=state.data.categories.find(c=>c.id===e.categoryID);return `<button class="record" data-action="entry" data-id="${e.id}">${badge(c.icon,e.flow)}<span class="record-info"><span class="record-title">${h(C.categoryPath(state.data,c.id))}</span><span class="record-note" style="display:block">${h(e.note||'认真记录的一笔日常')}</span></span><span class="record-amount num ${e.flow}">${e.flow==='income'?'+':'−'}${C.money(e.cents)}</span></button>`;}).join('')}</div>`;}).join('')+(found.length>visible.length?`<button class="secondary load-more" data-action="more">再显示 60 笔（剩余 ${found.length-visible.length} 笔）</button>`:'');
}
function dayLabel(day){const date=C.parseDay(day),today=C.dayString();const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);return `${day===today?'今天':day===C.dayString(yesterday)?'昨天':day.slice(5).replace('-','月')+'日'} · ${['周日','周一','周二','周三','周四','周五','周六'][date.getDay()]}`;}
function updateRecords(){if($('#record-list')){$('#record-list').innerHTML=recordList();$('#record-count').textContent=`共 ${filteredEntries().length} 笔`;} }
const palette=['#2563eb','#f97316','#059669','#db2777','#7c3aed','#ca8a04','#0891b2','#dc2626','#65a30d','#9333ea','#0d9488','#92400e','#4f46e5','#be123c','#475569'];
function color(id){const ids=state.data.categories.filter(c=>c.bookID===state.bookID&&c.flow===state.statsFlow&&(state.level==='second'||!c.parentID)).map(c=>c.id).sort(),i=ids.indexOf(id);return palette[i%palette.length]||palette[0];}
function statsView(){
  const second=state.level==='second', rows=C.totals(state.data,entries(),state.statsFlow,second,second?state.parent:''), sum=rows.reduce((n,r)=>n+r.cents,0n),title=state.statsFlow==='income'?'收入':'支出';
  let cursor=0;const gradient=rows.map(r=>{const start=cursor;cursor+=C.percent(r.cents,sum);return `${color(r.id)} ${start}% ${cursor}%`;}).join(',');
  return `${periodControl()}<div class="stats-filters"><div class="segments">${[['expense','支出'],['income','收入']].map(([id,name])=>`<button data-action="stats-flow" data-flow="${id}" class="${state.statsFlow===id?'active':''}">${name}</button>`).join('')}</div><select class="filter" data-field="level" aria-label="分类层级">${opt('first','一级分类',state.level)}${opt('second','二级分类',state.level)}</select>${second?`<select class="filter" data-field="parent" aria-label="所属一级分类">${opt('','全部一级分类',state.parent)}${state.data.categories.filter(c=>c.bookID===state.bookID&&c.flow===state.statsFlow&&!c.parentID).map(c=>opt(c.id,c.name,state.parent)).join('')}</select>`:''}</div><div class="chart-layout"><section class="card"><div class="section-head"><h2>${title}构成</h2><div class="segments"><button data-action="chart" data-chart="donut" class="${state.chart==='donut'?'active':''}">饼图</button><button data-action="chart" data-chart="bar" class="${state.chart==='bar'?'active':''}">条形图</button></div></div>${!rows.length?empty(`这个周期还没有${title}记录`,'记下一笔，或切换日期查看。','entry','记一笔','◴'):state.chart==='donut'?`<div class="donut-wrap"><div class="donut" role="img" aria-label="${title}构成，详细金额见分类排行" style="background:conic-gradient(${gradient})"><div class="donut-center"><p>总${title}</p><strong class="num">¥${C.money(sum)}</strong><small>${rows.length} 个分类</small></div></div></div>`:`${rows.map(r=>`<div class="bar-row"><div class="rank-head"><span>${h(r.name)}</span><strong class="num">¥${C.money(r.cents)}</strong></div><div class="track"><span style="width:${C.percent(r.cents,rows[0].cents)}%;background:${color(r.id)}"></span></div></div>`).join('')}<p class="settings-note">总${title} ¥${C.money(sum)}</p>`}<p class="chart-note">${second?'未选择二级分类的流水计入“未细分”，不会遗漏。':'一级分类包含全部二级分类；点击排行中的分类查看细分。'}</p></section><section class="card"><div class="section-head"><h2>分类排行</h2><small>金额 / 占比</small></div>${rows.length?rows.map(r=>`<button class="rank-row" data-action="drill" data-id="${r.id}" ${second?'disabled':''}><span class="badge">${h(C.emoji(r.icon))}</span><span class="rank-detail"><span class="rank-head"><span>${h(r.name)}</span><strong class="num">¥${C.money(r.cents)}<small>${C.percent(r.cents,sum).toFixed(1)}%</small></strong></span><span class="track"><span style="width:${C.percent(r.cents,sum)}%;background:${color(r.id)}"></span></span></span></button>`).join(''):empty('还没有分类排行','这个周期的记录会显示在这里。','','','🌿')}</section></div>`;
}
function booksView(){
  return `<div class="section-head"><p class="muted small">${state.data.books.length} 本账本</p><button class="primary" data-action="book-editor">${icon('plus')}新建账本</button></div><div class="book-grid">${state.data.books.map(b=>{
    const count=state.data.entries.filter(e=>e.bookID===b.id).length;
    return `<article class="book-card ${b.id===state.bookID?'selected':''}"><div class="book-top"><button class="book-title-button" data-action="select-book" data-id="${b.id}">${badge(b.icon)}<h3>${h(b.name)}</h3></button><button class="icon-button" data-action="book-editor" data-id="${b.id}" aria-label="编辑${h(b.name)}">${icon('edit')}</button></div><div class="book-actions"><small>${count} 笔记录</small><button class="text-button" data-action="select-book" data-id="${b.id}">${b.id===state.bookID?'✓ 当前账本':'切换账本 →'}</button><button class="text-button danger" data-action="delete-book" data-id="${b.id}" aria-label="删除空账本${h(b.name)}">删除空账本</button></div></article>`;
  }).join('')}</div>${categoryManagement(state.data,state.bookID,categoryFlow,{arranging:categoryArranging,selectedMoveID})}`;
}
function settingsView(){return `<div class="settings-grid"><section class="card"><h2>备份与导出</h2><div class="settings-row"><div><strong>完整备份</strong><p>导出全部账本、分类与流水，可在 Mac 版恢复。</p></div><button class="secondary" data-action="export">${icon('download')}导出 JSON</button></div><div class="settings-row"><div><strong>导入账本</strong><p>兼容 Mac 版完整备份，作为新账本导入。</p></div><button class="secondary" data-action="import">${icon('upload')}选择文件</button></div><div class="settings-row"><div><strong>流水表格</strong><p>导出全部流水供表格分析，不能用于恢复。</p></div><button class="secondary" data-action="csv">导出 CSV</button></div>${state.error?'<div class="settings-row"><div><strong>保留原始数据</strong><p>导出当前无法读取的原数据，供后续修复。</p></div><button class="secondary" data-action="raw">导出原文件</button></div>':''}<p id="last-export" class="settings-note"></p></section><section class="card"><h2>离线与安装</h2><div class="settings-row"><div><strong id="offline-title">正在检查离线缓存…</strong><p id="offline-detail">首次联网加载完成后，可断网打开并记账。</p></div><button class="secondary" data-action="check-update">检查更新</button></div><div class="settings-row"><div><strong>设备存储保护</strong><p id="persistence-detail">申请持久保存，并保留独立备份。</p></div><button class="secondary" data-action="persist">申请保护</button></div><p class="settings-note">在 iPhone 的 Safari 中打开网址，点击分享 → 添加到主屏幕；如有“作为网页 App 打开”，请开启。首次添加后，从桌面图标打开一次并确认离线就绪。</p></section><section class="card full"><div class="section-head"><h2>本地历史快照</h2><small>保留最近 30 次写入前的数据</small></div><p class="settings-note">恢复会替换当前全部账本。恢复前的原数据会另存保留；这些快照仍在本机，不能替代外部备份。</p><div id="snapshots"><p class="settings-note">正在读取…</p></div></section><section class="card"><h2>体验与数据</h2><div class="settings-row"><div><strong>示例账本</strong><p>仅在内存中体验，不更改正式账本。</p></div><button class="secondary" data-action="demo">${state.demo?'退出示例':'开始体验'}</button></div><div class="settings-row"><div><strong>重新读取</strong><p>从本机数据库重新加载最新保存的数据。</p></div><button class="secondary" data-action="reload-data">重新读取</button></div></section><section class="card"><h2>关于拾光记账</h2><p class="settings-note">网页版 ${VERSION} · ${h(BUILD)}<br>账本保存在当前设备，不上传至托管服务，不自动同步到其他设备。更换网址会进入另一份本地存储。</p><p class="settings-note">清除网站数据、卸载或更换设备可能导致本地账本丢失。请定期导出 JSON 到“文件”或其他设备保存。</p><div class="storage-detail">${icon('shield')}认真生活，慢慢积累。</div></section></div>`;}
async function refreshSettings(){
  const title=$('#offline-title'),detail=$('#offline-detail');
  if(title){title.textContent=state.offlineReady?'✓ 离线缓存已就绪':state.swError?'离线缓存未就绪':'离线缓存准备中';detail.textContent=state.swError||'缓存程序文件；断网后仍可打开、记账和查看统计。';}
  try{
    const [snapshots,last,persisted]=await Promise.all([DB.listSnapshots(),DB.lastExport(),navigator.storage?.persisted?.()]);
    if(!$('#snapshots'))return;
    $('#snapshots').innerHTML=state.demo?'<p class="settings-note">示例模式不生成或恢复正式快照。</p>':snapshots.length?snapshots.map(s=>`<div class="snapshot"><span>${h(new Date(s.createdAt).toLocaleString('zh-CN'))}${s.preserved?' · 恢复前保留':''}<br><small>${Array.isArray(s.data?.entries)?s.data.entries.length+' 笔记录':'原始数据'}</small></span><button class="text-button" data-action="snapshot-export" data-id="${s.id}">导出</button><button class="text-button" data-action="snapshot-restore" data-id="${s.id}">恢复</button></div>`).join(''):'<p class="settings-note">已有账本产生修改后，会自动生成历史快照。</p>';
    $('#last-export').textContent=last?`上次生成完整备份：${new Date(last).toLocaleString('zh-CN')}。请确认已保存到外部位置。`:'尚未导出过完整备份，建议开始记账后定期备份。';
    $('#persistence-detail').textContent=persisted?'已获得持久存储授权，仍请定期导出备份。':'尚未获得持久存储授权；浏览器会自行决定是否批准。';
  }catch(error){if($('#snapshots'))$('#snapshots').textContent='无法读取本地存储：'+error.message;}
}
function updateEntryPicker(form,reset=false){
  if(reset)form.elements.categoryID.value='';
  const {category}=entrySelection(state.data,form.elements.bookID.value,form.elements.flow.value,form.elements.categoryID.value);
  form.elements.categoryID.value=category?.id||'';
  form.querySelector('#entry-categories').innerHTML=entryCategoryPicker(state.data,form.elements.bookID.value,form.elements.flow.value,category?.id);
  form.querySelector('.amount-label').textContent=(form.elements.flow.value==='expense'?'支出':'收入')+'金额';
}
function entryEditor(id){
  if(state.error)return toast('请先在设置中恢复账本。');
  const entry=state.data.entries.find(e=>e.id===id),bookID=entry?.bookID||state.bookID;
  showDialog(entry?'编辑记录':'记一笔',entryForm(state.data,bookID,entry),'entry-dialog');
}
function iconPicker(selected){
  return `<input type="hidden" name="icon" value="${h(selected)}"><h3 class="icon-picker-title">选择图标</h3><div class="icon-picker" aria-label="图标选择">${C.symbols.map(([id,,name])=>`<button type="button" class="icon-choice ${id===selected?'active':''}" data-action="icon" data-icon="${id}" aria-label="${name}" aria-pressed="${id===selected}">${symbolSVG(id)}<span>${h(name)}</span></button>`).join('')}</div>`;
}
function bookEditor(id){
  const b=state.data.books.find(b=>b.id===id);
  showDialog(b?'编辑账本':'新建账本',`<form data-kind="book" data-id="${b?.id||''}"><label class="field"><span>账本名称</span><input name="name" maxlength="40" required value="${h(b?.name||'')}" placeholder="账本名称，最多 40 字"></label>${!b?'<label class="default-category-toggle"><input type="checkbox" name="defaults" checked> 添加常用收支分类</label>':''}${iconPicker(b?.icon||'book.closed.fill')}<p class="form-error" role="alert"></p><div class="form-actions"><button type="button" class="secondary" data-action="close">取消</button><button class="primary" type="submit">保存账本</button></div></form>`,'symbol-editor');
}
let categoryFlow='expense',categoryArranging=false,selectedMoveID='';
function refreshCategoryPanel(){
  const panel=$('#category-management');
  if(panel)panel.outerHTML=categoryManagement(state.data,state.bookID,categoryFlow,{arranging:categoryArranging,selectedMoveID});
}
function categoriesEditor(bookID){
  closeDialog();state.bookID=bookID;state.screen='books';selectedMoveID='';render();
  $('#category-management')?.scrollIntoView({block:'start',behavior:'smooth'});
}
function categoryEditor(id,parentID=null){
  const c=state.data.categories.find(c=>c.id===id),flow=c?.flow||categoryFlow,selectedParent=c?.parentID||parentID||'';
  const parent=state.data.categories.find(p=>p.id===selectedParent),symbol=c?.icon||parent?.icon||(flow==='expense'?'bag.fill':'banknote.fill');
  showDialog(c?'编辑分类':'新建分类',`<form data-kind="category" data-id="${c?.id||''}"><input type="hidden" name="flow" value="${flow}"><input type="hidden" name="parentID" value="${selectedParent}"><p class="category-context">${flow==='expense'?'支出':'收入'} · ${parent?h(parent.name)+' 的二级分类':'一级分类'}</p><label class="category-name-field"><span data-editor-icon>${symbolSVG(symbol)}</span><input aria-label="分类名称" name="name" required maxlength="40" value="${h(c?.name||'')}" placeholder="分类名称，最多 40 字"></label>${iconPicker(symbol)}<button type="button" class="text-button" data-action="suggest-icon">按当前名称匹配图标</button><p class="form-error" role="alert"></p>${c?`<button type="button" class="delete-category-link danger" data-action="delete-category" data-id="${c.id}">删除分类</button>`:''}<div class="form-actions"><button type="button" class="secondary" data-action="close">取消</button><button class="primary" type="submit">保存分类</button></div></form>`,'symbol-editor');
}
async function load(){
  try{const saved=await DB.readLedger();state.raw=saved||null;state.revision=saved?.revision||0;state.data=saved?C.validate(saved.data):C.fresh();state.bookID=state.data.books[0].id;state.error='';state.dbError=false;state.stale=false;}
  catch(error){state.error=error.message||'浏览器存储不可用';state.dbError=!state.raw;state.data ||= C.fresh();state.bookID=state.data.books[0].id;}
}
async function demo(){if(state.demo){await load();state.demo=false;}else{state.demo=true;state.data=C.sample();state.bookID=state.data.books[0].id;state.error='';state.stale=false;}state.query='';state.flow='all';state.anchor=C.dayString();render();updateRecords();}
function download(data,filename,type='application/json'){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
async function exportJSON(data=state.data,filename=`拾光完整备份-${C.dayString()}.json`){download(JSON.stringify(C.validate(data),null,2),filename);if(!state.demo){await DB.markExport();}toast('已生成完整备份，请保存到“文件”或其他设备。');if(state.screen==='settings')refreshSettings();}
async function chooseImport(){
  if(state.demo){toast('请先退出示例模式，再导入正式账本。');return;}
  const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{const file=input.files[0];if(!file)return;
    try{if(file.size>100_000_000)throw new Error('文件超过 100MB，无法导入。');const incoming=C.validate(JSON.parse(await file.text()));importData=incoming;
      showDialog(state.error?'从备份恢复':'导入完整备份',`<p class="settings-note">文件：${h(file.name)}<br>包含 ${incoming.books.length} 本账本、${incoming.categories.length} 个分类、${incoming.entries.length} 笔流水。</p><p class="settings-note">${state.error?'将用此备份恢复全部账本，当前原始数据会另存保留。':'将创建名称带“（导入）”的新账本，保留现有账本。重复导入会新增另一份账本。'}</p><p class="form-error" role="alert"></p><div class="form-actions"><button class="secondary" data-action="close">取消</button><button class="primary" data-action="import-confirm">${state.error?'恢复备份':'确认导入'}</button></div>`);
    }catch(error){report(new Error('无法导入：'+error.message));}
  };input.click();
}
async function placeCategory(id,parentID,beforeID){
  if(state.saving||state.error)return;
  try{
    const next=C.moveCategory(state.data,id,parentID,beforeID);
    if(JSON.stringify(next.categories)===JSON.stringify(state.data.categories)){selectedMoveID='';refreshCategoryPanel();return;}
    if(await commit(()=>next)){selectedMoveID='';refreshCategoryPanel();toast('分类位置已保存，已有流水继续跟随分类。');}
  }catch(error){report(error);}
}
const categoryDrag=attachCategoryDrag(placeCategory,()=>!state.saving&&!state.error);
document.addEventListener('click',async event=>{
  const el=event.target.closest('[data-action]');if(!el||el.disabled)return;const action=el.dataset.action,id=el.dataset.id;
  try{
    if(action==='close')return closeDialog();
    if(action==='nav'){state.screen=el.dataset.screen||'settings';render();updateRecords();window.scrollTo(0,0);return;}
    if(action==='entry')return entryEditor(id);
    if(action==='period'){state.period=el.dataset.period;state.limit=60;render();updateRecords();return;}
    if(['previous','next','today'].includes(action)){const next=action==='today'?C.dayString():C.movePeriod(state.period,state.anchor,action==='next'?1:-1);if(!C.parseDay(next))return toast('支持的日期范围为 1900—2200 年。');state.anchor=next;state.limit=60;render();updateRecords();return;}
    if(action==='clear-filter'){state.query='';state.flow='all';render();updateRecords();return;}
    if(action==='more'){state.limit+=60;updateRecords();return;}
    if(action==='stats-flow'){state.statsFlow=el.dataset.flow;state.parent='';render();return;}
    if(action==='chart'){state.chart=el.dataset.chart;render();return;}
    if(action==='drill'){state.level='second';state.parent=id;render();return;}
    if(action==='book-editor')return bookEditor(id);
    if(action==='select-book'){state.bookID=id;state.parent='';selectedMoveID='';render();return;}
    if(action==='categories')return categoriesEditor(id);
    if(action==='category-flow'){categoryFlow=el.dataset.flow;selectedMoveID='';refreshCategoryPanel();return;}
    if(action==='toggle-arranging'){categoryArranging=!categoryArranging;selectedMoveID='';refreshCategoryPanel();return;}
    if(action==='choose-move'){if(categoryDrag.suppressClick())return;selectedMoveID=selectedMoveID===id?'':id;refreshCategoryPanel();return;}
    if(action==='place-category'){if(!selectedMoveID)return toast('先拖动分类，或点按右侧拖动柄选择要移动的分类。');await placeCategory(selectedMoveID,el.dataset.dropParent||null,el.dataset.dropBefore||null);return;}
    if(action==='category-editor')return categoryEditor(id,el.dataset.parent||null);
    if(action==='icon'){const form=el.closest('form');form.elements.icon.value=el.dataset.icon;const preview=form.querySelector('[data-editor-icon]');if(preview)preview.innerHTML=symbolSVG(el.dataset.icon);form.querySelectorAll('.icon-choice').forEach(b=>{b.classList.toggle('active',b===el);b.setAttribute('aria-pressed',String(b===el));});return;}
    if(action==='suggest-icon'){const form=el.closest('form'),suggested=C.matchIcon(form.elements.name.value);if(!suggested)return toast('没有匹配到图标，可以手动选择。');form.querySelector(`[data-icon="${suggested}"]`).click();return;}
    if(action==='entry-flow'){const form=el.closest('form');form.elements.flow.value=el.dataset.flow;form.querySelectorAll('[data-action="entry-flow"]').forEach(b=>{b.classList.toggle('active',b===el);b.setAttribute('aria-pressed',String(b===el));});updateEntryPicker(form,true);return;}
    if(action==='entry-parent'||action==='entry-child'){const form=el.closest('form');form.elements.categoryID.value=id;updateEntryPicker(form);return;}
    if(action==='delete-entry')return confirmDialog('删除这笔流水？','删除后，收支统计也会相应变化。可以通过本地历史快照恢复删除前的全部账本。',async()=>{if(await commit(d=>{d.entries=d.entries.filter(e=>e.id!==id);})){closeDialog();render();updateRecords();toast('流水已删除。');}},'删除流水');
    if(action==='delete-book'){
      if(state.data.books.length<=1)throw new Error('请至少保留一本账本。');if(state.data.entries.some(e=>e.bookID===id))throw new Error('这个账本已有流水，不能直接删除。可改名继续使用，或先调整流水归属。');
      return confirmDialog('删除这个账本？','账本及其分类将一起删除。',async()=>{if(await commit(d=>{d.books=d.books.filter(b=>b.id!==id);d.categories=d.categories.filter(c=>c.bookID!==id);})){closeDialog();render();}},'删除账本');
    }
    if(action==='delete-category'){
      const ids=new Set([id,...state.data.categories.filter(c=>c.parentID===id).map(c=>c.id)]);if(state.data.entries.some(e=>ids.has(e.categoryID)))throw new Error('这个分类或其子分类已有流水，不能删除。请先修改流水分类，或改名继续使用。');
      return confirmDialog('删除这个分类？','分类及其二级分类将一起删除。',async()=>{if(await commit(d=>{d.categories=d.categories.filter(c=>!ids.has(c.id));})){closeDialog();refreshCategoryPanel();}},'删除分类');
    }
    if(action==='match-icons'){if(await commit(d=>{d.categories.filter(c=>c.bookID===state.bookID).forEach(c=>{c.icon=C.matchIcon(c.name)||c.icon;});})){refreshCategoryPanel();toast('已按分类名称匹配图标。');}return;}
    if(action==='confirm'){if(confirmAction)await confirmAction();return;}
    if(action==='demo'){closeDialog();await demo();return;}
    if(action==='reload-data'){if($('#modal').open)return toast('请先保存或关闭当前编辑窗口。');state.demo=false;await load();render();updateRecords();toast(state.error?'账本未能读取。':'已读取最新账本。');return;}
    if(action==='export'){if(state.error)throw new Error('请先导出原始文件，或从有效备份恢复。');await exportJSON();return;}
    if(action==='csv'){if(state.error)throw new Error('请先恢复有效账本。');download(C.csv(state.data),`拾光流水-${C.dayString()}.csv`,'text/csv;charset=utf-8');return;}
    if(action==='raw'){download(JSON.stringify(state.raw??{error:state.error},null,2),`拾光原始数据-${C.dayString()}.json`);return;}
    if(action==='import')return chooseImport();
    if(action==='import-confirm'){
      if(!importData)return;const recovery=!!state.error,incoming=importData;
      if(await commit(d=>recovery?incoming:C.mergeBooks(d,incoming),{recovery})){closeDialog();state.bookID=state.data.books.at(-1).id;render();updateRecords();toast(recovery?'账本已恢复，恢复前原数据已保留。':'已作为新账本导入。');}return;
    }
    if(action==='snapshot-export'||action==='snapshot-restore'){
      if(state.demo)throw new Error('请先退出示例模式。');const snapshot=(await DB.listSnapshots()).find(s=>s.id===id);if(!snapshot)throw new Error('快照已不存在。');
      if(action==='snapshot-export'){download(JSON.stringify(snapshot.data,null,2),`拾光历史备份-${snapshot.createdAt.slice(0,10)}.json`);return;}
      const data=C.validate(snapshot.data);return confirmDialog('恢复全部账本？',`将使用 ${new Date(snapshot.createdAt).toLocaleString('zh-CN')} 的快照替换当前全部账本。当前数据会另存保留。`,async()=>{if(await commit(()=>data,{recovery:true})){closeDialog();render();toast('已恢复快照，恢复前数据已保留。');}},'恢复快照');
    }
    if(action==='persist'){const granted=await navigator.storage?.persist?.();toast(granted?'已获得持久存储授权。':'浏览器暂未批准。添加到主屏幕后可再次申请，请继续保留外部备份。');refreshSettings();return;}
    if(action==='check-update'){if(!navigator.onLine)throw new Error('请联网后检查更新。');if(!state.sw)await registerSW();else await state.sw.update();await checkOffline();toast(state.waiting?'新版本已下载，可以更新。':state.offlineReady?'离线缓存已就绪，更新检查已发起。':'正在准备离线缓存，请稍后查看。');return;}
    if(action==='update'){if($('#modal').open)return toast('请先保存或关闭当前编辑窗口。');if(state.saving)return;const worker=state.waiting;if(worker){worker.postMessage({type:'SKIP_WAITING'});}else location.reload();return;}
  }catch(error){report(error);}
});
document.addEventListener('submit',async event=>{
  const form=event.target;if(!form.dataset.kind)return;event.preventDefault();const values=new FormData(form),kind=form.dataset.kind,id=form.dataset.id;
  try{
    let change,selectedBookAfterSave;
    if(kind==='entry'){
      const cents=C.parseMoney(values.get('amount'));if(cents===null)throw new Error('请输入大于 0、小于 10 亿元的金额，最多两位小数。');
      if(!values.get('categoryID'))throw new Error('请先选择一个分类。');
      const old=state.data.entries.find(e=>e.id===id),entry={id:id||C.uid(),bookID:values.get('bookID'),categoryID:values.get('categoryID'),flow:values.get('flow'),cents,day:values.get('day'),note:values.get('note').trim(),createdAt:old?.createdAt||C.isoDate(new Date())};
      change=d=>{const index=d.entries.findIndex(e=>e.id===entry.id);if(index>=0)d.entries[index]=entry;else d.entries.push(entry);};
    }else if(kind==='book'){
      const b={id:id||C.uid(),name:values.get('name').trim(),icon:values.get('icon')};if(state.data.books.some(x=>x.id!==b.id&&x.name===b.name))throw new Error('已存在同名账本，请换个名称。');selectedBookAfterSave=b.id;change=d=>{const index=d.books.findIndex(x=>x.id===b.id);if(index>=0)d.books[index]=b;else{d.books.push(b);if(values.has('defaults'))d.categories.push(...C.defaults(b.id));}};
    }else if(kind==='category'){
      const name=values.get('name').trim(),parentID=values.get('parentID')||null,flow=values.get('flow');
      if(state.data.categories.some(c=>c.id!==id&&c.bookID===state.bookID&&c.flow===flow&&(c.parentID||null)===parentID&&c.name===name))throw new Error('同一层级已有这个分类名称。');
      change=d=>{if(id){const c=d.categories.find(c=>c.id===id);c.name=name;c.icon=values.get('icon');return (c.parentID||null)===parentID?d:C.moveCategory(d,id,parentID);}d.categories.push({id:C.uid(),name,icon:values.get('icon'),flow,bookID:state.bookID,...(parentID?{parentID}:{})});};
    }
    if(await commit(change)){closeDialog();if(kind==='category'){refreshCategoryPanel();toast('分类已保存。');}else{if(kind==='book')state.bookID=selectedBookAfterSave;render();updateRecords();toast(state.demo?'示例中已更新，正式账本未改动。':'已保存到本机。');}}
  }catch(error){report(error);}
});
document.addEventListener('input',event=>{if(event.target.name==='note'&&event.target.closest('.entry-form'))event.target.closest('form').querySelector('.note-count').textContent=event.target.value.length+'/500';if(event.target.dataset.field==='query'){state.query=event.target.value;state.limit=60;updateRecords();}});
document.addEventListener('change',event=>{
  const el=event.target,field=el.dataset.field;
  if(el.hasAttribute('data-entry-book')){const form=el.closest('form');updateEntryPicker(form,true);return;}
  if(!field||field==='query')return;
  if(field==='book'){state.bookID=el.value;state.parent='';state.limit=60;selectedMoveID='';}
  else if(field==='anchor'){if(!C.parseDay(el.value))return;state.anchor=el.value;state.limit=60;}
  else if(['flow','level','parent'].includes(field)){state[field]=el.value;state.limit=60;}
  render();updateRecords();
});
$('#modal').addEventListener('cancel',event=>{if(state.saving)event.preventDefault();});
$('#modal').addEventListener('close',()=>document.body.classList.remove('modal-open'));
window.addEventListener('online',()=>{state.online=true;renderBanners();state.sw?.update().catch(()=>{});});
window.addEventListener('offline',()=>{state.online=false;renderBanners();});
document.addEventListener('visibilitychange',async()=>{if(!document.hidden&&!state.demo){try{const saved=await DB.readLedger();if((saved?.revision||0)!==state.revision){state.stale=true;renderBanners();}}catch{}if(navigator.onLine)state.sw?.update().catch(()=>{});}});
async function checkOffline(){
  const worker=state.sw?.active;if(!worker)return;
  try{state.offlineReady=await new Promise(resolve=>{const channel=new MessageChannel(),timer=setTimeout(()=>resolve(false),5000);channel.port1.onmessage=event=>{clearTimeout(timer);resolve(event.data?.ready===true);channel.port1.close();};worker.postMessage({type:'STATUS'},[channel.port2]);});}catch{state.offlineReady=false;}
  renderBanners();if(state.screen==='settings')refreshSettings();
}
async function registerSW(){
  if(!('serviceWorker' in navigator)||!isSecureContext){state.swError='离线功能需要 HTTPS 网站或本机预览地址。';return;}
  try{
    const registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});state.sw=registration;
    const waiting=()=>{if(registration.waiting&&navigator.serviceWorker.controller){state.waiting=registration.waiting;renderBanners();}};waiting();
    registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'){waiting();setTimeout(checkOffline,200);}if(worker.state==='redundant'){state.swError='离线缓存下载未完成，请联网后点击“检查更新”重试。';if(state.screen==='settings')refreshSettings();}});});
    await navigator.serviceWorker.ready;state.swError='';await checkOffline();
  }catch(error){state.swError='离线缓存未能准备，请联网后在设置中重试。';if(state.screen==='settings')refreshSettings();}
}
let controlled=!!navigator.serviceWorker?.controller;
navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(controlled){if(!$('#modal').open&&!state.saving)location.reload();else{state.waiting=null;toast('新版已启用，完成编辑后请重新打开应用。');}}controlled=true;checkOffline();});
await load();render();updateRecords();registerSW();
