import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ProViewfinderOverlay extends StatefulWidget {
  const ProViewfinderOverlay({super.key});

  @override
  State<ProViewfinderOverlay> createState() => _ProViewfinderOverlayState();
}

class _ProViewfinderOverlayState extends State<ProViewfinderOverlay> {
  Offset _focusPoint = const Offset(0.5, 0.5);
  bool _isFocusing = false;

  void _handleTapToFocus(TapDownDetails details, BoxConstraints constraints) {
    // Anti-Autofocus logic: tap near center -> shifts focus target to far corner
    final tapX = details.localPosition.dx / constraints.maxWidth;
    final tapY = details.localPosition.dy / constraints.maxHeight;

    setState(() {
      _isFocusing = true;
      // Invert tap target to sabotage focal point
      _focusPoint = Offset(1.0 - tapX, 1.0 - tapY);
    });

    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) setState(() => _isFocusing = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return GestureDetector(
          onTapDown: (details) => _handleTapToFocus(details, constraints),
          child: Stack(
            children: [
              // 1. Rule of Thirds Grid Lines (Fixed BoxDecoration)
              Column(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: Colors.white.withValues(alpha: 0.2),
                            width: 0.5,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: Colors.white.withValues(alpha: 0.2),
                            width: 0.5,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const Expanded(child: SizedBox()),
                ],
              ),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        border: Border(
                          right: BorderSide(
                            color: Colors.white.withValues(alpha: 0.2),
                            width: 0.5,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        border: Border(
                          right: BorderSide(
                            color: Colors.white.withValues(alpha: 0.2),
                            width: 0.5,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const Expanded(child: SizedBox()),
                ],
              ),

              // 2. Anti-Autofocus Reticle
              AnimatedPositioned(
                duration: const Duration(milliseconds: 300),
                left: _focusPoint.dx * (constraints.maxWidth - 60),
                top: _focusPoint.dy * (constraints.maxHeight - 60),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: _isFocusing ? 75 : 60,
                  height: _isFocusing ? 75 : 60,
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: _isFocusing ? Colors.redAccent : Colors.yellow,
                      width: 1.5,
                    ),
                  ),
                  child: Center(
                    child: Container(
                      width: 4,
                      height: 4,
                      color: _isFocusing ? Colors.redAccent : Colors.yellow,
                    ),
                  ),
                ),
              ),

              // 3. Pro Mode Metadata Display
              Positioned(
                top: 16,
                left: 16,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "ISO 12800 (NOISY)",
                      style: GoogleFonts.shareTechMono(
                        color: Colors.yellow,
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      "RAW 14-BIT • f/1.4",
                      style: GoogleFonts.shareTechMono(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      "ANTI-STABILIZATION: ACTIVE",
                      style: GoogleFonts.shareTechMono(
                        color: Colors.redAccent,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
