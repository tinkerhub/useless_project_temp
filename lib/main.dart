import 'package:flutter/material.dart';
import 'ui/camera_screen.dart';
import 'widgets/chaos_loader.dart';
import 'widgets/result_modal.dart';

void main() {
  runApp(const ChaosCamApp());
}

class ChaosCamApp extends StatelessWidget {
  const ChaosCamApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Chaos-Cam',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0A0A0A),
      ),
      home: const MainCameraWrapper(),
    );
  }
}

class MainCameraWrapper extends StatefulWidget {
  const MainCameraWrapper({super.key});

  @override
  State<MainCameraWrapper> createState() => _MainCameraWrapperState();
}

class _MainCameraWrapperState extends State<MainCameraWrapper> {
  bool _isProcessing = false;

  void _triggerShutterSequence() async {
    // 1. Show Fake AI Processing Overlay
    setState(() => _isProcessing = true);

    // 2. Simulate Chaos Engine Delay (2.5 seconds)
    await Future.delayed(const Duration(milliseconds: 2500));

    if (!mounted) return;
    setState(() => _isProcessing = false);

    // 3. Display Final Ruined Photo Modal
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) =>
          const ResultModal(imageAssetPath: 'assets/sample_face.jpg'),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Camera Viewfinder & Gyro Leveler Screen
        CameraScreen(onShutterPressed: _triggerShutterSequence),

        // Fake AI Processing Overlay (Triggers on Shutter Tap)
        if (_isProcessing) const ChaosLoaderOverlay(),
      ],
    );
  }
}
