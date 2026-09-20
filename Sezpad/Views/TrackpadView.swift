import SwiftUI

struct TrackpadView: View {
    @EnvironmentObject var vm: InstrumentViewModel
    
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 14)
                .fill(Theme.trackpadBase)
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.ink.opacity(0.25), lineWidth: 1.5))
            VStack(spacing: 8) {
                HStack(spacing: 8) {
                    ZoneCell(zone: .zone1)
                    ZoneCell(zone: .zone2)
                    ZoneCell(zone: .zone3)
                    ZoneCell(zone: .zone4)
                }.frame(maxHeight: .infinity)
                ZoneCell(zone: .zone5).frame(maxHeight: .infinity)
            }
            .padding(12).frame(maxHeight: .infinity)
        }
        .aspectRatio(1.55, contentMode: .fit)
    }
}

private struct ZoneCell: View {
    let zone: Zone
    @EnvironmentObject var vm: InstrumentViewModel
    private var isActive: Bool { vm.currentZone == zone }
    
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 10).fill(zone.color.opacity(isActive ? 1.0 : 0.75))
            RoundedRectangle(cornerRadius: 10).stroke(isActive ? .white : Theme.ink.opacity(0.15), lineWidth: isActive ? 3 : 1)
            VStack(spacing: 4) {
                Text(zone.name).font(.system(size: 16, weight: .bold, design: .monospaced)).foregroundStyle(.white)
                //Text(zone.description).font(.system(size: 12, design: .monospaced)).foregroundStyle(.white.opacity(0.9))
            }
        }
        .scaleEffect(isActive ? 1.015 : 1.0)
        .animation(.spring(response: 0.18, dampingFraction: 0.7), value: isActive)
        .shadow(color: .black.opacity(isActive ? 0.18 : 0.05), radius: isActive ? 8 : 2, y: 2)
        .onTapGesture { vm.manualTrigger(zone: zone) }
    }
}
