"""Transport contract regressions, without requiring local inference."""

import json
import unittest
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError

from lm_studio import LMStudioBrain, LMStudioConfig
from lm_studio import OpenAIBrain


class LMStudioTransportTests(unittest.TestCase):
    def setUp(self):
        self.brain = LMStudioBrain(LMStudioConfig(model="prism-ml/bonsai-27b"), "citizen-1")
        self.request = {"citizen": {"id": "citizen-1"}, "private_context": {"memories": []}}

    @patch("lm_studio.urllib.request.urlopen")
    def test_supported_schema_and_detached_citizen_request(self, open_url):
        response = MagicMock()
        response.read.return_value = json.dumps({"choices": [{"message": {
            "content": '{"decision":"wait","plan_summary":"Rest at home"}'
        }}]}).encode()
        open_url.return_value.__enter__.return_value = response
        result = self.brain.decide(self.request)
        self.assertEqual(result["decision"], "wait")
        payload = json.loads(open_url.call_args.args[0].data)
        self.assertEqual(payload["model"], "prism-ml/bonsai-27b")
        self.assertEqual(payload["response_format"]["type"], "json_schema")
        schema = payload["response_format"]["json_schema"]["schema"]
        self.assertFalse(schema["additionalProperties"])
        self.assertIn("talk", schema["properties"]["decision"]["enum"])
        self.assertEqual(json.loads(payload["messages"][1]["content"]), self.request)

    @patch("lm_studio.urllib.request.urlopen")
    def test_native_reasoning_off_uses_only_message_output(self, open_url):
        self.brain.config.native_reasoning_off = True
        response = MagicMock()
        response.read.return_value = json.dumps({"output": [
            {"type": "reasoning", "content": "ignored"},
            {"type": "message", "content": '{"decision":"wait"}'}]}).encode()
        open_url.return_value.__enter__.return_value = response
        self.assertEqual(self.brain.decide(self.request), {"decision":"wait"})
        sent = open_url.call_args.args[0]
        self.assertTrue(sent.full_url.endswith("/api/v1/chat"))
        payload = json.loads(sent.data)
        self.assertEqual(payload["reasoning"], "off")
        self.assertFalse(payload["store"])

    @patch("lm_studio.urllib.request.urlopen")
    def test_wrong_citizen_context_never_reaches_model(self, open_url):
        self.assertEqual(self.brain.decide({"citizen": {"id": "citizen-2"}}), {"decision": "none"})
        open_url.assert_not_called()

    @patch("lm_studio.urllib.request.urlopen")
    def test_http_rejection_is_not_retried_or_silenced(self, open_url):
        open_url.side_effect = HTTPError("http://localhost", 400, "Bad request", {}, None)
        with self.assertLogs(level="WARNING") as logs:
            self.assertEqual(self.brain.decide(self.request), {"decision": "none"})
        self.assertEqual(open_url.call_count, 1)
        self.assertIn("HTTP 400", logs.output[0])

    def test_from_env_configures_native_reasoning_off_for_bonsai(self):
        with patch.dict("os.environ", {"WILLOW_AI_MODEL": "prism-ml/bonsai-27b"}):
            config = LMStudioConfig.from_env()
            self.assertTrue(config.native_reasoning_off)
            self.assertEqual(config.timeout, 60.0)
            self.assertEqual(config.max_tokens, 160)

    @patch("lm_studio.urllib.request.urlopen")
    def test_openai_provider_uses_bearer_key_and_current_token_parameter(self, open_url):
        brain = OpenAIBrain(LMStudioConfig(
            model="gpt-5-mini", base_url="https://api.openai.com/v1", api_key="sk-test"
        ), "citizen-1")
        response = MagicMock()
        response.read.return_value = json.dumps({"choices": [{"message": {
            "content": '{"decision":"wait"}'
        }}]}).encode()
        open_url.return_value.__enter__.return_value = response
        self.assertEqual(brain.decide(self.request), {"decision": "wait"})
        request = open_url.call_args.args[0]
        self.assertEqual(request.headers["Authorization"], "Bearer sk-test")
        self.assertEqual(json.loads(request.data)["response_format"], {"type": "json_object"})
        self.assertIn("max_completion_tokens", json.loads(request.data))


if __name__ == "__main__":
    unittest.main()
