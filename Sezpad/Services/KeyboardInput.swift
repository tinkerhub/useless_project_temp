//
//  KeyboardInput.swift
//  Sezpad
//
//  Created by Nikhil s krishnan on 12/09/26.
//


import AppKit
import Combine

// Listens for number keys 1-5 (and arrow keys) and emits zone triggers.
// Works alongside TrackpadInput — the ViewModel decides what to do with them.
final class KeyboardInput {
    
    // Emits a Zone when a key is pressed.
    let zoneEvents = PassthroughSubject<Zone, Never>()
    
    private var monitor: Any?
    
    func start() {
        monitor = NSEvent.addLocalMonitorForEvents(matching: [.keyDown]) { [weak self] event in
            guard let self else { return event }
            
            if let zone = Self.zone(for: event) {
                self.zoneEvents.send(zone)
                return nil   // swallow the event so macOS doesn't beep
            }
            return event     // let other keys pass through
        }
    }
    
    func stop() {
        if let monitor {
            NSEvent.removeMonitor(monitor)
            self.monitor = nil
        }
    }
    
    private static func zone(for event: NSEvent) -> Zone? {
        guard let chars = event.charactersIgnoringModifiers else { return nil }
        
        switch chars {
        case "1": return .zone1
        case "2": return .zone2
        case "3": return .zone3
        case "4": return .zone4
        case "5": return .zone5
        case " ": return .zone5       // spacebar = the "big bottom" zone
        default:
            // Arrow keys via keyCode
            // Left = 123, Right = 124, Down = 125, Up = 126
            switch event.keyCode {
            case 123: return .zone1
            case 125: return .zone5
            case 124: return .zone4
            case 126: return .zone2
            default: return nil
            }
        }
    }
    
    deinit { stop() }
}
