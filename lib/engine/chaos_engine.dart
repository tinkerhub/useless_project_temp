import 'package:flutter/services.dart';
import 'package:image/image.dart' as img;

class ChaosEngine {
  static Future<Uint8List> ruinPhoto(String assetPath) async {
    final ByteData data = await rootBundle.load(assetPath);
    final Uint8List bytes = data.buffer.asUint8List();
    
    img.Image? original = img.decodeImage(bytes);
    if (original == null) return bytes;

    // 1. Extreme Saturation & Contrast Skewing (Radioactive green/yellow tint)
    img.Image ruined = img.adjustColor(
      original,
      saturation: 2.8,
      contrast: 1.9,
      brightness: 0.7,
    );

    // 2. Strategic Thumb Smudge (Draw dark/opaque oval blob on bottom-right corner)
    img.fillCircle(
      ruined,
      x: (ruined.width * 0.85).toInt(),
      y: (ruined.height * 0.90).toInt(),
      radius: (ruined.width * 0.18).toInt(),
      color: img.ColorRgb8(30, 25, 20),
    );

    // 3. Decapitation Cropper (Crops top 25% of subject out)
    ruined = img.copyCrop(
      ruined,
      x: 0,
      y: (ruined.height * 0.22).toInt(),
      width: ruined.width,
      height: (ruined.height * 0.78).toInt(),
    );

    // 4. Heavy Gaussian Blur
    ruined = img.gaussianBlur(ruined, radius: 10);

    return Uint8List.fromList(img.encodeJpg(ruined, quality: 55));
  }
}