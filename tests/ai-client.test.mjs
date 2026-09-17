import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connectAI, normalizeConfig, publicAI, decide} from '../web/ai-client.js';

test('credentials are pinned to OpenAI and omitted from public status', () => {
  const c=normalizeConfig({provider:'openai',api_key:'test-secret',base_url:'https://attacker.example',model:'gpt-5-mini'});
  assert.equal(c.base_url,'https://api.openai.com/v1');
  assert.ok(!JSON.stringify(publicAI(c)).includes('test-secret'));
  assert.equal(normalizeConfig({provider:'local',base_url:'http://localhost:1234/v1',api_key:'test-secret'}).api_key,'');
  for(const base_url of ['http://example.com/v1','https://user:pass@example.com','file:///tmp/key','https://example.com?key=secret']) {
    assert.throws(()=>normalizeConfig({provider:'local',base_url}));
  }
});
test('connection verifies models and local auto-detection skips embeddings', async t => {
  t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({data:[{id:'nomic-embed'},{id:'local-chat'}]})));
  const config=await connectAI({provider:'local',base_url:'http://127.0.0.1:1234/v1'});
  assert.equal(config.model,'local-chat');
  await assert.rejects(connectAI({...config,model:'missing'}),/Model not found/);
});
test('connection failures and provider errors are actionable without echoing secrets', async t => {
  t.mock.method(globalThis,'fetch',async()=>new Response('test-secret', {status:401}));
  await assert.rejects(connectAI({provider:'openai',api_key:'test-secret'}),/key was rejected/);
  globalThis.fetch=async()=>{throw new TypeError('Failed to fetch');};
  await assert.rejects(connectAI({provider:'local',base_url:'http://localhost:1234/v1'}),/enable CORS/);
});
test('AI requests send only the supplied citizen context and reject malformed output', async t => {
  let request;
  t.mock.method(globalThis,'fetch',async(url,options)=>{request={url,options};return new Response(JSON.stringify({choices:[{message:{content:'```json\n{"decision":"talk","message":"Hello"}\n```'}}]}));});
  const config=normalizeConfig({provider:'openai',api_key:'test-secret',model:'gpt-5-mini'});
  assert.equal((await decide(config,{citizen:{id:'citizen-1'},request_type:'respond_to_conversation'})).message,'Hello');
  assert.equal(request.options.redirect,'error');
  const body=JSON.parse(request.options.body);
  assert.equal(body.store,false);assert.equal(body.max_completion_tokens,2048);
  assert.equal(body.messages[1].content.includes('test-secret'),false);
  globalThis.fetch=async()=>new Response(JSON.stringify({choices:[{message:{content:'not JSON'}}]}));
  await assert.rejects(decide(config,{}),/valid JSON/);
});
