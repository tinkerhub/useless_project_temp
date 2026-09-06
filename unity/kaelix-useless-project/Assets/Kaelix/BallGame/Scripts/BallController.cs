using UnityEngine;
using UnityEngine.InputSystem;

namespace Kaelix.BallGame
{
    [RequireComponent(typeof(Rigidbody))]
    public sealed class BallController : MonoBehaviour
    {
        [SerializeField] private float acceleration = 24f;
        [SerializeField] private float maximumSpeed = 11f;
        [SerializeField] private float jumpImpulse = 7f;
        [SerializeField] private float groundCheckDistance = 0.7f;
        [SerializeField] private float fallResetHeight = -5f;

        private Rigidbody body;
        private Vector3 spawnPosition;
        private Vector2 movementInput;
        private Vector2 arduinoMovementInput;
        private bool arduinoConnected;
        private bool jumpQueued;

        public void ApplyArduinoInput(Vector2 movement, bool jumpPressed, bool connected)
        {
            arduinoMovementInput = Vector2.ClampMagnitude(movement, 1f);
            arduinoConnected = connected;
            jumpQueued |= jumpPressed;
        }

        private void Awake()
        {
            body = GetComponent<Rigidbody>();
            spawnPosition = transform.position;
        }

        private void Update()
        {
            ReadKeyboardForPrototypeTest();

            if (transform.position.y < fallResetHeight)
            {
                Respawn();
            }
        }

        private void FixedUpdate()
        {
            var force = new Vector3(movementInput.x, 0f, movementInput.y) * acceleration;
            body.AddForce(force, ForceMode.Acceleration);

            var velocity = body.linearVelocity;
            var horizontalVelocity = new Vector3(velocity.x, 0f, velocity.z);
            if (horizontalVelocity.sqrMagnitude > maximumSpeed * maximumSpeed)
            {
                horizontalVelocity = horizontalVelocity.normalized * maximumSpeed;
                body.linearVelocity = new Vector3(horizontalVelocity.x, velocity.y, horizontalVelocity.z);
            }

            if (jumpQueued && IsGrounded())
            {
                body.AddForce(Vector3.up * jumpImpulse, ForceMode.Impulse);
            }

            jumpQueued = false;
        }

        private void ReadKeyboardForPrototypeTest()
        {
            var keyboard = Keyboard.current;
            if (keyboard == null)
            {
                movementInput = arduinoConnected ? arduinoMovementInput : Vector2.zero;
                return;
            }

            var horizontal = 0f;
            var vertical = 0f;

            if (keyboard.aKey.isPressed || keyboard.leftArrowKey.isPressed)
            {
                horizontal -= 1f;
            }

            if (keyboard.dKey.isPressed || keyboard.rightArrowKey.isPressed)
            {
                horizontal += 1f;
            }

            if (keyboard.sKey.isPressed || keyboard.downArrowKey.isPressed)
            {
                vertical -= 1f;
            }

            if (keyboard.wKey.isPressed || keyboard.upArrowKey.isPressed)
            {
                vertical += 1f;
            }

            var keyboardInput = Vector2.ClampMagnitude(new Vector2(horizontal, vertical), 1f);
            movementInput = arduinoConnected ? arduinoMovementInput : keyboardInput;
            jumpQueued |= keyboard.spaceKey.wasPressedThisFrame;
        }

        private bool IsGrounded()
        {
            return Physics.Raycast(
                transform.position,
                Vector3.down,
                groundCheckDistance,
                Physics.DefaultRaycastLayers,
                QueryTriggerInteraction.Ignore);
        }

        private void Respawn()
        {
            body.position = spawnPosition;
            body.rotation = Quaternion.identity;
            body.linearVelocity = Vector3.zero;
            body.angularVelocity = Vector3.zero;
        }
    }
}
