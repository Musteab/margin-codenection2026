const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const days = ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const clock = hour => `${String(Math.floor(hour)).padStart(2,'0')}:${hour%1?'30':'00'}`;

function events(state) {
  return [
    {id:'class',day:0,start:9,duration:2,title:'Data structures',kind:'school',label:'Class · Lecture hall B',detail:'Your class stays at its original time. It is not part of your available work time.'},
    {id:'research',day:0,start:14,duration:2,title:'Report research',kind:'school',label:'2h work session',task:true,done:state.done,detail:'Start with sources and an outline. This is the first of three two-hour sessions for the report due Friday at noon.'},
    {id:'committee',day:0,start:19,duration:1,title:'Committee preparation',kind:'club',label:'1h · Your part',task:true,detail:state.confirmed?'Your one-hour preparation stays. Someone else has confirmed they will handle the two-hour outreach task.':'Your one-hour preparation stays. The separate two-hour outreach task is still yours until someone confirms a handover.'},
    {id:'lab',day:1,start:10,duration:2,title:'Lab session',kind:'school',label:'Class · Computing lab',detail:'A fixed class from your sample timetable.'},
    {id:'draft',day:1,start:14,duration:2,title:'Report draft',kind:'school',label:'2h work session',task:true,detail:'Draft the report using your research. There is another two-hour session on Thursday for the final pass.'},
    {id:'shift-wed',day:1,start:18,duration:2,title:'Café shift',kind:'work',label:'Work · Fixed shift',detail:'Your existing shift stays in place. You can try an extra shift separately without changing your calendar.'},
    {id:'algorithms',day:2,start:9,duration:2,title:'Algorithms',kind:'school',label:'Class',detail:'A fixed class from your sample timetable.'},
    {id:'final',day:2,start:14,duration:2,title:'Report final pass',kind:'school',label:'2h work session',task:true,detail:'Check your argument, references and submission file. The report is due Friday at noon.'},
    {id:'walk',day:2,start:17,duration:1,title:'Walk + reset',kind:'rest',label:'Time for yourself',detail:'This time is protected. It is not a spare slot for more work.'},
    {id:'margin',day:3,start:9,duration:1,title:'Available hour',kind:'life',label:'1h before the deadline',detail:'One available work hour before Friday noon. It is already included in the available time shown above.'},
    {id:'deadline',day:3,start:12,duration:.65,title:'Report due',kind:'deadline',label:'Submit by 12:00',detail:'Friday, 18 September at noon. This is a submission deadline, not another work session.'},
    {id:'shift-fri',day:3,start:15,duration:2,title:'Café shift',kind:'work',label:'Work · Fixed shift',detail:'This shift is after the report deadline and stays in place.'},
    {id:'groceries',day:4,start:11,duration:1,title:state.moved?'Groceries':'Free time',kind:'life',label:state.moved?'Moved here · 1h':'Nothing planned',task:state.moved,detail:state.moved?'Your grocery trip now happens after the Friday deadline.':'This time is intentionally left open.'},
    {id:'friends',day:4,start:17,duration:1.5,title:'Dinner with friends',kind:'rest',label:'Social plans',detail:'Time with your friends stays in the plan.'}
  ];
}

function eventRow(event,ctx) {
  const time=event.kind==='deadline'?clock(event.start):`${clock(event.start)}–${clock(event.start+event.duration)}`;
  return `<details class="cw-agenda-item ${event.done?'cw-is-done':''}" data-cw-item="${event.id}"><summary><time>${time}</time><span class="cw-item-copy"><strong>${esc(event.title)}${event.done?' <span class="cw-complete-label">Done</span>':''}</strong><small>${esc(event.label)}</small></span>${ctx.icon('chevron')}</summary><div class="cw-item-details"><p>${esc(event.detail)}</p>${event.id==='research'?ctx.button('complete',event.done?'Undo completion':'Mark done','button ghost small',event.done?'reset':'check'):''}</div></details>`;
}

function dailyPlan(day,ctx) {
  const today=events(ctx.state).filter(event=>event.day===day);
  const next=today.find(event=>event.task&&!event.done);
  return `<div class="cw-day-title"><h2>${days[day]}, ${15+day} September</h2>${day===0?'<span>Today</span>':''}</div>${next?`<section class="cw-next-task" aria-label="Next work session"><div><p class="cw-section-label">Next work session</p><h3>${esc(next.title)}</h3><p class="cw-next-time">${clock(next.start)}–${clock(next.start+next.duration)} <span>${next.duration}h${next.kind==='school'?' · Report due Friday, 12:00':''}</span></p></div>${next.id==='research'?ctx.button('complete','Mark done','button ghost','check'):`<button class="button ghost" data-cw-event="${next.id}">View task ${ctx.icon('arrow')}</button>`}</section>`:`<div class="cw-no-task"><h3>${day===3?'Your report is due today.':'No work session planned.'}</h3><p>${day===3?'Submit it by 12:00. Your other plans are below.':'Keep the open time, or review your week before adding more.'}</p></div>`}<div class="cw-other-plans"><h3>${next?'Also on your day':'Your plans'}</h3>${today.filter(event=>event!==next).map(event=>eventRow(event,ctx)).join('')}</div>`;
}

function calendar(ctx) {
  const items=events(ctx.state);
  return `<div class="cw-calendar-scroll" tabindex="0" aria-label="Week calendar. Scroll horizontally on a small screen."><div class="cw-full-calendar"><div class="cw-calendar-days"><span>MYT</span>${days.map((day,index)=>`<strong>${day.slice(0,3)} ${15+index}</strong>`).join('')}</div><div class="cw-calendar-grid"><div class="cw-time-axis">${Array.from({length:12},(_,index)=>`<span>${String(index+9).padStart(2,'0')}:00</span>`).join('')}</div>${days.map((day,index)=>`<div class="cw-calendar-day">${items.filter(event=>event.day===index).map(event=>`<button class="cw-calendar-event ${event.task?'cw-task-block':''} ${event.kind==='deadline'?'cw-deadline-block':''} ${event.done?'cw-is-done':''}" data-cw-event="${event.id}" data-kind="${event.kind}" style="top:calc(${(event.start-9)/12*100}% + 3px);height:calc(${event.duration/12*100}% - 6px)" aria-label="${esc(event.title)}, ${day}, ${clock(event.start)}"><strong>${esc(event.title)}</strong>${event.duration>=1.5?`<small>${clock(event.start)}–${clock(event.start+event.duration)}</small>`:''}</button>`).join('')}</div>`).join('')}</div></div></div><p class="cw-calendar-note">Dashed blocks are suggested work sessions. Classes, shifts and time for yourself stay in place.</p>`;
}

export function renderWeek(ctx) {
  const selectedDay=Math.max(0,Math.min(4,Number(ctx.state.cwDay)||0));
  const room=ctx.margin();
  return `<div class="cw-scene cw-simple" data-cw-scene><header class="cw-heading"><p class="cw-date-label">15–19 September 2026</p><h1>Your week</h1><p class="cw-summary">You have <strong>${ctx.workHours()}h of work</strong> and <strong>${ctx.availableHours()}h to do it</strong> before Friday, 12:00.</p></header><section class="cw-week-help" aria-label="Help with your workload"><div><p>${room<0?`Let’s find ${Math.abs(room)}h of room without cutting into your rest.`:room===0?'It fits, but there is no buffer for anything unexpected.':`You have ${room}h left free. You can keep it that way.`}</p>${ctx.state.requested&&!ctx.state.confirmed?'<small>Outreach still counts while the handover is waiting for a reply.</small>':''}</div>${ctx.link('rebalance',room>=0?'Review my changes':'Find me some room','button primary','arrow')}</section><section class="cw-daily-plan" aria-label="Daily agenda"><div class="cw-day-selector" aria-label="Choose a day">${days.map((day,index)=>`<button data-cw-day="${index}" aria-pressed="${index===selectedDay}" class="${index===selectedDay?'is-selected':''}"><span>${day.slice(0,3)}</span><strong>${15+index}</strong></button>`).join('')}</div><div data-cw-agenda>${dailyPlan(selectedDay,ctx)}</div></section><details class="cw-disclosure cw-calendar-disclosure" ${ctx.state.cwCalendarOpen?'open':''}><summary><span>${ctx.icon('calendar')}See the full week calendar</span>${ctx.icon('chevron')}</summary>${calendar(ctx)}</details><details class="cw-disclosure cw-personal-disclosure"><summary><span>${ctx.icon('settings')}How this week feels</span>${ctx.icon('chevron')}</summary><div class="cw-personal-content"><p>Time is only one part of your load. These are your own check-ins.</p><dl>${[['Mental',ctx.state.settings.mental],['Physical',ctx.state.settings.physical],['Social',ctx.state.settings.social],['Life admin',ctx.state.settings.admin]].map(([label,level])=>`<div><dt>${label}</dt><dd>${level}</dd></div>`).join('')}</dl>${ctx.link('settings','Update my check-ins','cw-secondary-link','arrow')}</div></details><footer class="cw-more"><a href="#semester">Upcoming deadlines ${ctx.icon('arrow')}</a><a href="#whatif">Considering another commitment?</a></footer></div>`;
}

const forecast=[
  {hours:5,cause:'Reading and small weekly tasks'},
  {hours:6,cause:'Lab preparation and society admin'},
  {hours:7,cause:'Early assignment work and committee setup'},
  {hours:10,cause:'Course report, committee preparation and groceries'},
  {hours:8,cause:'Lab work and post-event admin'},
  {hours:6,cause:'Tutorial preparation and life admin'},
  {hours:5,cause:'Reading and routine preparation'},
  {hours:9,cause:'Revision and a society event'},
  {hours:11,cause:'Two assessment preparations overlap'},
  {hours:7,cause:'Project planning and regular tasks'},
  {hours:8,cause:'Project development and committee handover'},
  {hours:12,cause:'Final project preparation and submission tasks'},
  {hours:9,cause:'Project revisions and presentation rehearsal'},
  {hours:6,cause:'Final review and loose ends'}
];

export function renderSemester(ctx) {
  const selected=Math.max(1,Math.min(14,Number(ctx.state.selectedWeek)||4));
  const current=forecast[selected-1];
  const hours=selected===4?ctx.workHours():current.hours;
  return `<div class="sh-scene sh-simple" data-sh-scene><header class="cw-heading"><a href="#week" class="sh-back">← Back to your week</a><h1>Upcoming deadlines</h1><p class="cw-summary">See what’s due and the work you need to do beforehand.</p></header><section class="sh-next-deadline" aria-label="Next deadline"><div class="sh-date"><strong>18</strong><span>SEP · FRI</span></div><div class="sh-deadline-copy"><p class="cw-section-label">Next deadline</p><h2>Course report</h2><p>Submit by <strong>12:00 on Friday.</strong></p><p class="sh-deadline-effort">${ctx.state.done?'4h of work remaining. Research is done.':'6h of work, split into three 2h sessions.'}</p></div>${ctx.link('week','See my work sessions','button primary','arrow')}</section><section class="sh-preparation"><h2>Your preparation plan</h2><ol>${[['Tuesday','Research',ctx.state.done?'Done':'14:00–16:00'],['Wednesday','Draft','14:00–16:00'],['Thursday','Final pass','14:00–16:00']].map(([day,title,time])=>`<li class="${time==='Done'?'sh-step-done':''}"><span>${day}</span><strong>${title}</strong><time>${time}</time></li>`).join('')}</ol></section><section class="sh-other-deadline"><div><p class="cw-section-label">Also due Friday</p><h3>Committee outreach</h3><p>${ctx.state.confirmed?'The 2h outreach handover is confirmed. Your 1h preparation stays in your plan.':ctx.state.requested?'A handover has been requested. The 2h outreach task is still yours until someone confirms.':'1h of preparation and 2h of outreach. You can ask someone to share the outreach.'}</p></div><a href="#rebalance">${ctx.state.confirmed?'Review the plan':'Ask for help'} ${ctx.icon('arrow')}</a></section><details class="cw-disclosure sh-forecast" ${ctx.state.shForecastOpen?'open':''}><summary><span>${ctx.icon('semester')}Look further ahead</span>${ctx.icon('chevron')}</summary><div class="sh-forecast-content"><p>Choose a week to see its estimated task hours. These sample estimates can change.</p><div class="sh-week-picker" aria-label="Choose a semester week">${forecast.map((record,index)=>`<button data-week="${index+1}" aria-pressed="${selected===index+1}" class="${selected===index+1?'is-selected':''}"><span>Week ${index+1}</span><strong>${index===3?ctx.workHours():record.hours}h</strong></button>`).join('')}</div><section class="sh-selected-week" aria-live="polite"><h3>Week ${selected} · ${hours}h ${selected===4?'remaining':'estimated'}</h3><p>${selected===4?`${ctx.availableHours()}h available before Friday noon. ${ctx.margin()<0?`${Math.abs(ctx.margin())}h still needs another solution.`:ctx.margin()===0?'The hours fit with no buffer.':`${ctx.margin()}h is left free.`}`:`${current.cause}. Review the actual deadlines and your available time before making a plan.`}</p></section></div></details><footer class="cw-more"><a href="#inbox">Add a syllabus or timetable ${ctx.icon('plus')}</a><a href="#review">Review imported details</a></footer></div>`;
}

export function mountCalendarScenes(ctx) {
  const root=document.querySelector('[data-cw-scene]');
  if(root) {
    root.addEventListener('click',event=>{
      const day=event.target.closest('[data-cw-day]');
      if(day) {
        const index=Number(day.dataset.cwDay);ctx.state.cwDay=index;
        root.querySelectorAll('[data-cw-day]').forEach(button=>{const active=Number(button.dataset.cwDay)===index;button.classList.toggle('is-selected',active);button.setAttribute('aria-pressed',String(active));});
        root.querySelector('[data-cw-agenda]').innerHTML=dailyPlan(index,ctx);
      }
      const selected=event.target.closest('[data-cw-event]');
      if(selected) {
        const item=events(ctx.state).find(record=>record.id===selected.dataset.cwEvent);
        const modal=document.querySelector('#modal');
        modal.innerHTML=`<div class="dialog-top"><span>${days[item.day]}, ${15+item.day} September</span><button class="icon-button" data-action="close" aria-label="Close task details">${ctx.icon('close')}</button></div><h2 id="modal-title">${esc(item.title)}</h2><p>${esc(item.detail)}</p>${item.id==='research'?ctx.button('complete',item.done?'Undo completion':'Mark done','button ghost',item.done?'reset':'check'):ctx.button('close','Got it','button ghost')}`;
        modal.querySelector('[data-action="complete"]')?.addEventListener('click',()=>modal.close(),{once:true});
        modal.setAttribute('aria-labelledby','modal-title');modal.showModal();
      }
    });
    root.querySelector('.cw-calendar-disclosure').addEventListener('toggle',event=>{ctx.state.cwCalendarOpen=event.currentTarget.open;});
  }
  document.querySelector('.sh-forecast')?.addEventListener('toggle',event=>{ctx.state.shForecastOpen=event.currentTarget.open;});
  document.querySelector('.sh-next-deadline a[href="#week"]')?.addEventListener('click',()=>{ctx.state.cwDay=ctx.state.done?1:0;});
}
