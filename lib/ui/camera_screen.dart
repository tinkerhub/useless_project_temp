import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/tilt_leveler.dart';
import '../widgets/pro_viewfinder.dart';

class CameraScreen extends StatefulWidget {
  final VoidCallback onShutterPressed;

  const CameraScreen({super.key, required this.onShutterPressed});

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  int _selectedSampleIndex = 0;
  final List<String> _sampleAssets = [
    'assets/sample_face.jpg',
    'assets/sample_group.jpg',
    'assets/sample_landscape.jpg',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar: AI Sabotage Optimizer Pill
            Padding(
              padding: const EdgeInsets.symmetric(
                vertical: 12.0,
                horizontal: 16.0,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.blur_on,
                        color: Colors.redAccent,
                        size: 18,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        "ANTI-COMPUTATIONAL AI",
                        style: GoogleFonts.orbitron(
                          color: Colors.redAccent,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.redAccent.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Colors.redAccent.withOpacity(0.5),
                      ),
                    ),
                    child: Text(
                      "CHAOS v3.0",
                      style: GoogleFonts.shareTechMono(
                        color: Colors.redAccent,
                        fontSize: 10,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Main Viewport (Gyroscope-Sabotaged + Pro Overlay)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12.0),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Stack(
                    children: [
                      // Viewport Frame with Sensor Tilt
                      GyroTiltLeveler(
                        child: Container(
                          width: double.infinity,
                          height: double.infinity,
                          color: Colors.black,
                          child: Image.asset(
                            _sampleAssets[_selectedSampleIndex],
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      // Interactive Viewfinder Grid & Focus Overlay
                      const ProViewfinderOverlay(),
                    ],
                  ),
                ),
              ),
            ),

            // Sample Selector Bar (For Emulator Demo Switching)
            Container(
              height: 45,
              margin: const EdgeInsets.symmetric(vertical: 12),
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _sampleAssets.length,
                itemBuilder: (context, index) {
                  final isSelected = index == _selectedSampleIndex;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedSampleIndex = index),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected ? Colors.white24 : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isSelected ? Colors.white : Colors.white24,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          "Preset #${index + 1}",
                          style: GoogleFonts.shareTechMono(
                            color: isSelected ? Colors.white : Colors.white60,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            // Bottom Shutter Controls
            Padding(
              padding: const EdgeInsets.only(
                bottom: 24.0,
                left: 24.0,
                right: 24.0,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  IconButton(
                    icon: const Icon(Icons.flash_off, color: Colors.white60),
                    onPressed: () {},
                  ),
                  // Shutter Button
                  GestureDetector(
                    onTap: widget.onShutterPressed,
                    child: Container(
                      width: 76,
                      height: 76,
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.redAccent, width: 3),
                      ),
                      child: Container(
                        decoration: const BoxDecoration(
                          color: Colors.redAccent,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.camera_alt,
                          color: Colors.white,
                          size: 30,
                        ),
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.cameraswitch, color: Colors.white60),
                    onPressed: () {},
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
