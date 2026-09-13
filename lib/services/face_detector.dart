import 'dart:js_interop';

@JS('detectFacesJS')
external int _detectFacesJS();

@JS('manualFaceCount')
external set _setManualFaceCount(int value);

@JS('speakTextJS')
external void _speakTextJS(JSString text);

@JS('unlockAudioJS')
external void _unlockAudioJS();

class FaceDetectorService {
  static int detectFaces() {
    try {
      return _detectFacesJS();
    } catch (_) {
      return 0;
    }
  }

  static void setManualOverride(int count) {
    try {
      _setManualFaceCount = count;
    } catch (_) {}
  }

  static void unlockAudio() {
    try {
      _unlockAudioJS();
    } catch (_) {}
  }

  static void speak(String text) {
    try {
      _speakTextJS(text.toJS);
    } catch (_) {}
  }
}