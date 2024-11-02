import 'package:flutter/material.dart';

import '../chat_screen.dart';
import 'tic_tac_toe/tic_tac_to.dart';
import 'widgets/bottom_nav.dart';

class BottomNavMainScreen extends StatefulWidget {
  const BottomNavMainScreen({super.key});

  @override
  State<BottomNavMainScreen> createState() => _BottomNavMainScreenState();
}

class _BottomNavMainScreenState extends State<BottomNavMainScreen>
    with WidgetsBindingObserver {
  final _pages = [
    const TicTacTo(),
    ChatScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ValueListenableBuilder(
          valueListenable: indexChangeNotifier,
          builder: (BuildContext context, int index, Widget? _) {
            return _pages[index];
          },
        ),
      ),
      bottomNavigationBar: const BottomNavigationWidget(),
    );
  }
}