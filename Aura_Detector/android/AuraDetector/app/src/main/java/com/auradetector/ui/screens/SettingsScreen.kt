package com.auradetector.ui.screens

import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CutCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.auradetector.data.ServerConfig
import com.auradetector.data.ServerConfigRepository
import com.auradetector.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

enum class ConnectionStatus {
    IDLE, TESTING, OK, FAILED
}

private const val SETTINGS_LOG_TAG = "AuraSettings"

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onConnect: (ServerConfig) -> Unit
) {
    val context = LocalContext.current
    val repository = remember { ServerConfigRepository(context) }
    val initialConfig by repository.serverConfigFlow.collectAsState(initial = ServerConfig())
    
    var host by remember(initialConfig) { mutableStateOf(initialConfig.host) }
    var portString by remember(initialConfig) { mutableStateOf(initialConfig.port.toString()) }
    var token by remember(initialConfig) { mutableStateOf(initialConfig.token) }
    var status by remember { mutableStateOf(ConnectionStatus.IDLE) }
    var errorMessage by remember { mutableStateOf("") }
    val coroutineScope = rememberCoroutineScope()
    
    val client = remember {
        OkHttpClient.Builder()
            .connectTimeout(3, TimeUnit.SECONDS)
            .readTimeout(3, TimeUnit.SECONDS)
            .build()
    }

    val currentConfig = ServerConfig(host, portString.toIntOrNull() ?: 8765, token)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkNavy)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "AURA RADIATION MONITOR",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = CyanAccent,
            modifier = Modifier.padding(top = 16.dp, bottom = 32.dp)
        )
        
        OutlinedTextField(
            value = host,
            onValueChange = { host = it },
            label = { Text("SERVER IP ADDRESS") },
            textStyle = MaterialTheme.typography.bodyLarge,
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = NeonGreen,
                unfocusedBorderColor = CyanAccent,
                focusedLabelColor = NeonGreen,
                unfocusedLabelColor = CyanAccent,
                cursorColor = NeonGreen
            )
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = token,
            onValueChange = { token = it },
            label = { Text("SESSION TOKEN") },
            textStyle = MaterialTheme.typography.bodyLarge,
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = NeonGreen,
                unfocusedBorderColor = CyanAccent,
                focusedLabelColor = NeonGreen,
                unfocusedLabelColor = CyanAccent,
                cursorColor = NeonGreen
            )
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        OutlinedTextField(
            value = portString,
            onValueChange = { portString = it },
            label = { Text("PORT") },
            textStyle = MaterialTheme.typography.bodyLarge,
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = NeonGreen,
                unfocusedBorderColor = CyanAccent,
                focusedLabelColor = NeonGreen,
                unfocusedLabelColor = CyanAccent,
                cursorColor = NeonGreen
            )
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Button(
            onClick = {
                status = ConnectionStatus.TESTING
                errorMessage = ""
                coroutineScope.launch {
                    try {
                        require(currentConfig.isValid) { "Enter a server IP, valid port, and session token" }
                        val request = Request.Builder()
                            .url(currentConfig.healthUrl)
                            .build()
                        
                        val responseCode = withContext(Dispatchers.IO) {
                            client.newCall(request).execute().use { response ->
                                response.code
                            }
                        }

                        if (responseCode in 200..299) {
                            try {
                                repository.saveConfig(currentConfig)
                            } catch (saveError: Exception) {
                                Log.w(SETTINGS_LOG_TAG, "Could not save server settings", saveError)
                            }
                            status = ConnectionStatus.OK
                        } else {
                            status = ConnectionStatus.FAILED
                            errorMessage = "HTTP $responseCode"
                        }
                    } catch (e: Exception) {
                        Log.e(SETTINGS_LOG_TAG, "Connection test failed", e)
                        status = ConnectionStatus.FAILED
                        errorMessage = e.message ?: e.javaClass.simpleName
                    }
                }
            },
            shape = CutCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(containerColor = DarkSurface),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, CyanAccent, CutCornerShape(8.dp))
        ) {
            Text("TEST CONNECTION", color = CyanAccent, style = MaterialTheme.typography.labelLarge)
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        val statusColor = when (status) {
            ConnectionStatus.IDLE -> TextSecondary
            ConnectionStatus.TESTING -> OrangeWarning
            ConnectionStatus.OK -> NeonGreen
            ConnectionStatus.FAILED -> ErrorRed
        }
        
        val statusText = when (status) {
            ConnectionStatus.IDLE -> "STATUS: WAITING"
            ConnectionStatus.TESTING -> "STATUS: TESTING..."
            ConnectionStatus.OK -> "LINK: OK"
            ConnectionStatus.FAILED -> "LINK: FAILED — $errorMessage"
        }
        
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF1A1F33))
                .border(1.dp, statusColor)
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = statusText,
                color = statusColor,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
        }
        
        Spacer(modifier = Modifier.weight(1f))
        
        Button(
            onClick = {
                if (status == ConnectionStatus.OK) {
                    onConnect(currentConfig)
                }
            },
            enabled = status == ConnectionStatus.OK,
            shape = CutCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = NeonGreen,
                disabledContainerColor = DarkSurface
            ),
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .border(
                    1.dp, 
                    if (status == ConnectionStatus.OK) NeonGreen else TextSecondary, 
                    CutCornerShape(8.dp)
                )
        ) {
            Text(
                "CONNECT", 
                color = if (status == ConnectionStatus.OK) DarkNavy else TextSecondary,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
