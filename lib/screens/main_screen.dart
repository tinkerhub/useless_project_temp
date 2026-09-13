import 'package:flutter/material.dart';
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

    return GestureDetector(
      onTap: () => FaceDetectorService.unlockAudio(),
      child: Scaffold(
        backgroundColor: const Color(0xFFF8F9FA),
        appBar: AppBar(
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'SHYCAM',
                style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5, fontSize: 20),
              ),
              Text(
                'The camera that can\'t handle attention.',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
            ],
          ),
          actions: [
            IconButton.filledTonal(
              icon: Icon(_controller.isMuted ? Icons.volume_off_rounded : Icons.volume_up_rounded),
              tooltip: 'Toggle Voice',
              onPressed: () {
                FaceDetectorService.unlockAudio();
                _controller.toggleMute();
              },
            ),
            const SizedBox(width: 16),
          ],
          backgroundColor: Colors.white,
          elevation: 0,
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
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 12)],
                  ),
                  child: WebcamFrame(
                    controller: _cameraService.controller,
                    state: _controller.state,
                    shyness: _controller.shynessScore,
                    faceCount: _controller.currentFaceCount,
                    isPeeking: _controller.isPeeking,
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
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              icon: const Icon(Icons.refresh_rounded),
                              label: const Text('RESET'),
                              onPressed: () {
                                FaceDetectorService.unlockAudio();
                                _controller.reset();
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF6366F1),
                              foregroundColor: Colors.white,
                            ),
                            icon: const Icon(Icons.record_voice_over_rounded, size: 18),
                            label: const Text('TEST VOICE'),
                            onPressed: () {
                              FaceDetectorService.unlockAudio();
                              FaceDetectorService.speak("Hi! I am Shy Cam!");
                            },
                          ),
                          const SizedBox(width: 8),
                          FilterChip(
                            label: const Text('DEMO'),
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
                          color: Colors.grey.shade200,
                          borderRadius: BorderRadius.circular(12),
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
    );
  }
}