# Security, Privacy, and Operations — AUR/S

## AI Maintenance Context

**Purpose:** Sets non-negotiable data, network, and demo-operation boundaries before camera/network code exists.  
**Current stage:** Stage 0 — controls and runbook are required design constraints, not deployed controls.  
**Update this file when:** the system starts retaining data, changes network reachability, adds a dependency/service, changes authentication, or learns a real demo failure mode.

## 1. Privacy Position

The project processes camera frames only to locate temporary on-screen people. It does not recognize faces, infer personal traits, save frames, upload to cloud services, or attach a temporary track ID to a real identity.

Aura readings are explicitly fictional entertainment output.

## 2. Data Handling

| Data | Purpose | Retention |
|---|---|---|
| Camera JPEG | Current-frame detection | RAM only; discarded after processing/replacement |
| Temporary track ID | Overlay continuity | Session memory until expiry/disconnect |
| Aura profile | Consistent visual experience | Session memory until track expiry |
| Timing metrics | Performance diagnosis | Local aggregate/log only; no image data |
| Session token | Prevent unsolicited local clients | Short-lived; RAM only |

Do not log raw frames, contours tied to persistent names, device identifiers, or tokens.

## 3. Controls

- Bind the demo service to the LAN only; never port-forward it to the internet.
- Use a private Wi-Fi network and a short-lived random session token exchanged out of band.
- Apply Windows Firewall rules only for the required local port and Private network profile.
- Validate JSON fields, JPEG size, declared dimensions, protocol version, and token before image work.
- Limit one active client for the MVP.
- Show visible camera and connection state in the app.

### Captive-portal and peer-isolation rule

Do not use a college/public Wi-Fi network for the live scanner. A captive portal can redirect the app's local HTTP health request to a login gateway such as `172.16.16.16:8090`, and venue Wi-Fi may prevent phone-to-PC peer traffic. Use a direct phone hotspot or a private PC hotspot instead; internet access is not required.

## 4. Threats and Responses

| Threat | Response |
|---|---|
| Another device sends frames on venue Wi-Fi | Private network, token, one-client limit, firewall. |
| Oversized/malformed frame exhausts resources | Size/dimension limits; reject before decode; latest-frame slot. |
| Stale result looks live | Frame ID ordering and `DEGRADED` HUD state. |
| Camera data is accidentally retained | No persistence code path; logs exclude image data. |
| Subject mistake interpreted as identity | UI/documentation state IDs are temporary and fictional. |
| Model/server fails during demo | Health state, fallback model, local-preview-only graceful state. |

## 5. Observability

Health endpoint reports process state, model readiness, protocol version, and aggregate recent latency—never images, tokens, or identities. Client HUD shows connection status and current active-subject count.

## 6. Demo Runbook

1. Join the PC and phone to the private demo network.
2. Start the server; verify health and model warm-up.
3. Confirm the server's LAN IP, current session token, and Windows Firewall profile.
4. Open the app; wait for `LINK: OK`; test one selection and scan.
5. If latency rises, reduce JPEG dimensions/rate or choose the tested fallback model.
6. If the socket drops, let reconnect run; do not present the last overlay as live.
7. Stop the server after the demo and clear any temporary metrics per team policy.

## 7. Incident Rule

If a participant asks not to be on camera, point the phone away immediately. If the network cannot be kept private, do not run the live scanner.
