import Foundation

struct ZoneMapper {
    // Maps normalized trackpad coordinates (0.0 to 1.0) to a Zone.
    // Parameters:
    // x: Normalized x-coordinate (0.0 = left, 1.0 = right)
    // y: Normalized y-coordinate (0.0 = bottom, 1.0 = top)
    // Returns: The corresponding Zone, or nil if outside bounds.
    static func map(x: Double, y: Double) -> Zone? {
        
        guard (0.0...1.0).contains(x), (0.0...1.0).contains(y) else {
            return nil
        }
        
        // 16% each zone (1-4) and zone 5 bottom which will zone 5
        
        if y < 0.4 {
            return .zone5
        } else {
            // Zone 1-4
            let columnWidth = 1.0 / 4.0
            
            if x < columnWidth {
                return .zone1
            } else if x < columnWidth * 2 {
                return .zone2
            } else if x < columnWidth * 3 {
                return .zone3
            } else {
                return .zone4
            }
        }
    }
}
