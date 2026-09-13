import 'package:flutter/material.dart';
import '../models/shy_state.dart';
import '../services/camera_service.dart';
import '../services/face_detector.dart';
import '../services/shyness_controller.dart';
import '../widgets/webcam_frame.dart';
import '../widgets/shyness_meter.dart';
import '../widgets/message_box.dart';
import '../widgets/stats_panel.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  final CameraService _cameraService = CameraService();
  final ShynessController _controller = ShynessController();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _setup();
  }

  Future<void> _setup() async {
    await _cameraService.initialize();
    _controller.start();
    _controller.addListener(() {
      if (mounted) setState(() {});
    });
    setState(() {
      _isLoading = false;
    });
  }

  @override
  void dispose() {
    _cameraService.dispose();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    // Dynamic Emotion Background Color
    Color bgGlowColor;
    switch (_controller.state) {
      case ShyState.calm:
        bgGlowColor = const Color(0xFFF0FDF4);
        break;
      case ShyState.nervous:
        bgGlowColor = const Color(0xFFFEFCE8);
        break;
      case ShyState.shy:
        bgGlowColor = const Color(0xFFFDF2F8);
        break;
      case ShyState.panic:
        bgGlowColor = const Color(0xFFFFF1F2);
        break;
      case ShyState.extremePanic:
        bgGlowColor = const Color(0xFFFFE4E6);
        break;
    }

    return GestureDetector(
      onTap: () => FaceDetectorService.unlockAudio(),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 500),
        color: bgGlowColor,
        child: Scaffold(
          backgroundColor: Colors.transparent,
          appBar: AppBar(
            toolbarHeight: 85,
            backgroundColor: Colors.white.withOpacity(0.95),
            elevation: 1,
            shadowColor: Colors.black12,
            title: Row(
              children: [
                // Glowing Gradient Camera Icon Badge
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFEC4899)],
                    ),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF6366F1).withOpacity(0.4),
                        blurRadius: 12,
                        spreadRadius: 2,
                      )
                    ],
                  ),
                  child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 28),
                ),
                const SizedBox(width: 16),
                // Title & Subtitle
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'SHYCAM 📷',
                      style: TextStyle(
                        fontSize: 30, // Big & Clean Title
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5,
                        color: Color(0xFF1E1B4B),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'The camera that can\'t handle human attention.',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ],
            ),
            actions: [
              // System Online Status Pill
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: _controller.isCameraActive ? Colors.green.shade50 : Colors.red.shade50,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: _controller.isCameraActive ? Colors.green.shade300 : Colors.red.shade300, width: 1.5),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _controller.isCameraActive ? Colors.green : Colors.red,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _controller.isCameraActive ? 'SYSTEM ONLINE' : 'PAUSED',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: _controller.isCameraActive ? Colors.green.shade800 : Colors.red.shade800,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              // Voice Toggle Button
              IconButton.filledTonal(
                icon: Icon(_controller.isMuted ? Icons.volume_off_rounded : Icons.volume_up_rounded),
                tooltip: 'Toggle Voice',
                onPressed: () {
                  FaceDetectorService.unlockAudio();
                  _controller.toggleMute();
                },
              ),
              const SizedBox(width: 20),
            ],
          ),
          body: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 3,
                  child: Container(
                    height: 480,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(28),
                    ),
                    child: WebcamFrame(
                      controller: _cameraService.controller,
                      state: _controller.state,
                      shyness: _controller.shynessScore,
                      faceCount: _controller.currentFaceCount,
                      isPeeking: _controller.isPeeking,
                      isCameraActive: _controller.isCameraActive,
                    ),
                  ),
                ),
                const SizedBox(width: 24),
                Expanded(
                  flex: 2,
                  child: SingleChildScrollView(
                    child: Column(
                      children: [
                        ShynessMeter(shyness: _controller.shynessScore, state: _controller.state),
                        const SizedBox(height: 16),
                        MessageBox(message: _controller.currentMessage, state: _controller.state),
                        const SizedBox(height: 16),
                        StatsPanel(stats: _controller.stats),
                        const SizedBox(height: 20),
                        // Action Control Buttons Row
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: _controller.isCameraActive ? Colors.redAccent : Colors.green,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                ),
                                icon: Icon(_controller.isCameraActive ? Icons.stop_rounded : Icons.play_arrow_rounded),
                                label: Text(_controller.isCameraActive ? 'STOP' : 'START', style: const TextStyle(fontWeight: FontWeight.bold)),
                                onPressed: () {
                                  FaceDetectorService.unlockAudio();
                                  _controller.toggleCameraActive();
                                },
                              ),
                            ),
                            const SizedBox(width: 8),
                            OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              icon: const Icon(Icons.refresh_rounded),
                              label: const Text('RESET', style: TextStyle(fontWeight: FontWeight.bold)),
                              onPressed: () {
                                FaceDetectorService.unlockAudio();
                                _controller.reset();
                              },
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF6366F1),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              icon: const Icon(Icons.record_voice_over_rounded, size: 18),
                              label: const Text('TEST VOICE', style: TextStyle(fontWeight: FontWeight.bold)),
                              onPressed: () {
                                FaceDetectorService.unlockAudio();
                                FaceDetectorService.speak("Hi! I am Shy Cam!");
                              },
                            ),
                            const SizedBox(width: 8),
                            FilterChip(
                              label: const Text('DEMO', style: TextStyle(fontWeight: FontWeight.bold)),
                              selected: _controller.isDemoMode,
                              onSelected: (val) {
                                FaceDetectorService.unlockAudio();
                                _controller.setDemoMode(val);
                              },
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.9),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              const Text('Simulate:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              TextButton(onPressed: () { FaceDetectorService.unlockAudio(); FaceDetectorService.setManualOverride(-1); }, child: const Text('Auto')),
                              TextButton(onPressed: () { FaceDetectorService.unlockAudio(); FaceDetectorService.setManualOverride(0); }, child: const Text('0')),
                              TextButton(onPressed: () { FaceDetectorService.unlockAudio(); FaceDetectorService.setManualOverride(1); }, child: const Text('1')),
                              TextButton(onPressed: () { FaceDetectorService.unlockAudio(); FaceDetectorService.setManualOverride(3); }, child: const Text('3')),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}