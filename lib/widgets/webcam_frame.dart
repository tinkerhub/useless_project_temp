import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../models/shy_state.dart';
import 'camera_character.dart';
import 'curtain_overlay.dart';

class WebcamFrame extends StatelessWidget {
  final CameraController? controller;
  final ShyState state;
  final double shyness;
  final int faceCount;
  final bool isPeeking;
  final bool isCameraActive;

  const WebcamFrame({
    super.key,
    required this.controller,
    required this.state,
    required this.shyness,
    required this.faceCount,
    required this.isPeeking,
    required this.isCameraActive,
  });

  @override
  Widget build(BuildContext context) {
    double blushTintOpacity = (shyness > 30) ? ((shyness - 30) / 70.0) * 0.35 : 0.0;

    Widget previewWidget;
    if (controller != null && controller!.value.isInitialized) {
      previewWidget = AspectRatio(
        aspectRatio: controller!.value.aspectRatio,
        child: CameraPreview(controller!),
      );
    } else {
      previewWidget = Container(
        color: Colors.grey.shade900,
        child: const Center(
          child: CircularProgressIndicator(color: Colors.white),
        ),
      );
    }

    Widget content = ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned.fill(child: previewWidget),

          if (blushTintOpacity > 0)
            Positioned.fill(
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                color: Colors.pinkAccent.withOpacity(blushTintOpacity),
              ),
            ),

          // Camera Stopped Dark Overlay
          if (!isCameraActive)
            Positioned.fill(
              child: Container(
                color: Colors.black.withOpacity(0.65),
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.videocam_off_rounded, color: Colors.white, size: 56),
                    SizedBox(height: 12),
                    Text(
                      'CAMERA DETECTION STOPPED',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),

          Positioned(
            top: 16,
            right: 16,
            child: CameraCharacter(state: state, shyness: shyness),
          ),

          Positioned(
            bottom: 16,
            left: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.75),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                isCameraActive ? 'Faces Detected: $faceCount' : 'Status: STOPPED 🛑',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
          ),

          CurtainOverlay(
            isHidden: state == ShyState.extremePanic,
            isPeeking: isPeeking,
          ),
        ],
      ),
    );

    if (state == ShyState.panic || state == ShyState.extremePanic) {
      return content.animate(onPlay: (c) => c.repeat()).shake(hz: 8, offset: const Offset(5, 0));
    } else if (state == ShyState.shy) {
      return content.animate(onPlay: (c) => c.repeat()).shake(hz: 3, offset: const Offset(2, 0));
    }

    return content;
  }
}