/* storage.js — localStorage helpers, date utils and ALL business rules */
const K={company:"hcm_company",users:"hcm_users",att:"hcm_attendance",leaves:"hcm_leaves",session:"hcm_session",ann:"hcm_announcements"};
const DB={get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch(e){return d}},set(k,v){localStorage.setItem(k,JSON.stringify(v))}};
const IN_PAGES=location.pathname.includes("/pages/");
const go=p=>p==="index"?(IN_PAGES?"../":"")+"index.html":(IN_PAGES?"":"pages/")+p+".html";
const pad=n=>String(n).padStart(2,"0");
const fmtDate=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>fmtDate(new Date());
const nowHM=()=>{const d=new Date();return pad(d.getHours())+":"+pad(d.getMinutes())};
const toDate=s=>{const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)};
const toMin=t=>{const[h,m]=t.split(":").map(Number);return h*60+m};
const company=()=>DB.get(K.company,null);
const users=()=>DB.get(K.users,[]);
const employees=()=>users().filter(u=>u.role==="employee");
const records=()=>DB.get(K.att,[]);
const leaves=()=>DB.get(K.leaves,[]);
const isWork=(s,c=company())=>c.workDays.includes(toDate(s).getDay());
function workDaysBetween(a,b){let n=0;for(let d=toDate(a);d<=toDate(b);d.setDate(d.getDate()+1))if(isWork(fmtDate(d)))n++;return n}

/* ---- attendance ---- */
const attOf=(id,date)=>records().find(r=>r.empId===id&&r.date===date);
function checkIn(id,extra={}){const c=company(),t=today();
  if(!isWork(t))return{err:"Today is not a working day."};
  if(attOf(id,t))return{err:"You already checked in today."};
  const tm=nowHM(),late=toMin(tm)>toMin(c.start)+Number(c.grace);
  const r=records();r.push({empId:id,date:t,in:tm,out:null,status:late?"late":"present",hours:0,...extra});DB.set(K.att,r);return{ok:1,late,tm}}
function checkOut(id){const t=today(),r=records(),x=r.find(a=>a.empId===id&&a.date===t);
  if(!x)return{err:"Check in first."};if(x.out)return{err:"You already checked out today."};
  x.out=nowHM();x.hours=+((toMin(x.out)-toMin(x.in))/60).toFixed(2);if(x.hours<5)x.status="half";DB.set(K.att,r);return{ok:1,x}}
function weekHours(id){const d=new Date();d.setDate(d.getDate()-((d.getDay()+6)%7));const s=fmtDate(d);
  return records().filter(r=>r.empId===id&&r.date>=s).reduce((a,r)=>a+(r.out?r.hours:r.date===today()?Math.max(0,toMin(nowHM())-toMin(r.in))/60:0),0)}

/* ---- leave ---- */
const approvedLeaveOn=(id,d)=>leaves().find(l=>l.empId===id&&l.status==="approved"&&l.from<=d&&d<=l.to);
const usedDays=id=>leaves().filter(l=>l.empId===id&&l.status==="approved").reduce((s,l)=>s+l.days,0);
const balance=id=>company().quota-usedDays(id);
function leaveErrors(id,d){const e={};
  if(!d.type)e.type="Choose a leave type";if(!d.from)e.from="Pick a start date";if(!d.to)e.to="Pick an end date";if(!d.reason.trim())e.reason="Add a short reason";
  if(d.from&&d.to){
    if(d.from>d.to)e.to="To date must be on or after From date";
    else{const days=workDaysBetween(d.from,d.to);
      if(!days)e.to="That range has no working days";
      else if(leaves().some(l=>l.empId===id&&l.status!=="rejected"&&l.from<=d.to&&d.from<=l.to))e.from="Overlaps another leave request";
      else{const left=company().quota-leaves().filter(l=>l.empId===id&&l.status!=="rejected").reduce((s,l)=>s+l.days,0);if(days>left)e.to=`Only ${Math.max(left,0)} day(s) left in your quota`}}}
  return e}

/* ---- day status + payslip ---- */
function dayStatus(u,d){if(d<u.joined)return"na";if(!isWork(d))return"off";const r=attOf(u.id,d);if(r)return r.status;
  if(approvedLeaveOn(u.id,d))return"leave";return d>today()?"future":d===today()?"notin":"absent"}
function payslip(u,ym){const[y,m]=ym.split("-").map(Number),last=new Date(y,m,0).getDate(),s={wd:0,absent:0,half:0,late:0,present:0,leave:0};
  for(let i=1;i<=last;i++){const d=`${ym}-${pad(i)}`;if(!isWork(d))continue;s.wd++;const st=dayStatus(u,d);if(s[st]!==undefined)s[st]++}
  s.perDay=s.wd?u.salary/s.wd:0;s.deduction=s.perDay*(s.absent+.5*s.half);s.net=Math.max(0,u.salary-s.deduction);return s}
