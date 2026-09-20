# Bonsai local integration check — 2026-09-12

The running LM Studio server at `http://127.0.0.1:1234/v1/models` exposes
`prism-ml/bonsai-27b`. No download or provider replacement was needed.

A real adapter request initially failed because this server rejects
`response_format.type = json_object`. The adapter now sends `json_schema`.
HTTP rejections are logged by status without logging citizen context. A brain
refuses a request belonging to another citizen.

A temporary Ada context then produced a valid `wait` decision with a short plan
and `content` emotional state in 39.12 seconds. The existing decision validator
accepted it. This test did not change the user's saved town and did not test
live gameplay or dialogue.

Three transport regressions and the existing 25 AI tests passed. Model discovery
and one accepted decision do not establish gameplay readiness. In particular,
the World gateway currently defaults to a one-second timeout, and hourly
reasoning waits inside the simulation lock. Simply increasing that timeout
would freeze movement during slow inference. Background scheduling, bounded
inference concurrency, fair access for every citizen, and stale-result checks
are required before enabling this model for a larger population. The current
population is still three authored NPCs; individual walking speeds and expanded
occupations remain to be implemented.

The example environment and README identify Bonsai, but the example is not
automatically loaded. Existing preview servers were not restarted or switched
to AI during this check.
