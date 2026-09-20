


import SwiftUI

enum Theme {
    static let background   = Color(red: 0.96, green: 0.94, blue: 0.88)
    static let panelFill    = Color(red: 0.98, green: 0.96, blue: 0.91)
    static let panelStroke  = Color(red: 0.32, green: 0.45, blue: 0.70)
    static let headerFill   = Color(red: 0.78, green: 0.86, blue: 0.95)
    static let ink          = Color(red: 0.10, green: 0.14, blue: 0.25)
    static let subtleInk    = Color(red: 0.35, green: 0.40, blue: 0.50)
    static let accentGreen  = Color(red: 0.32, green: 0.72, blue: 0.40)
    static let trackpadBase = Color(red: 0.62, green: 0.66, blue: 0.72)
}

struct Panel<Content: View>: View {
    var title: String? = nil
    @ViewBuilder var content: Content
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if let title {
                Text(title)
                    .font(.system(size: 14, weight: .semibold, design: .monospaced))
                    .foregroundStyle(Theme.ink)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Theme.headerFill)
                Divider().overlay(Theme.panelStroke.opacity(0.4))
            }
            content
                .padding(12)
        }
        .background(Theme.panelFill)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Theme.panelStroke, lineWidth: 1.5)
        )
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
