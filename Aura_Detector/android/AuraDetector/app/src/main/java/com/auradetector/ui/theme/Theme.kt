package com.auradetector.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = NeonGreen,
    secondary = CyanAccent,
    tertiary = OrangeWarning,
    background = DarkNavy,
    surface = DarkSurface,
    error = ErrorRed,
    onPrimary = DarkNavy,
    onSecondary = DarkNavy,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    onError = DarkNavy
)

@Composable
fun AuraDetectorTheme(content: @Composable () -> Unit) {
    val colorScheme = DarkColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = InstrumentTypography,
        content = content
    )
}
