import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/character_profile.dart';

final characterCreatorProvider =
    NotifierProvider<CharacterCreatorNotifier, CharacterProfile>(
      CharacterCreatorNotifier.new,
    );

class CharacterCreatorNotifier extends Notifier<CharacterProfile> {
  static const skinColors = [
    Color(0xFFF1C7A5),
    Color(0xFFD89B72),
    Color(0xFFAE704B),
    Color(0xFF75452E),
    Color(0xFF40251C),
  ];

  static const hairColors = [
    Color(0xFF16100C),
    Color(0xFF5D3523),
    Color(0xFFD2A34A),
    Color(0xFFB51F32),
    Color(0xFF4C2A78),
  ];

  static const outfitColors = [
    Color(0xFF8B0000),
    Color(0xFF222222),
    Color(0xFF3B2468),
    Color(0xFF123D5A),
    Color(0xFF33502B),
  ];

  @override
  CharacterProfile build() => const CharacterProfile();

  void setPlayerName(String value) {
    state = state.copyWith(playerName: value);
  }

  void setCharacterName(String value) {
    state = state.copyWith(characterName: value);
  }

  void setSkinColor(Color value) {
    state = state.copyWith(skinColor: value);
  }

  void setHairColor(Color value) {
    state = state.copyWith(hairColor: value);
  }

  void setOutfitColor(Color value) {
    state = state.copyWith(outfitColor: value);
  }

  void nextExpression() {
    state = state.copyWith(expression: (state.expression + 1) % 3);
  }

  void randomize() {
    final seed = DateTime.now().millisecondsSinceEpoch;

    state = state.copyWith(
      skinColor: skinColors[seed % skinColors.length],
      hairColor: hairColors[(seed ~/ 3) % hairColors.length],
      outfitColor: outfitColors[(seed ~/ 7) % outfitColors.length],
      expression: seed % 3,
    );
  }
}
