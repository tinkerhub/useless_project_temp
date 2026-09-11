Based on the original PRD and the metrics we just defined, here is a cleaner PRD focused on what your system actually measures. The original document had enough military terminology to invade a lecture hall, so I’ve kept the technical intent while making the requirements concrete. 

# Product Requirements Document (PRD)

## Product Name

**Quantum Pen Flip Predictor**

## 1. Executive Summary

The Quantum Pen Flip Predictor is a computer-vision-based system that analyzes pen-spinning videos and evaluates the quality and consistency of the spinning technique.

The system processes high-frame-rate video, detects and tracks the pen and finger position, and calculates three primary performance metrics:

1. **RPM (Rotations Per Minute)**
2. **Finger/Rotation Center Accuracy**
3. **Wobble / Spin Stability**

The system also provides bounding-box kinetic data such as position, velocity, acceleration, and trajectory movement.

## 2. Objective

The objective is to automatically evaluate a pen-spin maneuver from video without relying on manual measurement.

The system should determine:

* How fast the pen is spinning.
* Whether the pen is rotating around the correct finger position.
* How stable or wobbly the spinning motion is.
* How the pen's position changes throughout the video.

## 3. Input

The system accepts high-frame-rate video recordings of the pen-spinning motion.

### Supported video characteristics

* 120 FPS
* 240 FPS
* Other frame rates may be supported if the FPS value is available.
* The pen should contain a clearly detectable visual marker to assist tracking.

## 4. Computer Vision Detection

### 4.1 Pen Detection

The system detects the pen in each frame using a bounding box.

For every frame, the system obtains:

$$
B_i=(x_i,y_i,w_i,h_i)
$$

where:

* \(x_i,y_i\) = bounding-box position
* \(w_i\) = bounding-box width
* \(h_i\) = bounding-box height

### 4.2 Pen Center

The center of the pen bounding box is calculated as:

$$
x_p=x_i+\frac{w_i}{2}
$$

$$
y_p=y_i+\frac{h_i}{2}
$$

Therefore:

$$
P_i=(x_p,y_p)
$$

### 4.3 Finger Position

The system detects the finger or intended rotation point and determines its center:

$$
C=(x_c,y_c)
$$

This center acts as the reference point for evaluating the spinning motion.

## 5. Bounding-Box Kinetics

The system uses the detected bounding box and its center position to calculate motion characteristics.

### 5.1 Position

The system records the pen position in every frame:

$$
P_i=(x_i,y_i)
$$

### 5.2 Velocity

Velocity is calculated from the change in position between frames:

$$
v_i=\frac{P_i-P_{i-1}}{\Delta t}
$$

### 5.3 Acceleration

Acceleration is calculated from the change in velocity:

$$
a_i=\frac{v_i-v_{i-1}}{\Delta t}
$$

These values provide information about the kinetics of the pen movement.

## 6. RPM Calculation

The system calculates angular displacement of the pen around the finger center.

For each frame:

$$
\theta_i=
\operatorname{atan2}(y_i-y_c,\;x_i-x_c)
$$

The change in angular displacement is:

$$
\Delta\theta=\theta_i-\theta_{i-1}
$$

After accounting for angle wrapping, total angular displacement can be used to calculate rotational speed.

Angular velocity is:

$$
\omega=\frac{\Delta\theta}{\Delta t}
$$

RPM is:

$$
\boxed{
RPM=\frac{\omega}{2\pi}\times60
}
$$

Alternatively, when complete rotations are counted:

$$
\boxed{
RPM=\frac{N}{T}\times60
}
$$

where:

* \(N\) = number of complete rotations
* \(T\) = time in seconds

For video-frame-based calculation:

$$
\boxed{
RPM=\frac{N\times FPS\times60}{F}
}
$$

where:

* \(FPS\) = video frame rate
* \(F\) = number of frames
* \(N\) = number of rotations

## 7. Finger Position / Center Accuracy

The system evaluates whether the pen rotates around the intended finger center.

The distance between the pen position and the finger center is:

$$
\boxed{
D_i=\sqrt{(x_i-x_c)^2+(y_i-y_c)^2}
}
$$

The average rotation radius is:

$$
\boxed{
\bar r=\frac{1}{N}\sum_{i=1}^{N}D_i
}
$$

The system may define an acceptable center tolerance \(D_{max}\).

A normalized center-accuracy score can then be calculated as:

$$
\boxed{
Accuracy=
\max\left(0,1-\frac{D}{D_{max}}\right)\times100
}
$$

This produces a percentage indicating how closely the detected motion corresponds to the intended center.

## 8. Wobble Detection

The system evaluates the stability of the pen's rotational path.

For each frame:

$$
r_i=\sqrt{(x_i-x_c)^2+(y_i-y_c)^2}
$$

The average radius is:

$$
\bar r=\frac{1}{N}\sum_{i=1}^{N}r_i
$$

The wobble error is calculated using the RMS deviation:

$$
\boxed{
W=
\sqrt{
\frac{1}{N}
\sum_{i=1}^{N}(r_i-\bar r)^2
}
}
$$

A normalized wobble percentage is:

$$
\boxed{
Wobble\%=\frac{W}{\bar r}\times100
}
$$

Lower values represent a more stable spin, while higher values indicate greater deviation from the ideal rotational path.

## 9. Trajectory Visualization

The system displays the detected pen coordinates over time.

A coordinate trail is generated:

$$
P_1,P_2,P_3,\ldots,P_N
$$

This provides a visual representation of the spinning trajectory and helps identify instability or irregular motion.

The trajectory should allow the user to visually distinguish:

* Stable circular motion
* Off-center rotation
* Irregular motion
* Significant wobbling

## 10. User Interface / HUD

The interface should display the video together with real-time analysis information.

### HUD elements

* Pen bounding box
* Finger/rotation center marker
* Pen trajectory trail
* RPM
* Center accuracy
* Wobble percentage
* Velocity
* Acceleration
* Operator identification
* Analysis status

The original PRD specifies a darkened video feed with high-contrast neon cyan and green markers for the HUD.

## 11. Occlusion Handling

If the pen marker is temporarily hidden by the user's fingers, the tracking system should continue estimating its position rather than immediately terminating the analysis.

The original PRD explicitly requires interpolation of the last known coordinates during temporary occlusion.

## 12. Tracking Failure

If the system completely loses track of the pen, it should indicate a tracking failure.

Examples include:

* Pen leaves the camera frame.
* Marker can no longer be detected.
* Pen stops at an unexpected location.
* Pen is dropped onto the desk.

The original PRD specifies a visible terminal alert for complete tracking failure.

## 13. Final Output

At the end of the analysis, the system should provide a performance summary such as:

**Pen Flip Analysis**

| Metric            |   Result |
| ----------------- | -------: |
| RPM               |      742 |
| Center Accuracy   |      94% |
| Wobble            |     3.8% |
| Average Velocity  |  2.4 m/s |
| Peak Acceleration | 8.1 m/s² |
| Tracking Quality  |     Good |

## 14. Success Criteria

The system is considered successful when it can:

* Reliably detect the pen in high-frame-rate video.
* Track the pen frame-by-frame.
* Identify the finger/rotation center.
* Calculate RPM from angular movement.
* Calculate center-position accuracy.
* Quantify wobble using trajectory deviation.
* Calculate bounding-box kinetics.
* Visualize the trajectory.
* Handle short periods of occlusion.
* Identify complete tracking failure.
* Present the results through a clear HUD.

## 15. Core Processing Pipeline

$$
\boxed{
Video
\rightarrow
Pen\ Detection
\rightarrow
Bounding\ Box
\rightarrow
Finger/Center\ Detection
\rightarrow
Frame\ Tracking
\rightarrow
Kinematic\ Analysis
\rightarrow
RPM
+
Center\ Accuracy
+
Wobble
\rightarrow
HUD
}
$$

The core idea is therefore not merely **"detect the pen."** The system turns the tracked bounding box into measurable motion data and uses that data to evaluate the quality of the pen spin.
