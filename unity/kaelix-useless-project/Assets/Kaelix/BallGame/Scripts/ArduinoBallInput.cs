using System;
using System.Collections.Concurrent;
using System.Globalization;
using System.IO.Ports;
using System.Threading;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Kaelix.BallGame
{
    /// <summary>
    /// Reads the combined Arduino controller stream for BallGamePrototype only.
    /// Joystick rolls the ball, the button jumps, and MPU tilt moves the camera.
    /// </summary>
    public sealed class ArduinoBallInput : MonoBehaviour
    {
        private const string BallSceneName = "BallGamePrototype";
        private const string PreferredPort = "COM5";
        private const int BaudRate = 115200;
        private const float JoystickDeadZone = 0.15f;

        private readonly ConcurrentQueue<Vector2> joystickEvents = new();
        private readonly ConcurrentQueue<Vector2> tiltEvents = new();
        private readonly ConcurrentQueue<bool> buttonEvents = new();
        private readonly ConcurrentQueue<string> readerErrors = new();

        private BallController ballController;
        private FollowCamera followCamera;
        private SerialPort serialPort;
        private Thread readerThread;
        private Vector2 joystickInput;
        private Vector2 tiltInput;
        private bool buttonPressed;
        private bool hasTiltReading;
        private volatile bool keepReading;

        public bool IsConnected { get; private set; }
        public string ActivePort { get; private set; } = "none";
        public string ConnectionMessage { get; private set; } = "Connecting...";

        public string DebugStatus => IsConnected
            ? $"Arduino {ActivePort}: connected | Stick {joystickInput.x:+0.00;-0.00;0.00}, " +
              $"{joystickInput.y:+0.00;-0.00;0.00} | Tilt {tiltInput.x:0.0}, {tiltInput.y:0.0} | " +
              $"Button {(buttonPressed ? "DOWN" : "up")}"
            : $"Arduino: {ConnectionMessage}";

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void StartForBallScene()
        {
            if (!string.Equals(
                    SceneManager.GetActiveScene().name,
                    BallSceneName,
                    StringComparison.Ordinal) ||
                FindAnyObjectByType<ArduinoBallInput>() != null)
            {
                return;
            }

            var inputObject = new GameObject(nameof(ArduinoBallInput));
            inputObject.AddComponent<ArduinoBallInput>();
        }

        private void Start()
        {
            ballController = FindAnyObjectByType<BallController>();
            followCamera = FindAnyObjectByType<FollowCamera>();

            if (ballController == null || followCamera == null)
            {
                ConnectionMessage = "Ball scene components were not found.";
                Debug.LogError(ConnectionMessage);
                enabled = false;
                return;
            }

            OpenArduinoPort();
        }

        private void OpenArduinoPort()
        {
            try
            {
                var availablePorts = SerialPort.GetPortNames();
                var portName = ChoosePort(availablePorts);

                serialPort = new SerialPort(portName, BaudRate)
                {
                    ReadTimeout = 100,
                    NewLine = "\n",
                    DtrEnable = true
                };
                serialPort.Open();

                ActivePort = portName;
                ConnectionMessage = "Connected";
                IsConnected = true;
                keepReading = true;

                readerThread = new Thread(ReadSerialLoop)
                {
                    IsBackground = true,
                    Name = "Arduino ball-game serial reader"
                };
                readerThread.Start();

                Debug.Log($"Ball game connected to Arduino on {portName} at {BaudRate} baud.");
            }
            catch (Exception exception)
            {
                IsConnected = false;
                ConnectionMessage =
                    $"not connected ({exception.Message}). Close Serial Monitor and restart Play Mode.";
                Debug.LogWarning(ConnectionMessage);
            }
        }

        private static string ChoosePort(string[] availablePorts)
        {
            foreach (var port in availablePorts)
            {
                if (string.Equals(port, PreferredPort, StringComparison.OrdinalIgnoreCase))
                {
                    return port;
                }
            }

            if (availablePorts.Length == 1)
            {
                return availablePorts[0];
            }

            throw new InvalidOperationException(
                availablePorts.Length == 0
                    ? "No COM ports were found"
                    : $"COM5 was not found; available ports: {string.Join(", ", availablePorts)}");
        }

        private void ReadSerialLoop()
        {
            while (keepReading)
            {
                try
                {
                    ParseLine(serialPort.ReadLine().Trim());
                }
                catch (TimeoutException)
                {
                    // Keeps the thread responsive when Play Mode exits.
                }
                catch (Exception exception)
                {
                    if (keepReading)
                    {
                        readerErrors.Enqueue(exception.Message);
                    }

                    break;
                }
            }
        }

        private void ParseLine(string line)
        {
            var parts = line.Split(',');

            if (parts.Length == 4 && parts[0] == "INPUT")
            {
                if (int.TryParse(parts[1], out var rawX) &&
                    int.TryParse(parts[2], out var rawY) &&
                    int.TryParse(parts[3], out var rawButton))
                {
                    joystickEvents.Enqueue(new Vector2(
                        NormalizeAxis(rawX),
                        -NormalizeAxis(rawY)));
                    buttonEvents.Enqueue(rawButton == 1);
                }

                return;
            }

            if (parts.Length == 3 && parts[0] == "TILT" &&
                float.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out var pitch) &&
                float.TryParse(parts[2], NumberStyles.Float, CultureInfo.InvariantCulture, out var roll))
            {
                tiltEvents.Enqueue(new Vector2(pitch, roll));
            }
        }

        private static float NormalizeAxis(int rawValue)
        {
            var value = Mathf.Clamp((rawValue - 512f) / 511f, -1f, 1f);
            var magnitude = Mathf.Abs(value);

            if (magnitude <= JoystickDeadZone)
            {
                return 0f;
            }

            var scaledMagnitude = (magnitude - JoystickDeadZone) / (1f - JoystickDeadZone);
            return Mathf.Sign(value) * scaledMagnitude;
        }

        private void Update()
        {
            while (joystickEvents.TryDequeue(out var newJoystickInput))
            {
                joystickInput = newJoystickInput;
            }

            var jumpPressedThisFrame = false;
            while (buttonEvents.TryDequeue(out var newButtonState))
            {
                jumpPressedThisFrame |= newButtonState && !buttonPressed;
                buttonPressed = newButtonState;
            }

            while (tiltEvents.TryDequeue(out var newTiltInput))
            {
                tiltInput = newTiltInput;
                hasTiltReading = true;
            }

            while (readerErrors.TryDequeue(out var error))
            {
                IsConnected = false;
                ConnectionMessage = $"connection lost ({error})";
                Debug.LogError($"Arduino ball-game input stopped: {error}");
            }

            ballController.ApplyArduinoInput(joystickInput, jumpPressedThisFrame, IsConnected);
            followCamera.ApplyArduinoTilt(tiltInput, IsConnected && hasTiltReading);
        }

        private void OnDestroy()
        {
            IsConnected = false;
            keepReading = false;

            if (readerThread is { IsAlive: true })
            {
                readerThread.Join(300);
            }

            if (serialPort is { IsOpen: true })
            {
                serialPort.Close();
            }

            serialPort?.Dispose();
        }
    }
}
