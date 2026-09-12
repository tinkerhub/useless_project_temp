import cv2
import math


PIXELS_PER_ANT_METER = 100.0

MIN_AREA = 20
MAX_AREA = 5000

MIN_MOVEMENT = 1.5
MAX_JUMP = 100

SMOOTHING_ALPHA = 0.30
MAX_LOST_FRAMES = 10

# New tracking reliability settings
MIN_CONFIRM_FRAMES = 3
MAX_CANDIDATE_JUMP = 60
MIN_CONTOUR_AREA = 20


def analyze_video(video_path: str):

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise ValueError("Could not open video")

    fps = cap.get(cv2.CAP_PROP_FPS)

    if fps <= 0:
        fps = 30.0

    total_frames = int(
        cap.get(cv2.CAP_PROP_FRAME_COUNT)
    )

    previous_gray = None

    previous_position = None
    smoothed_position = None

    trajectory = []

    total_distance = 0.0
    max_speed = 0.0
    moving_time = 0.0

    stop_count = 0
    longest_stop = 0.0
    current_stop = 0.0

    lost_frames = 0

    # ------------------------------------------------
    # Candidate confirmation
    # ------------------------------------------------

    candidate_position = None
    candidate_frames = 0

    frame_number = 0

    while True:

        ret, frame = cap.read()

        if not ret:
            break

        frame_number += 1

        gray = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2GRAY
        )

        gray = cv2.GaussianBlur(
            gray,
            (5, 5),
            0
        )

        if previous_gray is None:

            previous_gray = gray

            continue

        # --------------------------------------------
        # Motion detection
        # --------------------------------------------

        difference = cv2.absdiff(
            previous_gray,
            gray
        )

        _, threshold = cv2.threshold(
            difference,
            15,
            255,
            cv2.THRESH_BINARY
        )

        kernel = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE,
            (3, 3)
        )

        threshold = cv2.morphologyEx(
            threshold,
            cv2.MORPH_OPEN,
            kernel
        )

        threshold = cv2.dilate(
            threshold,
            kernel,
            iterations=1
        )

        contours, _ = cv2.findContours(
            threshold,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )

        candidates = []

        for contour in contours:

            area = cv2.contourArea(contour)

            if area < MIN_AREA:
                continue

            if area > MAX_AREA:
                continue

            x, y, w, h = cv2.boundingRect(contour)

            center_x = x + w / 2
            center_y = y + h / 2

            # ----------------------------------------
            # Basic shape filtering
            # ----------------------------------------

            if w <= 0 or h <= 0:
                continue

            aspect_ratio = max(w, h) / min(w, h)

            # Extremely thin single-pixel noise
            if aspect_ratio > 8:
                continue

            candidates.append({
                "x": center_x,
                "y": center_y,
                "area": area,
                "w": w,
                "h": h
            })

        selected = None

        # ==================================================
        # CASE 1
        # We don't currently have an ant
        # ==================================================

        if previous_position is None:

            if candidates:

                # Prefer a reasonably sized candidate.
                #
                # We don't simply use the largest object because
                # large floor/grout motion can fool the tracker.

                candidates.sort(
                    key=lambda c: c["area"],
                    reverse=True
                )

                best = candidates[0]

                position = (
                    best["x"],
                    best["y"]
                )

                # ------------------------------------------
                # Confirm candidate over multiple frames
                # ------------------------------------------

                if candidate_position is None:

                    candidate_position = position
                    candidate_frames = 1

                else:

                    distance = math.dist(
                        candidate_position,
                        position
                    )

                    if distance <= MAX_CANDIDATE_JUMP:

                        candidate_frames += 1

                        # Smooth candidate position
                        candidate_position = (
                            (
                                candidate_position[0]
                                + position[0]
                            ) / 2,

                            (
                                candidate_position[1]
                                + position[1]
                            ) / 2
                        )

                    else:

                        # Probably unrelated noise
                        candidate_position = position
                        candidate_frames = 1

                # Only accept after appearing consistently
                if candidate_frames >= MIN_CONFIRM_FRAMES:

                    selected = (
                        candidate_position[0],
                        candidate_position[1]
                    )

                    previous_position = selected
                    smoothed_position = selected

                    candidate_position = None
                    candidate_frames = 0

            else:

                candidate_position = None
                candidate_frames = 0

        # ==================================================
        # CASE 2
        # We already have an ant
        # ==================================================

        else:

            if candidates:

                # Find candidates close to the previous
                # ant position.

                nearby = []

                for candidate in candidates:

                    distance = math.dist(
                        previous_position,
                        (
                            candidate["x"],
                            candidate["y"]
                        )
                    )

                    if distance <= MAX_JUMP:

                        nearby.append(
                            (
                                distance,
                                candidate
                            )
                        )

                if nearby:

                    # Closest candidate wins
                    nearby.sort(
                        key=lambda item: item[0]
                    )

                    selected = nearby[0][1]

                    current_position = (
                        selected["x"],
                        selected["y"]
                    )

                    lost_frames = 0

                    # --------------------------------------
                    # Smooth movement
                    # --------------------------------------

                    if smoothed_position is None:

                        smoothed_position = current_position

                    else:

                        smoothed_position = (

                            SMOOTHING_ALPHA *
                            current_position[0]
                            +
                            (1 - SMOOTHING_ALPHA) *
                            smoothed_position[0],

                            SMOOTHING_ALPHA *
                            current_position[1]
                            +
                            (1 - SMOOTHING_ALPHA) *
                            smoothed_position[1]
                        )

                    position = smoothed_position

                    # --------------------------------------
                    # Calculate movement
                    # --------------------------------------

                    movement = math.dist(
                        previous_position,
                        position
                    )

                    if movement >= MIN_MOVEMENT:

                        total_distance += movement

                        speed_pixels = (
                            movement * fps
                        )

                        max_speed = max(
                            max_speed,
                            speed_pixels
                        )

                        moving_time += 1 / fps

                        current_stop = 0.0

                    else:

                        current_stop += 1 / fps

                        # Count a stop only when the ant
                        # has actually remained still.

                        if (
                            current_stop >= 1.0
                            and
                            (
                                current_stop - 1 / fps
                            ) < 1.0
                        ):

                            stop_count += 1

                        longest_stop = max(
                            longest_stop,
                            current_stop
                        )

                    trajectory.append({
                        "frame": frame_number,
                        "time": round(
                            frame_number / fps,
                            3
                        ),
                        "x": round(
                            position[0],
                            2
                        ),
                        "y": round(
                            position[1],
                            2
                        )
                    })

                    previous_position = position

                else:

                    # No candidate close enough
                    lost_frames += 1

            else:

                lost_frames += 1

        # ==================================================
        # LOST TRACK
        # ==================================================

        if lost_frames > MAX_LOST_FRAMES:

            previous_position = None
            smoothed_position = None

            candidate_position = None
            candidate_frames = 0

            lost_frames = 0

        previous_gray = gray

    cap.release()

    # ======================================================
    # STATISTICS
    # ======================================================

    distance = (
        total_distance /
        PIXELS_PER_ANT_METER
    )

    average_speed_pixels = (

        total_distance / moving_time

        if moving_time > 0

        else 0
    )

    average_speed = (
        average_speed_pixels /
        PIXELS_PER_ANT_METER
    )

    ant_max_speed = (
        max_speed /
        PIXELS_PER_ANT_METER
    )

    elapsed_time = (

        total_frames / fps

        if fps > 0

        else 0
    )

    estimated_steps = int(
        distance * 20
    )

    calories = round(
        distance * 0.8,
        1
    )

    if ant_max_speed > 0:

        terrain_score = int(
            (
                1 -
                average_speed /
                ant_max_speed
            ) * 100
        )

        terrain_score = max(
            0,
            min(
                100,
                terrain_score
            )
        )

    else:

        terrain_score = 0

    fitness_score = int(
        min(
            100,
            distance * 5 +
            average_speed * 10
        )
    )

    # ======================================================
    # ACHIEVEMENTS
    # ======================================================

    achievements = []

    if trajectory:
        achievements.append(
            "First Steps"
        )

    if distance >= 10:
        achievements.append(
            "10 AM Club"
        )

    if distance >= 25:
        achievements.append(
            "Marathon Ant"
        )

    if ant_max_speed >= 1:
        achievements.append(
            "Speed Demon"
        )

    if stop_count >= 10:
        achievements.append(
            "Professional Rest"
        )

    if moving_time >= 20:
        achievements.append(
            "Endurance Ant"
        )

    if not achievements:

        achievements.append(
            "Ant in Training"
        )

    return {

        "title":
            generate_activity_title(
                distance,
                ant_max_speed,
                stop_count
            ),

        "description":
            generate_description(
                distance,
                moving_time
            ),

        "distance":
            round(distance, 2),

        "elapsed_time":
            round(elapsed_time, 2),

        "moving_time":
            round(moving_time, 2),

        "average_speed":
            round(average_speed, 2),

        "max_speed":
            round(ant_max_speed, 2),

        "stops":
            stop_count,

        "longest_stop":
            round(longest_stop, 2),

        "estimated_steps":
            estimated_steps,

        "calories":
            calories,

        "terrain_score":
            terrain_score,

        "fitness_score":
            fitness_score,

        "achievements":
            achievements,

        "trajectory":
            trajectory
    }


def generate_activity_title(
    distance,
    max_speed,
    stops
):

    if max_speed >= 2:
        return "THE GREAT ANT GRAND PRIX"

    if stops >= 10:
        return "A Very Productive Day"

    if distance >= 25:
        return "The Extremely Unnecessary Marathon"

    if distance >= 10:
        return "The Big Expedition"

    return "Suspicious Amount of Walking"


def generate_description(
    distance,
    moving_time
):

    if distance >= 25:

        return (
            "An absolutely unnecessary amount "
            "of walking. Scientists are concerned."
        )

    if moving_time < 5:

        return (
            "Short expedition. "
            "The ant probably forgot something."
        )

    return (
        "A completely legitimate athletic "
        "achievement that definitely deserved "
        "to be tracked."
    )