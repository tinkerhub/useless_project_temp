import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/character_creator_provider.dart';
import '../widgets/full_body_avatar.dart';

class CharacterCreatorPage extends ConsumerWidget {
  const CharacterCreatorPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(characterCreatorProvider);
    final controller = ref.read(characterCreatorProvider.notifier);
    final keyboardVisible = MediaQuery.viewInsetsOf(context).bottom > 0;

    return GestureDetector(
      onTap: () {
        FocusManager.instance.primaryFocus?.unfocus();
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF050203),
        appBar: AppBar(
          toolbarHeight: 52,
          backgroundColor: Colors.transparent,
          title: const Text(
            'CREATE YOUR CHARACTER',
            style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 2),
          ),
        ),
        body: SafeArea(
          child: Row(
            children: [
              Expanded(
                flex: keyboardVisible ? 1 : 3,
                child: SingleChildScrollView(
                  keyboardDismissBehavior:
                      ScrollViewKeyboardDismissBehavior.onDrag,
                  padding: EdgeInsets.fromLTRB(
                    24,
                    keyboardVisible ? 4 : 12,
                    keyboardVisible ? 24 : 16,
                    20,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextField(
                        onChanged: controller.setPlayerName,
                        textInputAction: TextInputAction.next,
                        decoration: const InputDecoration(
                          labelText: 'Player name',
                          prefixIcon: Icon(Icons.person_outline),
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 14),
                      TextField(
                        onChanged: controller.setCharacterName,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) {
                          FocusManager.instance.primaryFocus?.unfocus();
                        },
                        decoration: const InputDecoration(
                          labelText: 'Character name',
                          prefixIcon: Icon(Icons.badge_outlined),
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 18),
                      _ColorSelector(
                        title: 'SKIN',
                        colors: CharacterCreatorNotifier.skinColors,
                        selected: profile.skinColor,
                        onSelected: controller.setSkinColor,
                      ),
                      _ColorSelector(
                        title: 'HAIR',
                        colors: CharacterCreatorNotifier.hairColors,
                        selected: profile.hairColor,
                        onSelected: controller.setHairColor,
                      ),
                      _ColorSelector(
                        title: 'OUTFIT',
                        colors: CharacterCreatorNotifier.outfitColors,
                        selected: profile.outfitColor,
                        onSelected: controller.setOutfitColor,
                      ),
                    ],
                  ),
                ),
              ),

              if (!keyboardVisible)
                Expanded(
                  flex: 2,
                  child: Container(
                    margin: const EdgeInsets.fromLTRB(8, 6, 20, 12),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF170609),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: const Color(0xFF8B0000),
                        width: 1.5,
                      ),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x558B0000),
                          blurRadius: 18,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Text(
                          profile.characterName.trim().isEmpty
                              ? 'UNNAMED CHAOS'
                              : profile.characterName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Expanded(
                          child: FittedBox(
                            fit: BoxFit.contain,
                            child: FullBodyAvatar(profile: profile),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Wrap(
                          alignment: WrapAlignment.center,
                          runAlignment: WrapAlignment.center,
                          spacing: 8,
                          runSpacing: 4,
                          children: [
                            OutlinedButton.icon(
                              onPressed: controller.nextExpression,
                              icon: const Icon(Icons.mood, size: 17),
                              label: const Text('EXPRESSION'),
                              style: OutlinedButton.styleFrom(
                                visualDensity: VisualDensity.compact,
                              ),
                            ),
                            OutlinedButton.icon(
                              onPressed: controller.randomize,
                              icon: const Icon(Icons.casino_outlined, size: 17),
                              label: const Text('RANDOMIZE'),
                              style: OutlinedButton.styleFrom(
                                visualDensity: VisualDensity.compact,
                              ),
                            ),
                            FilledButton.icon(
                              onPressed: () => context.push('/worlds'),
                              icon: const Icon(Icons.arrow_forward, size: 17),
                              label: const Text('CONTINUE'),
                              style: FilledButton.styleFrom(
                                backgroundColor: const Color(0xFF9E0718),
                                visualDensity: VisualDensity.compact,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ColorSelector extends StatelessWidget {
  const _ColorSelector({
    required this.title,
    required this.colors,
    required this.selected,
    required this.onSelected,
  });

  final String title;
  final List<Color> colors;
  final Color selected;
  final ValueChanged<Color> onSelected;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        children: [
          SizedBox(
            width: 76,
            child: Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                letterSpacing: 1,
              ),
            ),
          ),
          Expanded(
            child: Wrap(
              spacing: 10,
              runSpacing: 8,
              children: colors.map((color) {
                final isSelected = color == selected;

                return GestureDetector(
                  onTap: () => onSelected(color),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isSelected
                            ? Colors.white
                            : Colors.black.withValues(alpha: 0.7),
                        width: isSelected ? 3 : 1,
                      ),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: color.withValues(alpha: 0.7),
                                blurRadius: 7.0,
                                spreadRadius: 2,
                              ),
                            ]
                          : null,
                    ),
                    child: isSelected
                        ? const Icon(Icons.check, size: 18, color: Colors.white)
                        : null,
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}
