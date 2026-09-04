from passpose.backend.password_manager import save_password
from passpose.backend.password_manager import load_password
from passpose.backend.password_manager import verify_password


password = [
    "BOTH_HANDS_UP",
    "ARMS_OUT",
    "HANDS_TOGETHER"
]


print("Saving password...")

save_password(password)

print()

print("Loading password...")

saved = load_password()

print("Saved password:")
print(saved)

print()

print("Testing correct password...")

correct = verify_password([
    "BOTH_HANDS_UP",
    "ARMS_OUT",
    "HANDS_TOGETHER"
])

print("Result:", correct)

print()

print("Testing incorrect password...")

incorrect = verify_password([
    "BOTH_HANDS_UP",
    "SQUAT",
    "HANDS_TOGETHER"
])

print("Result:", incorrect)

print()
print("Testing multi-user email password storage...")

user1_email = "user1@example.com"
user1_seq = ["SQUAT", "ARMS_OUT", "LEFT_HAND_UP"]

user2_email = "user2@example.com"
user2_seq = ["BOTH_HANDS_UP", "HANDS_TOGETHER"]

save_password(user1_seq, email=user1_email)
save_password(user2_seq, email=user2_email)

print("User 1 verification:", verify_password(user1_seq, email=user1_email))
print("User 2 verification:", verify_password(user2_seq, email=user2_email))
print("Cross user verification (should be False):", verify_password(user1_seq, email=user2_email))

