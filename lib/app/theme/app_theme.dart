import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static final dark = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: const Color(0xFF050203),
    colorScheme: ColorScheme.fromSeed(
      seedColor: const Color(0xFF8B0000),
      brightness: Brightness.dark,
    ),
    textTheme: GoogleFonts.notoSansMalayalamTextTheme(
      ThemeData.dark().textTheme,
    ),
    useMaterial3: true,
  );
}
