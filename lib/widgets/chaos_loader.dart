import 'package:flutter/material.dart';
feature/ui-gyro
import 'package:google_fonts/google_fonts.dart';

class ChaosLoaderOverlay extends StatelessWidget {
  const ChaosLoaderOverlay({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black87,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(color: Colors.redAccent),
            const SizedBox(height: 20),
            Text(
              "APPLYING ANTI-COMPUTATIONAL AI...",
              style: GoogleFonts.shareTechMono(
                color: Colors.redAccent,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
import 'dart:typed_data';
import '../engine/chaos_engine.dart';
import 'result_modal.dart';

class ChaosLoader extends StatefulWidget {
  final String assetPath;
  const ChaosLoader({super.key, required this.assetPath});

  @override
  State<ChaosLoader> createState() => _ChaosLoaderState();
}

class _ChaosLoaderState extends State<ChaosLoader> {
  String _statusText = "Detecting facial symmetry to ruin...";

  @override
  void initState() {
    super.initState();
    _startChaosProcess();
  }

  Future<void> _startChaosProcess() async {
    await Future.delayed(const Duration(milliseconds: 600));
    if (mounted) setState(() => _statusText = "Applying radioactive white balance...");
    
    await Future.delayed(const Duration(milliseconds: 600));
    if (mounted) setState(() => _statusText = "Stamping oily thumb smudge...");

    await Future.delayed(const Duration(milliseconds: 600));
    if (mounted) setState(() => _statusText = "Decapitating subject framing...");

    Uint8List ruinedBytes = await ChaosEngine.ruinPhoto(widget.assetPath);

    if (mounted) {
      Navigator.pop(context); 
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (context) => ResultModal(imageBytes: ruinedBytes),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: const Color(0xFF121212),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(color: Colors.redAccent),
          const SizedBox(height: 20),
          Text(
            _statusText,
            style: const TextStyle(color: Colors.white, fontSize: 14),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
} main
