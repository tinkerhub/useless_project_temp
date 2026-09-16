import {TownRenderer} from './renderer.js';
import {makePhysics} from './physics.js';

const $=id=>document.getElementById(id), canvas=$('town'), keys=new Set();
let map,renderer,physics,state,token,player,sequence=0,connected=false,lastStateAt=0;
let target=null,goal=null,nearCitizen=null,nearBuilding=null,lastInput='',sending=false;
let renderedActors=[],frames=[],lastFrame=performance.now(),lastMini=0,lastUI=0,toastTimer;
let correction={x:0,y:0},inputHistory=[],inputRTT=40;
let llmState={connected:false,model:null,base_url:null};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const movementKeys=new Set(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright']);
const pressedAt=new Map();
const descriptions={
  hospital:'Care is available here for citizens injured in town. When medical staff are on duty, injured citizens receive prompt care upon arrival.',
  police:'You can file an account of an incident you witnessed. When officers are present, reports are officially reviewed on record.',
  school:'Brookside School serves the local neighborhood. Teachers and caretakers arrive for daily classes, reading clubs, and grounds maintenance.',
  college:'Willow College campus and courtyards. Lecturers and adult students gather here for coursework, study groups, and community projects.',
  'college-hall':'Arts & Sciences hall supporting practical workshops, science classes, and student research presentations.',
  library:'Public library offering local historical archives, quiet study tables, and neighborhood reading groups.',
  shop:'Corner Grocer provides fresh groceries and daily household essentials to residents throughout town.',
  market:'Garden Market features fresh produce, local goods, and community market stalls.',
  cafe:'Juniper Café is a welcoming meeting place for morning coffee, light bites, and friendly conversations.',
  'grove-cafe':'The Grove café nestled near Common Grounds, popular for quiet conversations and outdoor seating.',
  bakery:'Morning Loaf bakery fills the avenue with fresh sourdough bread, pastries, and morning treats.',
  restaurant:'The Copper Table serves evening meals and hosts neighborhood gatherings.',
  pharmacy:'Green Cross Pharmacy provides health advice, care plans, and essential medicine.',
  'town-hall':'Civic headquarters where town coordinators organize community meetings and municipal affairs.',
  'post-office':'Central dispatch for postal mail, deliveries, and parcel collection.',
  workshop:'Community repair workshop for tools, machinery, and neighborhood equipment maintenance.',
  station:'Willow Station connects the town with regional rail and welcomes arriving travelers.',
  community:'Community House hosts neighborhood support circles, volunteers, and local organizers.',
  sports:'Recreation Pavilion and sports grounds for fitness and outdoor games.',
  'student-housing':'Residential apartments for adult students attending Willow College.',
  'apartments-east':'Brookside residential apartments home to town workers and local families.',
  'home-1':'Ada & Ben’s home. Their daily routines bring them home to rest. Building interiors are not open.',
  'home-2':'Cleo’s home. Her daily routine brings her home to rest. Building interiors are not open.'
};

function formatModel(name){
  if(!name)return 'Active';
  const last=name.split('/').pop();
  return last.replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
}

function updateLLMStatus(info){
  if(info)llmState={...llmState,...info};
  const dot=$('llm-dot'),label=$('llm-label');
  const dDot=$('llm-dialog-dot'),dTitle=$('llm-dialog-title');
  const dModel=$('llm-dialog-model'),dUrl=$('llm-dialog-url');
  if(!dot||!label)return;
  if(llmState.connected&&llmState.model){
    dot.textContent='●';dot.className='llm-dot online';
    label.textContent=`LLM: ${formatModel(llmState.model)}`;
    if(dDot){
      dDot.textContent='●';dDot.className='llm-dot online';
      dTitle.textContent=llmState.provider==='openai'?'OpenAI Connected':'Local LLM Active';
      dModel.textContent=`Model: ${llmState.model}`;
      dUrl.innerHTML=`Endpoint: <code>${llmState.base_url||'http://127.0.0.1:1234/v1'}</code>`;
    }
  }else{
    dot.textContent='○';dot.className='llm-dot offline';
    label.textContent='No AI Connected';
    if(dDot){
      dDot.textContent='○';dDot.className='llm-dot offline';
      dTitle.textContent='No AI Connected';
      dModel.textContent='Connect a local model or OpenAI below.';
      dUrl.innerHTML=`Endpoint: <code>${llmState.base_url||'http://127.0.0.1:1234/v1'}</code>`;
    }
  }
}

function openLLMDialog(){
  release();
  $('llm-dialog').showModal();
}

function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function direction(){
  if(!connected||performance.now()-lastStateAt>700||target||$('town-map').open||$('place-dialog').open||$('llm-dialog').open)return {x:0,y:0};
  let x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
  let y=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));
  const length=Math.max(1,Math.hypot(x,y));return {x:x/length,y:y/length};
}
async function api(path,body){
  const options=body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','X-Town-Token':token},body:JSON.stringify(body),keepalive:true};
  const response=await fetch(path,{...options,signal:AbortSignal.timeout(5000)});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'The town could not be reached.');return data;
}
function action(name,citizen=null,message){const body={action:name};if(citizen!==null)body.target=citizen;if(message!==undefined)body.message=message;return api('/api/action',body);}
async function sendInput(force=false){
  if(!token||!connected)return;
  const d=direction(),signature=`${d.x},${d.y}`;
  if(!force&&signature==='0,0'&&lastInput===signature)return;
  lastInput=signature;
  const command={dx:d.x,dy:d.y,sequence:++sequence},sent=performance.now();
  inputHistory.push({...command,sent});inputHistory=inputHistory.slice(-30);
  try{await api('/api/input',command);inputRTT=inputRTT*.8+(performance.now()-sent)*.2;}
  catch(error){connected=false;keys.clear();$('connection').hidden=false;$('connection').textContent=error.message;}
}
function release(){keys.clear();pressedAt.clear();correction={x:0,y:0};sendInput(true);}

async function poll(){
  try{
    let next;
    if(!connected){const boot=await api('/api/bootstrap');token=boot.token;next=boot.state;}
    else next=await api('/api/state');
    const received=performance.now();
    if(state&&next.server_time<state.server_time)return;
    state=next;lastStateAt=received;connected=true;$('connection').hidden=true;
    if(state.llm)updateLLMStatus(state.llm);
    sequence=Math.max(sequence,state.ack);
    const authoritative=state.actors.find(a=>a.id===state.player_id);
    if(!player){player={...authoritative,position:{...authoritative.position}};renderer.follow(player.position,0,true);}
    else{
      const d=direction(),lead=Math.min(inputRTT/2000,.08);
      const expected=physics.move(authoritative.position,d.x*map.speed*lead,d.y*map.speed*lead);
      const gap=Math.hypot(player.position.x-expected.x,player.position.y-expected.y);
      if(gap>150){player.position={...expected};correction={x:0,y:0};}
      else correction={x:expected.x-player.position.x,y:expected.y-player.position.y};
      player.activity=authoritative.activity;player.location_id=authoritative.location_id;
      if(!d.x&&!d.y)player.facing=authoritative.facing;
    }
    inputHistory=inputHistory.filter(c=>c.sequence>state.ack);
    frames.push({time:received,actors:state.actors});frames=frames.slice(-5);
  }catch(error){connected=false;keys.clear();$('connection').textContent='Connection interrupted. Walking will resume when the town reconnects.';$('connection').hidden=false;}
  finally{setTimeout(poll,100);}
}

function interpolatedActors(now){
  const renderTime=now-120;
  let left=frames[0],right=frames.at(-1);
  for(let i=1;i<frames.length;i++)if(frames[i].time>=renderTime){left=frames[i-1];right=frames[i];break;}
  if(!left)return [];
  const t=left===right?1:Math.max(0,Math.min(1,(renderTime-left.time)/(right.time-left.time)));
  return right.actors.map(a=>{
    if(a.id===state.player_id)return player;
    const before=left.actors.find(b=>b.id===a.id)||a;
    return {...a,position:{x:before.position.x+(a.position.x-before.position.x)*t,y:before.position.y+(a.position.y-before.position.y)*t}};
  });
}
function frame(now){
  const dt=Math.min((now-lastFrame)/1000,.05);lastFrame=now;
  if(renderer&&player){
    const d=direction();player.moving=Boolean(d.x||d.y);
    player.position=physics.move(player.position,d.x*map.speed*dt,d.y*map.speed*dt);
    const k=1-Math.exp(-dt*13),cx=correction.x*k,cy=correction.y*k;
    player.position=physics.move(player.position,cx,cy);correction.x-=cx;correction.y-=cy;
    if(d.x||d.y)player.facing=Math.abs(d.x)>Math.abs(d.y)?(d.x>0?'right':'left'):(d.y>0?'down':'up');
    renderer.follow(player.position,dt,reducedMotion);renderedActors=interpolatedActors(now);
    renderer.draw(renderedActors,reducedMotion?0:now,nearCitizen?.id,goal);
    if(now-lastMini>150){renderer.overview($('minimap'),renderedActors,goal,false);if($('town-map').open)renderer.overview($('overview'),renderedActors,goal);lastMini=now;}
    if(now-lastUI>100){updateUI();lastUI=now;}
  }
  requestAnimationFrame(frame);
}

function updateUI(){
  // Public coordinates back the canvas for accessibility/testing without exposing
  // any citizen context or a mutation interface.
  canvas.dataset.playerX=player.position.x.toFixed(2);canvas.dataset.playerY=player.position.y.toFixed(2);
  canvas.dataset.cameraX=renderer.camera.x.toFixed(2);canvas.dataset.cameraY=renderer.camera.y.toFixed(2);
  canvas.dataset.connected=String(connected);
  canvas.dataset.actors=JSON.stringify(state.actors.map(a=>({id:a.id,x:a.position.x,y:a.position.y,activity:a.activity})));
  const tick=state.clock.tick,hour=tick%24,minute=Math.min(59,Math.floor(state.hour_fraction*60));
  $('clock').textContent=`Day ${Math.floor(tick/24)+1} · ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
  const p=player.position;
  const district=map.districts.find(d=>p.x>=d.x&&p.x<d.x+d.w&&p.y>=d.y&&p.y<d.y+d.h);
  $('district').textContent=district?.name||'Town outskirts';
  $('place-name').textContent=map.places[player.location_id]?.name||'Open ground';
  const candidates=state.actors.filter(a=>a.id!==state.player_id).map(a=>({...a,gap:Math.hypot(p.x-a.position.x,p.y-a.position.y)})).filter(a=>a.gap<=86&&physics.clear(p,a.position)).sort((a,b)=>a.gap-b.gap);
  nearCitizen=candidates[0]||null;
  nearBuilding=map.buildings.find(b=>Math.hypot(p.x-b.entrance.x,p.y-b.entrance.y)<100);
  $('prompt').hidden=Boolean(target||$('town-map').open||$('place-dialog').open||$('llm-dialog').open)||(!nearCitizen&&!nearBuilding);
  $('prompt-text').textContent=nearCitizen?`Talk to ${nearCitizen.name}`:nearBuilding?nearBuilding.name:'';
  const injured=candidates.find(a=>a.activity==='needs_help');
  $('help-button').hidden=!injured;$('help-button').dataset.citizen=injured?.id||'';
  if(goal){const a=map.places[goal].anchor,dx=a.x-p.x,dy=a.y-p.y;
    $('destination-name').textContent=map.places[goal].name;
    $('destination-distance').textContent=Math.hypot(dx,dy)<100?'You’ve arrived':`About ${Math.ceil(Math.hypot(dx,dy)/map.speed)} sec on foot`;
    $('direction').style.transform=`rotate(${Math.atan2(dy,dx)*180/Math.PI+90}deg)`;
  }
}
function pinPlace(id){goal=id;$('destination').hidden=false;$('town-map').close();canvas.focus();toast(`Heading toward ${map.places[id].name}`);}
function openMap(){if(!renderer)return;release();$('town-map').showModal();renderer.overview($('overview'),renderedActors,goal);}
function openPlace(){
  if(!nearBuilding)return;
  release();$('service-name').textContent=nearBuilding.name;
  $('service-description').textContent=descriptions[nearBuilding.id]||'The grounds are open to explore. Indoor services and daily activities at this building are not available yet.';
  const svc=state.services?.[nearBuilding.id];
  const statusEl=$('service-status');
  if(svc){
    const opens=String(svc.opens).padStart(2,'0')+':00',closes=String(svc.closes).padStart(2,'0')+':00';
    if(svc.available){
      statusEl.textContent=`● Open · Staff on duty: ${svc.staff_count} · Hours: ${opens}–${closes}`;
      statusEl.className='service-status open';statusEl.hidden=false;
    }else{
      const reason=svc.staff_count===0?'Staff not present':'Outside operating hours';
      statusEl.textContent=`○ Closed (${reason}) · Staff present: ${svc.staff_count} · Hours: ${opens}–${closes}`;
      statusEl.className='service-status closed';statusEl.hidden=false;
    }
  }else{statusEl.hidden=true;}
  $('report-button').hidden=nearBuilding.id!=='police'||!state.incident||state.incident.reported;
  $('service-result').textContent=nearBuilding.id==='police'&&state.incident?.reported?'Your witnessed account is on record.':'';
  $('place-dialog').showModal();
}

async function renderMessages(){
  const current=target;if(!current)return;
  try{
    const {messages,pending}=await api(`/api/conversation?citizen=${encodeURIComponent(current.id)}`);
    if(target!==current)return;
    const hasAI=state.ai_available?.includes(current.id);
    $('reply-status').textContent=pending?`${current.name} is considering a reply… You can keep walking whenever you like.`:messages.at(-1)?.speaker_id===current.id?'Reply received.':hasAI?'● Local LLM active. Ready to converse.':'○ No local LLM detected. Start LM Studio to enable AI replies.';
    const signature=messages.map(m=>m.id).join(',');if($('messages').dataset.signature===`${current.id}:${signature}`)return;
    $('messages').dataset.signature=`${current.id}:${signature}`;$('messages').replaceChildren();
    if(!messages.length){const p=document.createElement('p');p.className='empty-chat';p.textContent=`You’re standing with ${current.name}. Start a conversation.`;$('messages').append(p);}
    for(const m of messages){const bubble=document.createElement('div');bubble.className=`bubble ${m.speaker_id===state.player_id?'you':''}`;const label=document.createElement('small');label.textContent=m.speaker_id===state.player_id?'You':current.name;const text=document.createTextNode(m.message);bubble.append(label,text);$('messages').append(bubble);}
    $('messages').scrollTop=$('messages').scrollHeight;
  }catch(error){if(target===current)$('reply-status').textContent=error.message;}
}
async function openConversation(citizen){
  if(!citizen||target)return;release();
  try{
    await action('engage',citizen.id);target=citizen;$('citizen-name').textContent=citizen.name;$('portrait').textContent=citizen.name[0];
    $('messages').dataset.signature='';$('messages').replaceChildren();$('message').value='';
    const hasAI=state.ai_available?.includes(citizen.id);
    $('reply-status').textContent=hasAI?'● Local LLM active.':'○ No local LLM detected. Start LM Studio on http://127.0.0.1:1234 to enable AI.';
    $('conversation').showModal();$('message').focus();await renderMessages();
  }catch(error){toast(error.message);}
}
function closeConversation(){const previous=target;target=null;if(previous)action('disengage').catch(()=>{});release();canvas.focus();}
async function interact(){if(nearCitizen)await openConversation(nearCitizen);else openPlace();}

$('talk-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!target||sending)return;const message=$('message').value.trim();if(!message)return;
  const current=target;sending=true;$('send').disabled=true;$('message').disabled=true;
  $('reply-status').textContent='Sending…';
  try{
    await action('talk',current.id,message);
    if(target===current){$('message').value='';await renderMessages();$('reply-status').textContent=state.ai_available?.includes(current.id)?'Message delivered. Reply is generating…':'Message delivered. Citizen cannot reply (no local LLM connected).';}
  }catch(error){if(target===current)$('reply-status').textContent=error.message;}
  finally{sending=false;$('send').disabled=false;$('message').disabled=false;if(target===current)$('message').focus();}
});
$('message').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();$('talk-form').requestSubmit();}});
$('conversation').addEventListener('close',closeConversation);
$('close-conversation').onclick=()=>$('conversation').close();
$('morning-button').onclick=async()=>{
  try{
    await api('/api/time',{action:'morning'});
    toast('Advanced to 08:00 AM — Morning routines starting!');
  }catch(error){toast(error.message);}
};
$('map-button').onclick=openMap;$('minimap-button').onclick=openMap;$('close-map').onclick=()=>$('town-map').close();
$('town-map').addEventListener('close',()=>canvas.focus());
$('close-place').onclick=()=>$('place-dialog').close();$('place-dialog').addEventListener('close',()=>canvas.focus());
$('llm-button').onclick=openLLMDialog;$('close-llm').onclick=()=>$('llm-dialog').close();
$('llm-dialog').addEventListener('close',()=>canvas.focus());
function updateLLMForm(){
  const openai=$('llm-provider-input').value==='openai';
  $('llm-key-label').hidden=!openai;$('llm-key-input').hidden=!openai;
  $('llm-url-label').hidden=openai;$('llm-url-input').hidden=openai;
  $('llm-key-input').required=openai;$('llm-url-input').required=!openai;
  $('llm-form-help').textContent=openai?'Your key is kept in memory for this run and is not persisted.':'Works with LM Studio, Ollama, or any OpenAI-compatible local server.';
}
$('llm-provider-input').onchange=updateLLMForm;updateLLMForm();
$('llm-connect-form').onsubmit=async event=>{
  event.preventDefault();
  const provider=$('llm-provider-input').value, url=$('llm-url-input').value.trim();
  const model=$('llm-model-input').value.trim(), api_key=$('llm-key-input').value.trim(), btn=$('llm-connect-btn');
  btn.disabled=true;btn.textContent='Connecting…';
  try{
    const res=await api('/api/llm/connect',{provider,model,base_url:url,api_key});
    updateLLMStatus(res.result);
    if(res.result?.connected){
      toast(`Connected to ${res.result.model}! Citizens now think and converse with AI.`);
      $('llm-dialog').close();
    }else{
      toast('Could not connect to the selected AI provider.');
    }
  }catch(err){toast(`Connection failed: ${err.message}`);}
  finally{btn.disabled=false;btn.textContent='Connect';}
};
$('interact-button').onclick=interact;
$('help-button').onclick=async()=>{try{await action('assist',$('help-button').dataset.citizen);toast('Cleo is heading to Willow Hospital.');}catch(error){toast(error.message);}};
$('report-button').onclick=async()=>{try{await action('report','police');$('report-button').hidden=true;$('service-result').textContent='Your witnessed account is recorded. No crime has been established.';}catch(error){$('service-result').textContent=error.message;}};
$('clear-destination').onclick=()=>{goal=null;$('destination').hidden=true;};
function zoom(amount){if(renderer){renderer.zoom=Math.max(.65,Math.min(1.5,renderer.zoom+amount));$('zoom-label').textContent=`${Math.round(renderer.zoom*100)}%`;}}
$('zoom-out').onclick=()=>zoom(-.1);$('zoom-in').onclick=()=>zoom(.1);
window.addEventListener('keydown',event=>{
  const key=event.key.toLowerCase();if(event.target.matches('textarea,input'))return;
  if(movementKeys.has(key)){event.preventDefault();if(!$('town-map').open&&!$('place-dialog').open&&!$('llm-dialog').open&&!target){keys.add(key);if(!event.repeat){pressedAt.set(key,performance.now());sendInput(true);}}return;}
  if(event.repeat)return;
  if(key==='m'&&!target&&!$('place-dialog').open&&!$('llm-dialog').open){event.preventDefault();$('town-map').open?$('town-map').close():openMap();}
  if(key==='e'&&!target&&!$('town-map').open&&!$('place-dialog').open&&!$('llm-dialog').open){event.preventDefault();interact();}
  if(key==='f'&&!target&&!$('help-button').hidden)$('help-button').click();
});
window.addEventListener('keyup',event=>{const key=event.key.toLowerCase();if(movementKeys.has(key)){
  // Preserve very short taps for one physical update; held keys stop immediately.
  const stamp=pressedAt.get(key),delay=Math.max(0,55-(performance.now()-(stamp??0)));
  const stop=()=>{if(pressedAt.get(key)===stamp){keys.delete(key);pressedAt.delete(key);sendInput(true);}};
  if(delay)setTimeout(stop,delay);else stop();
}});
window.addEventListener('blur',release);document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});
for(const button of document.querySelectorAll('[data-dir]')){
  const key={up:'w',down:'s',left:'a',right:'d'}[button.dataset.dir];
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);keys.add(key);sendInput(true);});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>{keys.delete(key);sendInput(true);});
}
setInterval(()=>sendInput(),120);
setInterval(()=>{if(target){action('engage',target.id).catch(error=>{toast(error.message);$('conversation').close();});renderMessages();}},3000);

async function start(){
  $('retry').hidden=true;
  try{
    const [town,boot]=await Promise.all([api('/api/map'),api('/api/bootstrap')]);map=town;token=boot.token;state=boot.state;sequence=state.ack;
    if(state.llm)updateLLMStatus(state.llm);
    renderer=new TownRenderer(canvas,map);physics=makePhysics(map);connected=true;lastStateAt=performance.now();
    player={...state.actors.find(a=>a.id===state.player_id)};player.position={...player.position};renderer.follow(player.position,0,true);
    frames=[{time:performance.now(),actors:state.actors}];
    const ids=['hospital','police','town-hall','pharmacy','post-office','college','college-hall','library','school','community','shop','market','bakery','cafe','grove-cafe','restaurant','workshop','station','sports','square','park','home-1','home-2'];
    $('places').replaceChildren();for(const id of ids){const p=map.places[id];if(!p)continue;const button=document.createElement('button');button.textContent=p.name;const small=document.createElement('small');small.textContent=id==='hospital'?'Care for injured citizens':id==='police'?'Witnessed incident reports':['shop','market','bakery','cafe','grove-cafe','restaurant'].includes(id)?'Food & hospitality':id==='pharmacy'?'Health & pharmacy':['college','college-hall','school','library'].includes(id)?'Education & research':id==='workshop'?'Repairs & maintenance':id==='station'?'Rail transport':id==='town-hall'?'Civic coordinator':['square','park','community','sports'].includes(id)?'Community & leisure':'Resident home';button.append(small);button.onclick=()=>pinPlace(id);$('places').append(button);}
    $('loading').hidden=true;canvas.focus();requestAnimationFrame(frame);poll();
    // Read-only diagnostics for browser verification; contains public spatial data only.
    Object.defineProperty(window,'__townDebug',{configurable:true,get:()=>({player:structuredClone(player),camera:{...renderer.camera},zoom:renderer.zoom,connected,actors:structuredClone(state.actors),mapSize:[map.width,map.height],worldViewport:[renderer.width/renderer.zoom,renderer.height/renderer.zoom]})});
  }catch(error){$('loading').querySelector('p').textContent=error.message;$('retry').hidden=false;}
}
$('retry').onclick=start;start();
