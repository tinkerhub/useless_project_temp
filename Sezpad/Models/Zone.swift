import SwiftUI
import AppKit

enum Zone: Int, CaseIterable, Identifiable {
    case zone1 = 1
    case zone2 = 2
    case zone3 = 3
    case zone4 = 4
    case zone5 = 5
    
    var id: Int { self.rawValue }
    
    
    var name: String {
        switch self {
        case .zone1: return "Zone 1"
        case .zone2: return "Zone 2"
        case .zone3: return "Zone 3"
        case .zone4: return "Zone 4"
        case .zone5: return "Zone 5"
        }
    }
    
    var description: String {
        switch self {
        case .zone1: return "Deep Thud"
        case .zone2: return "Soft Pulse"
        case .zone3: return "Double Tap"
        case .zone4: return "Sharp Tap"
        case .zone5: return "High Tap"
        }
    }
    
    
    
    
    var soundName: String {
        switch self {
        case .zone1: return "deep_thud"
        case .zone2: return "soft_pulse"
        case .zone3: return "double_tap"
        case .zone4: return "sharp_tap"
        case .zone5: return "high_tap"
        }
    }
    
    var color: Color {
        switch self {
        case .zone1: return Color(red: 0.4, green: 0.6, blue: 0.9) // B
        case .zone2: return Color(red: 0.4, green: 0.85, blue: 0.6) // G
        case .zone3: return Color(red: 0.6, green: 0.4, blue: 0.9) // Purple
        case .zone4: return Color(red: 0.9, green: 0.85, blue: 0.4) // Y
        case .zone5: return Color(red: 0.9, green: 0.4, blue: 0.5) // Pink
        }
    }
    
    
    
    
    
    var hapticPattern: NSHapticFeedbackManager.FeedbackPattern {
        switch self {
        case .zone1: return .generic
        case .zone2: return .alignment
        case .zone3: return .levelChange
        case .zone4: return .generic
        case .zone5: return .levelChange
        }
    }
}



import Foundation

extension Zone {
    
    var noteName: String {
        switch self {
        case .zone1: return "Boom"
        case .zone2: return "Puh"
        case .zone3: return "Ta-ta"
        case .zone4: return "Tik"
        case .zone5: return "Ping"
        }
    }
    
    // A single music-note glyph for the sidebar. Purely decorative.
    var noteGlyph: String {
        switch self {
        case .zone1: return "𝄢"   // bass clef
        case .zone2: return "♪"
        case .zone3: return "♫"
        case .zone4: return "♩"
        case .zone5: return "♬"
        }
    }
}
