package com.auradetector.transport

import android.os.SystemClock
import android.util.Base64
import com.auradetector.data.ServerConfig
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject
import java.io.Closeable
import java.util.UUID
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.atomic.AtomicReference

enum class VisionLinkState { CONNECTING, READY, DEGRADED, OFFLINE }

data class TransportStatus(
    val state: VisionLinkState = VisionLinkState.CONNECTING,
    val detail: String = "Connecting…",
    val lastFrameId: Long? = null,
    val latencyMs: Long? = null
)

data class VisionPoint(val x: Float, val y: Float)

data class VisionProfile(
    val band: String,
    val min: String,
    val max: String,
    val palette: String
)

data class VisionSubject(
    val id: Long,
    val confidence: Float,
    val x: Float,
    val y: Float,
    val width: Float,
    val height: Float,
    val contour: List<VisionPoint>,
    val profile: VisionProfile?
)

data class VisionFrameState(
    val frameId: Long,
    val sourceWidth: Int,
    val sourceHeight: Int,
    val sourceToPreview: FloatArray,
    val subjects: List<VisionSubject>
)

private data class SentFrame(
    val id: Long,
    val sourceWidth: Int,
    val sourceHeight: Int,
    val sourceToPreview: FloatArray
)

/**
 * A single-in-flight frame sender. CameraX retains the newest camera frame while
 * this transport waits for an acknowledgement, avoiding a latency-growing queue.
 */
class AuraWebSocket(private val config: ServerConfig) : Closeable {
    private companion object {
        const val MIN_FRAME_INTERVAL_MS = 67L // 15 FPS maximum for the LAN prototype.
    }
    private val client = OkHttpClient.Builder()
        .connectTimeout(3, TimeUnit.SECONDS)
        .readTimeout(5, TimeUnit.SECONDS)
        .build()
    private val frameId = AtomicLong(0)
    private val lastAcceptedFrameId = AtomicLong(-1)
    private val awaitingFrameState = AtomicBoolean(false)
    private val helloAcknowledged = AtomicBoolean(false)
    private val frameSentAtMs = AtomicLong(0)
    private val lastFrameSentAtMs = AtomicLong(0)
    private val inFlightFrame = AtomicReference<SentFrame?>(null)
    private var webSocket: WebSocket? = null

    private val _status = MutableStateFlow(TransportStatus())
    val status = _status.asStateFlow()
    private val _frameState = MutableStateFlow<VisionFrameState?>(null)
    val frameState = _frameState.asStateFlow()

    fun connect() {
        _status.value = TransportStatus(VisionLinkState.CONNECTING, "Connecting…")
        webSocket = client.newWebSocket(
            Request.Builder().url(config.wsUrl).build(),
            object : WebSocketListener() {
                override fun onOpen(webSocket: WebSocket, response: Response) {
                    val hello = JSONObject()
                        .put("type", "hello")
                        .put("version", 1)
                        .put("token", config.token)
                        .put("clientId", UUID.randomUUID().toString())
                    webSocket.send(hello.toString())
                }

                override fun onMessage(webSocket: WebSocket, text: String) {
                    handleMessage(text)
                }

                override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                    _frameState.value = null
                    _status.value = TransportStatus(VisionLinkState.OFFLINE, "Socket closing: $reason")
                }

                override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                    _frameState.value = null
                    _status.value = TransportStatus(VisionLinkState.OFFLINE, "Socket closed: $reason")
                }

                override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                    awaitingFrameState.set(false)
                    _frameState.value = null
                    _status.value = TransportStatus(VisionLinkState.OFFLINE, t.message ?: "Connection failed")
                }
            }
        )
    }

    fun sendFrame(
        jpeg: ByteArray,
        width: Int,
        height: Int,
        sourceWidth: Int,
        sourceHeight: Int,
        sourceToPreview: FloatArray
    ): Boolean {
        val now = SystemClock.elapsedRealtime()
        val currentLatency = _status.value.latencyMs ?: 0L
        val dynamicIntervalMs = when {
            currentLatency > 200L -> 150L // ~6.6 FPS if server is heavily loaded
            currentLatency > 100L -> 120L // ~8.3 FPS if server is under load
            else -> 90L                    // ~11 FPS optimal smooth target
        }
        if (!helloAcknowledged.get() || now - lastFrameSentAtMs.get() < dynamicIntervalMs) return false
        if (!awaitingFrameState.compareAndSet(false, true)) return false

        val id = frameId.incrementAndGet()
        frameSentAtMs.set(now)
        lastFrameSentAtMs.set(now)
        val message = JSONObject()
            .put("type", "frame")
            .put("version", 1)
            .put("frameId", id)
            .put("capturedAtMs", System.currentTimeMillis())
            .put("width", width)
            .put("height", height)
            .put("jpeg", Base64.encodeToString(jpeg, Base64.NO_WRAP))

        val socket = webSocket
        inFlightFrame.set(
            SentFrame(id, sourceWidth, sourceHeight, sourceToPreview.copyOf())
        )
        if (socket == null || !socket.send(message.toString())) {
            inFlightFrame.set(null)
            awaitingFrameState.set(false)
            _status.value = TransportStatus(VisionLinkState.OFFLINE, "Frame send failed")
            return false
        }
        return true
    }

    private fun handleMessage(text: String) {
        val message = runCatching { JSONObject(text) }.getOrElse {
            _status.value = TransportStatus(VisionLinkState.DEGRADED, "Invalid server response")
            return
        }
        when (message.optString("type")) {
            "hello_ack" -> {
                helloAcknowledged.set(true)
                _status.value = TransportStatus(VisionLinkState.READY, "LINK: OK")
            }
            "frame_state" -> {
                val id = message.optLong("frameId", -1)
                if (id > lastAcceptedFrameId.get()) {
                    lastAcceptedFrameId.set(id)
                    awaitingFrameState.set(false)
                    val sentFrame = inFlightFrame.getAndSet(null)
                    if (sentFrame?.id == id) {
                        _frameState.value = VisionFrameState(
                            frameId = id,
                            sourceWidth = sentFrame.sourceWidth,
                            sourceHeight = sentFrame.sourceHeight,
                            sourceToPreview = sentFrame.sourceToPreview,
                            subjects = parseSubjects(message.optJSONArray("subjects"))
                        )
                    }
                    _status.value = TransportStatus(
                        state = VisionLinkState.READY,
                        detail = "LINK: OK",
                        lastFrameId = id,
                        latencyMs = SystemClock.elapsedRealtime() - frameSentAtMs.get()
                    )
                }
            }
            "error" -> {
                awaitingFrameState.set(false)
                inFlightFrame.set(null)
                _frameState.value = null
                val recoverable = message.optBoolean("recoverable", false)
                _status.value = TransportStatus(
                    if (recoverable) VisionLinkState.DEGRADED else VisionLinkState.OFFLINE,
                    message.optString("message", "Server error")
                )
            }
            else -> _status.value = TransportStatus(VisionLinkState.DEGRADED, "Unknown server message")
        }
    }

    override fun close() {
        helloAcknowledged.set(false)
        awaitingFrameState.set(false)
        inFlightFrame.set(null)
        _frameState.value = null
        _status.value = TransportStatus(VisionLinkState.OFFLINE, "Closed")
        try { webSocket?.close(1000, "Scanner closed") } catch (_: Exception) {}
        webSocket = null
        try { client.dispatcher.executorService.shutdown() } catch (_: Exception) {}
        try { client.connectionPool.evictAll() } catch (_: Exception) {}
    }

    private fun parseSubjects(subjects: org.json.JSONArray?): List<VisionSubject> {
        if (subjects == null) return emptyList()
        return buildList {
            for (index in 0 until minOf(subjects.length(), 6)) {
                val subject = subjects.optJSONObject(index) ?: continue
                val box = subject.optJSONArray("box") ?: continue
                if (!subject.has("id") || box.length() < 4) continue

                val values = FloatArray(4) { position -> box.optDouble(position, Double.NaN).toFloat() }
                if (values.any { !it.isFinite() || it < 0f || it > 1f }) continue
                val contour = subject.optJSONArray("contour")?.let(::parseContour).orEmpty()
                add(
                    VisionSubject(
                        id = subject.optLong("id"),
                        confidence = subject.optDouble("confidence", 0.0).toFloat(),
                        x = values[0],
                        y = values[1],
                        width = values[2],
                        height = values[3],
                        contour = contour,
                        profile = parseProfile(subject.optJSONObject("profile"))
                    )
                )
            }
        }
    }

    private fun parseContour(points: org.json.JSONArray): List<VisionPoint> = buildList {
        for (index in 0 until minOf(points.length(), 96)) {
            val point = points.optJSONArray(index) ?: continue
            if (point.length() < 2) continue
            val x = point.optDouble(0, Double.NaN).toFloat()
            val y = point.optDouble(1, Double.NaN).toFloat()
            if (x.isFinite() && y.isFinite() && x in 0f..1f && y in 0f..1f) {
                add(VisionPoint(x, y))
            }
        }
    }

    private fun parseProfile(profile: JSONObject?): VisionProfile? {
        if (profile == null) return null
        val band = profile.optString("band").takeIf(String::isNotBlank) ?: return null
        val minimum = profile.optString("min").takeIf(String::isNotBlank) ?: return null
        val maximum = profile.optString("max").takeIf(String::isNotBlank) ?: return null
        val palette = profile.optString("palette").takeIf(String::isNotBlank) ?: return null
        return VisionProfile(band, minimum, maximum, palette)
    }
}
