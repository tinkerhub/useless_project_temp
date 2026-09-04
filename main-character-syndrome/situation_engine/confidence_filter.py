def confidence_filter(confidence: float, floor: float = 0.25, ceiling: float = 0.99):
    return max(floor, min(ceiling, float(confidence)))
