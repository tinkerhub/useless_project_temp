import AppKit

final class HapticController {
    
    private let feedbackPerformer = NSHapticFeedbackManager.defaultPerformer
    
    
    // Parameters:
    // zone: The zone the user touched.
    // pressure: Normalized pressure value (0.0 to 1.0).
    func trigger(zone: Zone, pressure: Double) {
        // Clamp pressure just in case
        let p = max(0.0, min(1.0, pressure))
        
        
        // light(<0.33) medium(<0.66) firm(>=0.66) pressure
        let pattern: NSHapticFeedbackManager.FeedbackPattern
        
        if p < 0.33 {
            // low
            pattern = zone.hapticPattern == .generic ? .alignment : .generic
        } else if p < 0.66 {
            // mid
            pattern = zone.hapticPattern
        } else {
            // firm firm firm
            pattern = .levelChange
        }
        
        // Fire the haptic on the main thread (required by AppKit)
        DispatchQueue.main.async {
            self.feedbackPerformer.perform(
                pattern,
                performanceTime: .now
            )
        }
    }
    
    // Fires a special "double tap" pattern for Zone 3.
    // Since macOS has no built-in double-tap, we fire two haptics with a delay.
    func triggerDoubleTap(pressure: Double) {
        trigger(zone: .zone3, pressure: pressure)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.09) {
            self.feedbackPerformer.perform(.alignment, performanceTime: .now)
        }
    }
}
