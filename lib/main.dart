import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/welcome_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ShyCamApp());
}

class ShyCamApp extends StatelessWidget {
  const ShyCamApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SHYCAM',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6366F1)),
        textTheme: GoogleFonts.fredokaTextTheme(),
      ),
      home: const WelcomeScreen(),
    );
  }
}
