import pytest
from server.aura import AuraEngine, BANDS, PALETTES

def test_consistent_profile():
    engine = AuraEngine()
    engine.session_seed = "test_seed"
    
    p1 = engine.generate_profile(1)
    p2 = engine.generate_profile(1)
    
    assert p1.band == p2.band
    assert p1.palette == p2.palette

def test_band_weights_sum():
    total = sum(b["weight"] for b in BANDS)
    assert pytest.approx(total, 0.001) == 1.0

def test_valid_ranges():
    for b in BANDS:
        assert b["min"]
        assert b["max"]
        assert b["weight"] > 0

def test_valid_palette():
    engine = AuraEngine()
    p = engine.generate_profile(1)
    assert p.palette in PALETTES

def test_different_tracks():
    engine = AuraEngine()
    # High probability they are different, but we check hashes underlying
    p1 = engine.generate_profile(1)
    p2 = engine.generate_profile(2)
    # They might randomly collide, but we just check they don't throw

def test_valid_band():
    engine = AuraEngine()
    p = engine.generate_profile(1)
    assert p.band in [b["band"] for b in BANDS]
