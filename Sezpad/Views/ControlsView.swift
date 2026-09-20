import SwiftUI

struct ControlsView: View {
    @EnvironmentObject var vm: InstrumentViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ToggleRow(icon: "speaker.wave.2.fill", label: "Sound ON", isOn: $vm.soundEnabled)
            ToggleRow(icon: "waveform.path", label: "Haptics ON", isOn: $vm.hapticsEnabled)
        }
        .padding(12).frame(width: 220)
        .background(Theme.panelFill)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.panelStroke, lineWidth: 1.5))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

private struct ToggleRow: View {
    let icon: String
    let label: String
    @Binding var isOn: Bool
    
    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon).font(.system(size: 14)).foregroundStyle(Theme.ink).frame(width: 18)
            Text(label).font(.system(size: 13, weight: .medium, design: .monospaced)).foregroundStyle(Theme.ink)
            Spacer()
            Toggle("", isOn: $isOn).labelsHidden().toggleStyle(.switch).tint(Theme.accentGreen).scaleEffect(0.85)
        }
    }
}
