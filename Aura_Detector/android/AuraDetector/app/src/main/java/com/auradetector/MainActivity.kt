package com.auradetector

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.auradetector.ui.screens.SettingsScreen
import com.auradetector.ui.screens.ScannerScreen
import com.auradetector.ui.theme.AuraDetectorTheme
import com.auradetector.ui.theme.DarkNavy
import com.auradetector.data.ServerConfig
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AuraDetectorTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = DarkNavy
                ) {
                    val connectedConfig = remember { mutableStateOf<ServerConfig?>(null) }
                    connectedConfig.value?.let { config ->
                        ScannerScreen(config = config, onExit = { connectedConfig.value = null })
                    } ?: SettingsScreen(onConnect = { connectedConfig.value = it })
                }
            }
        }
    }
}
