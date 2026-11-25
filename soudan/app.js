'use strict';
const $ = id => document.getElementById(id);
const state = { slots: [], date: '', slot: '', month: '', data: null };
const dateKey = value => new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
const timeText = value => new Intl.DateTimeFormat('ja-JP', {timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));
const dayText = value => new Intl.DateTimeFormat('ja-JP', {timeZone:'Asia/Tokyo',month:'long',day:'numeric',weekday:'short'}).format(new Date(value));
const fullText = value => new Intl.DateTimeFormat('ja-JP', {timeZone:'Asia/Tokyo',year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(new Date(value)) + ' ' + timeText(value) + '〜' + timeText(new Date(new Date(value).getTime()+1800000)) + '（日本時間）';
function error(message, retry=false) { const box=$('global-error'); box.replaceChildren(); box.hidden=!message; if(message){box.append(document.createTextNode(message));if(retry){const b=document.createElement('button');b.textContent='再読み込み';b.className='text-button';b.onclick=()=>loadSlots();box.append(b);}} }
function panel(name, step) { for(const id of ['select','form','confirm']) $(id+'-panel').hidden=id!==name; document.querySelectorAll('[data-step]').forEach(li=>li.classList.toggle('active',Number(li.dataset.step)===step));error(''); }
function renderCalendar() {
 const [y,m]=state.month.split('-').map(Number);if(!y||!m)return;
 $('month-label').textContent=y+'年 '+m+'月'; const cal=$('calendar');cal.replaceChildren();
 const first=new Date(Date.UTC(y,m-1,1)); const offset=(first.getUTCDay()+6)%7;const days=new Date(Date.UTC(y,m,0)).getUTCDate();
 for(let i=0;i<offset;i++){const blank=document.createElement('span');cal.append(blank);}
 const dates=new Set(state.slots.map(dateKey));
 for(let day=1;day<=days;day++){const key=`${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;const b=document.createElement('button');b.type='button';b.textContent=day;b.disabled=!dates.has(key);b.className=(dates.has(key)?'available ':'')+(key===state.date?'selected':'');b.setAttribute('aria-label',`${y}年${m}月${day}日${b.disabled?' 選択不可':''}`);b.setAttribute('aria-pressed',String(key===state.date));b.onclick=()=>{state.date=key;state.slot='';renderCalendar();renderSlots();};cal.append(b);}
 const months=state.slots.map(s=>dateKey(s).slice(0,7)).sort();$('prev-month').disabled=!months.length||state.month<=months[0];$('next-month').disabled=!months.length||state.month>=months[months.length-1];
}
function renderSlots(){const box=$('slots');box.replaceChildren();$('to-form').disabled=!state.slot;$('selected-date-label').textContent=state.date?dayText(state.date+'T12:00:00+09:00'):'日付を選んでください'; const slots=state.slots.filter(s=>dateKey(s)===state.date);if(!slots.length){const p=document.createElement('p');p.className='loading';p.textContent=state.slots.length?'カレンダーから日付を選択してください。':'現在選択できる希望日時がありません。ページを再読み込みしてください。';box.append(p);return;}for(const slot of slots){const b=document.createElement('button');b.type='button';b.textContent=timeText(slot);b.className=slot===state.slot?'selected':'';b.setAttribute('aria-pressed',String(slot===state.slot));b.setAttribute('aria-label',fullText(slot));b.onclick=()=>{state.slot=slot;renderSlots();};box.append(b);}}
function loadSlots(){
 const now=new Date();const today=dateKey(now);state.slots=[];
 for(let day=0;day<28;day++){const date=new Date(today+'T00:00:00+09:00');date.setTime(date.getTime()+day*86400000);const key=dateKey(date);const week=new Date(key+'T12:00:00+09:00').getUTCDay();const weekend=week===0||week===6;for(let minute=(weekend?11:20)*60;minute<(weekend?20:23)*60;minute+=30){const slot=key+'T'+String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0')+':00+09:00';if(new Date(slot)>now)state.slots.push(slot);}}
 state.slot='';state.date=state.slots.length?dateKey(state.slots[0]):'';state.month=state.date.slice(0,7)||today.slice(0,7);renderCalendar();renderSlots();error('');
}function moveMonth(amount){const [y,m]=state.month.split('-').map(Number);const d=new Date(Date.UTC(y,m-1+amount,1));state.month=`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;state.date=dateKey(state.slots.find(s=>dateKey(s).startsWith(state.month)));state.slot='';renderCalendar();renderSlots();}
$('prev-month').onclick=()=>moveMonth(-1);$('next-month').onclick=()=>moveMonth(1);
$('to-form').onclick=()=>{if(!state.slot)return;$('form-slot').textContent=fullText(state.slot);panel('form',2);$('booking-form').elements.company.focus();};
$('back-date').onclick=()=>{panel('select',1);$('month-label').scrollIntoView({block:'center'});};
$('booking-form').onsubmit=e=>{e.preventDefault();const form=$('booking-form');if(!form.reportValidity())return;state.data={slot:state.slot};for(const key of ['company','name','email','task','volume'])state.data[key]=form.elements[key].value.trim();if(!state.data.company||!state.data.name||!state.data.task||!state.data.volume){error('必須項目を入力してください。分からない項目は「不明」で大丈夫です。');return;}const dl=$('confirmation');dl.replaceChildren();for(const [label,value] of [['ご希望日時',fullText(state.slot)],['会社名・屋号',state.data.company],['お名前',state.data.name],['メールアドレス',state.data.email],['ご相談内容',state.data.task],['月あたりの件数・時間',state.data.volume]]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;dl.append(dt,dd);}prepareDraft();panel('confirm',3);$('confirm-title').focus();};
$('back-form').onclick=()=>panel('form',2);
const recipient='katsuraharuki@outlook.jp';
const subject='無料30分相談のお申し込み';
function updateMailLink(){ $('submit-booking').href='mailto:'+recipient+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent($('email-draft').value); }
function prepareDraft(){
 const d=state.data;
 $('email-draft').value=[ '桂 治希 様','', '無料30分オンライン相談を希望します。','', '希望日時：'+fullText(d.slot), '会社名・屋号：'+d.company,'お名前：'+d.name,'返信先メールアドレス：'+d.email,'','AIに任せたい仕事・相談したいこと：',d.task,'','月あたりの件数・時間：'+d.volume,'','上記日時での相談が可能か、ご返信をお願いいたします。'].join('\r\n');
 $('copy-status').textContent='';updateMailLink();
}
$('email-draft').addEventListener('input',updateMailLink);
$('submit-booking').addEventListener('click',event=>{if(!state.data||new Date(state.data.slot)<=new Date()){event.preventDefault();panel('select',1);loadSlots();error('選択した希望日時を過ぎました。別の日時をお選びください。入力内容はそのまま残っています。');return;}updateMailLink();});
$('copy-draft').onclick=async()=>{try{await navigator.clipboard.writeText($('email-draft').value);$('copy-status').textContent='本文をコピーしました。件名「無料30分相談のお申し込み」で、ご自身のメールから送信してください。';}catch{const draft=$('email-draft');draft.focus();draft.select();$('copy-status').textContent='本文を選択しました。長押し、または Ctrl+C / ⌘C でコピーしてください。';}};
$('year').textContent=new Date().getFullYear();loadSlots();

