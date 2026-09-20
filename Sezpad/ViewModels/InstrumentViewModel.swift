

import Foundation
import Combine
import SwiftUI

@MainActor
final class InstrumentViewModel: ObservableObject {
    
    // Published state (drives the UI)
    
    @Published private(set) var currentZone: Zone? = nil
    @Published private(set) var currentPressure: Double = 0.0
    @Published private(set) var isTouching: Bool = false
    @Published private(set) var eventCount: Int = 0
    
    /// User-facing toggles (bound to the switches in the top-right of the UI).
    @Published var soundEnabled: Bool = true
    @Published var hapticsEnabled: Bool = true
    
    // Dependencies
    
    private let input = TrackpadInput()
    private let keyboard = KeyboardInput()
    private let mapper = ZoneMapper.self
    private let haptics = HapticController()
    private let sound = SoundController()
    
    //  Internal state
    
    private var cancellables = Set<AnyCancellable>()
    private var lastFiredZone: Zone? = nil
    private var lastFireTime: Date = .distantPast
    private let fireCooldown: TimeInterval = 0.12   // 120ms between triggers
    private var clearZoneTask: Task<Void, Never>? = nil
    
    // Lifecycle
    
    init() {
        bindInput()
    }
    
    func start() {
        input.start()
        keyboard.start()
    }
    
    func stop() {
        input.stop()
        keyboard.stop()
        clearZoneTask?.cancel()
    }
    
    // Input Binding
    
    private func bindInput() {
        input.events
            .receive(on: RunLoop.main)
            .sink { [weak self] event in
                self?.process(event)
            }
            .store(in: &cancellables)
        keyboard.zoneEvents
            .receive(on: RunLoop.main)
            .sink { [weak self] zone in
                self?.triggerFromKeyboard(zone: zone)
            }
            .store(in: &cancellables)
    }
    
    // Core Logic
    
    private func process(_ event: TrackpadEvent) {
        eventCount += 1
        
        switch event.phase {
        case .began:
            handleTouch(event, isNewTouch: true)
            
        case .moved:
            // Always update the pressure bar — it looks alive.
            currentPressure = event.pressure
            handleTouch(event, isNewTouch: false)
            
        case .ended:
            isTouching = false
            lastFiredZone = nil
            scheduleZoneClear()
        }
    }
    
    private func handleTouch(_ event: TrackpadEvent, isNewTouch: Bool) {
        isTouching = true
        currentPressure = event.pressure
        
        // Cancel any pending "clear zone" (user touched again)
        clearZoneTask?.cancel()
        clearZoneTask = nil
        
        guard let zone = mapper.map(x: event.x, y: event.y) else {
            return
        }
        
        // Update UI immediately — no debounce on visuals.
        currentZone = zone
        
        // Decide whether to FIRE the output (haptic + sound).
        let zoneChanged = (zone != lastFiredZone)
        let cooldownPassed = Date().timeIntervalSince(lastFireTime) > fireCooldown
        
        // Fire when: new touch on a zone, OR zone changed while dragging.
        let shouldFire = (zoneChanged && cooldownPassed) || (isNewTouch && zoneChanged)
        
        guard shouldFire else { return }
        
        fire(zone: zone, pressure: event.pressure)
        lastFiredZone = zone
        lastFireTime = Date()
    }
    
    private func fire(zone: Zone, pressure: Double) {
        if hapticsEnabled {
            if zone == .zone3 {
                haptics.triggerDoubleTap(pressure: pressure)
            } else {
                haptics.trigger(zone: zone, pressure: pressure)
            }
        }
        
        if soundEnabled {
            sound.play(zone: zone, pressure: pressure)
        }
    }
    
    /// After the finger lifts, keep the zone lit for a moment,
    /// then fade it out so the UI doesn't feel dead.
    private func scheduleZoneClear() {
        clearZoneTask?.cancel()
        clearZoneTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 400_000_000) // 400ms
            guard let self, !Task.isCancelled else { return }
            if !self.isTouching {
                self.currentZone = nil
                self.currentPressure = 0.0
            }
        }
    }
    
    // Derived UI helpers
    
    var pressurePercent: Int {
        Int((currentPressure * 100).rounded())
    }
    
    var zoneTitle: String {
        currentZone?.name ?? "—"
    }
    
    var zoneSubtitle: String {
        currentZone?.description ?? "Touch the trackpad"
    }
    
    var noteLabel: String {
        guard let z = currentZone else { return "—" }
        return "\(z.noteGlyph)  \(z.noteName)"
    }
    // Manually triggers a zone from the UI (click fallback).
    // Useful when haptics aren't available or for on-screen demos.
    func manualTrigger(zone: Zone) {
        currentZone = zone
        currentPressure = 0.75
        isTouching = true
        fire(zone: zone, pressure: 0.75)
        scheduleZoneClear()
    }
    private func triggerFromKeyboard(zone: Zone) {
            currentZone = zone
            currentPressure = 1.0
            isTouching = true
            fire(zone: zone, pressure: 1.0)
            scheduleZoneClear()
        }
}
