import 'dart:async';
import 'package:flutter/material.dart';
import '../models/shy_state.dart';
import '../models/shy_stats.dart';
import '../utils/messages.dart';
import 'face_detector.dart';

class ShynessController extends ChangeNotifier {
  double shynessScore = 0.0;
  ShyState state = ShyState.calm;
  int currentFaceCount = 0;
  bool isDemoMode = false;
  bool isPeeking = false;
  bool isMuted = false;
  bool isCameraActive = true;
  String currentMessage = "Finally... some privacy 😌";

  final ShyStats stats = ShyStats();
  Timer? _timer;
  double _stareDuration = 0.0;
  double _peekTimer = 0.0;

  void start() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(milliseconds: 100), (t) {
      _tick(0.1);
    });
  }

  void stop() {
    _timer?.cancel();
  }

  void toggleCameraActive() {
    isCameraActive = !isCameraActive;
    if (!isCameraActive) {
      FaceDetectorService.setManualOverride(0);
      currentFaceCount = 0;
      shynessScore = 0.0;
      state = ShyState.calm;
      _updateMessageAndSpeak("Camera detection stopped.");
    } else {
      FaceDetectorService.setManualOverride(-1);
      _updateMessageAndSpeak("Camera active!");
    }
    notifyListeners();
  }

  void toggleMute() {
    isMuted = !isMuted;
    notifyListeners();
  }

  void reset() {
    shynessScore = 0.0;
    state = ShyState.calm;
    currentFaceCount = 0;
    _stareDuration = 0.0;
    _peekTimer = 0.0;
    isPeeking = false;
    stats.reset();
    _updateMessageAndSpeak(FunnyMessages.getMessage(state, currentFaceCount));
    notifyListeners();
  }

  void setDemoMode(bool value) {
    isDemoMode = value;
    notifyListeners();
  }

  void _tick(double dt) {
    if (!isCameraActive) {
      currentFaceCount = 0;
      shynessScore = 0.0;
      stats.facesDetected = 0;
      _updateState();
      notifyListeners();
      return;
    }

    currentFaceCount = FaceDetectorService.detectFaces();
    stats.facesDetected = currentFaceCount;

    if (currentFaceCount == 0) {
      _stareDuration = 0.0;
      double decay = isDemoMode ? 25.0 : 12.0;
      shynessScore = (shynessScore - decay * dt).clamp(0.0, 100.0);
    } else {
      _stareDuration += dt;
      if (_stareDuration > stats.longestStareSec) {
        stats.longestStareSec = _stareDuration;
      }

      double durationBonus = 1.0 + (_stareDuration / 4.0);
      double multiFaceMult = 1.0 + (currentFaceCount - 1) * 1.5;
      double demoMult = isDemoMode ? 3.5 : 1.0;

      double growth = 7.0 * durationBonus * multiFaceMult * demoMult;
      shynessScore = (shynessScore + growth * dt).clamp(0.0, 100.0);
    }

    stats.currentShyness = shynessScore;
    _updateState();
    notifyListeners();
  }

  void _updateState() {
    ShyState newState;
    if (shynessScore <= 20) {
      newState = ShyState.calm;
    } else if (shynessScore <= 40) {
      newState = ShyState.nervous;
    } else if (shynessScore <= 60) {
      newState = ShyState.shy;
    } else if (shynessScore <= 85) {
      newState = ShyState.panic;
    } else {
      newState = ShyState.extremePanic;
    }

    if (newState == ShyState.extremePanic && state != ShyState.extremePanic) {
      stats.panicCount++;
      _peekTimer = 0.0;
      isPeeking = false;
    }

    if (newState == ShyState.extremePanic) {
      _peekTimer += 0.1;
      if (_peekTimer >= 4.0 && !isPeeking) {
        isPeeking = true;
        _updateMessageAndSpeak("Are they gone?");
      } else if (isPeeking && currentFaceCount > 0) {
        isPeeking = false;
        _peekTimer = 0.0;
        _updateMessageAndSpeak("NOPE!");
      }
    } else {
      isPeeking = false;
    }

    if (newState != state) {
      state = newState;
      if (!isPeeking) {
        _updateMessageAndSpeak(FunnyMessages.getMessage(state, currentFaceCount));
      }
    }
  }

  void _updateMessageAndSpeak(String msg) {
    if (currentMessage != msg) {
      currentMessage = msg;
      if (!isMuted) {
        String cleanSpeechText = msg.replaceAll(RegExp(r'[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]', unicode: true), '').trim();
        FaceDetectorService.speak(cleanSpeechText);
      }
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}