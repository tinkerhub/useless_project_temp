package com.auradetector.ui.theme

import androidx.compose.ui.graphics.Color

val DarkNavy = Color(0xFF0A0E1A)
val DarkSurface = Color(0xFF131829)
val NeonGreen = Color(0xFF00FF88)
val CyanAccent = Color(0xFF00E5FF)
val OrangeWarning = Color(0xFFFF6B35)
val AuraPurple = Color(0xFFBA68C8)
val AuraMagenta = Color(0xFFFF4081)
val AuraGold = Color(0xFFFFD54F)
val ErrorRed = Color(0xFFFF5252)
val TextPrimary = Color(0xFFE0E0E0)
val TextSecondary = Color(0xFF9E9E9E)
val AuraWhiteHot = Color(0xFFFFF8E1)

/** Map a server-assigned palette string to its Compose [Color]. */
fun paletteColor(palette: String?): Color = when (palette?.lowercase()) {
    "cyan"    -> CyanAccent
    "magenta" -> AuraMagenta
    "gold"    -> AuraGold
    "green"   -> NeonGreen
    "purple"  -> AuraPurple
    "orange"  -> OrangeWarning
    else      -> CyanAccent
}

/** Pick an effect colour from a scan result classification. */
fun resultColor(classification: String?): Color = when (classification) {
    "AURA OVERFLOW"              -> AuraWhiteHot
    "NEGATIVE AURA SINGULARITY"  -> AuraPurple
    "MILESTONE SIGNAL"           -> AuraGold
    "EXTREME FIELD"              -> ErrorRed
    "RADIANT"                    -> NeonGreen
    "VOID-ADJACENT"              -> AuraPurple
    else                         -> NeonGreen
}
