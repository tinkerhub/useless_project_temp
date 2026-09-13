class ShyStats {
  int facesDetected;
  double longestStareSec;
  int panicCount;
  double currentShyness;

  ShyStats({
    this.facesDetected = 0,
    this.longestStareSec = 0.0,
    this.panicCount = 0,
    this.currentShyness = 0.0,
  });

  int get cameraConfidence => (100 - currentShyness).clamp(0, 100).toInt();

  void reset() {
    facesDetected = 0;
    longestStareSec = 0.0;
    panicCount = 0;
    currentShyness = 0.0;
  }
}