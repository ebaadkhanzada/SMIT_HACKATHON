/* auth.js — first-run setup, login, session guard */
const page=document.body.dataset.page;
const session=()=>DB.get(K.session,null);
const me=()=>{const s=session();return s&&users().find(u=>u.id===s.id)||null};
const home=u=>go(u.role==="admin"?"admin":"employee");
function guard(role){const u=me();if(!company()||!u){location.replace(go("index"));return null}if(role&&u.role!==role){location.replace(home(u));return null}return u}
const logout=()=>{localStorage.removeItem(K.session);location.href=go("index")};
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if(page==="index"){const u=me();if(u&&company())location.replace(home(u));else renderAuth()}
function renderAuth(){const first=!company(),box=$("#authbox");
  $("#board").innerHTML=`<div>${flap("WHO IS IN TODAY","")}</div><div>${flap("PRESENT","g")} ${flap("LATE","")} ${flap("ON LEAVE","p")}</div>`;
  box.innerHTML=first
   ?`<h2>Set up your company</h2><p class="mut">First run. Create the company and its Admin account.</p><form novalidate>${fld("company","Company name")}${fld("name","Your name")}${fld("email","Admin email","email")}${fld("password","Password","password")}<button class="btn pri wide">Create workspace</button></form>`
   :`<h2>Sign in</h2><p class="mut">${esc(company().name)} · HCM Lite</p><form novalidate>${fld("email","Email","email")}${fld("password","Password","password")}<button class="btn pri wide">Sign in</button></form>`;
  $("form",box).onsubmit=ev=>{ev.preventDefault();const d=formData(ev.target),e={};d.email=(d.email||"").trim().toLowerCase();
   if(first){
     if(!d.company.trim())e.company="Enter your company name";if(!d.name.trim())e.name="Enter your name";
     if(!EMAIL.test(d.email))e.email="Enter a valid email";if((d.password||"").length<4)e.password="Use at least 4 characters";
     if(!showErrors(box,e))return;
     DB.set(K.company,{name:d.company.trim(),start:"09:00",grace:15,quota:20,workDays:[1,2,3,4,5]});
     const a={id:Date.now(),name:d.name.trim(),email:d.email,password:d.password,role:"admin",department:"Management",salary:0,joined:today()};
     DB.set(K.users,[a]);DB.set(K.session,{id:a.id});location.href=go("admin");
   }else{
     if(!EMAIL.test(d.email))e.email="Enter a valid email";if(!d.password)e.password="Enter your password";
     if(!Object.keys(e).length){const u=users().find(x=>x.email===d.email&&x.password===d.password);if(!u)e.password="Wrong email or password";else{DB.set(K.session,{id:u.id});location.href=home(u);return}}
     showErrors(box,e)}}}
