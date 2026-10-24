/* reports.js — BONUS: Chart.js chart, CSV export, printable monthly report */
const monthDays=ym=>{const[y,m]=ym.split("-").map(Number);return[...Array(new Date(y,m,0).getDate())].map((_,i)=>`${ym}-${pad(i+1)}`)};
function exportCSV(ym){const rows=[["Date","Employee","Email","Department","Check-in","Check-out","Hours","Status","Distance from office (m)"]];
  monthDays(ym).filter(d=>d<=today()).forEach(d=>employees().forEach(e=>{const s=dayStatus(e,d);if(["na","off","future"].includes(s))return;const r=attOf(e.id,d)||{};rows.push([d,e.name,e.email,e.department,r.in||"",r.out||"",r.out?r.hours:"",BL[s]||s,r.loc?r.loc.d:""])}));
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv"})),download:`attendance-${ym}.csv`});document.body.append(a);a.click();a.remove();return rows.length-1}
function printReport(ym){let tot=0;const rows=employees().map(e=>{const s=payslip(e,ym),h=records().filter(r=>r.empId===e.id&&r.date.startsWith(ym)).reduce((a,r)=>a+(r.hours||0),0);tot+=s.net;
    return`<tr><td>${esc(e.name)}</td><td>${esc(e.department)}</td><td>${s.present+s.late+s.half}</td><td>${s.late}</td><td>${s.half}</td><td>${s.absent}</td><td>${s.leave}</td><td>${h.toFixed(1)}</td><td>${money(s.net)}</td></tr>`}).join("");
  const r=$("#rep")||document.body.appendChild(Object.assign(document.createElement("div"),{id:"rep"}));
  r.innerHTML=`<h2>${esc(company().name)}: monthly attendance report</h2><p>${new Date(ym+"-01").toLocaleString("en",{month:"long",year:"numeric"})} · printed ${today()}</p><table><thead><tr><th>Employee</th><th>Dept</th><th>Attended</th><th>Late</th><th>Half</th><th>Absent</th><th>Leave</th><th>Hours</th><th>Net pay</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><th colspan="8">Total net payroll</th><th>${money(tot)}</th></tr></tfoot></table>`;
  document.body.classList.add("rp");print();document.body.classList.remove("rp")}
function adminExtras(D,T){
  if(window.Chart){const tx=getComputedStyle(document.documentElement).getPropertyValue("--mut").trim();
    new Chart($("#c7"),{type:"bar",data:{labels:D.map(d=>d.l),datasets:[{label:"On time",data:D.map(d=>d.p-d.lt),backgroundColor:"#00a86b",borderRadius:6},{label:"Late",data:D.map(d=>d.lt),backgroundColor:"#f5a524",borderRadius:6}]},options:{maintainAspectRatio:false,scales:{x:{stacked:true,ticks:{color:tx},grid:{display:false}},y:{stacked:true,beginAtZero:true,ticks:{color:tx,precision:0}}},plugins:{legend:{labels:{color:tx}}}}})}
  else $("#c7").replaceWith(Object.assign(document.createElement("p"),{className:"mut",textContent:"Chart.js could not load (offline)."}));
  $("#view").insertAdjacentHTML("beforeend",`<div class="pn noprint" style="margin-top:16px"><div class="row sp"><div><h3 style="margin:0">Reports</h3><small>Export attendance to CSV or print a monthly report</small></div><div class="row"><input type="month" id="rm" value="${T.slice(0,7)}" aria-label="Month" style="width:auto"><button class="btn sm" id="csv">Export CSV</button><button class="btn pri sm" id="rp">Print monthly report</button></div></div></div>`);
  $("#csv").onclick=()=>toast(`Exported ${exportCSV($("#rm").value)} attendance rows`);
  $("#rp").onclick=()=>employees().length?printReport($("#rm").value):toast("Add employees first","err")}
