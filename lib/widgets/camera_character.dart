import 'package:flutter/material.dart';
import '../models/shy_state.dart';

class CameraCharacter extends StatelessWidget {
  final ShyState state;
  final double shyness;

  const CameraCharacter({
    super.key,
    required this.state,
    required this.shyness,
  });

  @override
  Widget build(BuildContext context) {
    double blushOpacity = (shyness / 100.0).clamp(0.0, 0.85);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: state.color.withOpacity(0.4),
            blurRadius: 12,
            spreadRadius: 2,
          )
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            state.emoji,
            style: const TextStyle(fontSize: 36),
          ),
          const SizedBox(width: 8),
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            width: 14,
            height: 14,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.pinkAccent.withOpacity(blushOpacity),
            ),
          ),
        ],
      ),
    );
  }
}