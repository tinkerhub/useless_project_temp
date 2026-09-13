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

  const WebcamFrame({
    super.key,
    required this.controller,
    required this.state,
    required this.shyness,
    required this.faceCount,
    required this.isPeeking,
  });

  @override
  Widget build(BuildContext context) {
    // Web-safe flustered tint (avoids BackdropFilter video freezing bug)
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
          // Live Webcam Stream
          Positioned.fill(child: previewWidget),

          // Flustered Pink Tint Overlay when Shy/Panicking
          if (blushTintOpacity > 0)
            Positioned.fill(
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                color: Colors.pinkAccent.withOpacity(blushTintOpacity),
              ),
            ),

          // Top Right Character Expression
          Positioned(
            top: 16,
            right: 16,
            child: CameraCharacter(state: state, shyness: shyness),
          ),

          // Bottom Left Face Counter Badge
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
                'Faces Detected: $faceCount',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
          ),

          // Animated Hiding Curtain Overlay
          CurtainOverlay(
            isHidden: state == ShyState.extremePanic,
            isPeeking: isPeeking,
          ),
        ],
      ),
    );

    // Shake animation during Panic states
    if (state == ShyState.panic || state == ShyState.extremePanic) {
      return content.animate(onPlay: (c) => c.repeat()).shake(hz: 8, offset: const Offset(5, 0));
    } else if (state == ShyState.shy) {
      return content.animate(onPlay: (c) => c.repeat()).shake(hz: 3, offset: const Offset(2, 0));
    }

    return content;
  }
}