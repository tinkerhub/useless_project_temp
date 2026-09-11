using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using LibreHardwareMonitor.Hardware;

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
        if (!string.Equals(ctx.Request.Headers["Origin"], AllowedOrigin, StringComparison.OrdinalIgnoreCase))
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
                var snapshot = _hardware.ReadTelemetry();
                var payload = new TelemetryMessage
                {
                    type = "telemetry",
                    cpuTemp = snapshot.CpuTempC,
                    fanSpeed = snapshot.FanRpm,
                    currentFloor = snapshot.CurrentFloorPercent,
                    isHeating = _stress.IsActive
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
    public int fanSpeed { get; set; }
    public int currentFloor { get; set; }
    public bool isHeating { get; set; }
}

// =====================================================================
// Hardware access via LibreHardwareMonitor - the ONLY place that talks
// to sensors/fan controls. Implements the floor-only rule.
// =====================================================================
internal sealed class HardwareManager : IDisposable
{
    private readonly Computer _computer;
    private readonly object _lock = new();
    private readonly List<FanChannel> _fanChannels = new();
    private ISensor? _cpuTempSensor;

    private int _userFloorPercent; // 0-100, from the UI slider
    private Timer? _controlLoopTimer;

    public void Initialize()
    {
        _computer.Open();
        DiscoverSensors();

        // Enforce the floor continuously.
        _controlLoopTimer = new Timer(_ => EnforceFloor(), null, 0, 1000);

    }

    public HardwareManager()
    {
        _computer = new Computer
        {
            IsCpuEnabled = true,
            IsMotherboardEnabled = true, // fan controllers usually live under the motherboard/SuperIO
            IsControllerEnabled = true
        };
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
                         sensor.Name.Contains("Core (Tctl", StringComparison.OrdinalIgnoreCase)))
                    {
                        _cpuTempSensor = sensor;
                    }
                }
            }

            // Fan controls typically surface under Motherboard -> SubHardware (SuperIO/EC).
            foreach (var sub in hardware.SubHardware)
            {
                sub.Update();
                foreach (var sensor in sub.Sensors)
                {
                    if (sensor.SensorType == SensorType.Control && sensor.Control is not null)
                    {
                        var baseline = sensor.Control.SoftwareValue;
                        _fanChannels.Add(new FanChannel(sensor, baseline));
                    }
                    else if (sensor.SensorType == SensorType.Fan)
                    {
                        // paired RPM sensor, matched by index proximity; used for readout only
                    }
                }
            }
        }

        Console.WriteLine($"Detected {_fanChannels.Count} controllable fan channel(s).");
        Console.WriteLine(_cpuTempSensor is null
            ? "WARNING: could not find a CPU package temperature sensor."
            : $"CPU temperature sensor: {_cpuTempSensor.Name}");
    }

    public void SetUserFloor(int percent)
    {
        lock (_lock)
        {
            _userFloorPercent = percent;
        }
        EnforceFloor();
    }

    /// <summary>
    /// The Floor-Only Rule: TargetPWM = MAX(BIOS_Default_PWM, User_Floor_Override_PWM).
    /// We never command a fan slower than either the EC's own auto curve
    /// or the user's requested floor - only ever push speed up.
    /// </summary>
    private void EnforceFloor()
    {
        int floor;
        lock (_lock) { floor = _userFloorPercent; }

        foreach (var channel in _fanChannels)
        {
            try
            {
                var target = Math.Max(channel.BiosDefaultPercent, floor);

                if (target <= channel.BiosDefaultPercent && floor == 0)
                {
                    // Nothing to override - hand control back to the EC entirely.
                    channel.Sensor.Control!.SetDefault();
                }
                else
                {
                    channel.Sensor.Control!.SetSoftware(target);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"    ! Failed to set fan channel: {ex.Message}");
            }
        }
    }

    public TelemetrySnapshot ReadTelemetry()
    {
        foreach (var hardware in _computer.Hardware)
        {
            hardware.Update();
            foreach (var sub in hardware.SubHardware) sub.Update();
        }

        float temp = _cpuTempSensor?.Value ?? 0f;
        int rpm = 0;

        foreach (var hardware in _computer.Hardware)
        {
            foreach (var sub in hardware.SubHardware)
            {
                var fanSensor = sub.Sensors.FirstOrDefault(s => s.SensorType == SensorType.Fan);
                if (fanSensor?.Value is float v)
                {
                    rpm = Math.Max(rpm, (int)v);
                }
            }
        }

        int floor;
        lock (_lock) { floor = _userFloorPercent; }

        return new TelemetrySnapshot(temp, rpm, floor);
    }

    public void ReleaseAllOverrides()
    {
        lock (_lock) { _userFloorPercent = 0; }

        foreach (var channel in _fanChannels)
        {
            try { channel.Sensor.Control!.SetDefault(); }
            catch { }
        }
    }

    public void Dispose()
    {
        _controlLoopTimer?.Dispose();
        ReleaseAllOverrides();
        try { _computer.Close(); } catch { }
    }

    private sealed class FanChannel
    {
        public ISensor Sensor { get; }
        public float BiosDefaultPercent { get; set; }

        public FanChannel(ISensor sensor, float biosDefaultPercent)
        {
            Sensor = sensor;
            BiosDefaultPercent = biosDefaultPercent;
        }
    }
}

internal readonly record struct TelemetrySnapshot(float CpuTempC, int FanRpm, int CurrentFloorPercent);

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
        }
    }

    private static void BusyLoop(CancellationToken token)
    {
        // Simple dense arithmetic (matrix-multiply-like) workload to load
        // the FPU/ALU without allocating unbounded memory.
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

            // Yield periodically to check cancellation without waiting for a full pass.
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
    }

    public void Dispose() => StopAll();
}
