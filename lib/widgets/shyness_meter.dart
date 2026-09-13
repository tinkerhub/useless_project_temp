import 'package:flutter/material.dart';
import '../models/shy_state.dart';

class ShynessMeter extends StatelessWidget {
  final double shyness;
  final ShyState state;

  const ShynessMeter({
    super.key,
    required this.shyness,
    required this.state,
  });

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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'CAMERA SHYNESS',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
              ),
              Text(
                '${shyness.toStringAsFixed(1)}%',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: state.color),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: (shyness / 100.0).clamp(0.0, 1.0),
              minHeight: 18,
              backgroundColor: Colors.grey.shade200,
              color: state.color,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Text('State: ', style: TextStyle(fontWeight: FontWeight.w600)),
              Text(
                '${state.title} ${state.emoji}',
                style: TextStyle(fontWeight: FontWeight.bold, color: state.color),
              ),
            ],
          ),
        ],
      ),
    );
  }
}