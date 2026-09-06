using UnityEngine;

namespace Kaelix.BallGame
{
    public sealed class FollowCamera : MonoBehaviour
    {
        [SerializeField] private Transform target;
        [SerializeField] private Vector3 offset = new(0f, 8f, -10f);
        [SerializeField] private float followSharpness = 6f;
        [SerializeField] private float tiltOrbitSensitivity = 1.25f;
        [SerializeField] private float tiltHeightSensitivity = 0.08f;

        private Vector2 currentTilt;
        private Vector2 neutralTilt;
        private bool tiltConnected;
        private bool tiltCalibrated;

        public void Configure(Transform followTarget)
        {
            target = followTarget;
        }

        public void ApplyArduinoTilt(Vector2 tilt, bool connected)
        {
            if (!connected)
            {
                tiltConnected = false;
                tiltCalibrated = false;
                return;
            }

            tiltConnected = true;
            currentTilt = tilt;

            // The first valid reading becomes neutral. Hold the MPU comfortably
            // when entering Play Mode; no perfect table-level placement is needed.
            if (!tiltCalibrated)
            {
                neutralTilt = tilt;
                tiltCalibrated = true;
            }
        }

        private void LateUpdate()
        {
            if (target == null)
            {
                return;
            }

            var desiredOffset = offset;
            if (tiltConnected && tiltCalibrated)
            {
                var relativeTilt = currentTilt - neutralTilt;
                var orbitAngle = Mathf.Clamp(
                    -relativeTilt.y * tiltOrbitSensitivity,
                    -55f,
                    55f);
                var heightAdjustment = Mathf.Clamp(
                    relativeTilt.x * tiltHeightSensitivity,
                    -2.5f,
                    2.5f);

                desiredOffset.y += heightAdjustment;
                desiredOffset = Quaternion.AngleAxis(orbitAngle, Vector3.up) * desiredOffset;
            }

            var desiredPosition = target.position + desiredOffset;
            var blend = 1f - Mathf.Exp(-followSharpness * Time.deltaTime);
            transform.position = Vector3.Lerp(transform.position, desiredPosition, blend);
            transform.LookAt(target.position + Vector3.up * 0.4f);
        }
    }
}
