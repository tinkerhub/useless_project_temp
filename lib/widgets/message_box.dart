import 'package:flutter/material.dart';
import '../models/shy_state.dart';

class MessageBox extends StatelessWidget {
  final String message;
  final ShyState state;

  const MessageBox({
    super.key,
    required this.message,
    required this.state,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: state.color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: state.color.withOpacity(0.5), width: 1.5),
      ),
      child: Text(
        '"$message"',
        textAlign: TextAlign.center,
        style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Colors.grey.shade900,
        ),
      ),
    );
  }
}