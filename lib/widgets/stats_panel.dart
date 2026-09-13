import 'package:flutter/material.dart';
import '../models/shy_stats.dart';

class StatsPanel extends StatelessWidget {
  final ShyStats stats;

  const StatsPanel({super.key, required this.stats});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'CAMERA METRICS',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
          ),
          const SizedBox(height: 12),
          _statRow('Longest Stare', '${stats.longestStareSec.toStringAsFixed(1)}s'),
          _statRow('Panic Attacks', '${stats.panicCount}'),
          _statRow('Camera Confidence', '${stats.cameraConfidence}%'),
        ],
      ),
    );
  }

  Widget _statRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey.shade700)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}