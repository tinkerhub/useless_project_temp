import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';

class CharacterProfile extends Equatable {
  const CharacterProfile({
    this.playerName = '',
    this.characterName = '',
    this.skinColor = const Color(0xFFD89B72),
    this.hairColor = const Color(0xFF24160F),
    this.outfitColor = const Color(0xFF8B0000),
    this.expression = 0,
  });

  final String playerName;
  final String characterName;
  final Color skinColor;
  final Color hairColor;
  final Color outfitColor;
  final int expression;

  CharacterProfile copyWith({
    String? playerName,
    String? characterName,
    Color? skinColor,
    Color? hairColor,
    Color? outfitColor,
    int? expression,
  }) {
    return CharacterProfile(
      playerName: playerName ?? this.playerName,
      characterName: characterName ?? this.characterName,
      skinColor: skinColor ?? this.skinColor,
      hairColor: hairColor ?? this.hairColor,
      outfitColor: outfitColor ?? this.outfitColor,
      expression: expression ?? this.expression,
    );
  }

  @override
  List<Object?> get props => [
    playerName,
    characterName,
    skinColor,
    hairColor,
    outfitColor,
    expression,
  ];
}
