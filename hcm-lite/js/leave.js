/* leave.js — admin leave approvals + shared leave helpers */
const empName=id=>(users().find(u=>u.id===id)||{name:"Deleted user"}).name;
function decide(l,approve,done){modal(approve?"Approve leave":"Reject leave",`<p class="mut" style="margin-bottom:12px">${esc(empName(l.empId))} · ${l.days} day(s) · ${l.from} to ${l.to}</p><form novalidate><label class="f"><span>Comment ${approve?"(optional)":""}</span><textarea name="comment" rows="3" placeholder="Visible to the employee"></textarea>${errBox("comment")}</label><button class="btn ${approve?"ok":"no"} wide">${approve?"Approve":"Reject"} request</button></form>`,(m,close)=>{
  $("form",m).onsubmit=ev=>{ev.preventDefault();const c=formData(ev.target).comment.trim();if(!approve&&!c)return showErrors(m,{comment:"Add a comment so the employee knows why"});
    const all=leaves(),x=all.find(a=>a.id===l.id);x.status=approve?"approved":"rejected";x.comment=c;DB.set(K.leaves,all);close();toast(approve?"Leave approved. Balance updated.":"Leave rejected");done()}})}

if(page==="leaves"&&guard("admin")){shell("leaves","Leave requests","Approve or reject with a comment. Balances update instantly.","admin");let tab="pending";
  $("#view").innerHTML=`<div class="tabs" id="tabs"></div><div class="lv" id="lv"></div>`;
  const draw=()=>{const all=leaves().sort((a,b)=>b.id-a.id);
    $("#tabs").innerHTML=["pending","approved","rejected","all"].map(t=>`<button class="btn sm ${t===tab?"on":""}" data-t="${t}">${t[0].toUpperCase()+t.slice(1)} (${t==="all"?all.length:all.filter(l=>l.status===t).length})</button>`).join("");
    $$("[data-t]").forEach(b=>b.onclick=()=>{tab=b.dataset.t;draw()});
    const f=all.filter(l=>tab==="all"||l.status===tab);
    $("#lv").innerHTML=f.length?f.map(l=>{const u=users().find(x=>x.id===l.empId);return`<div class="pn"><div class="row sp"><div class="who"><div class="av">${esc(ini(empName(l.empId)))}</div><div><b>${esc(empName(l.empId))}</b><br><small>${u?esc(u.department):""}</small></div></div>${badge(l.status)}</div><div><b>${l.type}</b> · ${l.days} working day(s)<br><small>${l.from} → ${l.to}</small></div><p>${esc(l.reason)}</p>${l.comment?`<p class="mut">Admin: ${esc(l.comment)}</p>`:""}${u?`<small>Balance: ${balance(u.id)} of ${company().quota} days left</small>`:""}${l.status==="pending"?`<div class="row"><button class="btn ok sm" data-a="${l.id}">Approve</button><button class="btn no sm" data-r="${l.id}">Reject</button></div>`:""}</div>`}).join(""):`<div class="pn empty" style="grid-column:1/-1"><b>Nothing here</b>No ${tab==="all"?"":tab+" "}leave requests yet.</div>`;
    $$("[data-a]").forEach(b=>b.onclick=()=>decide(leaves().find(l=>l.id==b.dataset.a),true,draw));$$("[data-r]").forEach(b=>b.onclick=()=>decide(leaves().find(l=>l.id==b.dataset.r),false,draw))};draw()}
