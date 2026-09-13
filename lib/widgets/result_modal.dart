import 'package:flutter/material.dart';
 feature/ui-gyro

class ResultModal extends StatelessWidget {
  final String imageAssetPath;
  const ResultModal({super.key, required this.imageAssetPath});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: const Color(0xFF1E1E1E),
      title: const Text(
        "Photo Successfully Ruined",
        style: TextStyle(color: Colors.redAccent),
      ),
      content: Image.asset(imageAssetPath),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text("Close", style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}
import 'dart:typed_data';
import '../engine/llm_critic.dart';

class ResultModal extends StatefulWidget {
  final Uint8List imageBytes;
  const ResultModal({super.key, required this.imageBytes});

  @override
  State<ResultModal> createState() => _ResultModalState();
}

class _ResultModalState extends State<ResultModal> {
  String _roastText = "Consulting local AI critic...";

  @override
  void initState() {
    super.initState();
    _fetchRoast();
  }

  Future<void> _fetchRoast() async {
    final roast = await LlmCritic.generateRoast();
    if (mounted) setState(() => _roastText = roast);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Color(0xFF121212),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          const Text("CHAOS CAPTURE RESULT", style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 16),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.memory(widget.imageBytes, fit: BoxFit.contain),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black45,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
            ),
            child: Text(
              _roastText,
              style: const TextStyle(color: Colors.white70, fontStyle: FontStyle.italic, fontSize: 13),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
                icon: const Icon(Icons.delete_forever),
                label: const Text("Incinerate"),
                onPressed: () => Navigator.pop(context),
              ),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(foregroundColor: Colors.white70),
                icon: const Icon(Icons.share),
                label: const Text("Export Proof"),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Error 404: File too shameful to share.")),
                  );
                },
              ),
            ],
          )
        ],
      ),
    );
  }
}
 main
