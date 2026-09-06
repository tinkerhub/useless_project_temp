using System;
using System.Collections.Concurrent;
using System.Globalization;
using System.IO.Ports;
using System.Threading;
using UnityEngine;
using UnityEngine.SceneManagement;

/// <summary>
/// Minimal Arduino-to-Unity controller test.
///
/// Expected serial messages at 115200 baud:
///   BUTTON,0
///   BUTTON,1
///   INPUT,512,512,0
///   TILT,-12.50,24.75
///
/// The component creates its own movable cube, so the scene needs no manual setup.
/// </summary>
public sealed class ButtonCubeDemo : MonoBehaviour
{
    private const string PreferredPort = "COM5";
    private const int BaudRate = 115200;
    private const float MovementSpeed = 6f;
    private const float JoystickDeadZone = 0.15f;
    private const float RotationFollowSpeed = 10f;

    private static readonly Color ReleasedColor = new(0.1f, 0.65f, 1f);
    private static readonly Color PressedColor = new(1f, 0.25f, 0.1f);

    private readonly ConcurrentQueue<bool> buttonEvents = new();
    private readonly ConcurrentQueue<Vector2> joystickEvents = new();
    private readonly ConcurrentQueue<Vector2> tiltEvents = new();
    private readonly ConcurrentQueue<string> logMessages = new();

    private SerialPort serialPort;
    private Thread readerThread;
    private Renderer cubeRenderer;
    private Transform cubeTransform;
    private Vector2 joystickInput;
    private Vector2 tiltInput;
    private volatile bool keepReading;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    private static void StartDemo()
    {
        // Keep this hardware sandbox isolated from the actual game scenes.
        if (!string.Equals(SceneManager.GetActiveScene().name, "SampleScene", StringComparison.Ordinal))
        {
            return;
        }

        var demoObject = new GameObject(nameof(ButtonCubeDemo));
        demoObject.AddComponent<ButtonCubeDemo>();
    }

    private void Start()
    {
        CreateCube();
        OpenArduinoPort();
    }

    private void CreateCube()
    {
        var cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
        cube.name = "Arduino Controller Cube";
        cube.transform.position = Vector3.zero;
        cube.transform.localScale = Vector3.one * 2f;

        cubeRenderer = cube.GetComponent<Renderer>();
        cubeTransform = cube.transform;
        cubeRenderer.material.color = ReleasedColor;
    }

    private void OpenArduinoPort()
    {
        try
        {
            var availablePorts = SerialPort.GetPortNames();
            var portName = Array.Exists(availablePorts, port =>
                string.Equals(port, PreferredPort, StringComparison.OrdinalIgnoreCase))
                ? PreferredPort
                : availablePorts.Length == 1
                    ? availablePorts[0]
                    : throw new InvalidOperationException(
                        $"Could not choose an Arduino port. Available ports: {string.Join(", ", availablePorts)}");

            serialPort = new SerialPort(portName, BaudRate)
            {
                ReadTimeout = 100,
                NewLine = "\n",
                DtrEnable = true
            };
            serialPort.Open();

            keepReading = true;
            readerThread = new Thread(ReadSerialLoop)
            {
                IsBackground = true,
                Name = "Arduino controller serial reader"
            };
            readerThread.Start();

            Debug.Log($"Arduino controller connected to {portName} at {BaudRate} baud.");
        }
        catch (Exception exception)
        {
            Debug.LogError(
                "Arduino connection failed. Close Arduino Serial Monitor, verify the COM port, " +
                $"then enter Play Mode again. Details: {exception.Message}");
        }
    }

    private void ReadSerialLoop()
    {
        while (keepReading)
        {
            try
            {
                var line = serialPort.ReadLine().Trim();
                if (line == "BUTTON,1")
                {
                    buttonEvents.Enqueue(true);
                }
                else if (line == "BUTTON,0")
                {
                    buttonEvents.Enqueue(false);
                }
                else
                {
                    ParseControllerInput(line);
                }
            }
            catch (TimeoutException)
            {
                // A short timeout lets the thread notice when Play Mode stops.
            }
            catch (Exception exception)
            {
                if (keepReading)
                {
                    logMessages.Enqueue($"Arduino serial read stopped: {exception.Message}");
                }

                break;
            }
        }
    }

    private void ParseControllerInput(string line)
    {
        var parts = line.Split(',');

        if (parts.Length == 4 && parts[0] == "INPUT")
        {
            ParseJoystickAndButton(parts);
            return;
        }

        if (parts.Length == 3 && parts[0] == "TILT")
        {
            ParseTilt(parts);
        }
    }

    private void ParseJoystickAndButton(string[] parts)
    {
        if (!int.TryParse(parts[1], out var rawX) ||
            !int.TryParse(parts[2], out var rawY) ||
            !int.TryParse(parts[3], out var rawButton))
        {
            return;
        }

        var x = NormalizeAxis(rawX);
        var y = -NormalizeAxis(rawY);

        joystickEvents.Enqueue(new Vector2(x, y));
        buttonEvents.Enqueue(rawButton == 1);
    }

    private void ParseTilt(string[] parts)
    {
        if (!float.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out var pitch) ||
            !float.TryParse(parts[2], NumberStyles.Float, CultureInfo.InvariantCulture, out var roll))
        {
            return;
        }

        tiltEvents.Enqueue(new Vector2(pitch, roll));
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
        while (buttonEvents.TryDequeue(out var isPressed))
        {
            cubeRenderer.material.color = isPressed ? PressedColor : ReleasedColor;
        }

        while (joystickEvents.TryDequeue(out var newJoystickInput))
        {
            joystickInput = newJoystickInput;
        }

        while (tiltEvents.TryDequeue(out var newTiltInput))
        {
            tiltInput = newTiltInput;
        }

        while (logMessages.TryDequeue(out var message))
        {
            Debug.LogError(message);
        }

        var movement = new Vector3(joystickInput.x, joystickInput.y, 0f);
        cubeTransform.Translate(movement * (MovementSpeed * Time.deltaTime), Space.World);

        var position = cubeTransform.position;
        position.x = Mathf.Clamp(position.x, -7f, 7f);
        position.y = Mathf.Clamp(position.y, -4f, 4f);
        cubeTransform.position = position;

        var targetRotation = Quaternion.Euler(tiltInput.x, 0f, -tiltInput.y);
        var rotationBlend = 1f - Mathf.Exp(-RotationFollowSpeed * Time.deltaTime);
        cubeTransform.rotation = Quaternion.Slerp(cubeTransform.rotation, targetRotation, rotationBlend);
    }

    private void OnDestroy()
    {
        keepReading = false;

        if (readerThread is { IsAlive: true })
        {
            readerThread.Join(250);
        }

        if (serialPort is { IsOpen: true })
        {
            serialPort.Close();
        }

        serialPort?.Dispose();
    }
}
