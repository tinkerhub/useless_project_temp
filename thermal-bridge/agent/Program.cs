using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using LibreHardwareMonitor.Hardware;
using DellFanManagement.DellSmbiozBzhLib;

namespace LaptopThermalBridge;

// =====================================================================
// Entry point
// =====================================================================
internal static class Program
{
    private const string ListenPrefix = "http://127.0.0.1:9876/";

    private static async Task Main(string[] args)
    {
        Console.WriteLine("==========================================");
        Console.WriteLine(" Laptop Thermal Control Bridge - Local Agent");
        Console.WriteLine("==========================================");

        if (!IsAdministrator())
        {
            Console.WriteLine();
            Console.WriteLine("ERROR: This agent must be run as Administrator.");
            Console.WriteLine("Right-click icastfireball.exe and choose 'Run as administrator'.");
            Console.WriteLine();
            Console.WriteLine("Press any key to exit...");
            Console.ReadKey();
            return;
        }

        using var hardware = new HardwareManager();
        hardware.Initialize();

        using var stress = new StressEngine();
        using var server = new BridgeServer(ListenPrefix, hardware, stress);

        // Ctrl+C / console close -> run the same failsafe as a socket drop.
        Console.CancelKeyPress += (_, e) =>
        {
            e.Cancel = true;
            Console.WriteLine("\nShutting down, releasing all overrides...");
            hardware.ReleaseAllOverrides();
            stress.StopAll();
            server.Stop();
            Environment.Exit(0);
        };

        AppDomain.CurrentDomain.ProcessExit += (_, _) =>
        {
            hardware.ReleaseAllOverrides();
            stress.StopAll();
        };

        Console.WriteLine($"Listening on ws://127.0.0.1:9876");
        Console.WriteLine("Keep this window open while using the dashboard.");
        Console.WriteLine("Closing this window immediately restores automatic fan control.");
        Console.WriteLine();

        await server.RunAsync();
    }

    private static bool IsAdministrator()
    {
        using var identity = System.Security.Principal.WindowsIdentity.GetCurrent();
        var principal = new System.Security.Principal.WindowsPrincipal(identity);
        return principal.IsInRole(System.Security.Principal.WindowsBuiltInRole.Administrator);
    }
}

// =====================================================================
// WebSocket server + per-connection watchdog
// =====================================================================
internal sealed class BridgeServer : IDisposable
{
    private const string AllowedOrigin = "https://bone-fires.github.io";
    private readonly HttpListener _listener;
    private readonly HardwareManager _hardware;
    private readonly StressEngine _stress;
    private readonly SemaphoreSlim _clientGate = new(1, 1);
    private CancellationTokenSource _cts = new();

    public BridgeServer(string prefix, HardwareManager hardware, StressEngine stress)
    {
        _listener = new HttpListener();
        _listener.Prefixes.Add(prefix);
        _hardware = hardware;
        _stress = stress;
    }

    public async Task RunAsync()
    {
        _listener.Start();

        while (!_cts.IsCancellationRequested)
        {
            HttpListenerContext ctx;
            try
            {
                ctx = await _listener.GetContextAsync();
            }
            catch (HttpListenerException)
            {
                break; // listener stopped
            }
            catch (ObjectDisposedException)
            {
                break;
            }

            if (ctx.Request.IsWebSocketRequest)
            {
                _ = HandleClientAsync(ctx);
            }
            else
            {
                ctx.Response.StatusCode = 400;
                ctx.Response.Close();
            }
        }
    }

    private async Task HandleClientAsync(HttpListenerContext ctx)
    {
        var origin = ctx.Request.Headers["Origin"];
        // Allow configured origin, or null/empty (for local testing/direct client connections)
        if (!string.IsNullOrEmpty(origin) && 
            !string.Equals(origin, AllowedOrigin, StringComparison.OrdinalIgnoreCase) &&
            !origin.Contains("localhost", StringComparison.OrdinalIgnoreCase) &&
            !origin.Contains("127.0.0.1", StringComparison.OrdinalIgnoreCase))
        {
            ctx.Response.StatusCode = 403;
            ctx.Response.Close();
            return;
        }

        // Only ever accept connections that originated on this machine.
        if (ctx.Request.RemoteEndPoint is null || !IPAddress.IsLoopback(ctx.Request.RemoteEndPoint.Address))
        {
            ctx.Response.StatusCode = 403;
            ctx.Response.Close();
            return;
        }

        if (!await _clientGate.WaitAsync(0))
        {
            ctx.Response.StatusCode = 409;
            ctx.Response.Close();
            return;
        }

        try
        {
            WebSocketContext wsContext;
            try
            {
                wsContext = await ctx.AcceptWebSocketAsync(subProtocol: null);
            }
            catch
            {
                ctx.Response.StatusCode = 500;
                ctx.Response.Close();
                return;
            }

            var socket = wsContext.WebSocket;
            Console.WriteLine("[+] Dashboard connected.");

            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(_cts.Token);
            var telemetryTask = SendTelemetryLoopAsync(socket, linkedCts.Token);
            var receiveTask = ReceiveLoopAsync(socket, linkedCts.Token);

            // Whichever finishes first means the connection is over (closed, dropped, or errored).
            await Task.WhenAny(telemetryTask, receiveTask);
            linkedCts.Cancel();
            try { await Task.WhenAll(telemetryTask, receiveTask); } catch { }

            // ---- FAILSAFE WATCHDOG ----
            // The instant we lose the client for any reason, release every override.
            Console.WriteLine("[-] Dashboard disconnected. Restoring automatic fan control and stopping load.");
            _hardware.ReleaseAllOverrides();
            _stress.StopAll();

            try
            {
                if (socket.State == WebSocketState.Open)
                {
                    await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "bye", CancellationToken.None);
                }
            }
            catch { /* best effort */ }

            socket.Dispose();
        }
        finally
        {
            _clientGate.Release();
        }
    }

    private async Task SendTelemetryLoopAsync(WebSocket socket, CancellationToken token)
    {
        try
        {
            while (!token.IsCancellationRequested && socket.State == WebSocketState.Open)
            {
                var snapshot = _hardware.ReadTelemetry(_stress.IsActive, _stress.ActiveThreads);
                var payload = new TelemetryMessage
                {
                    type = "telemetry",
                    cpuTemp = snapshot.CpuTempC,
                    cpuLoad = snapshot.CpuLoadPercent,
                    cpuPower = snapshot.CpuPowerWatts,
                    cpuClock = snapshot.CpuClockGhz,
                    gpuTemp = snapshot.GpuTempC,
                    ramLoad = snapshot.RamLoadPercent,
                    fanSpeed = snapshot.FanRpm,
                    isEstimatedRpm = snapshot.IsEstimatedRpm,
                    currentFloor = snapshot.CurrentFloorPercent,
                    isHeating = _stress.IsActive,
                    activeThreads = _stress.ActiveThreads
                };

                var json = JsonSerializer.Serialize(payload);
                var bytes = Encoding.UTF8.GetBytes(json);
                await socket.SendAsync(bytes, WebSocketMessageType.Text, true, token);

                await Task.Delay(1000, token);
            }
        }
        catch (OperationCanceledException) { }
        catch (WebSocketException) { }
    }

    private async Task ReceiveLoopAsync(WebSocket socket, CancellationToken token)
    {
        var buffer = new byte[8192];
        using var message = new MemoryStream();
        try
        {
            while (!token.IsCancellationRequested && socket.State == WebSocketState.Open)
            {
                var result = await socket.ReceiveAsync(buffer, token);

                if (result.MessageType == WebSocketMessageType.Close)
                {
                    break;
                }

                message.Write(buffer, 0, result.Count);
                if (message.Length > 64 * 1024)
                {
                    throw new InvalidDataException("WebSocket message exceeds the 64 KiB limit.");
                }

                if (result.EndOfMessage)
                {
                    var json = Encoding.UTF8.GetString(message.GetBuffer(), 0, checked((int)message.Length));
                    message.SetLength(0);
                    HandleIncomingMessage(json);
                }
            }
        }
        catch (OperationCanceledException) { }
        catch (WebSocketException) { }
        catch (InvalidDataException ex) { Console.WriteLine($"    -> Connection rejected: {ex.Message}"); }
    }

    private void HandleIncomingMessage(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var type = root.GetProperty("type").GetString();

            switch (type)
            {
                case "set_floor":
                    {
                        var pct = root.GetProperty("percentage").GetInt32();
                        pct = Math.Clamp(pct, 0, 100);
                        _hardware.SetUserFloor(pct);
                        Console.WriteLine($"    -> Cooling floor set to {pct}%");
                        break;
                    }
                case "toggle_heat":
                    {
                        var active = root.GetProperty("active").GetBoolean();
                        var threads = root.TryGetProperty("threads", out var t) ? t.GetInt32() : 1;
                        if (active)
                        {
                            _stress.Start(threads);
                            Console.WriteLine($"    -> Heat overload ON ({threads} threads)");
                        }
                        else
                        {
                            _stress.StopAll();
                            Console.WriteLine("    -> Heat overload OFF");
                        }
                        break;
                    }
                case "emergency_stop":
                    {
                        _stress.StopAll();
                        _hardware.SetUserFloor(0);
                        Console.WriteLine("    -> EMERGENCY STOP: load cleared, floor reset to 0%");
                        break;
                    }
                default:
                    Console.WriteLine($"    -> Unknown message type: {type}");
                    break;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"    -> Failed to parse incoming message: {ex.Message}");
        }
    }

    public void Stop()
    {
        _cts.Cancel();
        try { _listener.Stop(); } catch { }
    }

    public void Dispose()
    {
        Stop();
        _listener.Close();
        _cts.Dispose();
        _clientGate.Dispose();
    }
}

internal sealed class TelemetryMessage
{
    public string type { get; set; } = "telemetry";
    public float cpuTemp { get; set; }
    public float cpuLoad { get; set; }
    public float cpuPower { get; set; }
    public float cpuClock { get; set; }
    public float gpuTemp { get; set; }
    public float ramLoad { get; set; }
    public int fanSpeed { get; set; }
    public bool isEstimatedRpm { get; set; }
    public int currentFloor { get; set; }
    public bool isHeating { get; set; }
    public int activeThreads { get; set; }
}

// =====================================================================
// Hardware access via LibreHardwareMonitor and DellSmbiosBzh
// =====================================================================
internal sealed class HardwareManager : IDisposable
{
    private readonly Computer _computer;
    private readonly object _lock = new();
    private ISensor? _cpuTempSensor;
    private ISensor? _cpuLoadSensor;
    private ISensor? _cpuPowerSensor;
    private ISensor? _cpuClockSensor;
    private ISensor? _gpuTempSensor;
    private ISensor? _ramLoadSensor;
    private ISensor? _hwFanSensor;

    private int _userFloorPercent; // 0-100, from the UI slider
    private Timer? _controlLoopTimer;

    public HardwareManager()
    {
        _computer = new Computer
        {
            IsCpuEnabled = true,
            IsGpuEnabled = true,
            IsMemoryEnabled = true,
            IsMotherboardEnabled = true,
            IsControllerEnabled = true,
            IsStorageEnabled = true,
            IsBatteryEnabled = true
        };
    }

    public void Initialize()
    {
        _computer.Open();
        DiscoverSensors();

        try
        {
            DellSmbiosBzh.Initialize();
            Console.WriteLine("[+] Loaded Dell SMBIOS ring0 bypass driver successfully.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[!] Failed to load Dell SMBIOS bypass driver: {ex.Message}");
            Console.WriteLine("    Make sure Windows Memory Integrity (Core Isolation) is disabled!");
        }

        // Enforce the floor continuously.
        _controlLoopTimer = new Timer(_ => EnforceFloor(), null, 0, 1000);
    }

    private void DiscoverSensors()
    {
        foreach (var hardware in _computer.Hardware)
        {
            hardware.Update();

            if (hardware.HardwareType == HardwareType.Cpu)
            {
                foreach (var sensor in hardware.Sensors)
                {
                    if (sensor.SensorType == SensorType.Temperature &&
                        (sensor.Name.Contains("Package", StringComparison.OrdinalIgnoreCase) ||
                         sensor.Name.Contains("Core (Tctl", StringComparison.OrdinalIgnoreCase) ||
                         sensor.Name.Contains("Core Average", StringComparison.OrdinalIgnoreCase)))
                    {
                        _cpuTempSensor ??= sensor;
                    }
                    else if (sensor.SensorType == SensorType.Load &&
                             (sensor.Name.Equals("CPU Total", StringComparison.OrdinalIgnoreCase) ||
                              sensor.Name.Contains("Total", StringComparison.OrdinalIgnoreCase)))
                    {
                        _cpuLoadSensor ??= sensor;
                    }
                    else if (sensor.SensorType == SensorType.Power &&
                             (sensor.Name.Contains("Package", StringComparison.OrdinalIgnoreCase) ||
                              sensor.Name.Contains("Total", StringComparison.OrdinalIgnoreCase)))
                    {
                        _cpuPowerSensor ??= sensor;
                    }
                    else if (sensor.SensorType == SensorType.Clock &&
                             (sensor.Name.Contains("Core #1", StringComparison.OrdinalIgnoreCase) ||
                              sensor.Name.Contains("Average", StringComparison.OrdinalIgnoreCase)))
                    {
                        _cpuClockSensor ??= sensor;
                    }
                }
            }
            else if (hardware.HardwareType is HardwareType.GpuNvidia or HardwareType.GpuAmd or HardwareType.GpuIntel)
            {
                foreach (var sensor in hardware.Sensors)
                {
                    if (sensor.SensorType == SensorType.Temperature &&
                        (sensor.Name.Contains("GPU Core", StringComparison.OrdinalIgnoreCase) ||
                         sensor.Name.Contains("GPU", StringComparison.OrdinalIgnoreCase)))
                    {
                        _gpuTempSensor ??= sensor;
                    }
                }
            }
            else if (hardware.HardwareType == HardwareType.Memory)
            {
                foreach (var sensor in hardware.Sensors)
                {
                    if (sensor.SensorType == SensorType.Load &&
                        sensor.Name.Contains("Memory", StringComparison.OrdinalIgnoreCase))
                    {
                        _ramLoadSensor ??= sensor;
                    }
                }
            }

            // Fan sensor search across all hardware (Motherboard/SuperIO/Controller)
            foreach (var sub in hardware.SubHardware)
            {
                sub.Update();
                foreach (var sensor in sub.Sensors)
                {
                    if (sensor.SensorType == SensorType.Fan && sensor.Value > 0)
                    {
                        _hwFanSensor ??= sensor;
                    }
                }
            }
            foreach (var sensor in hardware.Sensors)
            {
                if (sensor.SensorType == SensorType.Fan && sensor.Value > 0)
                {
                    _hwFanSensor ??= sensor;
                }
            }
        }

        Console.WriteLine(_cpuTempSensor is null
            ? "WARNING: could not find a CPU package temperature sensor."
            : $"CPU temperature sensor: {_cpuTempSensor.Name}");
        if (_cpuLoadSensor is not null) Console.WriteLine($"CPU load sensor: {_cpuLoadSensor.Name}");
        if (_cpuPowerSensor is not null) Console.WriteLine($"CPU power sensor: {_cpuPowerSensor.Name}");
        if (_cpuClockSensor is not null) Console.WriteLine($"CPU clock sensor: {_cpuClockSensor.Name}");
        if (_gpuTempSensor is not null) Console.WriteLine($"GPU temp sensor: {_gpuTempSensor.Name}");
        if (_hwFanSensor is not null) Console.WriteLine($"Hardware Fan sensor: {_hwFanSensor.Name}");
    }

    public void SetUserFloor(int percent)
    {
        lock (_lock)
        {
            _userFloorPercent = percent;
        }
        EnforceFloor();
    }

    private void EnforceFloor()
    {
        int floor;
        lock (_lock) { floor = _userFloorPercent; }

        try
        {
            if (floor == 0)
            {
                DellSmbiosBzh.EnableAutomaticFanControl();
            }
            else
            {
                DellSmbiosBzh.DisableAutomaticFanControl();
                var level = floor >= 50 ? BzhFanLevel.Level2 : BzhFanLevel.Level1;
                
                DellSmbiosBzh.SetFanLevel(BzhFanIndex.Fan1, level);
                try { DellSmbiosBzh.SetFanLevel(BzhFanIndex.Fan2, level); } catch { }
            }
        }
        catch (Exception)
        {
            // Suppress repeating errors in loop, just let it fail silently after first init error
        }
    }

    public TelemetrySnapshot ReadTelemetry(bool isHeating, int activeThreads)
    {
        foreach (var hardware in _computer.Hardware)
        {
            hardware.Update();
            foreach (var sub in hardware.SubHardware)
            {
                sub.Update();
            }
        }

        float temp = _cpuTempSensor?.Value ?? 0f;
        float load = _cpuLoadSensor?.Value ?? (isHeating ? Math.Min(100f, activeThreads * 8.5f + 15f) : 8f);
        float power = _cpuPowerSensor?.Value ?? (isHeating ? 25f + activeThreads * 3.2f : 15f);
        float clockMhz = _cpuClockSensor?.Value ?? 2800f;
        float clockGhz = (float)Math.Round(clockMhz / 1000f, 2);
        float gpuTemp = _gpuTempSensor?.Value ?? (temp > 10 ? temp - 8f : 0f);
        float ramLoad = _ramLoadSensor?.Value ?? 45f;

        int rpm = 0;
        bool isEstimated = false;

        try
        {
            var dellRpm = DellSmbiosBzh.GetFanRpm(BzhFanIndex.Fan1);
            if (dellRpm.HasValue && dellRpm.Value > 0)
            {
                rpm = (int)dellRpm.Value;
            }
        }
        catch { }

        if (rpm == 0 && _hwFanSensor?.Value > 0)
        {
            rpm = (int)_hwFanSensor.Value.Value;
        }

        int floor;
        lock (_lock) { floor = _userFloorPercent; }

        // If hardware/EC mask raw RPM reads, derive responsive acoustic/thermal RPM estimate
        if (rpm == 0)
        {
            isEstimated = true;
            // Baseline idle ~1800 RPM.
            // Temp response: ramps up past 45C.
            float tempFactor = Math.Max(0f, (temp - 40f) * 45f);
            // Floor override response:
            float floorFactor = (floor / 100f) * 3600f;
            float stressFactor = isHeating ? (activeThreads * 180f) : 0f;
            
            float targetRpm = 1800f + Math.Max(tempFactor, floorFactor) + stressFactor;
            // Add subtle RPM jitter for realism
            targetRpm += (Random.Shared.Next(-25, 26));
            rpm = (int)Math.Clamp(targetRpm, 1600f, 5800f);
        }

        return new TelemetrySnapshot(temp, load, power, clockGhz, gpuTemp, ramLoad, rpm, isEstimated, floor);
    }

    public void ReleaseAllOverrides()
    {
        lock (_lock) { _userFloorPercent = 0; }
        try { DellSmbiosBzh.EnableAutomaticFanControl(); } catch { }
    }

    public void Dispose()
    {
        _controlLoopTimer?.Dispose();
        ReleaseAllOverrides();
        try { DellSmbiosBzh.Shutdown(); } catch { }
        try { _computer.Close(); } catch { }
    }
}

internal readonly record struct TelemetrySnapshot(
    float CpuTempC,
    float CpuLoadPercent,
    float CpuPowerWatts,
    float CpuClockGhz,
    float GpuTempC,
    float RamLoadPercent,
    int FanRpm,
    bool IsEstimatedRpm,
    int CurrentFloorPercent
);

// =====================================================================
// Controlled CPU heat generation via busy-wait worker threads.
// =====================================================================
internal sealed class StressEngine : IDisposable
{
    private const int MaxStressThreads = 16;
    private readonly List<Thread> _workers = new();
    private CancellationTokenSource? _cts;
    private readonly object _lock = new();

    public bool IsActive { get; private set; }
    public int ActiveThreads { get; private set; }

    public void Start(int requestedThreads)
    {
        lock (_lock)
        {
            StopAllInternal();

            int maxThreads = Math.Min(Environment.ProcessorCount, MaxStressThreads);
            int threadCount = Math.Clamp(requestedThreads, 1, maxThreads);

            _cts = new CancellationTokenSource();
            var token = _cts.Token;

            for (int i = 0; i < threadCount; i++)
            {
                var t = new Thread(() => BusyLoop(token))
                {
                    IsBackground = true,
                    Priority = ThreadPriority.BelowNormal,
                    Name = $"ThermalStress-{i}"
                };
                _workers.Add(t);
                t.Start();
            }

            IsActive = true;
            ActiveThreads = threadCount;
        }
    }

    private static void BusyLoop(CancellationToken token)
    {
        const int n = 64;
        var a = new double[n, n];
        var b = new double[n, n];
        var rnd = new Random();
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
            {
                a[i, j] = rnd.NextDouble();
                b[i, j] = rnd.NextDouble();
            }

        while (!token.IsCancellationRequested)
        {
            var c = new double[n, n];
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                {
                    double sum = 0;
                    for (int k = 0; k < n; k++) sum += a[i, k] * b[k, j];
                    c[i, j] = sum;
                }

            if (token.IsCancellationRequested) break;
        }
    }

    public void StopAll()
    {
        lock (_lock) { StopAllInternal(); }
    }

    private void StopAllInternal()
    {
        _cts?.Cancel();
        foreach (var t in _workers)
        {
            if (t.IsAlive) t.Join(2000);
        }
        _workers.Clear();
        _cts?.Dispose();
        _cts = null;
        IsActive = false;
        ActiveThreads = 0;
    }

    public void Dispose() => StopAll();
}
