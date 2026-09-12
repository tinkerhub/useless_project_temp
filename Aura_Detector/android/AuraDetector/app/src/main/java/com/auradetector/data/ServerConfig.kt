package com.auradetector.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "server_config")

data class ServerConfig(
    val host: String = "",
    val port: Int = 8765,
    val token: String = ""
) {
    val baseUrl: String get() = "http://$host:$port"
    val wsUrl: String get() = "ws://$host:$port/ws"
    val healthUrl: String get() = "http://$host:$port/health"
    val isValid: Boolean get() = host.isNotBlank() && port in 1..65535 && token.isNotBlank()
}

class ServerConfigRepository(private val context: Context) {
    companion object {
        val HOST_KEY = stringPreferencesKey("server_host")
        val PORT_KEY = intPreferencesKey("server_port")
        val TOKEN_KEY = stringPreferencesKey("server_token")
    }

    val serverConfigFlow: Flow<ServerConfig> = context.dataStore.data
        .map { preferences ->
            val host = preferences[HOST_KEY] ?: ""
            val port = preferences[PORT_KEY] ?: 8765
            val token = preferences[TOKEN_KEY] ?: ""
            ServerConfig(host, port, token)
        }

    suspend fun saveConfig(config: ServerConfig) {
        context.dataStore.edit { preferences ->
            preferences[HOST_KEY] = config.host
            preferences[PORT_KEY] = config.port
            preferences[TOKEN_KEY] = config.token
        }
    }
}
