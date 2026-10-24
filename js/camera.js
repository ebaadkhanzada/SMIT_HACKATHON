/* camera.js — BONUS: camera + location + face-detection check-in (getUserMedia, geolocation, face-api.js CDN) */
const FA="https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/";
let faReady;
const loadFace=()=>faReady??=new Promise((ok,no)=>{const s=document.createElement("script");s.src=FA+"dist/face-api.js";s.onerror=no;s.onload=async()=>{try{await faceapi.nets.tinyFaceDetector.loadFromUri(FA+"model/");ok()}catch(e){no(e)}};document.head.append(s)});
const distM=(a,b,c,d)=>{const r=x=>x*Math.PI/180,h=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;return 2*6371e3*Math.asin(Math.sqrt(h))};

function camCheckin(c,done){let stream,timer,loc=null,face=false,faceOk=true,camOk=false;const fence=c.lat!=null&&c.lng!=null;
  const m=modal("Camera check-in",`<video id="vd" autoplay muted playsinline style="width:100%;border-radius:10px;background:#000;transform:scaleX(-1);min-height:180px"></video><div class="grid" style="gap:6px;margin:12px 0;font-weight:600"><div id="s1">Camera: starting…</div><div id="s2">Location: checking…</div><div id="s3">Face: loading detector…</div></div><button class="btn ok wide" id="go" disabled>Check in</button>`);
  const stop=()=>{clearInterval(timer);stream&&stream.getTracks().forEach(t=>t.stop())};
  const mo=new MutationObserver(()=>{if(!document.body.contains(m)){stop();mo.disconnect()}});mo.observe(document.body,{childList:true});
  const set=(id,t,ok)=>{const e=$("#"+id,m);if(e)e.textContent=t,e.style.color=ok===true?"var(--a)":ok===false?"var(--bad)":""};
  const upd=()=>{const locOk=!fence||(loc&&loc.d<=c.radius);const b=$("#go",m);if(b)b.disabled=!(camOk&&(face||!faceOk)&&locOk)};
  navigator.mediaDevices&&navigator.mediaDevices.getUserMedia?navigator.mediaDevices.getUserMedia({video:{facingMode:"user"}}).then(s=>{stream=s;$("#vd",m).srcObject=s;camOk=true;set("s1","Camera: ready",true);upd();
    loadFace().then(()=>{set("s3","Face: look at the camera",null);timer=setInterval(async()=>{const v=$("#vd",m);if(!v||!v.videoWidth)return;const r=await faceapi.detectSingleFace(v,new faceapi.TinyFaceDetectorOptions());face=!!r;set("s3",face?"Face: detected":"Face: not detected",face);upd()},700)})
      .catch(()=>{faceOk=false;set("s3","Face detector unavailable (offline). Camera-only check-in allowed.",null);upd()})}).catch(()=>set("s1","Camera: blocked. Allow camera access in your browser and try again.",false))
   :set("s1","Camera: not supported on this browser",false);
  navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>{const la=p.coords.latitude,ln=p.coords.longitude;loc={lat:la,lng:ln,d:fence?distM(la,ln,c.lat,c.lng):0};
    set("s2",fence?(loc.d<=c.radius?`Location: inside office area (${Math.round(loc.d)} m away)`:`Location: ${Math.round(loc.d)} m away. You must be within ${c.radius} m.`):"Location: captured",!fence||loc.d<=c.radius);upd()},()=>{set("s2",fence?"Location: blocked. Allow location access to check in.":"Location: unavailable (not required)",fence?false:null);upd()},{enableHighAccuracy:true,timeout:12000})
   :set("s2","Location: not supported",fence?false:null);
  $("#go",m).onclick=()=>{stop();m.remove();done({face:faceOk&&face,loc:loc?{lat:+loc.lat.toFixed(5),lng:+loc.lng.toFixed(5),d:Math.round(loc.d)}:null})}}
