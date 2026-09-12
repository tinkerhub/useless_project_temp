# Laptop Thermal Control Bridge

A two-part project: a static dashboard on GitHub Pages, and a local Windows
agent that talks to it over a loopback-only WebSocket to read sensors and
enforce a fan-speed floor.

```
repo/
├── agent/
│   ├── LaptopThermalBridge.csproj
│   ├── app.manifest          # forces "Run as administrator"
│   └── Program.cs
├── web/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── .github/workflows/       GitHub Actions workflows (repository root)
```

## Building the agent

Requires the .NET 8 SDK on Windows.

```powershell
cd agent
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```

The output binary lands in
`agent/bin/Release/net8.0-windows/win-x64/publish/icastfireball.exe`.
Upload that file as `icastfireball.exe` to a GitHub Release tagged so that
`https://github.com/bone-fires/thaatha/releases/latest/download/icastfireball.exe`
resolves to it.

## Publishing the dashboard

Push to `main` and the `pages.yml` workflow deploys the `web/` directory to
GitHub Pages automatically. Enable Pages once in the repo settings
(**Settings → Pages → Source: GitHub Actions**).

The dashboard is configured for the `bone-fires/thaatha` Pages origin. If the
repository or owner changes, update both the release URL in `web/index.html`
and `AllowedOrigin` in `agent/Program.cs`.

## Safety notes on the agent design

- **Floor-only, never a ceiling.** The control loop computes
  `target = MAX(biosDefaultPercent, userFloor)` and only ever pushes fan
  speed *up* relative to what the EC's own curve wants at that moment.
- **Conservative baseline.** The agent captures the available control value at
  startup and never intentionally drops control to resample it while a floor
  is active. Hardware without a trustworthy writable control path must not be
  used with this prototype.
- **Failsafe watchdog.** Any disconnect — tab closed, process killed,
  network blip — immediately calls `SetDefault()` on every fan control
  channel and cancels all stress threads. There is no "hold last state"
  path.
- **Loopback-only.** The `HttpListener` prefix is `127.0.0.1`, and incoming
  connections are also checked against `IPAddress.IsLoopback` before being
  accepted, so nothing outside the machine can reach the agent.
- **Single dashboard session.** A second browser tab is rejected so one
  connection cannot release another connection's global hardware state.
- **Origin restricted.** Only the configured GitHub Pages origin is accepted.

## Known caveats

- LibreHardwareMonitor's fan-control support is hardware/EC-dependent —
  some OEM firmware restricts or ignores SetSoftware() writes. If the panel
  shows a fan channel but the floor doesn't visibly move the fan, that
  model likely doesn't expose writable control to WinRing0.
- Vendor fan-control software (e.g. ASUS Armoury Crate, Lenovo Vantage)
  competing for the same EC channel will fight the override. Close it
  before using the bridge.
- `ws://127.0.0.1` from an HTTPS GitHub Pages page may be blocked by browser
  mixed-content policy. Verify this in the target browser before publishing;
  a secure local transport may be required.
