import 'package:flutter/material.dart';
import 'package:flutter_useless_project_sample/Bottom_nav_bar/bottom_nav_bar.dart';
import 'package:provider/provider.dart';

import 'api.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => ChatProvider(
        ChatApiService(
          baseUrl: 'https://5a01-34-82-186-76.ngrok-free.app',
        ),
      ),
      child: MaterialApp(
        title: 'Professional Chat UI',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blueGrey),
          useMaterial3: true,
        ),
        home: const BottomNavMainScreen(),
      ),
    );
  }
}
