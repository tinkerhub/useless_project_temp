import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

class LandingPage extends StatelessWidget {
  const LandingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment.topCenter,
            radius: 1.2,
            colors: [Color(0xFF5E090F), Color(0xFF1A0306), Color(0xFF050203)],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              Positioned.fill(
                child: IgnorePointer(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black54,
                          Colors.black87,
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              Center(
                child: SingleChildScrollView(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 20,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        LayoutBuilder(
                          builder: (context, constraints) {
                            final imageSize = constraints.maxWidth < 700
                                ? 90.0
                                : 135.0;

                            return Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                _MemeImage(
                                  imagePath: 'assets/images/aarattannan.png',
                                  size: imageSize,
                                  rotation: -0.08,
                                ),
                                SizedBox(
                                  width: constraints.maxWidth < 700 ? 14 : 30,
                                ),
                                Flexible(
                                  child: FittedBox(
                                    fit: BoxFit.scaleDown,
                                    child: Text(
                                      'KOLA MASS',
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.bebasNeue(
                                        fontSize: 76,
                                        fontWeight: FontWeight.w900,
                                        color: const Color(0xFFE50920),
                                        letterSpacing: 5,
                                        shadows: const [
                                          Shadow(
                                            color: Color(0xFFFF001E),
                                            blurRadius: 24,
                                          ),
                                          Shadow(
                                            color: Colors.black,
                                            blurRadius: 8,
                                            offset: Offset(3, 4),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                                SizedBox(
                                  width: constraints.maxWidth < 700 ? 14 : 30,
                                ),
                                _MemeImage(
                                  imagePath: 'assets/images/ajp.png',
                                  size: imageSize,
                                  rotation: 0.08,
                                ),
                              ],
                            );
                          },
                        ),
                        const SizedBox(height: 18),
                        const Text(
                          'Some feelings need their own universe.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 16,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                        const SizedBox(height: 42),
                        SizedBox(
                          width: 360,
                          height: 60,
                          child: FilledButton(
                            onPressed: () {
                              context.push('/character');
                            },
                            style: FilledButton.styleFrom(
                              backgroundColor: const Color(0xFF9E0718),
                              foregroundColor: Colors.white,
                              elevation: 14,
                              shadowColor: const Color(0xFFFF001E),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                                side: const BorderSide(
                                  color: Color(0xFFE50920),
                                  width: 1.2,
                                ),
                              ),
                            ),
                            child: const Text(
                              'ENTER THE WORLD',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 2,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        const Text(
                          'A fictional cartoon chaos sandbox',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.white38, fontSize: 12),
                        ),
                      ],
                    ),
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

class _MemeImage extends StatefulWidget {
  const _MemeImage({
    required this.imagePath,
    required this.size,
    required this.rotation,
  });

  final String imagePath;
  final double size;
  final double rotation;

  @override
  State<_MemeImage> createState() => _MemeImageState();
}

class _MemeImageState extends State<_MemeImage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 750),
    );

    _scale = CurvedAnimation(parent: _controller, curve: Curves.elasticOut);

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scale,
      child: Transform.rotate(
        angle: widget.rotation,
        child: Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE50920), width: 2),
            boxShadow: const [
              BoxShadow(
                color: Color(0x99FF001E),
                blurRadius: 22,
                spreadRadius: 2,
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.asset(
              widget.imagePath,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return const Icon(
                  Icons.broken_image_outlined,
                  color: Colors.white54,
                  size: 36,
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}
