import 'package:flutter/material.dart';

import '../Parties_screen/parties_screen.dart';
import '../Project_screen/project_screen.dart';
import '../Quotation_screen/quotation_screen.dart';
import 'widgets/bottom_nav.dart';

class BottomNavMainScreen extends StatefulWidget {
  const BottomNavMainScreen({super.key});

  @override
  State<BottomNavMainScreen> createState() => _BottomNavMainScreenState();
}

class _BottomNavMainScreenState extends State<BottomNavMainScreen>
    with WidgetsBindingObserver {
  final _pages = [
    const QuotationScreen(),
    ProjectScreen(),
    PartiesScreen(),
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
