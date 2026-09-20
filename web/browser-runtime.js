import {connectAI, publicAI, decide} from './ai-client.js';
let worker, ready, config = null, serial = 0, releaseLock;
const pending = new Map();
let store;
function database() {
  return store ||= new Promise((resolve, reject) => {
    const req = indexedDB.open('willow-private-world', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('saves');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new Error('Browser storage is unavailable. Enable site storage to save your world.'));
  });
}
async function storage(mode, value) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('saves', mode), saves = tx.objectStore('saves');
    const req = mode === 'readonly' ? saves.get('world') : saves.put(value, 'world');
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = tx.onabort = () => reject(new Error('Could not save your town. Browser storage may be full. Export a backup before closing.'));
  });
}
export const hasSave = async () => Boolean(await storage('readonly'));
function rpc(type, args = {}) {
  return new Promise((resolve, reject) => {
    const id = ++serial;
    const timer = setTimeout(() => {pending.delete(id);reject(new Error('The town took too long to respond. Reload to reconnect.'));}, type === 'init' ? 120000 : 15000);
    pending.set(id, {resolve, reject, timer});
    worker.postMessage({id, type, ...args});
  });
}
function fail(error) {
  for (const item of pending.values()) {clearTimeout(item.timer);item.reject(error);}
  pending.clear();
}
async function startWorker() {
  // Prevent competing tabs from overwriting the same browser save.
  if (!navigator.locks) throw new Error('This browser needs Web Locks support. Open Willow in a current browser over HTTPS or localhost.');
  await new Promise((resolve, reject) => {
    navigator.locks.request('willow-world', {ifAvailable:true}, async lock => {
      if (!lock) {reject(new Error('Your town is open in another tab. Close that tab, then try again.'));return;}
      await new Promise(release => {releaseLock=release;resolve();});
    }).catch(reject);
  });
  try {
    const saved = await storage('readonly');
    worker = new Worker(new URL('./world-worker.js', import.meta.url), {type:'module'});
    worker.onerror = () => {fail(new Error('The game worker stopped. Reload to reconnect.'));window.dispatchEvent(new CustomEvent('willow-error',{detail:'The game worker stopped. Reload to restore your save.'}));};
    worker.onmessage = async ({data}) => {
      if (data.event === 'save') {
        try {await storage('readwrite', data.value);window.dispatchEvent(new CustomEvent('willow-saved'));}
        catch(error) {window.dispatchEvent(new CustomEvent('willow-error',{detail:error.message}));}
      } else if (data.event === 'fatal') {
        fail(new Error(data.error));window.dispatchEvent(new CustomEvent('willow-error',{detail:data.error}));
      } else if (data.event === 'ai') {
        const activeConfig = config, req = data.request;
        let response, error;
        try {if (!activeConfig) return;response = await decide(activeConfig, req);}
        catch(err) {error=err.message;}
        // A provider change invalidates outstanding responses.
        if (config === activeConfig) rpc('complete', {cid:req.citizen.id, request_id:req.request_id, response, error}).catch(()=>{});
      } else {
        const item = pending.get(data.id);if (!item) return;
        pending.delete(data.id);clearTimeout(item.timer);
        data.error ? item.reject(new Error(data.error)) : item.resolve(data.result);
      }
    };
    await rpc('init', {saved, info:publicAI(config)});
  } catch(error) {
    worker?.terminate();worker=null;releaseLock?.();ready=null;throw error;
  }
}
export async function browserAPI(path, body) {
  if (path === '/api/llm/connect') {
    const next = await connectAI(body);
    config = next;
    if (ready) {await ready;await rpc('configure', {info:publicAI(config)});}
    return {result:publicAI(config)};
  }
  if (path === '/api/llm/disconnect') {
    config=null;
    if (ready) {await ready;await rpc('configure', {info:publicAI(null)});}
    return {result:publicAI(null)};
  }
  if (path === '/api/llm/status') return publicAI(config);
  await (ready ||= startWorker().catch(error => {ready=null;throw error;}));
  return rpc('api', {path, body});
}
export async function setActive(value) {if (ready) {await ready;await rpc('active', {body:value});}}
export async function exportWorld() {
  const value = ready ? (await ready, await rpc('export')) : await storage('readonly');
  if (!value) throw new Error('Play first to create a town.');
  const url=URL.createObjectURL(new Blob([value], {type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='willow-world.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
