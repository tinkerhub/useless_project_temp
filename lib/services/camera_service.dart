import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';

class CameraService {
  CameraController? controller;
  bool isInitialized = false;

  Future<bool> initialize() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) return false;

      final frontCam = cameras.firstWhere(
        (cam) => cam.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      controller = CameraController(
        frontCam,
        ResolutionPreset.medium,
        enableAudio: false,
      );

      await controller!.initialize();
      isInitialized = true;
      return true;
    } catch (e) {
      if (kDebugMode) print('Camera init error: $e');
      isInitialized = false;
      return false;
    }
  }

  void dispose() {
    controller?.dispose();
    isInitialized = false;
  }
}