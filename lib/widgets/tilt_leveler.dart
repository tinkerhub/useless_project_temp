import 'dart:async';
import 'package:flutter/material.dart';
import 'package:sensors_plus/sensors_plus.dart';

class GyroTiltLeveler extends StatefulWidget {
  final Widget child;
  const GyroTiltLeveler({super.key, required this.child});

  @override
  State<GyroTiltLeveler> createState() => _GyroTiltLevelerState();
}

class _GyroTiltLevelerState extends State<GyroTiltLeveler> {
  StreamSubscription<AccelerometerEvent>? _accelSubscription;
  double _tiltAngle = 0.35; // Initial deliberate 20-degree awkward tilt

  @override
  void initState() {
    super.initState();
    _initAccelerometer();
  }

  void _initAccelerometer() {
    // Listen to device motion to actively sabotage leveling
    _accelSubscription = accelerometerEventStream().listen((
      AccelerometerEvent event,
    ) {
      if (!mounted) return;
      setState(() {
        // Reverse X acceleration so leveling counteracts stability
        // Multiplied to exaggerate small tilt movements
        _tiltAngle = (-event.x * 0.15).clamp(-0.8, 0.8);
      });
    });
  }

  @override
  void dispose() {
    _accelSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedRotation(
      turns: _tiltAngle / (2 * 3.14159),
      duration: const Duration(milliseconds: 150),
      curve: Curves.easeOut,
      child: widget.child,
    );
  }
}
