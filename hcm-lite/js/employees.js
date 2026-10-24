/* employees.js — manage employees (admin) */
if(page==="employees"&&guard("admin")){shell("employees","Employees","Add an employee and their login is created automatically.","admin");
  $("#view").innerHTML=`<div class="bar2"><input id="q" placeholder="Search name, email or department" aria-label="Search"><select id="dp" aria-label="Department"></select><button class="btn pri" id="add">+ Add employee</button></div><div class="pn tw" id="list"></div>`;
  const draw=()=>{const E=employees(),q=$("#q").value.toLowerCase(),cur=$("#dp").value,deps=[...new Set(E.map(e=>e.department))].sort();
    $("#dp").innerHTML=`<option value="">All departments</option>`+deps.map(d=>`<option ${d===cur?"selected":""}>${esc(d)}</option>`).join("");
    const f=E.filter(e=>(!$("#dp").value||e.department===$("#dp").value)&&[e.name,e.email,e.department].join(" ").toLowerCase().includes(q));
    $("#list").innerHTML=!E.length?`<div class="empty"><b>No employees yet</b>Add your first employee to create their login.</div>`:!f.length?`<div class="empty"><b>No matches</b>Try another search or department.</div>`
    :`<table><thead><tr><th>Employee</th><th>Department</th><th>Salary</th><th>Joined</th><th>Today</th><th></th></tr></thead><tbody>${f.map(e=>`<tr><td><div class="who"><div class="av">${esc(ini(e.name))}</div><div><b>${esc(e.name)}</b><br><small>${esc(e.email)}</small></div></div></td><td>${esc(e.department)}</td><td>${money(e.salary)}</td><td>${e.joined}</td><td>${badge(dayStatus(e,today()))}</td><td class="row"><button class="btn sm" data-ed="${e.id}">Edit</button><button class="btn sm no" data-dl="${e.id}">Delete</button></td></tr>`).join("")}</tbody></table>`;
    $$("[data-ed]").forEach(b=>b.onclick=()=>form(E.find(e=>e.id==b.dataset.ed)));
    $$("[data-dl]").forEach(b=>b.onclick=()=>{const e=E.find(x=>x.id==b.dataset.dl);if(!confirm(`Delete ${e.name}? Their login, attendance and leave records will be removed.`))return;
      DB.set(K.users,users().filter(u=>u.id!==e.id));DB.set(K.att,records().filter(r=>r.empId!==e.id));DB.set(K.leaves,leaves().filter(l=>l.empId!==e.id));toast("Employee deleted");draw()})};
  function form(e){const edit=!!e;e=e||{};const deps=[...new Set(employees().map(x=>x.department))];
    modal(edit?"Edit employee":"Add employee",`<form novalidate>${fld("name","Full name","text",e.name)}${fld("email","Email (used to log in)","email",e.email)}<div class="two">${fld("password",edit?"New password (optional)":"Password","password")}${fld("department","Department","text",e.department,'list="dl"')}</div><datalist id="dl">${deps.map(d=>`<option value="${esc(d)}">`).join("")}</datalist><div class="two">${fld("salary","Monthly salary (Rs)","number",e.salary,'min="1"')}${fld("joined","Joining date","date",e.joined||today())}</div><button class="btn pri wide">${edit?"Save changes":"Create employee and login"}</button></form>`,(m,close)=>{
      $("form",m).onsubmit=ev=>{ev.preventDefault();const d=formData(ev.target),er={};d.email=d.email.trim().toLowerCase();
        if(!d.name.trim())er.name="Enter the employee's name";
        if(!EMAIL.test(d.email))er.email="Enter a valid email";else if(users().some(u=>u.email===d.email&&u.id!==e.id))er.email="This email is already used";
        if(!edit&&d.password.length<4)er.password="Use at least 4 characters";else if(d.password&&d.password.length<4)er.password="Use at least 4 characters";
        if(!d.department.trim())er.department="Enter a department";
        if(!(Number(d.salary)>0))er.salary="Salary must be greater than 0";if(!d.joined)er.joined="Pick a date";
        if(!showErrors(m,er))return;const all=users();
        if(edit){Object.assign(all.find(u=>u.id===e.id),{name:d.name.trim(),email:d.email,department:d.department.trim(),salary:Number(d.salary),joined:d.joined});if(d.password)all.find(u=>u.id===e.id).password=d.password}
        else all.push({id:Date.now(),name:d.name.trim(),email:d.email,password:d.password,role:"employee",department:d.department.trim(),salary:Number(d.salary),joined:d.joined});
        DB.set(K.users,all);close();toast(edit?"Changes saved":`${d.name.trim()} can now log in`);draw()}})}
  $("#add").onclick=()=>form();$("#q").oninput=draw;$("#dp").onchange=draw;draw()}
