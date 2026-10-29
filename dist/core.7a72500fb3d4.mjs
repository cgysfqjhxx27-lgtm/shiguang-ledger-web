// Version-1 JSON remains compatible with LedgerCore on Mac/iPhone.
export const MAX_CENTS = 99_999_999_999;
export const uid = () => crypto.randomUUID();
// Foundation's JSONDecoder.iso8601 expects seconds without fractional digits.
export const isoDate = date => date.toISOString().replace(/\.\d{3}Z$/, 'Z');
export const clone = value => structuredClone(value);
const fail = message => { throw new Error(message); };
export const symbols = [
  ['book.closed.fill','📒','账本'],['leaf.fill','🌿','生活'],['fork.knife','🍴','餐饮'],['cup.and.saucer.fill','☕','咖啡'],
  ['carrot.fill','🥕','买菜'],['basket.fill','🧺','日用'],['tshirt.fill','👕','服饰'],['bag.fill','🛍️','购物'],
  ['tram.fill','🚇','地铁'],['bus.fill','🚌','公交'],['car.fill','🚗','汽车'],['airplane','✈️','旅行'],
  ['fuelpump.fill','⛽','加油'],['bolt.car.fill','🔋','充电'],['bicycle','🚲','骑行'],['house.fill','🏡','居家'],
  ['key.fill','🔑','房租'],['bolt.fill','⚡','水电'],['drop.fill','💧','用水'],['flame.fill','🔥','燃气'],
  ['wifi','📶','网络'],['globe','🌐','外网'],['network','🌐','网络'],['iphone','📱','手机'],
  ['laptopcomputer','💻','电脑'],['headphones','🎧','数码'],['film.fill','🎬','电影'],['gamecontroller.fill','🎮','游戏'],
  ['figure.run','🏃','运动'],['sparkles','✨','休闲'],['book.fill','📖','学习'],['books.vertical.fill','📚','资料'],
  ['graduationcap.fill','🎓','教育'],['cross.case.fill','🩺','健康'],['pills.fill','💊','药品'],['cross.vial.fill','🧴','保健'],
  ['scissors','✂️','理发'],['heart.fill','❤️','关爱'],['heart.circle.fill','❤️','孝亲'],['pawprint.fill','🐾','宠物'],
  ['gift.fill','🎁','礼物'],['briefcase.fill','💼','工作'],['banknote.fill','💵','收入'],['creditcard.fill','💳','银行卡'],
  ['wallet.pass.fill','👛','钱包'],['chart.line.uptrend.xyaxis','📈','理财'],['tray.and.arrow.down.fill','📥','收款'],
  ['person.2.fill','👪','家庭'],['person.crop.circle.badge.checkmark','🎫','会员'],['building.2.fill','🏢','物业'],
  ['sunrise.fill','🌅','早餐'],['takeoutbag.and.cup.and.straw.fill','🥡','午餐'],['moon.fill','🌙','晚餐'],
  ['sun.max.fill','☀️','阳光'],['birthday.cake.fill','🍰','甜品'],['fork.knife.circle.fill','🍽️','美食'],['ellipsis.circle.fill','•••','其他']
];
export function emoji(icon) { return symbols.find(s => s[0] === icon)?.[1] || '◈'; }
export function matchIcon(name) {
  const exact={"餐饮":"fork.knife","水果":"basket.fill","买菜做饭":"carrot.fill","米面粮油":"leaf.fill","外出美食":"fork.knife.circle.fill","咖啡茶饮":"cup.and.saucer.fill","交通":"tram.fill","公共交通":"bus.fill","打车":"car.fill","充电":"bolt.car.fill","火车飞机":"airplane","购物":"bag.fill","日用品":"basket.fill","鞋服衣帽":"tshirt.fill","数码":"headphones","居家":"house.fill","物业费":"building.2.fill","水电燃气":"bolt.fill","网络费用":"wifi","休闲":"sparkles","电影":"film.fill","运动":"figure.run","旅行":"airplane","会员":"person.crop.circle.badge.checkmark","健康":"cross.case.fill","医疗费用":"cross.case.fill","药品":"pills.fill","理发护肤":"scissors","保健品":"cross.vial.fill","其他支出":"ellipsis.circle.fill","孝敬父母":"heart.circle.fill","人情往来":"gift.fill","学习进修":"graduationcap.fill","书籍资料":"books.vertical.fill","外网会员":"globe","科学上网":"network","工作收入":"briefcase.fill","工资":"banknote.fill","奖金":"gift.fill","兼职":"laptopcomputer","其他收入":"tray.and.arrow.down.fill","早餐":"sunrise.fill","午餐":"takeoutbag.and.cup.and.straw.fill","晚餐":"moon.fill","房租":"key.fill","加油":"fuelpump.fill","服饰":"tshirt.fill"};
  if(exact[name.trim()]) return exact[name.trim()];
  const rules = [['咖啡|茶饮','cup.and.saucer.fill'],['早餐','sunrise.fill'],['午餐','takeoutbag.and.cup.and.straw.fill'],['晚餐','moon.fill'],['餐|美食','fork.knife'],['买菜','carrot.fill'],['水果|日用','basket.fill'],['物业','building.2.fill'],['房租','key.fill'],['水电|电费','bolt.fill'],['充电','bolt.car.fill'],['打车|汽车','car.fill'],['公交|公共交通','bus.fill'],['地铁|交通','tram.fill'],['加油','fuelpump.fill'],['旅行|飞机','airplane'],['服饰|鞋服','tshirt.fill'],['购物','bag.fill'],['数码','headphones'],['理发','scissors'],['保健','cross.vial.fill'],['健康|医疗','cross.case.fill'],['药','pills.fill'],['电影','film.fill'],['运动','figure.run'],['书籍|资料','books.vertical.fill'],['学习|教育','graduationcap.fill'],['会员','person.crop.circle.badge.checkmark'],['网络','wifi'],['孝|父母','heart.circle.fill'],['奖金|礼','gift.fill'],['工资|收入','banknote.fill'],['工作','briefcase.fill'],['兼职','laptopcomputer'],['居家','house.fill'],['休闲','sparkles'],['宠物','pawprint.fill']];
  return rules.find(([pattern]) => new RegExp(pattern).test(name))?.[1] || null;
}
// Editable built-in category template; contains no ledger entries.
export const DEFAULT_CATEGORY_PLAN = [
  [
    "餐饮",
    "fork.knife",
    "expense",
    [
      [
        "买菜做饭",
        "carrot.fill"
      ],
      [
        "米面粮油",
        "leaf.fill"
      ],
      [
        "水果",
        "basket.fill"
      ],
      [
        "咖啡茶饮",
        "cup.and.saucer.fill"
      ],
      [
        "外出美食",
        "fork.knife.circle.fill"
      ]
    ]
  ],
  [
    "交通",
    "tram.fill",
    "expense",
    [
      [
        "公共交通",
        "bus.fill"
      ],
      [
        "打车",
        "car.fill"
      ],
      [
        "充电",
        "bolt.car.fill"
      ],
      [
        "火车飞机",
        "airplane"
      ]
    ]
  ],
  [
    "购物",
    "bag.fill",
    "expense",
    [
      [
        "日用品",
        "basket.fill"
      ],
      [
        "鞋服衣帽",
        "tshirt.fill"
      ],
      [
        "数码",
        "headphones"
      ]
    ]
  ],
  [
    "居家",
    "house.fill",
    "expense",
    [
      [
        "物业费",
        "building.2.fill"
      ],
      [
        "水电燃气",
        "bolt.fill"
      ],
      [
        "网络费用",
        "wifi"
      ]
    ]
  ],
  [
    "休闲",
    "sparkles",
    "expense",
    [
      [
        "电影",
        "film.fill"
      ],
      [
        "运动",
        "figure.run"
      ],
      [
        "旅行",
        "airplane"
      ],
      [
        "会员",
        "person.crop.circle.badge.checkmark"
      ]
    ]
  ],
  [
    "健康",
    "cross.case.fill",
    "expense",
    [
      [
        "医疗费用",
        "cross.case.fill"
      ],
      [
        "药品",
        "pills.fill"
      ],
      [
        "理发护肤",
        "scissors"
      ],
      [
        "保健品",
        "cross.vial.fill"
      ]
    ]
  ],
  [
    "其他支出",
    "ellipsis.circle.fill",
    "expense",
    [
      [
        "孝敬父母",
        "heart.circle.fill"
      ],
      [
        "人情往来",
        "gift.fill"
      ]
    ]
  ],
  [
    "工作收入",
    "briefcase.fill",
    "income",
    [
      [
        "工资",
        "banknote.fill"
      ],
      [
        "奖金",
        "gift.fill"
      ],
      [
        "兼职",
        "laptopcomputer"
      ]
    ]
  ],
  [
    "其他收入",
    "tray.and.arrow.down.fill",
    "income",
    []
  ],
  [
    "学习进修",
    "graduationcap.fill",
    "expense",
    [
      [
        "书籍资料",
        "books.vertical.fill"
      ],
      [
        "外网会员",
        "globe"
      ],
      [
        "科学上网",
        "network"
      ]
    ]
  ]
];
export function defaults(bookID) {
  return DEFAULT_CATEGORY_PLAN.flatMap(([name,icon,flow,children]) => {
    const parent={id:uid(),bookID,name,icon,flow};
    return [parent,...children.map(([name,icon])=>({id:uid(),bookID,parentID:parent.id,name,icon,flow}))];
  });
}
export function fresh() {
  const book = {id:uid(),name:'日常账本',icon:'book.closed.fill'};
  return {schemaVersion:1,books:[book],categories:defaults(book.id),entries:[]};
}
export function dayString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function parseDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y,m,d] = value.split('-').map(Number), date = new Date(y,m-1,d,12);
  return y >= 1900 && y <= 2200 && dayString(date) === value ? date : null;
}
export function money(cents, grouping = true) {
  const n = BigInt(cents), abs = n < 0n ? -n : n;
  return `${n<0n?'-':''}${grouping?(abs/100n).toLocaleString('zh-CN'):abs/100n}.${String(abs%100n).padStart(2,'0')}`;
}
export function parseMoney(text) {
  const raw = String(text).trim();
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(raw)) return null;
  const [a,b=''] = raw.split('.'), cents = Number(a)*100+Number(b.padEnd(2,'0'));
  return cents > 0 && cents <= MAX_CENTS ? cents : null;
}
export function validate(input) {
  const d = clone(input);
  if (!d || d.schemaVersion !== 1) fail(`不支持的数据版本（${d?.schemaVersion ?? '缺失'}），请使用版本 1 的完整备份。`);
  if (!Array.isArray(d.books)||!d.books.length||d.books.length>1000||!Array.isArray(d.categories)||d.categories.length>50000||!Array.isArray(d.entries)||d.entries.length>100000) fail('账本结构无效，或记录数超过支持范围。');
  const idPattern = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
  const normalizeID = value => typeof value === 'string' && idPattern.test(value) ? value.toLowerCase() : fail('记录编号无效。');
  const validName = value => typeof value === 'string' && value.trim() && [...value].length<=40;
  for (const list of [d.books,d.categories,d.entries]) {
    for (const item of list) {
      if (!item || typeof item !== 'object') fail('记录格式无效。');
      item.id = normalizeID(item.id);
    }
    if (new Set(list.map(x=>x.id)).size !== list.length) fail('存在重复的记录编号。');
  }
  const books = new Set(d.books.map(b=>b.id));
  for (const item of [...d.books,...d.categories]) if (!validName(item.name)||typeof item.icon!=='string'||!item.icon.trim()||item.icon.length>200) fail('账本或分类的名称、图标无效。');
  for (const c of d.categories) {
    c.bookID=normalizeID(c.bookID);
    if (c.parentID != null) c.parentID=normalizeID(c.parentID); else delete c.parentID;
    if (!books.has(c.bookID)||!['expense','income'].includes(c.flow)) fail('分类所属账本或收支类型无效。');
  }
  const cats = new Map(d.categories.map(c=>[c.id,c]));
  for (const c of d.categories) if (c.parentID) {
    const p=cats.get(c.parentID);
    if (!p||p.id===c.id||p.parentID||p.bookID!==c.bookID||p.flow!==c.flow) fail('分类层级无效，仅支持同一账本、同一收支类型的两级分类。');
  }
  for (const e of d.entries) {
    e.bookID=normalizeID(e.bookID); e.categoryID=normalizeID(e.categoryID);
    const c=cats.get(e.categoryID);
    if (!c||c.bookID!==e.bookID||c.flow!==e.flow||!Number.isSafeInteger(e.cents)||e.cents<=0||e.cents>MAX_CENTS||!parseDay(e.day)||typeof e.note!=='string'||[...e.note].length>500||typeof e.createdAt!=='string'||!Number.isFinite(Date.parse(e.createdAt))) fail('流水金额、日期、备注或分类关系无效。');
    e.createdAt=isoDate(new Date(e.createdAt));
  }
  return d;
}
export function categoryPath(data,id) {
  const c=data.categories.find(c=>c.id===id), p=c&&data.categories.find(p=>p.id===c.parentID);
  return c ? (p?`${p.name} / ${c.name}`:c.name) : '未知分类';
}
export function mergeBooks(current,incoming) {
  const source=validate(incoming), result=clone(current), books=new Map(), cats=new Map();
  source.books.forEach(b=>books.set(b.id,uid())); source.categories.forEach(c=>cats.set(c.id,uid()));
  result.books.push(...source.books.map(b=>({...b,id:books.get(b.id),name:[...b.name].slice(0,32).join('')+'（导入）'})));
  result.categories.push(...source.categories.map(c=>({...c,id:cats.get(c.id),bookID:books.get(c.bookID),...(c.parentID?{parentID:cats.get(c.parentID)}:{})})));
  result.entries.push(...source.entries.map(e=>({...e,id:uid(),bookID:books.get(e.bookID),categoryID:cats.get(e.categoryID)})));
  return validate(result);
}
export function periodRange(period,anchor) {
  const date=parseDay(anchor)||new Date(), start=new Date(date.getFullYear(),date.getMonth(),date.getDate(),12);
  if(period==='week') start.setDate(start.getDate()-(start.getDay()+6)%7);
  if(['month','quarter','year'].includes(period)) start.setDate(1);
  if(period==='quarter') start.setMonth(Math.floor(start.getMonth()/3)*3);
  if(period==='year') start.setMonth(0);
  const end=new Date(start);
  if(period==='day') end.setDate(end.getDate()+1);
  if(period==='week') end.setDate(end.getDate()+7);
  if(period==='month') end.setMonth(end.getMonth()+1);
  if(period==='quarter') end.setMonth(end.getMonth()+3);
  if(period==='year') end.setFullYear(end.getFullYear()+1);
  const last=new Date(end); last.setDate(last.getDate()-1);
  return {start:dayString(start),end:dayString(end),last:dayString(last)};
}
export function movePeriod(period,anchor,step) {
  const date=parseDay(periodRange(period,anchor).start);
  if(period==='day'||period==='week') date.setDate(date.getDate()+step*(period==='week'?7:1));
  else date.setMonth(date.getMonth()+step*({month:1,quarter:3,year:12}[period]));
  return dayString(date);
}
export function periodLabel(period,anchor) {
  const {start,last}=periodRange(period,anchor), [y,m]=start.split('-').map(Number);
  return period==='day'?start:period==='week'?`${start} — ${last.slice(5)}`:period==='month'?`${y}年${m}月`:period==='quarter'?`${y}年 第${Math.ceil(m/3)}季度`:`${y}年`;
}
export function periodEntries(data,bookID,period,anchor) {
  const {start,end}=periodRange(period,anchor);
  return data.entries.filter(e=>e.bookID===bookID&&e.day>=start&&e.day<end).sort((a,b)=>b.day.localeCompare(a.day)||b.createdAt.localeCompare(a.createdAt));
}
export const sumEntries = (entries,flow) => entries.reduce((sum,e)=>sum+(!flow||e.flow===flow?BigInt(e.cents):0n),0n);
export function totals(data,entries,flow,secondLevel=false,parentID='') {
  const cats=new Map(data.categories.map(c=>[c.id,c])), result=new Map();
  for(const e of entries.filter(e=>e.flow===flow)) {
    const c=cats.get(e.categoryID);
    if(parentID&&(c.parentID||c.id)!==parentID) continue;
    const group=secondLevel?c:cats.get(c.parentID)||c;
    const item=result.get(group.id)||{id:group.id,name:secondLevel?(c.parentID?categoryPath(data,c.id):c.name+' · 未细分'):group.name,icon:group.icon,cents:0n};
    item.cents+=BigInt(e.cents); result.set(group.id,item);
  }
  return [...result.values()].sort((a,b)=>a.cents===b.cents?a.name.localeCompare(b.name):a.cents>b.cents?-1:1);
}
export const percent = (cents,total) => total?Number(BigInt(cents)*1000n/BigInt(total))/10:0;
export function moveCategory(data,id,parentID=null,beforeID=null) {
  const d=clone(data), source=d.categories.find(c=>c.id===id);
  if(!source) fail('分类已不存在。');
  if(parentID) {
    const p=d.categories.find(c=>c.id===parentID);
    if(!p||p.id===id||p.parentID||p.bookID!==source.bookID||p.flow!==source.flow) fail('只能移到同一账本、同一收支类型的一级分类下。');
    if(d.categories.some(c=>c.parentID===id)) fail('请先移走二级分类，再将此分类移入其他分类。');
  }
  if(beforeID===id) return d;
  if(beforeID&&!d.categories.some(c=>c.id===beforeID&&c.bookID===source.bookID&&c.flow===source.flow&&(c.parentID||null)===parentID)) fail('放置位置无效。');
  if((source.parentID||null)!==parentID&&d.categories.some(c=>c.id!==id&&c.bookID===source.bookID&&c.flow===source.flow&&(c.parentID||null)===parentID&&c.name===source.name)) fail('目标位置已有同名分类。');
  d.categories=d.categories.filter(c=>c.id!==id); delete source.parentID; if(parentID) source.parentID=parentID;
  let index=beforeID?d.categories.findIndex(c=>c.id===beforeID):-1;
  if(index<0) {
    const last=d.categories.findLastIndex(c=>c.bookID===source.bookID&&c.flow===source.flow&&(c.parentID||null)===parentID);
    index=last>=0?last+1:parentID?d.categories.findIndex(c=>c.id===parentID)+1:d.categories.length;
  }
  d.categories.splice(index,0,source); return validate(d);
}
export function csv(data) {
  const field=value=>{ let text=String(value); if(/^[=+@-]/.test(text.trimStart())) text="'"+text; return '"'+text.replaceAll('"','""')+'"'; };
  const cats=new Map(data.categories.map(c=>[c.id,c])), books=new Map(data.books.map(b=>[b.id,b]));
  const rows=[['日期','账本','收支','金额（元）','一级分类','二级分类','备注'],...data.entries.toSorted((a,b)=>b.day.localeCompare(a.day)).map(e=>{
    const c=cats.get(e.categoryID), p=cats.get(c.parentID);
    return [e.day,books.get(e.bookID).name,e.flow==='income'?'收入':'支出',money(e.cents,false),p?.name||c.name,p?c.name:'',e.note];
  })];
  return '\uFEFF'+rows.map(row=>row.map(field).join(',')).join('\r\n');
}
export function sample() {
  const d=fresh(); d.books[0].name='生活账本';
  const travel={id:uid(),name:'旅行账本',icon:'airplane'}; d.books.push(travel);d.categories.push(...defaults(travel.id));
  [['工资',1680000,2,'这个月的努力'],['物业费',320000,3,'温暖的小家'],['外出美食',3800,0,'和同事吃午餐'],['咖啡茶饮',2600,0,'一杯拿铁'],['公共交通',600,0,'地铁通勤'],['日用品',12850,1,'补充生活小物'],['买菜做饭',8600,1,'好好吃饭'],['鞋服衣帽',32900,4,'换季新衣'],['水果',1500,0,'豆浆与三明治'],['电影',7800,5,'周末的电影']].forEach(([name,cents,offset,note],i)=>{
    const c=d.categories.find(c=>c.bookID===d.books[0].id&&c.name===name), date=new Date();date.setDate(Math.max(1,date.getDate()-offset));
    d.entries.push({id:uid(),bookID:c.bookID,categoryID:c.id,flow:c.flow,cents,day:dayString(date),note,createdAt:isoDate(new Date(Date.now()-i*60000))});
  }); return d;
}
