# WebSocket Protocol — AUR/S v1

**Endpoint:** `ws://<PC-LAN-IP>:8765/ws`  
**Encoding:** UTF-8 JSON control messages; JPEG payload transport is implementation-specific but must preserve this envelope's semantics.  
**Rule:** every client message includes `version: 1` and a valid session token after hello.

## AI Maintenance Context

**Purpose:** Prevents Android and server work from inventing incompatible assumptions.  
**Current stage:** The v1 endpoint and Android client have exchanged live `frame_state` metadata over the private Windows hotspot; the Android client now renders its current subject metadata, while physical alignment and person-track validation are pending.
**Update this file when:** before implementing a message, after a contract correction, or before any backward-incompatible change. Keep a compatibility note rather than silently changing established fields.

## 1. Session Flow

```text
client connects → hello → hello_ack → frame* → frame_state* → close
                                  ↘ error (recoverable where possible)
```

1. Client sends `hello` with a short-lived token.
2. Server validates the token and responds with capability/configuration data.
3. Client sends current camera frames with increasing integer `frameId` values.
4. Server responds with zero or one `frame_state` per processed frame.
5. Client ignores any state whose `frameId` is not newer than the last accepted one.

## 2. Messages

### `hello` — client to server

```json
{"type":"hello","version":1,"token":"short-lived-token","clientId":"random-session-id"}
```

### `hello_ack` — server to client

```json
{"type":"hello_ack","version":1,"sessionId":"random-server-session-id","maxSubjects":6,"serverTimeMs":0}
```

### `frame` — client to server

```json
{"type":"frame","version":1,"frameId":42,"capturedAtMs":123456,"width":640,"height":360,"jpeg":"base64-or-binary-reference"}
```

`frameId` is strictly increasing for a connected client. `capturedAtMs` is for client latency correlation only; clocks do not need to agree.

### `frame_state` — server to client

```json
{
  "type":"frame_state",
  "version":1,
  "frameId":42,
  "serverReceivedAtMs":123470,
  "inferenceMs":31,
  "subjects":[
    {
      "id":4,
      "confidence":0.91,
      "box":[0.31,0.18,0.21,0.62],
      "contour":[[0.32,0.19],[0.37,0.21]],
      "profile":{"band":"powerful","min":"5000","max":"100000","palette":"magenta"}
    }
  ]
}
```

- `box` is `[x, y, width, height]`; all positions are normalized against the transmitted frame.
- `contour` is optional and contains normalized points in order.
- `profile` appears on the first response for a subject and may be omitted after the client acknowledges/caches it.
- Finite aura limits are strings to avoid client/server integer precision disagreement. Infinite bands are represented as `{"infinite": true}` instead.

### `error` — server to client

```json
{"type":"error","version":1,"code":"invalid_frame","message":"JPEG could not be decoded","recoverable":true}
```

Known error codes: `UNAUTHORIZED`, `UNSUPPORTED_VERSION`, `INVALID_MESSAGE`, `INVALID_FRAME`, `SERVER_UNAVAILABLE`, `RATE_LIMITED`.

## 3. Validation and Limits

- Reject unknown protocol versions.
- Reject missing/invalid tokens after a short grace period.
- Reject a frame whose declared dimensions or payload size exceed configured limits.
- Accept only `person` tracks; return at most six ranked subjects.
- The current server uses `yolo26n-seg.pt` with BoT-SORT and returns normalized `[x, y, width, height]` boxes plus a simplified normalized contour when a mask is available.
- Do not echo frame JPEGs or add image-derived biometric information to responses.

## 4. Ordering and Freshness

The protocol optimizes for recency, not delivery of every frame. Dropping a frame is normal. A response that arrives out of order is discarded by the client. The server may skip a response when it replaces an old pending frame with a newer one.

## 5. Compatibility

Backward-incompatible changes require a new `version`. Additive optional fields may be introduced within v1 only when v1 clients can ignore them safely.
