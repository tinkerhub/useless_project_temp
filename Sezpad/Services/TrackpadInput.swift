import AppKit
import Combine

//Touch Phase

enum TouchPhase {
    case began
    case moved
    case ended
}

//Trackpad Event

struct TrackpadEvent {
    let x: Double          // 0.0 to 1.0 lr
    let y: Double          // 0.0 to 1.0 bt
    let pressure: Double   // 0.0 → 1.0 (Force Touch only)
    let phase: TouchPhase
}

//TrackpadInput

final class TrackpadInput {
    
    //Emits a TrackpadEvent whenever the user touches, moves, or releases.
    let events = PassthroughSubject<TrackpadEvent, Never>()
    
    private var localMonitor: Any?
    private var isTouching = false
    
    //Lifecycle
    
    func start() {
        
        localMonitor = NSEvent.addLocalMonitorForEvents(
            matching: [.leftMouseDown, .leftMouseDragged, .leftMouseUp, .pressure]
        ) { [weak self] event in
            self?.handle(event)
            return event
        }
        
        print("bawe, TrackpadInput started listening for touches")
    }
    
    func stop() {
        if let monitor = localMonitor {
            NSEvent.removeMonitor(monitor)
            localMonitor = nil
        }
    }
    
 
    
    private func handle(_ event: NSEvent) {
        
        let phase: TouchPhase
        switch event.type {
        case .leftMouseDown:
            phase = .began
            isTouching = true
        case .leftMouseUp:
            phase = .ended
            isTouching = false
        case .leftMouseDragged, .pressure:
            // `.pressure` events fire even without movement,
            // so treat them as "moved" if we're already touching.
            guard isTouching else { return }
            phase = .moved
        default:
            return
        }
        
        // Normalize the coordinates against the main screen.
        //    `NSEvent.mouseLocation` is in screen space (origin = bottom-left).
        let screen = NSScreen.main?.frame ?? .zero
        guard screen.width > 0, screen.height > 0 else { return }
        
        let mouse = NSEvent.mouseLocation
        let normX = (mouse.x - screen.origin.x) / screen.width
        let normY = (mouse.y - screen.origin.y) / screen.height
        
        // Read pressure. On non-Force-Touch Macs this will be 0.
       
        
        
        var pressure = Double(event.pressure)
        if pressure <= 0 {
           
            // Fast = hard press, slow = light press.
            let speed = Double(hypot(event.deltaX, event.deltaY))
            pressure = min(1.0, 0.3 + speed / 50.0)
        }
        
       
        let touch = TrackpadEvent(
            x: normX,
            y: normY,
            pressure: pressure,
            phase: phase
        )
        events.send(touch)
    }
    
    deinit {
        stop()
    }
}
