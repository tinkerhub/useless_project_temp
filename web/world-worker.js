import {loadPyodide} from './vendor/pyodide/pyodide.mjs';
let py, bridge, active = false, previous = performance.now();
function call(method, ...args) {
  // JSON is data, never executable source.
  py.globals.set('_browser_args', JSON.stringify(args));
  return JSON.parse(py.runPython(`json.dumps(bridge.${method}(*json.loads(_browser_args)))`));
}
function save() { if (bridge) postMessage({event:'save', value:py.runPython('json.dumps(bridge.world._state)')}); }
function drain() { for (const request of call('drain')) postMessage({event:'ai', request}); }
self.onmessage = async ({data:{id, type, path, body, saved, info, cid, request_id, response, error}}) => {
  try {
    let result;
    if (type === 'init') {
      py = await loadPyodide({indexURL:new URL('./vendor/pyodide/', import.meta.url).href});
      py.FS.mkdirTree('/willow');
      const modules = ['world','town','spatial','population','institutions','ai_reasoning','fast_brain','browser_bridge'];
      await Promise.all(modules.map(async name => {
        const res = await fetch(`./engine/${name}.py`);
        if (!res.ok) throw new Error('The game engine could not be downloaded. Reload to try again.');
        py.FS.writeFile(`/willow/${name}.py`, await res.text());
      }));
      if (saved) py.FS.writeFile('/willow/save.json', saved);
      py.runPython("import sys, json\nsys.path.insert(0, '/willow')\nfrom browser_bridge import BrowserWorld\nbridge = BrowserWorld('/willow/save.json')");
      bridge = true;
      call('configure', info);
      previous = performance.now();
      setInterval(() => {
        const now = performance.now(), dt = Math.min((now - previous) / 1000, .1); previous = now;
        if (!active || dt <= 0) return;
        try {py.globals.set('_dt', dt); py.runPython('bridge.world.step(_dt)');}
        catch {active=false; postMessage({event:'fatal', error:'The town simulation stopped. Reload to restore your latest save.'});}
      }, 50);
      setInterval(save, 3000);
      setInterval(() => {if (active) {call('background');drain();}}, 15000);
      save();
      result = true;
    } else if (type === 'active') {
      active = Boolean(body); previous = performance.now();
      if (!active) {py.runPython("bridge.world.act('player', 'steer', params={'dx':0,'dy':0,'sequence':bridge.world.browser_snapshot()['ack']+1})");save();}
    } else if (type === 'configure') {
      call('configure', info);
    } else if (type === 'complete') {
      call('complete', cid, request_id, response, error);
      save();
    } else if (type === 'export') {
      result = py.runPython('json.dumps(bridge.world._state)');
    } else {
      result = call('dispatch', path, body ?? null);
      drain();
      if (body && path !== '/api/input') save();
    }
    postMessage({id, result});
  } catch (error) {
    postMessage({id, error:type === 'init' ? 'Your town could not load. Check the connection or restore a valid save; your existing save has been kept.' : error.message});
  }
};
