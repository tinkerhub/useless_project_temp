import Foundation
import AVFoundation

enum SoundGenerator {
    
    static func ensureSoundsExist() {
        let dir = soundsDirectory()
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        
        let specs: [(Zone, SoundSpec)] = [
            (.zone1, .deepThud),
            (.zone2, .softPulse),
            (.zone3, .doubleTap),
            (.zone4, .sharpTap),
            (.zone5, .highTap)
        ]
        
        for (zone, spec) in specs {
            let url = dir.appendingPathComponent("\(zone.soundName).wav")
            if FileManager.default.fileExists(atPath: url.path) { continue }
            do {
                try render(spec: spec, to: url)
                print("🎵 Generated \(zone.soundName).wav")
            } catch {
                print("❌ Failed to generate \(zone.soundName): \(error)")
            }
        }
    }
    
    static func soundsDirectory() -> URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        return base.appendingPathComponent("Sezpad/Sounds", isDirectory: true)
    }
    
    // Removed 'private' so the extension at the bottom can see it
    struct SoundSpec {
        var segments: [Segment]
        var gain: Float = 0.9
    }
    
    // Removed 'private'
    struct Segment {
        var freq: Double
        var duration: Double
        var waveform: Waveform
        var attack: Double = 0.005
        var release: Double = 0.15
        var freqEnd: Double? = nil
    }
    
    // Removed 'private'
    enum Waveform { case sine, triangle, noise }
    
    private static let sampleRate: Double = 44100
    
    private static func render(spec: SoundSpec, to url: URL) throws {
        var samples: [Float] = []
        for seg in spec.segments {
            let n = Int(seg.duration * sampleRate)
            for i in 0..<n {
                let t = Double(i) / sampleRate
                let progress = Double(i) / Double(max(1, n - 1))
                let f: Double = {
                    guard let end = seg.freqEnd else { return seg.freq }
                    return seg.freq + (end - seg.freq) * progress
                }()
                
                let phase = 2.0 * .pi * f * t
                var sample: Double
                switch seg.waveform {
                case .sine: sample = sin(phase)
                case .triangle: sample = 2.0 * abs(2.0 * (t * f - floor(t * f + 0.5))) - 1.0
                case .noise: sample = Double.random(in: -1...1)
                }
                
                let attackEnv = min(1.0, t / seg.attack)
                let releaseStart = seg.duration - seg.release
                let releaseEnv: Double = t < releaseStart ? 1.0 : pow(1.0 - (t - releaseStart) / seg.release, 2.0)
                sample *= attackEnv * releaseEnv
                samples.append(Float(sample) * spec.gain)
            }
        }
        try wav(from: samples).write(to: url)
    }
    
    private static func wav(from samples: [Float]) throws -> Data {
        let numSamples = samples.count
        let bytesPerSample = 2
        let dataSize = numSamples * bytesPerSample
        let fileSize = 36 + dataSize
        
        var d = Data()
        func append(_ s: String) { d.append(s.data(using: .ascii)!) }
        func append(_ v: UInt32) { var x = v.littleEndian; d.append(Data(bytes: &x, count: 4)) }
        func append(_ v: UInt16) { var x = v.littleEndian; d.append(Data(bytes: &x, count: 2)) }
        
        append("RIFF"); append(UInt32(fileSize)); append("WAVE")
        append("fmt "); append(UInt32(16)); append(UInt16(1)); append(UInt16(1))
        append(UInt32(sampleRate)); append(UInt32(sampleRate * Double(bytesPerSample)))
        append(UInt16(bytesPerSample)); append(UInt16(16))
        append("data"); append(UInt32(dataSize))
        
        for s in samples {
            let clamped = max(-1.0, min(1.0, s))
            var le = Int16(clamped * 32767.0).littleEndian
            d.append(Data(bytes: &le, count: 2))
        }
        return d
    }
}

// MARK: - Zone Presets
// Now this extension can access SoundSpec because we removed 'private'
extension SoundGenerator.SoundSpec {
    static var deepThud: Self { Self(segments: [.init(freq: 90, duration: 0.28, waveform: .sine, attack: 0.003, release: 0.25, freqEnd: 55)], gain: 0.95) }
    static var softPulse: Self { Self(segments: [.init(freq: 220, duration: 0.16, waveform: .triangle, attack: 0.005, release: 0.12)], gain: 0.65) }
    static var doubleTap: Self { Self(segments: [
        .init(freq: 660, duration: 0.055, waveform: .triangle, attack: 0.002, release: 0.04),
        .init(freq: 0, duration: 0.045, waveform: .sine),
        .init(freq: 740, duration: 0.06, waveform: .triangle, attack: 0.002, release: 0.05)
    ], gain: 0.7) }
    static var sharpTap: Self { Self(segments: [
        .init(freq: 1200, duration: 0.03, waveform: .noise, attack: 0.001, release: 0.028),
        .init(freq: 1400, duration: 0.05, waveform: .sine, attack: 0.001, release: 0.045)
    ], gain: 0.55) }
    static var highTap: Self { Self(segments: [.init(freq: 880, duration: 0.09, waveform: .sine, attack: 0.002, release: 0.08, freqEnd: 1320)], gain: 0.6) }
}
