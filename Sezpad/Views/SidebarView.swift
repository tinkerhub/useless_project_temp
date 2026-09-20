import SwiftUI

struct SidebarView: View {
    @EnvironmentObject var vm: InstrumentViewModel
    
    var body: some View {
        Panel(title: "Current Zone") {
            VStack(alignment: .leading, spacing: 18) {
                HStack(spacing: 10) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(vm.currentZone?.color ?? Theme.trackpadBase.opacity(0.4))
                        .frame(width: 28, height: 28)
                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(Theme.ink.opacity(0.25), lineWidth: 1))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(vm.zoneTitle).font(.system(size: 15, weight: .bold, design: .monospaced)).foregroundStyle(Theme.ink)
                        Text("Zone active").font(.system(size: 12, design: .monospaced)).foregroundStyle(Theme.subtleInk)
                    }
                }
                Divider().overlay(Theme.panelStroke.opacity(0.3))
                VStack(alignment: .leading, spacing: 8) {
                    Text("Pressure").font(.system(size: 13, weight: .semibold, design: .monospaced)).foregroundStyle(Theme.ink)
                    HStack(spacing: 10) {
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 4).fill(.white)
                                    .overlay(RoundedRectangle(cornerRadius: 4).stroke(Theme.panelStroke, lineWidth: 1.2))
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(vm.currentZone?.color ?? Theme.accentGreen)
                                    .frame(width: max(0, geo.size.width * vm.currentPressure))
                                    .animation(.easeOut(duration: 0.08), value: vm.currentPressure)
                            }
                        }.frame(height: 22)
                        Text("\(vm.pressurePercent)%")
                            .font(.system(size: 13, weight: .semibold, design: .monospaced))
                            .foregroundStyle(Theme.ink).frame(width: 44, alignment: .trailing)
                            .monospacedDigit()
                    }
                }
                Divider().overlay(Theme.panelStroke.opacity(0.3))
                VStack(alignment: .leading, spacing: 6) {
                    Text("Note").font(.system(size: 13, weight: .semibold, design: .monospaced)).foregroundStyle(Theme.ink)
                    Text(vm.noteLabel).font(.system(size: 14, design: .monospaced)).foregroundStyle(Theme.ink)
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .frame(width: 240)
    }
}
