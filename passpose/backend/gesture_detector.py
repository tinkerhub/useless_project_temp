def detect_arms_out(landmarks):

    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]

    left_wrist = landmarks[15]
    right_wrist = landmarks[16]

    tolerance = 0.10

    left_arm_out = abs(left_wrist.y - left_shoulder.y) < tolerance
    right_arm_out = abs(right_wrist.y - right_shoulder.y) < tolerance

    return left_arm_out and right_arm_out

def detect_hands_together(landmarks):

    left_wrist = landmarks[15]
    right_wrist = landmarks[16]

    dx = left_wrist.x - right_wrist.x
    dy = left_wrist.y - right_wrist.y

    distance = (dx ** 2 + dy ** 2) ** 0.5

    threshold = 0.25

    return distance < threshold
def detect_squat(landmarks):

    left_hip = landmarks[23]
    right_hip = landmarks[24]

    left_knee = landmarks[25]
    right_knee = landmarks[26]

    left_difference = left_knee.y - left_hip.y
    right_difference = right_knee.y - right_hip.y

    threshold = 0.25

    left_squat = left_difference < threshold
    right_squat = right_difference < threshold

    return left_squat and right_squat

def detect_gesture(landmarks):

    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]

    left_wrist = landmarks[15]
    right_wrist = landmarks[16]

    margin = 0.08

    left_hand_up = (
        left_wrist.y < left_shoulder.y - margin
    )

    right_hand_up = (
        right_wrist.y < right_shoulder.y - margin
    )
   
    #squats checking
    if detect_squat(landmarks):
       return "SQUAT"
    
    #hands together
    if detect_hands_together(landmarks):
        return "HANDS_TOGETHER"
    
    # Arms stretched horizontally
    if detect_arms_out(landmarks):
        return "ARMS_OUT"

    # Both hands above shoulders
    elif left_hand_up and right_hand_up:
        return "BOTH_HANDS_UP"

    # Right hand above shoulder
    elif right_hand_up and not left_hand_up:
        return "RIGHT_HAND_UP"

    # Left hand above shoulder
    elif left_hand_up and not right_hand_up:
        return "LEFT_HAND_UP"

    else:
        return "NEUTRAL"