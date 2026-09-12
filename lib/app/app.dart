import 'package:flutter/material.dart';

import 'router.dart';
import 'theme/app_theme.dart';

class CruelWorldApp extends StatelessWidget {
  const CruelWorldApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'KOLA MASS',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      routerConfig: appRouter,
    );
  }
}
