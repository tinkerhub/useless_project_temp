import SwiftUI

@main
struct HapticInstrumentApp: App {
    @StateObject private var vm = InstrumentViewModel()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(vm)
                .onAppear {
                    vm.start()
                    // Auto-fullscreen for demo
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                        if let window = NSApp.windows.first,
                           !window.styleMask.contains(.fullScreen) {
                            window.toggleFullScreen(nil)
                        }
                    }
                }
                .onDisappear {
                    vm.stop()
                }
        }
        .windowStyle(.hiddenTitleBar)
        .defaultSize(width: 980, height: 640)
    }
}
