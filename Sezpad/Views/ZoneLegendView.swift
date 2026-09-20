import SwiftUI

struct ZoneLegendView: View {
    @EnvironmentObject var vm: InstrumentViewModel
    
    var body: some View {
        Panel(title: "Zones & Sounds") {
            VStack(spacing: 6) {
                ForEach(Zone.allCases) { zone in
                    HStack(spacing: 10) {
                        RoundedRectangle(cornerRadius: 5)
                            .fill(zone.color)
                            .frame(width: 22, height: 22)
                            .overlay(
                                RoundedRectangle(cornerRadius: 5)
                                    .stroke(Theme.ink.opacity(0.2), lineWidth: 1)
                            )
                        
                        VStack(alignment: .leading, spacing: 1) {
                            Text(zone.name)
                                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                                .foregroundStyle(Theme.ink)
                            //Text(zone.description)
                                //.font(.system(size: 11, design: .monospaced))
                                //.foregroundStyle(Theme.subtleInk)
                        }
                        Spacer()
                    }
                    .padding(.vertical, 6)
                    .padding(.horizontal, 8)
                    .background(
                        RoundedRectangle(cornerRadius: 6)
                            .fill(vm.currentZone == zone ? zone.color.opacity(0.22) : Color.clear)
                    )
                    .animation(.easeOut(duration: 0.12), value: vm.currentZone)
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .topLeading)
        }
        .frame(width: 220)
    }
}
