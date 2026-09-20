import SwiftUI

struct ContentView: View {
    @EnvironmentObject var vm: InstrumentViewModel
    
    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            VStack(spacing: 16) {
                header
                HStack(alignment: .top, spacing: 16) {
                    SidebarView()
                    TrackpadView()
                    VStack(spacing: 16) {
                        ControlsView()
                        ZoneLegendView()
                    }
                }
                .frame(maxHeight: .infinity)
                footer
            }
            .padding(20)
        }
        .frame(minWidth: 900, minHeight: 600)
    }
    
    private var header: some View {
        HStack(spacing: 14) {
            Image(systemName: "waveform.circle.fill")
                .font(.system(size: 42))
                .foregroundStyle(Theme.panelStroke)
            VStack(alignment: .leading, spacing: 2) {
                Text("Sezpad")
                    .font(.system(size: 26, weight: .heavy, design: .monospaced))
                    .foregroundStyle(Theme.ink)
                Text("Your MacBook trackpad can do sez on the beat boi.")
                    .font(.system(size: 13, design: .monospaced))
                    .foregroundStyle(Theme.subtleInk)
            }
            Spacer()
        }
    }
    
    private var footer: some View {
        Text("Touch the trackpad. Make it vibrate. by Neekhill:) inspired by notes.krishkrosh.com")
            .font(.system(size: 14, weight: .medium, design: .monospaced))
            .foregroundStyle(Theme.ink)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(Theme.panelFill)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Theme.panelStroke, lineWidth: 1.5)
            )
            .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
