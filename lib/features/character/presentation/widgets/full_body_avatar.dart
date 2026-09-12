import 'package:flutter/material.dart';

import '../../domain/entities/character_profile.dart';

class FullBodyAvatar extends StatelessWidget {
  const FullBodyAvatar({super.key, required this.profile});

  final CharacterProfile profile;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 220,
      height: 310,
      child: Stack(
        alignment: Alignment.topCenter,
        children: [
          Positioned(
            top: 34,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: profile.skinColor,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.black, width: 4),
              ),
              child: _Face(expression: profile.expression),
            ),
          ),
          Positioned(
            top: 22,
            child: Container(
              width: 104,
              height: 48,
              decoration: BoxDecoration(
                color: profile.hairColor,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(48),
                  bottom: Radius.circular(18),
                ),
              ),
            ),
          ),
          Positioned(
            top: 126,
            child: Container(
              width: 104,
              height: 112,
              decoration: BoxDecoration(
                color: profile.outfitColor,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: Colors.black, width: 4),
              ),
            ),
          ),
          Positioned(
            top: 140,
            left: 22,
            child: _Limb(
              width: 28,
              height: 105,
              color: profile.skinColor,
              angle: 0.15,
            ),
          ),
          Positioned(
            top: 140,
            right: 22,
            child: _Limb(
              width: 28,
              height: 105,
              color: profile.skinColor,
              angle: -0.15,
            ),
          ),
          Positioned(
            top: 225,
            left: 63,
            child: _Limb(width: 38, height: 80, color: const Color(0xFF17171D)),
          ),
          Positioned(
            top: 225,
            right: 63,
            child: _Limb(width: 38, height: 80, color: const Color(0xFF17171D)),
          ),
        ],
      ),
    );
  }
}

class _Face extends StatelessWidget {
  const _Face({required this.expression});

  final int expression;

  @override
  Widget build(BuildContext context) {
    final mouths = ['⌢', '—', '⌣'];

    return Stack(
      children: [
        const Positioned(top: 38, left: 24, child: _Eye()),
        const Positioned(top: 38, right: 24, child: _Eye()),
        Positioned(
          left: 0,
          right: 0,
          bottom: 12,
          child: Text(
            mouths[expression],
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.black,
              fontSize: 26,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }
}

class _Eye extends StatelessWidget {
  const _Eye();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 12,
      height: 16,
      decoration: const BoxDecoration(
        color: Colors.black,
        shape: BoxShape.circle,
      ),
    );
  }
}

class _Limb extends StatelessWidget {
  const _Limb({
    required this.width,
    required this.height,
    required this.color,
    this.angle = 0,
  });

  final double width;
  final double height;
  final Color color;
  final double angle;

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: angle,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(width),
          border: Border.all(color: Colors.black, width: 4),
        ),
      ),
    );
  }
}
