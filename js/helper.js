/* helper.js — Smart helper: keyword-matching chat that answers from real app data */
function answer(q,u){const t=q.toLowerCase(),w=t.split(/\W+/),has=(...x)=>x.some(k=>t.includes(k)),T=today(),c=company();
  if(u.role==="admin"){const E=employees(),S=E.map(e=>({e,s:dayStatus(e,T),r:attOf(e.id,T)})),names=a=>a.length?a.map(x=>x.e.name).join(", "):"nobody";
    const p=E.find(e=>e.name.length>2&&(t.includes(e.name.toLowerCase())||w.includes(e.name.split(" ")[0].toLowerCase())));
    if(p){const s=dayStatus(p,T),r=attOf(p.id,T);return `${p.name} (${p.department}): ${BL[s]||s} today${r?`, in ${r.in}${r.out?`, out ${r.out}`:""}`:""}. Leave left: ${balance(p.id)} of ${c.quota} days.`}
    if(!E.length)return"No employees yet. Add one from the Employees page and I can answer from real data.";
    if(has("pending"))return`${leaves().filter(l=>l.status==="pending").length} leave request(s) are waiting for approval.`;
    if(has("how many")&&has("employee","staff","people")||has("headcount","total employees"))return`We have ${E.length} employee${E.length>1?"s":""}.`;
    if(has("leave")){const L=E.filter(e=>approvedLeaveOn(e.id,T));if(!L.length)return"Nobody is on approved leave today.";const by={};L.forEach(e=>{const k=approvedLeaveOn(e.id,T).type.toLowerCase();by[k]=(by[k]||0)+1});
      return`${L.length} employee${L.length>1?"s":""}: ${Object.entries(by).map(([k,v])=>`${v} ${k}`).join(", ")}.\n${names(L.map(e=>({e})))}`}
    if(has("late"))return`${S.filter(x=>x.s==="late").length} late today: ${names(S.filter(x=>x.s==="late"))}.`;
    if(has("absent","not in","missing","absentee"))return`Not checked in yet: ${names(S.filter(x=>["notin","absent"].includes(x.s)))}.`;
    if(has("present","attend","here","office")){const h=S.filter(x=>["present","late","half"].includes(x.s));return`${h.length} of ${E.length} checked in today.`}
    if(has("department")){const d={};E.forEach(e=>d[e.department]=(d[e.department]||0)+1);return Object.entries(d).map(([k,v])=>`${k}: ${v}`).join("\n")}
    if(has("payroll","salary","salaries"))return`Total monthly payroll: ${money(E.reduce((a,e)=>a+Number(e.salary),0))}.`;
    return"Try: How many employees do we have? · Who is on leave today? · Who was late today? · Who is absent? · pending leaves · or an employee's name."}
  const r=attOf(u.id,T);
  if(has("everyone","colleague","other","employees","who is","who was","company"))return"I can only share your own data as an employee.";
  if(has("leave")&&has("left","remaining","balance","how many"))return`You have ${balance(u.id)} leave day(s) left out of ${c.quota} this year (${usedDays(u.id)} used).`;
  if(has("pending"))return`You have ${leaves().filter(l=>l.empId===u.id&&l.status==="pending").length} pending leave request(s).`;
  if(has("late"))return!r?"You haven't checked in today yet.":r.status==="late"?`Yes. You checked in at ${r.in}; office starts at ${c.start} with ${c.grace} min grace.`:`No. You checked in at ${r.in}, on time.`;
  if(has("hour","week"))return`You've worked ${weekHours(u.id).toFixed(1)} hours this week.`;
  if(has("net","payslip","salary","pay"))return`Estimated net pay this month: ${money(payslip(u,today().slice(0,7)).net)}.`;
  if(has("check","status","today","attendance"))return!r?"No check-in yet today.":`Checked in at ${r.in}${r.out?`, out at ${r.out} (${r.hours} h)`:", still working"}. Status: ${BL[r.status]}.`;
  return"Try: How many leaves do I have left? · Was I late today? · How many hours did I work this week? · What is my net pay?"}

function initHelper(u){const adm=u.role==="admin",chips=adm?["How many employees do we have?","Who is on leave today?","Who was late today?"]:["How many leaves do I have left?","Was I late today?","Hours worked this week?"];
  const f=document.createElement("button");f.className="fab";f.innerHTML="<i>AI</i> Ask helper";
  const p=document.createElement("div");p.className="chat";p.innerHTML=`<header>Smart helper<small>Answers from your live HCM data</small></header><div class="msgs"><div class="m">Hi ${esc(u.name.split(" ")[0])}! Ask me about ${adm?"your team":"your attendance and leave"}.</div></div><div class="chips">${chips.map(c=>`<button type="button">${c}</button>`).join("")}</div><form><input placeholder="Type a question…" aria-label="Question"><button class="btn pri">Send</button></form>`;
  document.body.append(f,p);const L=$(".msgs",p),add=(t,c)=>{const m=document.createElement("div");m.className="m "+c;m.textContent=t;L.append(m);L.scrollTop=L.scrollHeight};
  const ask=q=>{if(!q.trim())return;add(q,"u");setTimeout(()=>add(answer(q,me()||u),""),350)};
  f.onclick=()=>p.classList.toggle("open");$$(".chips button",p).forEach(b=>b.onclick=()=>ask(b.textContent));
  $("form",p).onsubmit=e=>{e.preventDefault();const i=$("input",p);ask(i.value);i.value=""}}
