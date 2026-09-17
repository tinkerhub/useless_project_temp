import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadPyodide} from 'pyodide';

test('real WebAssembly engine: isolated worlds, bounded actions, AI validation and save reload', async()=>{
  const py=await loadPyodide();
  py.FS.mkdirTree('/willow');
  for(const name of ['world','town','spatial','population','institutions','ai_reasoning','fast_brain']) {
    py.FS.writeFile(`/willow/${name}.py`,await readFile(`${name}.py`,'utf8'));
  }
  py.FS.writeFile('/willow/browser_bridge.py',await readFile('web/browser_bridge.py','utf8'));
  const result=py.runPython(`
import sys, json
sys.path.insert(0, '/willow')
from browser_bridge import BrowserWorld
from pathlib import Path
first = BrowserWorld('/willow/first.json')
second = BrowserWorld('/willow/second.json')
assert len(first.snapshot()['actors']) == 51
first.dispatch('/api/time', {'action':'advance','ticks':1})
assert first.snapshot()['clock']['tick'] == second.snapshot()['clock']['tick'] + 1
try:
    first.dispatch('/api/time', {'action':'advance','ticks':100000})
    raise AssertionError('Unbounded advancement')
except ValueError:
    pass
first.configure({'connected':True,'model':'test','autonomous':True})
first.background()
assert len(first.drain()) == 1
first.configure({'connected':True,'model':'test'})
w = first.world
# Put the player next to Ada to exercise the genuine action/range boundary.
w._state['citizens']['player']['position'] = dict(w._state['citizens']['citizen-1']['position'])
w._state['citizens']['player']['location_id'] = w._state['citizens']['citizen-1']['location_id']
first.dispatch('/api/action', {'action':'engage','target':'citizen-1'})
first.dispatch('/api/action', {'action':'talk','target':'citizen-1','message':'Hello Ada'})
request = first.drain()[0]
assert request['citizen']['id'] == 'citizen-1'
assert 'citizens' not in request
assert first.dispatch('/api/conversation?citizen=citizen-1')['pending']
first.complete('citizen-1', request['request_id'], {'decision':'talk','message':'Welcome to Willow!'})
assert first.dispatch('/api/conversation?citizen=citizen-1')['messages'][-1]['message'] == 'Welcome to Willow!'
first.dispatch('/api/action', {'action':'talk','target':'citizen-1','message':'How are you?'})
request = first.drain()[0]
first.complete('citizen-1', request['request_id'], {'decision':'talk','message':'bad','money':999999})
assert first.dispatch('/api/conversation?citizen=citizen-1')['error']
# Disconnect invalidates in-flight decisions.
first.dispatch('/api/action', {'action':'talk','target':'citizen-1','message':'Bye'})
request = first.drain()[0]
first.configure({'connected':False})
first.complete('citizen-1', request['request_id'], {'decision':'talk','message':'stale'})
assert first.dispatch('/api/conversation?citizen=citizen-1')['messages'][-1]['message'] == 'Bye'
w.step(.05)
w.save()
restored = BrowserWorld('/willow/first.json')
assert restored.world._state['clock']['tick'] == w._state['clock']['tick']
assert restored.dispatch('/api/conversation?citizen=citizen-1')['messages'][-1]['message'] == 'Bye'
assert restored.info['connected'] is False
'The browser engine passed'
`);
  assert.equal(result,'The browser engine passed');
});
