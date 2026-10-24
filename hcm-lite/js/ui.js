/* ui.js — shared UI: shell, modal, toast, forms, split-flap board */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>"Rs "+Math.round(n).toLocaleString("en-PK");
const ini=n=>n.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
const greet=()=>{const h=new Date().getHours();return h<12?"Good morning":h<17?"Good afternoon":"Good evening"};
document.documentElement.dataset.theme=DB.get("hcm_theme","light");
const IC={home:'<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',users:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-4 3-6 7-6s7 2 7 6M17 5a3.5 3.5 0 010 7M22 20c0-3-2-5-4-5.5"/>',cal:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',slip:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6"/>'};
const BL={present:"Present",late:"Late",half:"Half day",absent:"Absent",leave:"On leave",notin:"Not in yet",off:"Day off",future:"—",na:"—",pending:"Pending",approved:"Approved",rejected:"Rejected"};
const badge=s=>`<span class="b ${s}">${BL[s]||s}</span>`;

/* split-flap text: each character is its own flipping tile */
const flap=(t,c="",n=22)=>[...String(t).toUpperCase().slice(0,n)].map((ch,i)=>`<span class="fl ${c}" style="--i:${i}">${ch===" "?"&nbsp;":esc(ch)}</span>`).join("");

function toast(m,t=""){const w=$("#toasts")||document.body.appendChild(Object.assign(document.createElement("div"),{id:"toasts"}));const e=document.createElement("div");e.className="toast "+t;e.textContent=m;w.append(e);setTimeout(()=>e.remove(),3400)}
function modal(title,html,mount){const m=document.createElement("div");m.className="ov";m.innerHTML=`<div class="md" role="dialog" aria-label="${esc(title)}"><div class="mh"><h3>${title}</h3><button class="x" aria-label="Close">×</button></div>${html}</div>`;document.body.append(m);const close=()=>m.remove();m.onclick=e=>{if(e.target===m)close()};$(".x",m).onclick=close;mount&&mount(m,close);return m}
const fld=(n,l,t="text",v="",x="")=>`<label class="f"><span>${l}</span><input name="${n}" type="${t}" value="${esc(v)}" ${x}><small class="err" data-err="${n}"></small></label>`;
const errBox=n=>`<small class="err" data-err="${n}"></small>`;
function showErrors(root,e){$$(".err",root).forEach(s=>s.textContent=e[s.dataset.err]||"");$$("input,select,textarea",root).forEach(i=>i.classList.toggle("bad",!!e[i.name]));const first=$$(".bad",root)[0];first&&first.focus();return!Object.keys(e).length}
const formData=f=>Object.fromEntries(new FormData(f));
function countUp(){$$("[data-count]").forEach(el=>{const t=+el.dataset.count;let s=null;const f=ts=>{s??=ts;const p=Math.min((ts-s)/700,1);el.textContent=Math.round(t*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)};requestAnimationFrame(f)})}
const anns=()=>DB.get(K.ann,[]);
const annHTML=()=>{const a=anns().slice(-4).reverse();return a.length?a.map(x=>`<div class="ann"><b>${esc(x.title)}</b><p>${esc(x.body)}</p><small>${x.date} · ${esc(x.by)}</small></div>`).join(""):'<p class="mut">No announcements yet.</p>'};

function shell(active,title,sub,role){const u=guard(role);if(!u)return null;const c=company();
  const nav=u.role==="admin"?[["admin","home","Dashboard"],["employees","users","Employees"],["leaves","cal","Leaves"],["settings","gear","Settings"],["payslip","slip","Payslips"]]:[["employee","home","Dashboard"],["payslip","slip","Payslip"]];
  const v=$("#view"),l=document.createElement("div");l.className="layout";
  l.innerHTML=`<aside class="side"><div class="brand"><div class="logo">H</div><div>HCM Lite<small>${esc(c.name)}</small></div></div><nav class="nav" aria-label="Main">${nav.map(([p,i,t])=>`<a href="${go(p)}" class="${p===active?"on":""}"><svg viewBox="0 0 24 24">${IC[i]}</svg>${t}</a>`).join("")}</nav><div class="me"><div class="av">${esc(ini(u.name))}</div><div><b>${esc(u.name)}</b><small>${u.role==="admin"?"Administrator":esc(u.department)}</small></div></div></aside><div class="content"><div class="top"><div><h1>${title}</h1><p class="mut">${sub||""}</p></div><div class="tools"><button class="btn sm" id="pw">Password</button><button class="btn sm" id="th">Theme</button><button class="btn sm" id="lo">Log out</button></div></div></div>`;
  v.replaceWith(l);$(".content",l).append(v);
  $("#lo").onclick=logout;
  $("#th").onclick=()=>{const t=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=t;DB.set("hcm_theme",t)};
  $("#pw").onclick=()=>modal("Change password",`<form novalidate>${fld("cur","Current password","password")}${fld("nw","New password (min 4 characters)","password")}${fld("cf","Confirm new password","password")}<button class="btn pri wide">Update password</button></form>`,(m,close)=>{$("form",m).onsubmit=ev=>{ev.preventDefault();const d=formData(ev.target),e={};
    if(d.cur!==u.password)e.cur="Current password is wrong";if(d.nw.length<4)e.nw="Use at least 4 characters";if(d.cf!==d.nw)e.cf="Passwords do not match";
    if(!showErrors(m,e))return;const all=users();all.find(x=>x.id===u.id).password=d.nw;DB.set(K.users,all);close();toast("Password updated")}});
  if(active==="admin"||active==="employee")initHelper(u);
  return u}
