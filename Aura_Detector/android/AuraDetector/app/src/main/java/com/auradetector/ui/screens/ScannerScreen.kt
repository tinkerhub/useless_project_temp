package com.auradetector.ui.screens

import android.Manifest
import android.animation.ValueAnimator
import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.media.MediaPlayer
import android.media.ToneGenerator
import com.auradetector.R
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Typeface
import android.content.pm.PackageManager
import android.graphics.ImageFormat
import android.graphics.Rect
import android.graphics.YuvImage
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.core.UseCaseGroup
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.camera.view.transform.CoordinateTransform
import androidx.camera.view.transform.ImageProxyTransformFactory
import androidx.camera.view.transform.OutputTransform
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.graphics.lerp
import kotlin.math.sin
import kotlin.math.cos
import kotlin.math.PI
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.CutCornerShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke as CanvasStroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect as ComposeRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.zIndex
import androidx.core.content.ContextCompat
import androidx.lifecycle.Observer
import com.auradetector.data.ServerConfig
import com.auradetector.transport.AuraWebSocket
import com.auradetector.transport.TransportStatus
import com.auradetector.transport.VisionFrameState
import com.auradetector.transport.VisionPoint
import com.auradetector.transport.VisionProfile
import com.auradetector.transport.VisionLinkState
import com.auradetector.ui.theme.AuraWhiteHot
import com.auradetector.ui.theme.CyanAccent
import com.auradetector.ui.theme.DarkNavy
import com.auradetector.ui.theme.ErrorRed
import com.auradetector.ui.theme.NeonGreen
import com.auradetector.ui.theme.OrangeWarning
import com.auradetector.ui.theme.paletteColor
import com.auradetector.ui.theme.resultColor
import java.io.ByteArrayOutputStream
import java.util.Locale
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicReference
import kotlin.coroutines.cancellation.CancellationException
import kotlin.math.exp
import kotlin.math.ln
import kotlin.random.Random
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive

@Composable
fun ScannerScreen(config: ServerConfig, onExit: () -> Unit) {
    val context = LocalContext.current
    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        )
    }
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted -> hasCameraPermission = granted }

    LaunchedEffect(Unit) {
        if (!hasCameraPermission) permissionLauncher.launch(Manifest.permission.CAMERA)
    }

    if (!hasCameraPermission) {
        PermissionRequired(onRequestPermission = { permissionLauncher.launch(Manifest.permission.CAMERA) })
        return
    }

    val transport = remember { AuraWebSocket(config) }
    val status by transport.status.collectAsState()
    val frameState by transport.frameState.collectAsState()
    var selectedSubjectId by remember { mutableStateOf<Long?>(null) }
    var liveReading by remember { mutableStateOf<String?>(null) }
    val latestFrameState = rememberUpdatedState(frameState)
    val auraGenerators = remember { mutableMapOf<Long, AuraValueGenerator>() }
    var scanningSubjectId by remember { mutableStateOf<Long?>(null) }
    var scanProgress by remember { mutableStateOf(0f) }
    var scanResult by remember { mutableStateOf<AuraScanResult?>(null) }
    val scanGenerators = remember { mutableMapOf<Long, AuraScanGenerator>() }
    var soundEnabled by remember { mutableStateOf(true) }
    val latestSoundEnabled = rememberUpdatedState(soundEnabled)
    val feedback = remember(context) { ScanFeedback(context) }

    val particleSystem = remember { ParticleSystem() }
    var particleTick by remember { mutableIntStateOf(0) }
    val scanPulseProgress = remember { Animatable(0f) }
    val transition = rememberInfiniteTransition(label = "breathe")
    val breatheAlpha by transition.animateFloat(
        initialValue = 0.6f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1250, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "breatheAlpha"
    )
    val wavePhase by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1600, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "wavePhase"
    )
    val scanPulseColor = scanResult?.let { if (it.isPositive) NeonGreen else ErrorRed } ?: NeonGreen

    DisposableEffect(feedback) {
        onDispose { feedback.release() }
    }

    LaunchedEffect(Unit) {
        while (isActive) {
            particleSystem.update(0.05f)
            particleTick++
            delay(50)
        }
    }

    LaunchedEffect(frameState, soundEnabled) {
        if (!soundEnabled) return@LaunchedEffect
        while (isActive) {
            val subjects = frameState?.subjects.orEmpty()
            if (subjects.isEmpty()) {
                delay(350)
                continue
            }

            var totalIntensity = 0L
            var maxProximityArea = 0.05f

            for (subj in subjects) {
                val area = subj.width * subj.height
                if (area > maxProximityArea) maxProximityArea = area
                val profile = subj.profile ?: continue
                val generator = auraGenerators.getOrPut(subj.id) { AuraValueGenerator(subj.id) }
                val reading = generator.next(profile)
                val rawStr = reading.replace(" AUR/s", "").replace("+", "").replace("−", "").trim()
                val valNum = if (rawStr.contains("∞")) 100_000L else rawStr.toLongOrNull() ?: 500L
                totalIntensity += valNum
            }

            val proximityMultiplier = (maxProximityArea * 2.2f).coerceIn(0.05f, 1.5f)
            val effectiveField = (totalIntensity * 0.15f * proximityMultiplier).toLong()

            val checkInterference = if (subjects.size == 2) {
                val s1 = subjects[0]
                val s2 = subjects[1]
                val dist = kotlin.math.hypot(
                    (s1.x + s1.width / 2f) - (s2.x + s2.width / 2f),
                    (s1.y + s1.height / 2f) - (s2.y + s2.height / 2f)
                )
                var totalVal = 0L
                for (s in subjects) {
                    val prof = s.profile
                    if (prof != null) {
                        if (prof.max == "∞") totalVal += 500_000L
                        else totalVal += (prof.max.toLongOrNull() ?: 5000L)
                    }
                }
                dist < 0.28f && (totalVal >= 150_000L || totalIntensity >= 120_000L)
            } else false

            if (checkInterference) {
                feedback.playEmergencyInterferenceSound(soundEnabled)
                delay(130)
            } else {
                val delayMs = when {
                    effectiveField <= 300L -> 850L
                    effectiveField <= 3000L -> 450L
                    effectiveField <= 15000L -> 220L
                    effectiveField <= 35000L -> 100L
                    else -> 40L
                }
                feedback.geigerTick(soundEnabled)
                delay(delayMs)
            }
        }
    }

    LaunchedEffect(frameState) {
        if (selectedSubjectId != null && frameState?.subjects?.none { it.id == selectedSubjectId } != false) {
            selectedSubjectId = null
            scanningSubjectId = null
            scanResult = null
        }
    }
    LaunchedEffect(selectedSubjectId) {
        liveReading = null
        val subjectId = selectedSubjectId ?: return@LaunchedEffect
        val generator = auraGenerators.getOrPut(subjectId) { AuraValueGenerator(subjectId) }
        try {
            while (isActive) {
                val subject = latestFrameState.value?.subjects?.firstOrNull { it.id == subjectId }
                val profile = subject?.profile
                if (profile == null) {
                    liveReading = null
                } else {
                    liveReading = generator.next(profile)
                }
                delay(160)
            }
        } catch (_: CancellationException) {
        } finally {
            liveReading = null
        }
    }
    LaunchedEffect(scanningSubjectId) {
        val subjectId = scanningSubjectId ?: run {
            scanProgress = 0f
            return@LaunchedEffect
        }
        feedback.scanStarted(latestSoundEnabled.value)
        scanResult = null
        val startedAt = System.currentTimeMillis()
        try {
            while (isActive) {
                scanProgress = ((System.currentTimeMillis() - startedAt) / 1_000f).coerceIn(0f, 1f)
                if (scanProgress >= 1f) break
                delay(80)
            }
            scanResult = scanGenerators.getOrPut(subjectId) { AuraScanGenerator(subjectId) }.initialScan()
            delay(12_000)
        } finally {
            if (scanningSubjectId == subjectId) {
                scanningSubjectId = null
                scanProgress = 0f
                scanResult = null
            }
        }
    }
    LaunchedEffect(scanResult) {
        val res = scanResult
        if (res != null) {
            feedback.playResultAudio(res, latestSoundEnabled.value)
            
            val projected = frameState?.let { projectSubjects(it) }?.firstOrNull { it.subject.id == scanningSubjectId }
            val cx = projected?.box?.center?.x ?: 500f
            val cy = projected?.box?.center?.y ?: 500f
            val color = if (res.isPositive) NeonGreen else ErrorRed
            particleSystem.burst(cx, cy, 35, color)

            scanPulseProgress.snapTo(0f)
            scanPulseProgress.animateTo(1f, tween(900))
        } else {
            scanPulseProgress.snapTo(0f)
        }
    }
    DisposableEffect(Unit) {
        transport.connect()
        onDispose { transport.close() }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        CameraTransportPreview(transport)
        SubjectOverlay(
            frameState = frameState,
            selectedSubjectId = selectedSubjectId,
            liveReading = liveReading,
            breatheAlpha = breatheAlpha,
            wavePhase = wavePhase,
            particleSystem = particleSystem,
            particleTick = particleTick,
            scanPulseProgress = scanPulseProgress.value,
            scanPulseColor = scanPulseColor,
            scanningSubjectId = scanningSubjectId,
            onSelectSubject = {
                if (selectedSubjectId != it) {
                    scanningSubjectId = null
                    scanResult = null
                }
                selectedSubjectId = it
            },
            onScanSubject = { subjectId ->
                if (selectedSubjectId == subjectId && scanningSubjectId == null) {
                    scanningSubjectId = subjectId
                }
            }
        )
        ScanOverlay(
            subjectId = scanningSubjectId,
            progress = scanProgress,
            result = scanResult,
            onRollBonus = {
                val current = scanResult ?: return@ScanOverlay
                val subjectId = scanningSubjectId ?: return@ScanOverlay
                val newResult = scanGenerators.getOrPut(subjectId) { AuraScanGenerator(subjectId) }.rollBonus(current)
                scanResult = newResult
                feedback.playResultAudio(newResult, latestSoundEnabled.value)
                
                val projected = frameState?.let { projectSubjects(it) }?.firstOrNull { it.subject.id == subjectId }
                val cx = projected?.box?.center?.x ?: 500f
                val cy = projected?.box?.center?.y ?: 500f
                val color = if (newResult.isPositive) NeonGreen else ErrorRed
                particleSystem.burst(cx, cy, 35, color)
            }
        )
        
        val isInterference = remember(frameState) {
            val subjects = frameState?.subjects.orEmpty()
            if (subjects.size == 2) {
                val s1 = subjects[0]
                val s2 = subjects[1]
                val dx = (s1.x + s1.width / 2f) - (s2.x + s2.width / 2f)
                val dy = (s1.y + s1.height / 2f) - (s2.y + s2.height / 2f)
                val dist = kotlin.math.hypot(dx, dy)

                var totalVal = 0L
                for (s in subjects) {
                    val prof = s.profile
                    if (prof != null) {
                        if (prof.max == "∞") totalVal += 500_000L
                        else totalVal += (prof.max.toLongOrNull() ?: 5000L)
                    }
                }
                dist < 0.28f && totalVal >= 150_000L
            } else false
        }

        val subjectCount = frameState?.subjects?.size ?: 0
        val selectedSubjectProfile = frameState?.subjects?.firstOrNull { it.id == selectedSubjectId }?.profile
        val hudSubjectColor = selectedSubjectProfile?.palette?.let { paletteColor(it) } ?: NeonGreen

        ScannerHud(
            status = status,
            selectedSubjectId = selectedSubjectId,
            liveReading = liveReading,
            scanStatus = when {
                scanningSubjectId != null && scanResult == null ->
                    "SCANNING #${scanningSubjectId} ${(scanProgress * 100).toInt()}%"
                scanResult != null -> "SCAN READY #${scanningSubjectId}"
                else -> null
            },
            soundEnabled = soundEnabled,
            frameState = frameState,
            isInterference = isInterference,
            subjectCount = subjectCount,
            subjectColor = hudSubjectColor,
            onToggleSound = { soundEnabled = !soundEnabled }
        )
    }
    BackHandler(onBack = onExit)
}

@Composable
private fun CameraTransportPreview(transport: AuraWebSocket) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val previewView = remember { PreviewView(context).apply { scaleType = PreviewView.ScaleType.FILL_CENTER } }
    val analyzerExecutor = remember { Executors.newSingleThreadExecutor() }
    val previewOutputTransform = remember { AtomicReference<OutputTransform?>(null) }
    val imageTransformFactory = remember {
        ImageProxyTransformFactory().apply {
            setUsingCropRect(true)
            setUsingRotationDegrees(true)
        }
    }

    DisposableEffect(lifecycleOwner, transport) {
        var disposed = false
        val updatePreviewTransform = {
            if (Looper.myLooper() == Looper.getMainLooper()) {
                previewOutputTransform.set(previewView.outputTransform)
            } else {
                previewView.post {
                    if (!disposed) previewOutputTransform.set(previewView.outputTransform)
                }
            }
        }
        val layoutListener = android.view.View.OnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
            updatePreviewTransform()
        }
        val streamObserver = Observer<PreviewView.StreamState> {
            updatePreviewTransform()
        }
        previewView.addOnLayoutChangeListener(layoutListener)
        previewView.previewStreamState.observe(lifecycleOwner, streamObserver)
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        fun bindCamera() {
            if (disposed) return
            val viewPort = previewView.viewPort
            if (viewPort == null) {
                previewView.post(::bindCamera)
                return
            }
            val cameraProvider = cameraProviderFuture.get()
            val preview = Preview.Builder().build().also {
                it.surfaceProvider = previewView.surfaceProvider
            }
            val analysis = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also { imageAnalysis ->
                    imageAnalysis.setAnalyzer(analyzerExecutor) { image ->
                        try {
                            image.sourceToPreviewMatrix(
                                previewOutputTransform.get(),
                                imageTransformFactory
                            )?.let { transform ->
                                val frame = image.toJpeg()
                                transport.sendFrame(
                                    jpeg = frame.bytes,
                                    width = frame.width,
                                    height = frame.height,
                                    sourceWidth = frame.width,
                                    sourceHeight = frame.height,
                                    sourceToPreview = transform
                                )
                            }
                        } catch (error: Exception) {
                            Log.w("AuraDetector", "Skipping unavailable camera frame", error)
                        } finally {
                            image.close()
                        }
                    }
                }

            cameraProvider.unbindAll()
            cameraProvider.bindToLifecycle(
                lifecycleOwner,
                CameraSelector.DEFAULT_BACK_CAMERA,
                UseCaseGroup.Builder()
                    .setViewPort(viewPort)
                    .addUseCase(preview)
                    .addUseCase(analysis)
                    .build()
            )
        }
        previewView.post {
            cameraProviderFuture.addListener(::bindCamera, ContextCompat.getMainExecutor(context))
        }

        onDispose {
            disposed = true
            previewView.removeOnLayoutChangeListener(layoutListener)
            previewView.previewStreamState.removeObserver(streamObserver)
            previewOutputTransform.set(null)
            if (cameraProviderFuture.isDone) cameraProviderFuture.get().unbindAll()
            analyzerExecutor.shutdown()
        }
    }

    AndroidView(factory = { previewView }, modifier = Modifier.fillMaxSize())
}

@Composable
private fun SubjectOverlay(
    frameState: VisionFrameState?,
    selectedSubjectId: Long?,
    liveReading: String?,
    breatheAlpha: Float,
    wavePhase: Float,
    particleSystem: ParticleSystem,
    particleTick: Int,
    scanPulseProgress: Float,
    scanPulseColor: Color,
    scanningSubjectId: Long?,
    onSelectSubject: (Long?) -> Unit,
    onScanSubject: (Long) -> Unit
) {
    val projectedSubjects = remember(frameState) {
        frameState?.let(::projectSubjects).orEmpty()
    }
    val latestSubjects = rememberUpdatedState(projectedSubjects)
    val latestSelectionHandler = rememberUpdatedState(onSelectSubject)
    val latestScanHandler = rememberUpdatedState(onScanSubject)
    val latestSelectedSubjectId = rememberUpdatedState(selectedSubjectId)
    if (projectedSubjects.isEmpty() && particleSystem.particles.isEmpty()) return

    val labelPaint = remember {
        Paint(Paint.ANTI_ALIAS_FLAG).apply {
            typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
        }
    }
    val backplatePaint = remember {
        Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = DarkNavy.copy(alpha = 0.75f).toArgb()
        }
    }

    Canvas(
        modifier = Modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectTapGestures(
                    onDoubleTap = { point ->
                        val hit = findHitSubject(latestSubjects.value, point)
                        if (hit == null) {
                            latestSelectionHandler.value(null)
                        } else if (hit.subject.id == latestSelectedSubjectId.value) {
                            latestScanHandler.value(hit.subject.id)
                        } else {
                            latestSelectionHandler.value(hit.subject.id)
                        }
                    },
                    onTap = { point ->
                        findHitSubject(latestSubjects.value, point)
                            ?.subject
                            ?.id
                            .let(latestSelectionHandler.value)
                    }
                )
            }
    ) {
        val _tick = particleTick

        projectedSubjects.forEach { projected ->
            val subject = projected.subject
            val left = projected.box.left
            val top = projected.box.top
            val right = projected.box.right
            val bottom = projected.box.bottom
            val boxWidth = right - left
            val boxHeight = bottom - top
            val selected = subject.id == selectedSubjectId
            val baseColor = paletteColor(subject.profile?.palette)
            val color = if (selected) baseColor else baseColor.copy(alpha = 0.75f)
            val contour = projected.contour

            val alphaMult = if (selected) 1.6f else 1.0f

            // 1. OUTWARD RADIATING DIVINE WAVES (FLUID & WAVY STROKES ONLY - NO INSIDE FILL!)
            val numWaves = 5
            val maxExpand = if (selected) 42.dp.toPx() else 30.dp.toPx()

            for (w in 0 until numWaves) {
                val waveOffsetFrac = (wavePhase + w.toFloat() / numWaves) % 1.0f
                val expandPx = 2.dp.toPx() + waveOffsetFrac * maxExpand
                
                val bellCurve = sin(waveOffsetFrac * Math.PI.toFloat())
                val waveAlpha = (0.40f * bellCurve * breatheAlpha * alphaMult).coerceIn(0f, 0.65f)
                val strokeW = (1.5.dp.toPx() + waveOffsetFrac * 3.5.dp.toPx())

                val waveColor = if (waveOffsetFrac < 0.18f) {
                    lerp(AuraWhiteHot, baseColor, waveOffsetFrac / 0.18f)
                } else {
                    color
                }

                if (contour.size >= 3) {
                    val cx = contour.map { it.x }.average().toFloat()
                    val cy = contour.map { it.y }.average().toFloat()
                    val wavePath = Path().apply {
                        contour.forEachIndexed { idx, pt ->
                            val pdx = pt.x - cx
                            val pdy = pt.y - cy
                            val angle = kotlin.math.atan2(pdy, pdx)
                            val pdist = kotlin.math.hypot(pdx, pdy)
                            
                            // Fluid organic wave modulation around the perimeter
                            val ripple = sin(angle * 3f + wavePhase * (2f * PI.toFloat()) + w * 0.7f) * 3.5.dp.toPx()
                            val totalExpand = expandPx + ripple
                            val pscale = if (pdist > 0) (pdist + totalExpand) / pdist else 1f
                            val vx = cx + pdx * pscale
                            val vy = cy + pdy * pscale
                            
                            if (idx == 0) moveTo(vx, vy) else lineTo(vx, vy)
                        }
                        close()
                    }
                    drawPath(wavePath, waveColor.copy(alpha = waveAlpha), style = CanvasStroke(strokeW))
                } else {
                    val boxWobble = sin(wavePhase * (2f * PI.toFloat()) * 2f + w * 0.8f) * 2.5.dp.toPx()
                    val totalExpand = expandPx + boxWobble
                    drawRoundRect(
                        color = waveColor.copy(alpha = waveAlpha),
                        topLeft = Offset(left - totalExpand, top - totalExpand),
                        size = Size(boxWidth + totalExpand * 2, boxHeight + totalExpand * 2),
                        cornerRadius = CornerRadius(20.dp.toPx() + totalExpand * 0.4f),
                        style = CanvasStroke(strokeW)
                    )
                }
            }

            // 2. CRISP CORE OUTLINE (UNFILLED INTERIOR - Person remains 100% visible!)
            if (contour.size >= 3) {
                val crispPath = Path().apply {
                    moveTo(contour.first().x, contour.first().y)
                    contour.drop(1).forEach { lineTo(it.x, it.y) }
                    close()
                }
                drawPath(crispPath, baseColor.copy(alpha = 0.45f * breatheAlpha), style = CanvasStroke(4.dp.toPx()))
                drawPath(crispPath, if (selected) AuraWhiteHot else baseColor, style = CanvasStroke(2.dp.toPx()))
            } else {
                drawRoundRect(
                    color = baseColor.copy(alpha = 0.45f * breatheAlpha),
                    topLeft = Offset(left, top),
                    size = Size(boxWidth, boxHeight),
                    cornerRadius = CornerRadius(20.dp.toPx()),
                    style = CanvasStroke(4.dp.toPx())
                )
                drawRoundRect(
                    color = if (selected) AuraWhiteHot else baseColor,
                    topLeft = Offset(left, top),
                    size = Size(boxWidth, boxHeight),
                    cornerRadius = CornerRadius(20.dp.toPx()),
                    style = CanvasStroke(2.dp.toPx())
                )
            }

            if (selected) {
                val boxWidth = right - left
                val boxHeight = bottom - top
                val bracketLen = (minOf(boxWidth, boxHeight) * 0.2f).coerceAtLeast(16f)
                val strokeW = 2.5.dp.toPx()
                val reticleColor = NeonGreen

                drawLine(reticleColor, Offset(left, top), Offset(left + bracketLen, top), strokeWidth = strokeW)
                drawLine(reticleColor, Offset(left, top), Offset(left, top + bracketLen), strokeWidth = strokeW)
                drawLine(reticleColor, Offset(right, top), Offset(right - bracketLen, top), strokeWidth = strokeW)
                drawLine(reticleColor, Offset(right, top), Offset(right, top + bracketLen), strokeWidth = strokeW)
                drawLine(reticleColor, Offset(left, bottom), Offset(left + bracketLen, bottom), strokeWidth = strokeW)
                drawLine(reticleColor, Offset(left, bottom), Offset(left, bottom - bracketLen), strokeWidth = strokeW)
                drawLine(reticleColor, Offset(right, bottom), Offset(right - bracketLen, bottom), strokeWidth = strokeW)
                drawLine(reticleColor, Offset(right, bottom), Offset(right, bottom - bracketLen), strokeWidth = strokeW)

                val cx = left + boxWidth / 2f
                val cy = top + boxHeight / 2f
                val crossLenX = boxWidth * 0.3f
                val crossLenY = boxHeight * 0.3f
                drawLine(reticleColor.copy(alpha = 0.25f), Offset(cx - crossLenX / 2f, cy), Offset(cx + crossLenX / 2f, cy), strokeWidth = strokeW)
                drawLine(reticleColor.copy(alpha = 0.25f), Offset(cx, cy - crossLenY / 2f), Offset(cx, cy + crossLenY / 2f), strokeWidth = strokeW)
            }

            drawIntoCanvas { canvas ->
                labelPaint.color = baseColor.toArgb()
                labelPaint.textSize = 14.dp.toPx()
                val labelText = "SUBJECT #${subject.id}"
                
                val labelX = (left + 2.dp.toPx()).coerceIn(0f, (size.width - labelPaint.measureText(labelText)).coerceAtLeast(0f))
                val labelY = (top + labelPaint.textSize + 2.dp.toPx())
                    .coerceIn(labelPaint.textSize, (size.height - labelPaint.textSize * 2f).coerceAtLeast(labelPaint.textSize))

                val textWidth = labelPaint.measureText(labelText)
                canvas.nativeCanvas.drawRoundRect(
                    labelX - 4.dp.toPx(), labelY - labelPaint.textSize - 2.dp.toPx(),
                    labelX + textWidth + 4.dp.toPx(), labelY + 3.dp.toPx(),
                    4.dp.toPx(), 4.dp.toPx(),
                    backplatePaint
                )
                canvas.nativeCanvas.drawText(labelText, labelX, labelY, labelPaint)

                if (selected && liveReading != null) {
                    val readingWidth = labelPaint.measureText(liveReading)
                    val readingY = (labelY + labelPaint.textSize + 4.dp.toPx())
                        .coerceAtMost(size.height - 2.dp.toPx())
                    
                    canvas.nativeCanvas.drawRoundRect(
                        labelX - 4.dp.toPx(), readingY - labelPaint.textSize - 2.dp.toPx(),
                        labelX + readingWidth + 4.dp.toPx(), readingY + 3.dp.toPx(),
                        4.dp.toPx(), 4.dp.toPx(),
                        backplatePaint
                    )
                    canvas.nativeCanvas.drawText(
                        liveReading,
                        labelX,
                        readingY,
                        labelPaint
                    )
                }
            }

            if (scanPulseProgress > 0f && scanningSubjectId == subject.id) {
                val subjectCenter = projected.box.center
                for (ring in 0..2) {
                    val ringDelay = ring * 0.12f
                    val ringProgress = ((scanPulseProgress - ringDelay) / (1f - ringDelay)).coerceIn(0f, 1f)
                    if (ringProgress > 0f) {
                        val maxRadius = maxOf(size.width, size.height) * 0.4f
                        val radius = ringProgress * maxRadius
                        val alpha = (1f - ringProgress) * 0.5f
                        drawCircle(
                            color = scanPulseColor.copy(alpha = alpha),
                            radius = radius,
                            center = subjectCenter,
                            style = Stroke(2.5f.dp.toPx() * (1f - ringProgress * 0.5f))
                        )
                    }
                }
            }
        }

        if (projectedSubjects.size == 2) {
            val p1 = projectedSubjects[0]
            val p2 = projectedSubjects[1]
            val c1 = p1.box.center
            val c2 = p2.box.center
            val distancePx = kotlin.math.hypot(c1.x - c2.x, c1.y - c2.y)

            var totalAura = 0L
            for (proj in projectedSubjects) {
                val prof = proj.subject.profile
                if (prof != null) {
                    if (prof.max == "∞") totalAura += 500_000L
                    else totalAura += (prof.max.toLongOrNull() ?: 5000L)
                }
            }

            val maxInterferenceDistance = minOf(size.width, size.height) * 0.28f
            if (distancePx < maxInterferenceDistance && totalAura >= 150_000L) {
                val numSegments = 6
                val lightningPath = Path().apply {
                    moveTo(c1.x, c1.y)
                    for (i in 1 until numSegments) {
                        val frac = i.toFloat() / numSegments
                        val midX = c1.x + (c2.x - c1.x) * frac
                        val midY = c1.y + (c2.y - c1.y) * frac
                        val jitterX = Random.nextFloat() * 24.dp.toPx() - 12.dp.toPx()
                        val jitterY = Random.nextFloat() * 24.dp.toPx() - 12.dp.toPx()
                        lineTo(midX + jitterX, midY + jitterY)
                    }
                    lineTo(c2.x, c2.y)
                }

                drawPath(lightningPath, Color(0xFFFF0055), style = CanvasStroke(width = 6.dp.toPx(), cap = StrokeCap.Round))
                drawPath(lightningPath, AuraWhiteHot, style = CanvasStroke(width = 2.dp.toPx(), cap = StrokeCap.Round))

                particleSystem.burst(
                    (c1.x + c2.x) / 2f,
                    (c1.y + c2.y) / 2f,
                    4,
                    Color(0xFFFF0055)
                )
            }
        }

        particleSystem.spawnAmbient(projectedSubjects)
        with(particleSystem) {
            drawParticles()
        }
    }
}

private class Particle(
    var x: Float, var y: Float,
    var vx: Float, var vy: Float,
    var life: Float, var maxLife: Float,
    var size: Float, var color: Color
)

private class ParticleSystem {
    val particles = mutableListOf<Particle>()
    private val maxParticles = 150

    fun update(dt: Float) {
        val iter = particles.iterator()
        while (iter.hasNext()) {
            val p = iter.next()
            p.x += p.vx * dt
            p.y += p.vy * dt
            p.vx *= 0.98f
            p.vy *= 0.98f
            p.life -= dt / p.maxLife
            if (p.life <= 0f) iter.remove()
        }
    }

    fun spawnAmbient(subjects: List<ProjectedSubject>) {
        if (particles.size >= maxParticles) return
        for (projected in subjects) {
            if (particles.size >= maxParticles) break
            val box = projected.box
            val cx = box.center.x
            val cy = box.center.y
            val color = paletteColor(projected.subject.profile?.palette)
            if (Random.nextFloat() < 0.4f) {
                val angle = Random.nextFloat() * 2f * kotlin.math.PI.toFloat()
                val radiusX = box.width * 0.5f
                val radiusY = box.height * 0.5f
                val spawnX = cx + kotlin.math.cos(angle) * radiusX
                val spawnY = cy + kotlin.math.sin(angle) * radiusY
                val speed = Random.nextFloat() * 35f + 15f
                particles.add(Particle(
                    x = spawnX,
                    y = spawnY,
                    vx = kotlin.math.cos(angle) * speed,
                    vy = kotlin.math.sin(angle) * speed,
                    life = 1f,
                    maxLife = Random.nextFloat() * 1.0f + 0.4f,
                    size = Random.nextFloat() * 3.5f + 1.5f,
                    color = color
                ))
            }
        }
    }

    fun burst(centerX: Float, centerY: Float, count: Int, color: Color) {
        repeat(count.coerceAtMost(maxParticles - particles.size)) {
            val angle = Random.nextFloat() * 2f * kotlin.math.PI.toFloat()
            val speed = Random.nextFloat() * 180f + 60f
            particles.add(Particle(
                x = centerX + Random.nextFloat() * 12f - 6f,
                y = centerY + Random.nextFloat() * 12f - 6f,
                vx = kotlin.math.cos(angle) * speed,
                vy = kotlin.math.sin(angle) * speed,
                life = 1f,
                maxLife = Random.nextFloat() * 0.7f + 0.3f,
                size = Random.nextFloat() * 5f + 2f,
                color = color
            ))
        }
    }

    fun DrawScope.drawParticles() {
        for (p in particles) {
            val alpha = (p.life * 0.65f).coerceIn(0f, 1f)
            drawCircle(
                color = p.color.copy(alpha = alpha),
                radius = p.size * p.life.coerceIn(0.3f, 1f),
                center = Offset(p.x, p.y)
            )
        }
    }
}

private fun findHitSubject(subjects: List<ProjectedSubject>, point: Offset): ProjectedSubject? =
    subjects.asReversed().firstOrNull { it.contains(point) }

private data class ProjectedSubject(
    val subject: com.auradetector.transport.VisionSubject,
    val box: ComposeRect,
    val contour: List<Offset>
) {
    fun contains(point: Offset): Boolean =
        if (contour.size >= 3) pointInPolygon(point, contour) else box.contains(point)
}

private fun projectSubjects(frameState: VisionFrameState): List<ProjectedSubject> {
    fun project(point: VisionPoint): Offset {
        val sourceX = point.x * frameState.sourceWidth
        val sourceY = point.y * frameState.sourceHeight
        val transform = frameState.sourceToPreview
        val denominator = transform[6] * sourceX + transform[7] * sourceY + transform[8]
        return Offset(
            (transform[0] * sourceX + transform[1] * sourceY + transform[2]) / denominator,
            (transform[3] * sourceX + transform[4] * sourceY + transform[5]) / denominator
        )
    }

    return frameState.subjects.map { subject ->
        val boxCorners = listOf(
            VisionPoint(subject.x, subject.y),
            VisionPoint(subject.x + subject.width, subject.y),
            VisionPoint(subject.x + subject.width, subject.y + subject.height),
            VisionPoint(subject.x, subject.y + subject.height)
        ).map(::project)
        val box = ComposeRect(
            left = boxCorners.minOf { it.x },
            top = boxCorners.minOf { it.y },
            right = boxCorners.maxOf { it.x },
            bottom = boxCorners.maxOf { it.y }
        )
        ProjectedSubject(subject, box, subject.contour.map(::project))
    }
}

private fun pointInPolygon(point: Offset, polygon: List<Offset>): Boolean {
    var inside = false
    var previous = polygon.lastIndex
    for (index in polygon.indices) {
        val currentPoint = polygon[index]
        val previousPoint = polygon[previous]
        val crosses = (currentPoint.y > point.y) != (previousPoint.y > point.y)
        if (crosses) {
            val intersectionX =
                (previousPoint.x - currentPoint.x) * (point.y - currentPoint.y) /
                    (previousPoint.y - currentPoint.y) + currentPoint.x
            if (point.x < intersectionX) inside = !inside
        }
        previous = index
    }
    return inside
}

private data class AuraScanResult(
    val base: String,
    val bonusValue: String? = null,
    val isPositive: Boolean = true,
    val final: String,
    val classification: String,
    val rawBonusNumber: String? = null
)

private class ScanFeedback(private val context: Context) {
    private val toneGenerator = ToneGenerator(AudioManager.STREAM_MUSIC, 55)
    private var activeMediaPlayer: MediaPlayer? = null
    private val vibrator: Vibrator? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        context.getSystemService(VibratorManager::class.java)?.defaultVibrator
    } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }

    fun scanStarted(soundEnabled: Boolean) {
        vibrate(longArrayOf(0, 24), -1)
        if (soundEnabled) toneGenerator.startTone(ToneGenerator.TONE_PROP_BEEP, 70)
    }

    fun scanCompleted(soundEnabled: Boolean) {
        vibrate(longArrayOf(0, 40, 60, 40, 60, 100), -1)
        if (soundEnabled) toneGenerator.startTone(ToneGenerator.TONE_PROP_ACK, 250)
    }

    fun playResultAudio(result: AuraScanResult, soundEnabled: Boolean) {
        playBonusMemeSound(
            rawBonusNumber = result.rawBonusNumber,
            isPositive = result.isPositive,
            finalText = result.final,
            soundEnabled = soundEnabled
        )
    }

    fun playBonusMemeSound(isPositive: Boolean, isJackpot: Boolean, soundEnabled: Boolean) {
        playBonusMemeSound(rawBonusNumber = null, isPositive = isPositive, finalText = null, soundEnabled = soundEnabled)
    }

    fun playBonusMemeSound(
        rawBonusNumber: String?,
        isPositive: Boolean,
        finalText: String?,
        soundEnabled: Boolean
    ) {
        if (!soundEnabled) return

        val resId = getCustomSoundResId(rawBonusNumber, isPositive, finalText)
        if (resId != null) {
            try {
                try {
                    activeMediaPlayer?.let {
                        if (it.isPlaying) it.stop()
                        it.release()
                    }
                } catch (_: Exception) {}
                activeMediaPlayer = null

                val mp = MediaPlayer.create(context, resId)
                if (mp != null) {
                    activeMediaPlayer = mp
                    mp.setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_GAME)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    mp.setOnCompletionListener { player ->
                        try {
                            player.release()
                        } catch (_: Exception) {}
                        if (activeMediaPlayer == player) {
                            activeMediaPlayer = null
                        }
                    }
                    mp.start()
                    return
                }
            } catch (e: Exception) {
                Log.w("AuraDetector", "Error playing custom sound res: $resId", e)
            }
        }

        val isJackpot = rawBonusNumber == "∞" || rawBonusNumber == "696969" || rawBonusNumber == "676767"
        playSynthesizedMemeSound(isPositive, isJackpot)
    }

    private fun getCustomSoundResId(rawBonusNumber: String?, isPositive: Boolean, finalText: String?): Int? {
        val num = rawBonusNumber?.trim()
        val text = finalText.orEmpty()

        if (num == "0" || text.startsWith("0 ") || text.contains(" 0 AUR") || text.endsWith("0")) {
            return R.raw.sound_0
        }

        if (!isPositive && (num == "676767" || num == "696969" || text.contains("-676767") || text.contains("−676767") || text.contains("-696969") || text.contains("−696969"))) {
            return R.raw.minus_676767_696969
        }

        if (num == "69" && !isPositive) return R.raw.minus_69
        if (text.contains("-69") || text.contains("−69")) return R.raw.minus_69

        if (num == "676767" || num == "696969" || num == "67" || (num == "69" && isPositive) || text.contains("676767") || text.contains("696969")) {
            return R.raw.sound_676767_696969
        }

        if (num == "100000" || text.contains("100000")) return R.raw.sound_100000
        if (num == "50000" || text.contains("50000")) return R.raw.sound_50000
        if (num == "1000" || num == "5000" || text.contains("1000") || text.contains("5000")) {
            return R.raw.sound_1000_5000
        }

        if (num == "∞" || text.contains("∞") || text.contains("infinity")) {
            return R.raw.minus_infinity
        }

        return null
    }

    private fun playSynthesizedMemeSound(isPositive: Boolean, isJackpot: Boolean) {
        try {
            val sampleRate = 22050
            val durationMs = if (isJackpot) 750 else 420
            val numSamples = sampleRate * durationMs / 1000
            val samples = ShortArray(numSamples)

            val freqs = if (isPositive) {
                if (isJackpot) floatArrayOf(523.25f, 659.25f, 783.99f, 1046.50f)
                else floatArrayOf(523.25f, 659.25f, 783.99f)
            } else {
                if (isJackpot) floatArrayOf(349.23f, 329.63f, 311.13f, 261.63f)
                else floatArrayOf(349.23f, 293.66f, 246.94f)
            }

            val samplesPerNote = numSamples / freqs.size
            var sampleIdx = 0
            for (f in freqs) {
                val period = sampleRate / f
                for (i in 0 until samplesPerNote) {
                    if (sampleIdx >= numSamples) break
                    val angle = 2.0 * Math.PI * i / period
                    val valSine = Math.sin(angle)
                    val valSq = if (valSine > 0) 0.5 else -0.5
                    val envelope = (1.0 - i.toDouble() / samplesPerNote).coerceIn(0.0, 1.0)
                    val sampleVal = ((valSine * 0.4 + valSq * 0.6) * envelope * 22000).toInt()
                    samples[sampleIdx++] = sampleVal.toShort()
                }
            }

            val audioTrack = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_GAME)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(sampleRate)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build()
                )
                .setBufferSizeInBytes(numSamples * 2)
                .setTransferMode(AudioTrack.MODE_STATIC)
                .build()

            audioTrack.write(samples, 0, numSamples)
            audioTrack.play()

            Handler(Looper.getMainLooper()).postDelayed({
                try { audioTrack.release() } catch (_: Exception) {}
            }, durationMs + 250L)

        } catch (e: Exception) {
            Log.w("AuraDetector", "Fallback for bonus sound", e)
            if (isPositive) toneGenerator.startTone(ToneGenerator.TONE_DTMF_A, 300)
            else toneGenerator.startTone(ToneGenerator.TONE_PROP_NACK, 300)
        }
    }

    fun geigerTick(soundEnabled: Boolean) {
        if (!soundEnabled) return
        toneGenerator.startTone(ToneGenerator.TONE_PROP_BEEP, 18)
    }

    fun playEmergencyInterferenceSound(soundEnabled: Boolean) {
        if (!soundEnabled) return
        vibrate(longArrayOf(0, 35, 30, 35), -1)
        try {
            toneGenerator.startTone(ToneGenerator.TONE_CDMA_EMERGENCY_RINGBACK, 120)
        } catch (_: Exception) {
            toneGenerator.startTone(ToneGenerator.TONE_PROP_BEEP2, 120)
        }
    }

    fun release() {
        toneGenerator.release()
        try {
            activeMediaPlayer?.let {
                if (it.isPlaying) it.stop()
                it.release()
            }
        } catch (_: Exception) {}
        activeMediaPlayer = null
    }

    private fun vibrate(pattern: LongArray, repeat: Int) {
        val device = vibrator ?: return
        if (!device.hasVibrator()) return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            device.vibrate(VibrationEffect.createWaveform(pattern, repeat))
        } else {
            @Suppress("DEPRECATION")
            device.vibrate(pattern, repeat)
        }
    }
}

private class AuraScanGenerator(subjectId: Long) {
    private val random = Random(subjectId.toInt() xor 0x51A7C0DE)

    fun initialScan(): AuraScanResult {
        // 45% chance to roll a special meme/audio aura value
        val isSpecialRoll = random.nextDouble() < 0.45
        val isPositive = random.nextDouble() < 0.60 // 60% positive / 40% negative
        val signStr = if (isPositive) "+" else "−"

        if (isSpecialRoll) {
            val specialValues = listOf("∞", "100000", "50000", "5000", "1000", "676767", "696969", "67", "69", "0")
            val chosen = specialValues[random.nextInt(specialValues.size)]
            val formattedVal = if (chosen == "0") "0 AUR/s" else "$signStr$chosen AUR/s"

            val classification = when (chosen) {
                "∞" -> if (isPositive) "INFINITE OVERFLOW" else "VOID SINGULARITY"
                "100000" -> if (isPositive) "CRITICAL PEAK RADIANCE" else "CRITICAL DRAIN"
                "50000" -> if (isPositive) "HIGH PULSE RADIANCE" else "HIGH FIELD COLLAPSE"
                "5000" -> if (isPositive) "HIGH ENERGY PULSE" else "FIELD COLLAPSE"
                "1000" -> if (isPositive) "STABLE HARMONIC" else "HARMONIC DRAIN"
                "676767" -> if (isPositive) "SUPREME SPECTRUM 67" else "CATACLYSMIC DRAIN 67"
                "696969" -> if (isPositive) "NICE OVERDRIVE 69" else "NICE CURSE DRAIN 69"
                "67" -> if (isPositive) "RESONANCE SIGNAL 67" else "CURSE SIGNAL 67"
                "69" -> if (isPositive) "NICE SPECTRUM 69" else "NICE DRAIN 69"
                "0" -> "ZERO AURA HARMONY"
                else -> "NULL FIELD READOUT"
            }

            return AuraScanResult(
                base = formattedVal,
                bonusValue = null,
                isPositive = isPositive,
                final = formattedVal,
                classification = classification,
                rawBonusNumber = chosen
            )
        }

        // Standard random readout (no commas!)
        val baseVal = random.nextLong(100, 40_000)
        val formattedBase = "$signStr$baseVal AUR/s"
        return AuraScanResult(
            base = formattedBase,
            bonusValue = null,
            isPositive = isPositive,
            final = formattedBase,
            classification = if (isPositive) "READOUT CALIBRATED" else "SPECTRUM DRAIN",
            rawBonusNumber = baseVal.toString()
        )
    }

    fun rollBonus(currentResult: AuraScanResult): AuraScanResult {
        // 40% Curse (Negative) / 60% Blessing (Positive) split
        val isPositive = random.nextDouble() < 0.60

        // Preferred set matching custom audio files
        val fixedValues = listOf("696969", "676767", "100000", "50000", "5000", "1000", "69", "67", "0", "∞")
        val chosenValueStr = fixedValues[random.nextInt(fixedValues.size)]

        val signStr = if (isPositive) "+" else "−"
        val bonusFormatted = if (chosenValueStr == "0") "0 AURA" else "$signStr$chosenValueStr AURA"

        val classification = when (chosenValueStr) {
            "∞" -> if (isPositive) "INFINITE OVERFLOW" else "VOID SINGULARITY"
            "696969" -> if (isPositive) "NICE OVERDRIVE (+696969)" else "NICE CURSE DRAIN (−696969)"
            "676767" -> if (isPositive) "SUPREME SPECTRUM (+676767)" else "CATACLYSMIC DRAIN (−676767)"
            "100000" -> if (isPositive) "MAJOR RADIANCE (+100000)" else "MAJOR FIELD DRAIN (−100000)"
            "50000" -> if (isPositive) "HIGH PULSE RADIANCE (+50000)" else "HIGH FIELD COLLAPSE (−50000)"
            "5000" -> if (isPositive) "PULSE SPECTRUM (+5000)" else "PULSE DRAIN (−5000)"
            "1000" -> if (isPositive) "HARMONIC BOOST (+1000)" else "HARMONIC DRAIN (−1000)"
            "69" -> if (isPositive) "NICE SPECTRUM (+69)" else "NICE DRAIN (−69)"
            "67" -> if (isPositive) "BONUS FIELD (+67)" else "FIELD CURSE (−67)"
            "0" -> "ZERO AURA BALANCE"
            else -> if (isPositive) "SOLITARY AURA (+1)" else "SINGLE DROP CURSE (−1)"
        }

        return currentResult.copy(
            bonusValue = bonusFormatted,
            isPositive = isPositive,
            final = bonusFormatted,
            classification = classification,
            rawBonusNumber = chosenValueStr
        )
    }
}

private class AuraValueGenerator(subjectId: Long) {
    private val random = Random(subjectId.toInt() xor 0x5EEDBEEF)
    private var profileKey: String? = null
    private var value: Double? = null

    fun next(profile: VisionProfile): String {
        val key = "${profile.band}|${profile.min}|${profile.max}|${profile.palette}"
        if (key != profileKey) {
            profileKey = key
            value = null
        }

        if (profile.max == "∞") return "∞ AUR/s"
        val minimum = profile.min.toDoubleOrNull() ?: return "— AUR/s"
        val maximum = profile.max.toDoubleOrNull() ?: return "— AUR/s"
        if (maximum <= minimum) return format(minimum)

        val positiveMinimum = maxOf(1.0, minimum)
        val current = value ?: exp(
            ln(positiveMinimum) + random.nextDouble() * (ln(maximum) - ln(positiveMinimum))
        )
        val next = if (maximum / positiveMinimum >= 100.0) {
            current * exp(random.nextDouble(-0.08, 0.08))
        } else {
            current + (maximum - minimum) * random.nextDouble(-0.08, 0.08)
        }
        value = next.coerceIn(minimum, maximum)
        return format(value ?: minimum)
    }

    private fun format(value: Double): String =
        "${value.toLong()} AUR/s"
}

@Composable
private fun ScanOverlay(
    subjectId: Long?,
    progress: Float,
    result: AuraScanResult?,
    onRollBonus: () -> Unit
) {
    if (subjectId == null) return
    val transition = rememberInfiniteTransition(label = "scanPulse")
    val pulseAlpha by transition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(450, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scanPulseAlpha"
    )
    val rotateAngle by transition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotateAngle"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .zIndex(10f),
        contentAlignment = Alignment.Center
    ) {
        if (result == null) {
            // High-Tech Bio-Scanner UI
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.padding(24.dp)
            ) {
                // Central Glowing Scanning Arc Ring
                Box(
                    modifier = Modifier.size(130.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val strokeW = 4.dp.toPx()
                        // Outer background ring track
                        drawCircle(
                            color = OrangeWarning.copy(alpha = 0.15f),
                            style = CanvasStroke(strokeW)
                        )
                        // Progress arc
                        drawArc(
                            brush = Brush.sweepGradient(
                                listOf(OrangeWarning.copy(alpha = 0.3f), OrangeWarning, CyanAccent)
                            ),
                            startAngle = rotateAngle,
                            sweepAngle = (progress * 360f).coerceIn(10f, 360f),
                            useCenter = false,
                            style = CanvasStroke(strokeW, cap = StrokeCap.Round)
                        )
                        // Inner reticle ring
                        drawCircle(
                            color = CyanAccent.copy(alpha = 0.25f * pulseAlpha),
                            radius = size.minDimension * 0.35f,
                            style = CanvasStroke(1.5.dp.toPx())
                        )
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "${(progress * 100).toInt()}%",
                            color = OrangeWarning
                        )
                        Text(
                            text = "ANALYZING",
                            color = CyanAccent.copy(alpha = 0.8f)
                        )
                    }
                }

                // Sleek Glassmorphism Info Badge
                Column(
                    modifier = Modifier
                        .background(
                            DarkNavy.copy(alpha = 0.92f),
                            shape = RoundedCornerShape(16.dp)
                        )
                        .border(
                            1.5.dp,
                            Brush.horizontalGradient(
                                listOf(OrangeWarning.copy(alpha = pulseAlpha), CyanAccent.copy(alpha = pulseAlpha))
                            ),
                            shape = RoundedCornerShape(16.dp)
                        )
                        .padding(horizontal = 24.dp, vertical = 14.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text("AURA SCAN IN PROGRESS", color = OrangeWarning)
                    Text("TARGET: SUBJECT #$subjectId", color = CyanAccent)
                    
                    val phaseMsg = when {
                        progress < 0.3f -> "Calibrating Spectrum Band..."
                        progress < 0.7f -> "Sampling Quantum Field..."
                        else -> "Resolving Matrix Profile..."
                    }
                    Text(phaseMsg, color = CyanAccent.copy(alpha = 0.75f))

                    // Gradient Progress Bar
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(0.85f)
                            .height(6.dp)
                            .background(CyanAccent.copy(alpha = 0.15f), shape = CircleShape)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(progress.coerceIn(0f, 1f))
                                .height(6.dp)
                                .background(
                                    Brush.horizontalGradient(listOf(OrangeWarning, CyanAccent)),
                                    shape = CircleShape
                                )
                        )
                    }
                }
            }
        } else {
            // Scan Complete Result Card - Interactive Random Bonus Button inside!
            val hasBonus = result.bonusValue != null
            val auraColor = if (!hasBonus) CyanAccent else if (result.isPositive) NeonGreen else ErrorRed

            Column(
                modifier = Modifier
                    .fillMaxWidth(0.92f)
                    .background(DarkNavy.copy(alpha = 0.96f), shape = RoundedCornerShape(20.dp))
                    .border(2.5.dp, auraColor, shape = RoundedCornerShape(20.dp))
                    .padding(22.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Header Badge
                Box(
                    modifier = Modifier
                        .background(auraColor.copy(alpha = 0.2f), shape = RoundedCornerShape(10.dp))
                        .border(1.2.dp, auraColor, shape = RoundedCornerShape(10.dp))
                        .padding(horizontal = 16.dp, vertical = 5.dp)
                ) {
                    Text(
                        text = if (!hasBonus) "★ AURA SCAN COMPLETE ★" else if (result.isPositive) "★ BLESSING GRANTED ★" else "☠ CURSE INFLICTED ☠",
                        color = auraColor,
                        fontWeight = FontWeight.Bold
                    )
                }

                if (hasBonus) {
                    // ICONIC GIANT MEME AURA BONUS READOUT
                    Text(
                        text = result.bonusValue!!,
                        color = auraColor,
                        fontSize = 34.sp,
                        fontWeight = FontWeight.Black
                    )
                } else {
                    Text(
                        text = result.base,
                        color = CyanAccent,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Text(
                    text = result.classification,
                    color = CyanAccent.copy(alpha = 0.85f),
                    fontWeight = FontWeight.Medium
                )

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(auraColor.copy(alpha = 0.4f))
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("BASELINE READOUT", color = CyanAccent.copy(alpha = 0.7f))
                    Text(result.base, color = CyanAccent)
                }

                if (hasBonus) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("RANDOM BONUS ROLL", color = CyanAccent.copy(alpha = 0.7f))
                        Text(
                            text = result.bonusValue!!,
                            color = auraColor,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                // INTERACTIVE RANDOM BONUS BUTTON INSIDE POPUP CARD!
                Button(
                    onClick = onRollBonus,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (hasBonus) auraColor.copy(alpha = 0.25f) else OrangeWarning.copy(alpha = 0.3f)
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(
                            1.5.dp,
                            if (hasBonus) auraColor else OrangeWarning,
                            shape = RoundedCornerShape(12.dp)
                        )
                ) {
                    Text(
                        text = if (hasBonus) "🎲 RE-ROLL RANDOM BONUS" else "🎲 ROLL RANDOM BONUS",
                        color = if (hasBonus) auraColor else OrangeWarning,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
            }
        }
    }
}

private fun ImageProxy.sourceToPreviewMatrix(
    previewOutput: OutputTransform?,
    imageTransformFactory: ImageProxyTransformFactory
): FloatArray? {
    previewOutput ?: return null
    val sourceOutput = imageTransformFactory.getOutputTransform(this)
    return Matrix().apply {
        CoordinateTransform(sourceOutput, previewOutput).transform(this)
    }.let { matrix ->
        FloatArray(9).also(matrix::getValues)
    }
}

@Composable
private fun ScannerHud(
    status: TransportStatus,
    selectedSubjectId: Long?,
    liveReading: String?,
    scanStatus: String?,
    soundEnabled: Boolean,
    frameState: VisionFrameState?,
    isInterference: Boolean,
    subjectCount: Int,
    subjectColor: Color,
    onToggleSound: () -> Unit
) {
    val statusColor = when (status.state) {
        VisionLinkState.READY -> NeonGreen
        VisionLinkState.CONNECTING -> OrangeWarning
        VisionLinkState.DEGRADED -> OrangeWarning
        VisionLinkState.OFFLINE -> ErrorRed
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // TOP HUD BAR - Safe Window Inset Padded (Notch & Status bar safe!)
        Column(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        listOf(DarkNavy.copy(alpha = 0.96f), DarkNavy.copy(alpha = 0.88f))
                    )
                )
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 10.dp)
        ) {
            // Header Row: Title & Connection Status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("AURA RADIATION MONITOR", color = CyanAccent)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(8.dp).background(statusColor, CircleShape))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(status.detail, color = statusColor)
                }
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            
            // Sub-metrics Row
            val metrics = buildString {
                status.lastFrameId?.let { append("FRAME: $it  ") }
                status.latencyMs?.let { append("${it}ms  ") }
                append("SUBJECTS: $subjectCount")
            }
            Text(metrics, color = CyanAccent.copy(alpha = 0.65f))

            // INTEGRATED FIELD METER GAUGE (Safe & Non-overflowing!)
            if (selectedSubjectId != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            "SUBJ #$selectedSubjectId",
                            color = subjectColor,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                        
                        // Parse reading fraction for live meter
                        val valDouble = liveReading?.replace(",", "")
                            ?.replace(" AUR/s", "")
                            ?.trim()
                            ?.toDoubleOrNull() ?: 0.0
                        val frac = if (valDouble > 0) {
                            (kotlin.math.ln(valDouble + 1.0) / kotlin.math.ln(100_000.0)).coerceIn(0.05, 1.0).toFloat()
                        } else 0f

                        // Meter bar track
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(6.dp)
                                .background(DarkNavy, shape = CircleShape)
                                .border(0.8.dp, subjectColor.copy(alpha = 0.5f), shape = CircleShape)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth(frac)
                                    .height(6.dp)
                                    .background(
                                        Brush.horizontalGradient(
                                            listOf(CyanAccent, subjectColor, AuraWhiteHot)
                                        ),
                                        shape = CircleShape
                                    )
                            )
                        }
                    }

                    if (liveReading != null) {
                        Text(
                            liveReading,
                            color = CyanAccent,
                            modifier = Modifier.padding(start = 10.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(statusColor.copy(alpha = 0.6f))
            )
        }

        // AURA INTERFERENCE WARNING BANNER OVERLAY
        if (isInterference) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .statusBarsPadding()
                    .padding(top = 74.dp)
                    .background(
                        Brush.verticalGradient(
                            listOf(Color(0xFF880022).copy(alpha = 0.92f), DarkNavy.copy(alpha = 0.95f))
                        ),
                        shape = CutCornerShape(8.dp)
                    )
                    .border(1.5.dp, Color(0xFFFF0055), shape = CutCornerShape(8.dp))
                    .padding(horizontal = 20.dp, vertical = 8.dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "⚠ AURA INTERFERENCE ⚠",
                        color = AuraWhiteHot,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Black,
                        fontSize = 14.sp
                    )
                    Text(
                        "RESONANCE OVERLOAD BETWEEN SUBJECTS",
                        color = Color(0xFFFF6699),
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp
                    )
                }
            }
        }

        // BOTTOM-LEFT GEIGER FLUX COUNTER & SPECTRAL GRAPH WIDGET
        GeigerFluxMeter(
            frameState = frameState,
            selectedSubjectId = selectedSubjectId,
            liveReading = liveReading,
            isInterference = isInterference,
            modifier = Modifier
                .align(Alignment.BottomStart)
                .navigationBarsPadding()
                .padding(start = 12.dp, bottom = 14.dp)
        )

        // BOTTOM-RIGHT SOUND TOGGLE BUTTON - Safe Navigation Bar Padded
        Button(
            onClick = onToggleSound,
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = DarkNavy.copy(alpha = 0.90f)),
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .navigationBarsPadding()
                .padding(end = 12.dp, bottom = 14.dp)
                .border(1.dp, CyanAccent, RoundedCornerShape(12.dp))
        ) {
            Text(if (soundEnabled) "SOUND ON" else "SOUND OFF", color = CyanAccent)
        }
    }
}

@Composable
private fun GeigerFluxMeter(
    frameState: VisionFrameState?,
    selectedSubjectId: Long?,
    liveReading: String?,
    isInterference: Boolean,
    modifier: Modifier = Modifier
) {
    val targetCpm = remember(frameState, selectedSubjectId, liveReading, isInterference) {
        if (isInterference) {
            99999
        } else {
            var base = Random.nextInt(18, 36)
            val subjects = frameState?.subjects.orEmpty()
            if (subjects.isNotEmpty()) {
                var totalAuraSum = 0L
                var maxProximityArea = 0.05f

                for (subj in subjects) {
                    val area = subj.width * subj.height
                    if (area > maxProximityArea) maxProximityArea = area

                    val profile = subj.profile ?: continue
                    val minVal = profile.min.toDoubleOrNull() ?: 100.0
                    val maxVal = if (profile.max == "∞") 100_000.0 else profile.max.toDoubleOrNull() ?: 5000.0
                    val avgVal = (minVal + maxVal) / 2.0
                    totalAuraSum += avgVal.toLong()
                }

                if (selectedSubjectId != null && liveReading != null) {
                    if (liveReading.contains("∞")) {
                        totalAuraSum += 50_000L
                    } else {
                        val rawVal = liveReading.replace(",", "").replace(" AUR/s", "")
                            .replace("+", "").replace("−", "").replace(" AURA", "").trim().toLongOrNull() ?: 0L
                        totalAuraSum += rawVal
                    }
                }

                val proximityMultiplier = (maxProximityArea * 2.2f).coerceIn(0.05f, 1.5f)
                val scaledAuraField = (totalAuraSum * 0.15f * proximityMultiplier).toInt()

                base += scaledAuraField.coerceAtMost(99999)
            }
            base
        }
    }

    val animatedCpm = remember { Animatable(24f) }
    LaunchedEffect(targetCpm) {
        animatedCpm.animateTo(
            targetValue = targetCpm.toFloat(),
            animationSpec = spring(
                dampingRatio = Spring.DampingRatioLowBouncy,
                stiffness = Spring.StiffnessLow
            )
        )
    }

    val transition = rememberInfiniteTransition(label = "geigerBars")
    val barPhase by transition.animateFloat(
        initialValue = 0f,
        targetValue = 2f * PI.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "barPhase"
    )

    val currentCpmInt = animatedCpm.value.toInt()
    val uSvRate = (currentCpmInt / 120.0)

    val (statusText, statusColor) = if (isInterference) {
        "⚠ AURA INTERFERENCE" to Color(0xFFFF0055)
    } else when {
        currentCpmInt > 40000 -> "☢ CRITICAL OVERFLOW" to ErrorRed
        currentCpmInt > 12000 -> "⚡ FLUX SPIKE" to OrangeWarning
        currentCpmInt > 1200 -> "▲ ELEVATED FIELD" to NeonGreen
        else -> "● NOMINAL FLUX" to CyanAccent
    }

    Box(
        modifier = modifier
            .width(210.dp)
            .background(
                Brush.verticalGradient(
                    listOf(
                        DarkNavy.copy(alpha = 0.92f),
                        Color(0xFF0B1021).copy(alpha = 0.95f)
                    )
                ),
                shape = CutCornerShape(topEnd = 12.dp, bottomStart = 8.dp)
            )
            .border(
                1.dp,
                Brush.horizontalGradient(
                    listOf(statusColor.copy(alpha = 0.8f), CyanAccent.copy(alpha = 0.4f))
                ),
                shape = CutCornerShape(topEnd = 12.dp, bottomStart = 8.dp)
            )
            .padding(10.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("☢", color = statusColor, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        "GEIGER FLUX MONITOR",
                        color = CyanAccent,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold
                    )
                }
                Box(
                    modifier = Modifier
                        .size(7.dp)
                        .background(statusColor, CircleShape)
                        .border(1.dp, AuraWhiteHot.copy(alpha = 0.6f), CircleShape)
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            Row(
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column {
                    Text(
                        text = if (currentCpmInt > 99999) "99999+ CPM" else "$currentCpmInt CPM",
                        color = statusColor,
                        fontSize = 17.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Black
                    )
                    Text(
                        text = String.format(Locale.US, "%.2f μSv/h", uSvRate),
                        color = CyanAccent.copy(alpha = 0.75f),
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
                Text(
                    text = statusText,
                    color = statusColor.copy(alpha = 0.9f),
                    fontSize = 8.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(38.dp)
                    .background(Color(0xFF060913), shape = RoundedCornerShape(6.dp))
                    .border(0.5.dp, statusColor.copy(alpha = 0.4f), shape = RoundedCornerShape(6.dp))
            ) {
                val numBars = 11
                val centerIndex = 5
                val sigma = 2.2f
                val barGap = 2.dp.toPx()
                val totalGap = barGap * (numBars - 1)
                val barWidth = (size.width - totalGap) / numBars
                val normalizedFlux = (currentCpmInt / 25000f).coerceIn(0.12f, 1.0f)

                val gridY = size.height * 0.5f
                drawLine(
                    color = Color.White.copy(alpha = 0.08f),
                    start = Offset(0f, gridY),
                    end = Offset(size.width, gridY),
                    strokeWidth = 1f
                )

                for (i in 0 until numBars) {
                    val x = i * (barWidth + barGap)
                    val distFromCenter = kotlin.math.abs(i - centerIndex).toFloat()
                    val gaussianFactor = kotlin.math.exp(-(distFromCenter * distFromCenter) / (2.0f * sigma * sigma))

                    val breathJitter = 1.0f + kotlin.math.sin(barPhase + i * 0.25f) * 0.04f
                    val peakBarHeight = size.height * normalizedFlux * breathJitter
                    val barHeight = (peakBarHeight * gaussianFactor).coerceIn(4f, size.height)

                    val topY = size.height - barHeight

                    val barColor = when {
                        normalizedFlux > 0.75f -> ErrorRed
                        normalizedFlux > 0.45f -> OrangeWarning
                        normalizedFlux > 0.25f -> NeonGreen
                        else -> CyanAccent
                    }

                    drawRoundRect(
                        color = barColor,
                        topLeft = Offset(x, topY),
                        size = Size(barWidth, barHeight),
                        cornerRadius = CornerRadius(2.dp.toPx(), 2.dp.toPx())
                    )

                    drawRect(
                        color = AuraWhiteHot.copy(alpha = 0.9f),
                        topLeft = Offset(x, topY),
                        size = Size(barWidth, 2f)
                    )

                    drawRoundRect(
                        color = Color.Black.copy(alpha = 0.4f),
                        topLeft = Offset(x, topY),
                        size = Size(barWidth, barHeight),
                        cornerRadius = CornerRadius(2.dp.toPx(), 2.dp.toPx()),
                        style = Stroke(width = 1f)
                    )
                }
            }
        }
    }
}

@Composable
private fun PermissionRequired(onRequestPermission: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkNavy)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("CAMERA PERMISSION REQUIRED", color = ErrorRed)
        Button(onClick = onRequestPermission, modifier = Modifier.padding(top = 16.dp)) {
            Text("ALLOW CAMERA")
        }
    }
}

private data class JpegFrame(val bytes: ByteArray, val width: Int, val height: Int)

private fun ImageProxy.toJpeg(quality: Int = 70, maxLongEdge: Int = 640): JpegFrame {
    require(format == ImageFormat.YUV_420_888) { "Expected YUV_420_888 camera frame" }
    val sourceLeft = cropRect.left and 1.inv()
    val sourceTop = cropRect.top and 1.inv()
    val sourceWidth = cropRect.width() and 1.inv()
    val sourceHeight = cropRect.height() and 1.inv()
    require(sourceWidth >= 2 && sourceHeight >= 2) { "Camera crop is too small" }

    val sourceLongEdge = maxOf(sourceWidth, sourceHeight)
    val targetWidth = if (sourceLongEdge <= maxLongEdge) sourceWidth else {
        maxOf(2, (sourceWidth.toLong() * maxLongEdge / sourceLongEdge).toInt() and 1.inv())
    }
    val targetHeight = if (sourceLongEdge <= maxLongEdge) sourceHeight else {
        maxOf(2, (sourceHeight.toLong() * maxLongEdge / sourceLongEdge).toInt() and 1.inv())
    }
    val nv21 = ByteArray(targetWidth * targetHeight * ImageFormat.getBitsPerPixel(ImageFormat.NV21) / 8)
    copyPlane(
        planes[0], sourceLeft, sourceTop, sourceWidth, sourceHeight, targetWidth, targetHeight, nv21, 0
    )
    copyChromaPlanes(
        planes[1], planes[2], sourceLeft, sourceTop, sourceWidth, sourceHeight,
        targetWidth, targetHeight, nv21, targetWidth * targetHeight
    )

    val jpeg = ByteArrayOutputStream().use { stream ->
        YuvImage(nv21, ImageFormat.NV21, targetWidth, targetHeight, null)
            .compressToJpeg(Rect(0, 0, targetWidth, targetHeight), quality, stream)
        stream.toByteArray()
    }
    return jpeg.rotate(imageInfo.rotationDegrees, targetWidth, targetHeight, quality)
}

private fun copyPlane(
    plane: ImageProxy.PlaneProxy,
    sourceLeft: Int,
    sourceTop: Int,
    sourceWidth: Int,
    sourceHeight: Int,
    targetWidth: Int,
    targetHeight: Int,
    output: ByteArray,
    outputOffset: Int
) {
    val buffer = plane.buffer
    val start = buffer.position()
    for (targetRow in 0 until targetHeight) {
        val sourceRow = sourceTop + targetRow * sourceHeight / targetHeight
        val rowStart = start + sourceRow * plane.rowStride
        for (targetColumn in 0 until targetWidth) {
            val sourceColumn = sourceLeft + targetColumn * sourceWidth / targetWidth
            output[outputOffset + targetRow * targetWidth + targetColumn] =
                buffer.get(rowStart + sourceColumn * plane.pixelStride)
        }
    }
}

private fun copyChromaPlanes(
    uPlane: ImageProxy.PlaneProxy,
    vPlane: ImageProxy.PlaneProxy,
    sourceLeft: Int,
    sourceTop: Int,
    sourceWidth: Int,
    sourceHeight: Int,
    targetWidth: Int,
    targetHeight: Int,
    output: ByteArray,
    outputOffset: Int
) {
    val uBuffer = uPlane.buffer
    val vBuffer = vPlane.buffer
    val uStart = uBuffer.position()
    val vStart = vBuffer.position()
    var outputIndex = outputOffset
    for (targetRow in 0 until targetHeight / 2) {
        val sourceRow = sourceTop / 2 + targetRow * sourceHeight / targetHeight
        for (targetColumn in 0 until targetWidth / 2) {
            val sourceColumn = sourceLeft / 2 + targetColumn * sourceWidth / targetWidth
            output[outputIndex++] = vBuffer.get(
                vStart + sourceRow * vPlane.rowStride + sourceColumn * vPlane.pixelStride
            )
            output[outputIndex++] = uBuffer.get(
                uStart + sourceRow * uPlane.rowStride + sourceColumn * uPlane.pixelStride
            )
        }
    }
}

private fun ByteArray.rotate(rotationDegrees: Int, width: Int, height: Int, quality: Int): JpegFrame {
    val rotation = ((rotationDegrees % 360) + 360) % 360
    if (rotation == 0) return JpegFrame(this, width, height)

    val source = BitmapFactory.decodeByteArray(this, 0, size)
        ?: error("Camera JPEG could not be decoded for rotation")
    val rotated = Bitmap.createBitmap(
        source, 0, 0, source.width, source.height, Matrix().apply { postRotate(rotation.toFloat()) }, true
    )
    if (rotated !== source) source.recycle()
    return try {
        val bytes = ByteArrayOutputStream().use { stream ->
            rotated.compress(Bitmap.CompressFormat.JPEG, quality, stream)
            stream.toByteArray()
        }
        JpegFrame(bytes, rotated.width, rotated.height)
    } finally {
        rotated.recycle()
    }
}
