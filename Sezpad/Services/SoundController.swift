import AVFoundation
import AppKit

final class SoundController {
    
    private var audioPlayers: [String: AVAudioPlayer] = [:]
    
    init() {
        preloadSounds()
    }
    
    private func preloadSounds() {
        for zone in Zone.allCases {
            // 1. Try to load from the app bundle (bundled custom sounds)
            if let url = Bundle.main.url(forResource: zone.soundName, withExtension: "wav") {
                loadPlayer(url: url, name: zone.soundName, source: "bundle")
                continue
            }
            
            // 2. Fall back: generate + load from Application Support
            SoundGenerator.ensureSoundsExist()
            let dir = SoundGenerator.soundsDirectory()
            let url = dir.appendingPathComponent("\(zone.soundName).wav")
            if FileManager.default.fileExists(atPath: url.path) {
                loadPlayer(url: url, name: zone.soundName, source: "generated")
            } else {
                print("bawe Missing sound: \(zone.soundName).wav")
            }
        }
    }
    
    private func loadPlayer(url: URL, name: String, source: String) {
        do {
            let player = try AVAudioPlayer(contentsOf: url)
            player.prepareToPlay()
            player.volume = 0.7
            audioPlayers[name] = player
            print("bawe its Loaded \(name).wav from \(source)")
        } catch {
            print("bawe,its Failed to load \(name): \(error)")
        }
    }
    
    func play(zone: Zone, pressure: Double) {
        let p = Float(max(0.1, min(1.0, pressure)))
        
        if let player = audioPlayers[zone.soundName] {
            player.volume = p
            player.currentTime = 0
            player.play()
        } else {
            NSSound.beep()
        }
    }
}
