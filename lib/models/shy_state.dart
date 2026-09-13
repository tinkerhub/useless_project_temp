import 'package:flutter/material.dart';

enum ShyState {
  calm,
  nervous,
  shy,
  panic,
  extremePanic,
}

extension ShyStateX on ShyState {
  String get emoji {
    switch (this) {
      case ShyState.calm:
        return '😎';
      case ShyState.nervous:
        return '😳';
      case ShyState.shy:
        return '🫣';
      case ShyState.panic:
        return '😰';
      case ShyState.extremePanic:
        return '😭';
    }
  }

  String get title {
    switch (this) {
      case ShyState.calm:
        return 'CALM';
      case ShyState.nervous:
        return 'NERVOUS';
      case ShyState.shy:
        return 'SHY';
      case ShyState.panic:
        return 'PANIC';
      case ShyState.extremePanic:
        return 'EXTREME PANIC';
    }
  }

  Color get color {
    switch (this) {
      case ShyState.calm:
        return const Color(0xFF4ADE80);
      case ShyState.nervous:
        return const Color(0xFFFACC15);
      case ShyState.shy:
        return const Color(0xFFF472B6);
      case ShyState.panic:
        return const Color(0xFFFB7185);
      case ShyState.extremePanic:
        return const Color(0xFFF43F5E);
    }
  }
}