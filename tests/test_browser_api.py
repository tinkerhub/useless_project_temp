"""Real HTTP boundary tests. Run with permission to bind a loopback socket."""
import json
from pathlib import Path
import tempfile
import threading
import unittest
import urllib.request
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from server import make_server
from world import World
from town import destination_anchor


class BrowserAPITests(unittest.TestCase):
    def setUp(self):
        self.directory=tempfile.TemporaryDirectory();self.addCleanup(self.directory.cleanup)
        self.path=Path(self.directory.name)/"world.json"
        world=World(self.path);world.ensure_player()
        state=json.loads(self.path.read_text())
        state["citizens"]["player"]["position"]=destination_anchor("citizen-1","home-1")
        self.path.write_text(json.dumps(state));self.world=World(self.path)
        self.server=make_server(self.world,port=0)
        self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start()
        self.addCleanup(self.close_server)
        self.base=f"http://127.0.0.1:{self.server.server_port}"
        _,boot=self.request("/api/bootstrap");self.token=boot["token"]

    def close_server(self):
        self.server.shutdown();self.server.server_close();self.thread.join(timeout=2)

    def request(self,path,body=None,**headers):
        data=json.dumps(body).encode() if body is not None else None
        if data is not None:
            headers={"Content-Type":"application/json","X-Town-Token":getattr(self,"token",""),**headers}
        request=Request(self.base+path,data=data,headers=headers)
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        try: response=opener.open(request,timeout=3)
        except HTTPError as error:response=error
        with response:
            raw=response.read()
            return response.status,json.loads(raw) if response.headers.get_content_type()=="application/json" else raw.decode()

    def test_static_allowlist_and_browser_data_projection(self):
        for path in ("/", "/app.js", "/style.css", "/renderer.js", "/physics.js", "/favicon.svg"):
            self.assertEqual(self.request(path)[0],200)
        for path in ("/world.py","/data/world.json","/../world.py","/api/citizen_context"):
            self.assertEqual(self.request(path)[0],404)
        code,state=self.request("/api/state");self.assertEqual(code,200)
        for field in ("private_social","private_ai","private_knowledge","personality_traits","relationships","beliefs"):
            self.assertNotIn(field,json.dumps(state))

    def test_requests_cannot_impersonate_citizens_or_set_positions(self):
        invalid=[{"action":"move","target":"hospital"}, {"action":"talk","target":"citizen-1","message":"Hello","actor_id":"citizen-2"}]
        for body in invalid:self.assertEqual(self.request("/api/action",body)[0],400)
        self.assertEqual(self.request("/api/input",{"x":4000,"y":4000})[0],400)
        self.assertEqual(self.request("/api/input",{"dx":False,"dy":0,"sequence":1})[0],400)

    def test_tokens_and_cross_origin_requests_are_rejected(self):
        body={"dx":1,"dy":0,"sequence":1}
        self.assertEqual(self.request("/api/input",body,**{"X-Town-Token":"wrong"})[0],403)
        self.assertEqual(self.request("/api/input",body,Origin="https://other.example")[0],403)
        self.assertEqual(self.request("/api/input",body)[0],200)

    def test_pair_scoped_conversation_and_unconfigured_reply(self):
        self.world.act("citizen-1","talk","citizen-2","Not the player’s conversation.")
        body={"action":"talk","target":"citizen-1","message":"Hello from the browser."}
        self.assertEqual(self.request("/api/action",body)[0],200)
        code,data=self.request("/api/conversation?citizen=citizen-1")
        self.assertEqual(code,200)
        self.assertEqual([m["message"] for m in data["messages"]],["Hello from the browser."])
        self.assertNotIn("Not the player",json.dumps(data))
        self.assertEqual(self.request("/api/conversation?citizen=missing")[0],400)
        self.assertEqual(self.request("/api/action",{"action":"talk","target":"citizen-3","message":"Too far"})[0],400)


if __name__ == "__main__":
    unittest.main()
