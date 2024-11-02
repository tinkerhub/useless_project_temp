import 'package:flutter/material.dart';

ValueNotifier<int> indexChangeNotifier = ValueNotifier(0);

class BottomNavigationWidget extends StatelessWidget {
  const BottomNavigationWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: indexChangeNotifier,
      builder: (BuildContext context, int newIndex, Widget? _) {
        return ClipRRect(
          borderRadius: const BorderRadius.only(
            topRight: Radius.circular(24),
            topLeft: Radius.circular(24),
          ),
          child: BottomNavigationBar(
            selectedItemColor: Colors.g,
            unselectedItemColor: Colors.grey[400],
            showUnselectedLabels: true,
            currentIndex: newIndex,
            onTap: (index) {
              indexChangeNotifier.value = index;
            },
            elevation: 5,
            unselectedFontSize: 10,
            type: BottomNavigationBarType.fixed,
            // selectedLabelStyle: GoogleFonts.lato(
            //   fontSize: 12,
            //   fontWeight: FontWeight.w500,
            // ),
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.insert_drive_file_outlined),
                label: 'Qoutation',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.home_filled),
                label: 'Projects',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.person_3_sharp),
                label: 'Parties',
              ),
            ],
          ),
        );
      },
    );
  }
}
