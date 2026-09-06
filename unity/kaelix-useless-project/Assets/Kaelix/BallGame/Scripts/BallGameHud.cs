using UnityEngine;

namespace Kaelix.BallGame
{
    public sealed class BallGameHud : MonoBehaviour
    {
        private GUIStyle style;
        private ArduinoBallInput arduinoInput;

        private void OnGUI()
        {
            style ??= new GUIStyle(GUI.skin.box)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = 18,
                normal = { textColor = Color.white }
            };

            arduinoInput ??= FindAnyObjectByType<ArduinoBallInput>();

            var status = arduinoInput == null
                ? "Arduino: starting..."
                : arduinoInput.DebugStatus;

            GUI.Box(
                new Rect(20f, 20f, 500f, 84f),
                $"Joystick = roll  |  Button = jump  |  MPU tilt = camera\n{status}\n" +
                "Keyboard fallback: WASD / Arrows + Space",
                style);
        }
    }
}
