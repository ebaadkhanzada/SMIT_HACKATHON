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
    return null}
  const r=attOf(u.id,T);
  if(has("everyone","colleague","other","employees","who is","who was","company"))return"I can only share your own data as an employee.";
  if(has("leave")&&has("left","remaining","balance","how many"))return`You have ${balance(u.id)} leave day(s) left out of ${c.quota} this year (${usedDays(u.id)} used).`;
  if(has("pending"))return`You have ${leaves().filter(l=>l.empId===u.id&&l.status==="pending").length} pending leave request(s).`;
  if(has("late"))return!r?"You haven't checked in today yet.":r.status==="late"?`Yes. You checked in at ${r.in}; office starts at ${c.start} with ${c.grace} min grace.`:`No. You checked in at ${r.in}, on time.`;
  if(has("hour","week"))return`You've worked ${weekHours(u.id).toFixed(1)} hours this week.`;
  if(has("net","payslip","salary","pay"))return`Estimated net pay this month: ${money(payslip(u,today().slice(0,7)).net)}.`;
  if(has("check","status","today","attendance"))return!r?"No check-in yet today.":`Checked in at ${r.in}${r.out?`, out at ${r.out} (${r.hours} h)`:", still working"}. Status: ${BL[r.status]}.`;
  return null}

function initHelper(u){const adm=u.role==="admin",chips=adm?["How many employees do we have?","Who is on leave today?","Who was late today?"]:["How many leaves do I have left?","Was I late today?","Hours worked this week?"];
  const f=document.createElement("button");f.className="fab";f.innerHTML="<i>AI</i> Ask helper";
  const p=document.createElement("div");p.className="chat";p.innerHTML=`<header>Smart helper<small>${DB.get("hcm_gemini",{}).key?"Gemini + your live HCM data":"Answers from your live HCM data"}</small></header><div class="msgs"><div class="m">Hi ${esc(u.name.split(" ")[0])}! Ask me about ${adm?"your team":"your attendance and leave"}.</div></div><div class="chips">${chips.map(c=>`<button type="button">${c}</button>`).join("")}</div><form><input placeholder="Type a question…" aria-label="Question"><button class="btn pri">Send</button></form>`;
  document.body.append(f,p);const L=$(".msgs",p),add=(t,c)=>{const m=document.createElement("div");m.className="m "+c;m.textContent=t;L.append(m);L.scrollTop=L.scrollHeight};
  const ask=async q=>{if(!q.trim())return;add(q,"u");const usr=me()||u,g=DB.get("hcm_gemini",{});let a=answer(q,usr);
    if(g.key){add("Thinking…","");const t=L.lastChild,r=await gemini(q,usr,g);t.remove();a=r.ok?r.text:r.text+(a?"\n\nKeyword answer: "+a:"")}
    else if(a===null)a=HINT(usr);
    setTimeout(()=>add(a,""),250)};
  f.onclick=()=>p.classList.toggle("open");$$(".chips button",p).forEach(b=>b.onclick=()=>ask(b.textContent));
  $("form",p).onsubmit=e=>{e.preventDefault();const i=$("input",p);ask(i.value);i.value=""}}

const HINT=u=>u.role==="admin"?"Try: How many employees do we have? · Who is on leave today? · Who was late today? · Who is absent? · pending leaves · or an employee's name. Add a Gemini key in Settings to answer anything else.":"Try: How many leaves do I have left? · Was I late today? · How many hours did I work this week? · What is my net pay?";

/* ---- BONUS: Gemini LLM. Key is typed into Settings and kept only in this browser's localStorage (never in the code). ---- */
function dataSummary(u){const c=company(),T=today();
  if(u.role==="admin")return JSON.stringify({today:T,company:{name:c.name,officeStart:c.start,graceMinutes:c.grace,yearlyLeaveQuota:c.quota},employees:employees().slice(0,60).map(e=>{const r=attOf(e.id,T);return{name:e.name,department:e.department,salary:e.salary,statusToday:dayStatus(e,T),checkIn:r?r.in:null,checkOut:r?r.out:null,leaveDaysLeft:balance(e.id)}}),pendingLeaves:leaves().filter(l=>l.status==="pending").map(l=>({employee:empName(l.empId),type:l.type,from:l.from,to:l.to,days:l.days}))});
  const m=payslip(u,T.slice(0,7));
  return JSON.stringify({today:T,you:u.name,department:u.department,office:{start:c.start,graceMinutes:c.grace},todayRecord:attOf(u.id,T)||null,hoursWorkedThisWeek:+weekHours(u.id).toFixed(1),leaveDaysLeft:balance(u.id),yearlyLeaveQuota:c.quota,myLeaves:leaves().filter(l=>l.empId===u.id).map(l=>({type:l.type,from:l.from,to:l.to,days:l.days,status:l.status})),thisMonth:{workingDays:m.wd,present:m.present,late:m.late,halfDays:m.half,absent:m.absent,onLeave:m.leave,estimatedNetPay:Math.round(m.net)}})}
async function gemini(q,u,g){const sys="You are the smart helper inside HCM Lite, a small HR app. Answer ONLY from the DATA JSON. If the answer is not in the data, say you do not have that information. Be brief (max 3 sentences) and use plain text."+(u.role==="admin"?"":" The user is an employee: only discuss their own data and politely refuse questions about other people.");
  try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(g.model||"gemini-3.5-flash")}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":g.key},body:JSON.stringify({systemInstruction:{parts:[{text:sys}]},contents:[{role:"user",parts:[{text:`DATA:\n${dataSummary(u)}\n\nQUESTION: ${q}`}]}]})});
    const j=await r.json().catch(()=>({}));if(!r.ok)return{ok:0,text:`Gemini error (${r.status}): ${(j.error&&j.error.message)||"request failed"}`};
    const p=(((j.candidates||[])[0]||{}).content||{}).parts,t=p?p.map(x=>x.text||"").join("").trim():"";return t?{ok:1,text:t}:{ok:0,text:"Gemini returned an empty answer. Try rephrasing."}}
  catch(e){return{ok:0,text:"Could not reach Gemini (network, blocked request or bad key restriction). Open the browser console (F12) for details."}}}
