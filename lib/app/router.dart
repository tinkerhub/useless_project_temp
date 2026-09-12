import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/character/presentation/pages/character_creator_page.dart';
import '../features/landing/presentation/pages/landing_page.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (context, state) => const LandingPage()),
    GoRoute(
      path: '/character',
      builder: (context, state) => const CharacterCreatorPage(),
    ),
    GoRoute(
      path: '/worlds',
      builder: (context, state) => const Scaffold(
        body: Center(child: Text('WORLD SELECTION — coming next')),
      ),
    ),
  ],
);
