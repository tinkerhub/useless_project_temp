import 'package:flutter/material.dart';

class CurtainOverlay extends StatelessWidget {
  final bool isHidden;
  final bool isPeeking;

  const CurtainOverlay({
    super.key,
    required this.isHidden,
    required this.isPeeking,
  });

  @override
  Widget build(BuildContext context) {
    double topOffset;
    if (!isHidden) {
      topOffset = -600.0; // Completely off screen when calm
    } else if (isPeeking) {
      topOffset = -350.0; // Slides up slightly to peek
    } else {
      topOffset = 0.0; // Covers webcam fully
    }

    return AnimatedPositioned(
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeInOut,
      top: topOffset,
      left: 0,
      right: 0,
      bottom: -topOffset,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1E1B4B),
          borderRadius: BorderRadius.circular(24),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              isPeeking ? '👀' : '🙈',
              style: const TextStyle(fontSize: 64),
            ),
            const SizedBox(height: 12),
            Text(
              isPeeking ? "...Are they gone?" : "I'M LEAVING! CAMERA HIDING!",
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}