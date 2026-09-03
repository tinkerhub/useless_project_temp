# RotiWorld — Product Requirements Document

## 1. One-liner
RotiWorld is a deliberately useless computer-vision toy: photograph a misshapen chapati, and the app tells you — with unwarranted confidence — which country's outline your roti most closely resembles, complete with a similarity score and a side-by-side shape comparison.

## 2. Vision & Tone
- Purely entertainment/novelty — a shareable, meme-able toy, not a serious geography or nutrition tool.
- Tone: playful, deadpan-serious UI copy delivering absurd results with total confidence (e.g. "Your chapati is 87.3% Madagascar").
- Should feel fast, fun, and screenshot-worthy.

## 3. Goals
- **[G1]** Extract the outline of a chapati from a user-submitted photo.
- **[G2]** Extract outlines for every country in the world from the WRI bounds dataset.
- **[G3]** Compare the chapati outline to every country outline using a scale-invariant shape-similarity algorithm — **size must not matter**, only shape.
- **[G4]** Return the single best-matching country + similarity score, plus a visual shape overlay.
- **[G5]** Make every stage of the pipeline (thresholding, matching algorithm, scoring formula, dataset choice) tunable via config, not hardcoded, so the project stays easy to tweak and re-run.

## 4. Non-Goals
- Not attempting geographic/political accuracy or endorsement of borders (WRI's disclaimer applies as-is — see §12).
- Not a food-recognition app — no attempt to verify the object actually is a chapati.
- Not optimized for adversarial/clinical-grade image conditions — a phone photo on a reasonably plain surface is the expected input.
- No user accounts / auth in v1 (stretch goal only, see §9 Phase 5).

## 5. Core User Flow
1. User opens RotiWorld.
2. User uploads or takes a photo of a chapati (ideally on a contrasting, plain-ish background).
3. App shows the detected outline overlaid on the photo — "Is this your chapati?" sanity-check step.
4. User confirms (or retakes the photo if the outline looks wrong).
5. App computes similarity against every country and returns:
   - Best match: country name + score (e.g. "78.4% match")
   - Side-by-side / overlaid outline comparison, both shapes normalized to the same scale
   - Optional leaderboard: top-5 "honorable mentions"
6. User can export/share the result as an image card.

## 6. System Architecture

Two pipelines — one built once offline, one run per request:

```
OFFLINE (run once / on config change)
  WRI-bounds SVG or GeoJSON
       │
       ▼
  Per-country polygon extraction
       │
       ▼
  Normalize (center, scale-normalize)
       │
       ▼
  Cache: {iso_a3, name, contour_points, hu_moments, area, bbox} → country_cache.pkl

ONLINE (per request)
  Photo upload
       │
       ▼
  Preprocess: grayscale → blur → threshold → morphology
       │
       ▼
  cv2.findContours → largest/outer contour
       │
       ▼
  Normalize (same method as offline pipeline)
       │
       ▼
  cv2.matchShapes against every cached country contour
       │
       ▼
  Rank → best match + leaderboard
       │
       ▼
  Frontend renders result + overlay
```

## 7. Functional Requirements

### 7.1 Country Boundary Data Pipeline (offline)

**Data source**: [`wri/wri-bounds`](https://github.com/wri/wri-bounds) (CC0-1.0 licensed, based on Natural Earth Data).

> ⚠️ **Resolve in Phase 0**: the SVGs at the repo root (`in_miller.svg`, `us_wintri.svg`, `intl_wintri.svg`, etc.) are **whole-world composite maps** in specific projections, not one file per country. Individual country shapes need to come from either:
> - **(a)** `dist/svgs.zip` — *if* it turns out to contain per-country paths, or
> - **(b)** one of the whole-world SVGs, splitting `<path>` elements by their per-country id/class attribute, or
> - **(c)** falling back to the **GeoJSON** exports in the same repo (`dist/all_primary_countries.geojson` / `dist/all_countries.geojson`), which need no path-string parsing at all and are the recommended fallback if the SVG route is messy.
>
> The config below supports swapping data source (`svg` vs `geojson`) without touching the comparison engine — pipeline output (a normalized point array per country) is identical either way.

**Requirements:**
- **[FR1.1]** Parse the chosen source (`svgelements`/`svgpathtools` for SVG `d` attributes, or `shapely`/`geopandas` for GeoJSON polygons) into raw coordinate arrays per country.
- **[FR1.2]** For multi-polygon countries (islands, archipelagos, exclaves — e.g. Indonesia, Philippines, Japan, Chile), select a strategy per config:
  - `largest_only` (default): use only the largest-area polygon (mainland).
  - `all_merged`: treat all polygons as one contour set (experimental — flag as such).
- **[FR1.3]** Convert each polygon to an OpenCV-compatible contour: `np.array([[x, y]], dtype=np.int32)`.
- **[FR1.4]** Normalize each contour (§7.3) and cache `{iso_a3, name, contour_points, hu_moments, area, bbox}` to `country_cache.pkl`.
- **[FR1.5]** Pipeline runs via a single idempotent script: `build_country_cache.py`.
- **[FR1.6]** Store dataset provenance + WRI CC0 attribution note in the cache metadata.

### 7.2 Chapati Image Processing (online, per request)

- **[FR2.1]** Accept image upload (jpg/png/heic→convert); max size configurable (default 10 MB).
- **[FR2.2]** Preprocess: grayscale → Gaussian blur (kernel size configurable) → threshold. Support `otsu` (default) and `adaptive_gaussian`, since chapati/plate/table lighting varies.
- **[FR2.3]** Morphological cleanup (`cv2.morphologyEx`, open/close) to remove noise specks; kernel size configurable.
- **[FR2.4]** `cv2.findContours` with `RETR_EXTERNAL` + `CHAIN_APPROX_SIMPLE`; pick the contour with the largest `cv2.contourArea`; reject if below `min_contour_area_ratio` of image area → return an error asking for a retake.
- **[FR2.5]** Optionally simplify with `cv2.approxPolyDP` (epsilon as % of arc length, configurable) before comparison, to reduce noise from torn/crumbly edges — keep the unsimplified version for display.
- **[FR2.6]** Return the detected contour overlaid on the original image for the confirmation step.

### 7.3 Normalization (applied identically to chapati contour and every country contour)

This is what makes size irrelevant and the comparison fair.

- **[FR3.1]** Center each contour at its centroid (translation invariance).
- **[FR3.2]** Scale-normalize by dividing coordinates by a configurable size measure:
  - `bounding_box_diagonal` (default)
  - `sqrt_area`
  - `max_radius`
- **[FR3.3]** Rotation is **not** manually normalized — `cv2.matchShapes`'s Hu-moment basis is rotation-invariant by construction (§7.4). If a rotation-aligned method is added later (e.g. PCA-axis alignment, for use with Procrustes-style metrics), it's a separate config path.

### 7.4 Shape Comparison Engine

- **[FR4.1]** Primary metric: `cv2.matchShapes(contour_a, contour_b, method, 0)` — inherently translation-, rotation-, and **scale-invariant** via Hu moments, directly satisfying "size should be ignored."
  - `method` configurable: `CONTOURS_MATCH_I1` (default), `I2`, `I3`.
- **[FR4.2]** `matchShapes` returns a *distance* (0 = identical, unbounded above). Convert to a user-facing similarity score (0–100%) via configurable formula, default:
  `similarity = 100 * exp(-k * distance)`, with `k` tunable (default `5`) — calibrate empirically so scores don't all cluster near 0% or 100%.
- **[FR4.3]** Optional secondary/tie-break metric (feature-flagged, **off by default** in v1): OpenCV-contrib `ShapeContextDistanceExtractor` or Hausdorff distance, for cases where Hu-moment matching gives unintuitive results (e.g. mirror-image shapes scoring identically under I1/I2/I3 — decide deliberately in Phase 0, not by accident).
- **[FR4.4]** Compare the chapati contour against **every** cached country contour; since country contours are precomputed this should be O(n) — target < 1 second for ~195 countries on typical hardware.
- **[FR4.5]** Sort ascending by distance (= descending similarity); return top-1 (best match) + top-N (`leaderboard_size`, default 5).

### 7.5 Results & Display

- **[FR5.1]** Return the winning country (name, ISO code, optional flag), similarity score, and the *normalized* point arrays for both contours (already same scale) so the frontend can draw them overlaid or side-by-side without extra backend rendering.
- **[FR5.2]** Provide a backend-rendered comparison image (matplotlib/OpenCV draw) as a fallback for non-JS clients / shareable export.
- **[FR5.3]** Leaderboard: ranked list of top-N countries with scores.
- **[FR5.4]** Shareable card: composited image (chapati photo + outline + country outline + score + branding), generated server-side (Pillow) or client-side (canvas).
- **[FR5.5]** Playful copy generator: template strings keyed by score bucket (e.g. `>90%`: "Cartographically confirmed."; `<20%`: "Your chapati defies national borders.") — lives in a config/JSON file, not hardcoded in logic.

### 7.6 API (for a split backend/frontend build)

```
POST /api/analyze
  body: multipart/form-data { image: file }
  response: {
    detected_contour: [[x, y], ...],
    confirm_required: true
  }

POST /api/match
  body: { contour: [[x, y], ...] }   // the confirmed/adjusted contour
  response: {
    best_match: { country: "Madagascar", iso_a3: "MDG", score: 78.4 },
    leaderboard: [ { country, iso_a3, score }, ... up to N ],
    chapati_outline_normalized: [[x, y], ...],
    country_outline_normalized: [[x, y], ...]
  }
```
Split into two calls so the UI can show the "confirm your chapati outline" step before committing to full comparison — better UX, avoids wasted compute on bad photos.

## 8. Configuration Reference (single source of truth — `config.yaml`)

Everything tunable lives here so behavior changes without touching pipeline code:

```yaml
country_data:
  source: svg                                 # svg | geojson
  svg_path: ./data/intl_wintri.svg
  geojson_path: ./data/all_primary_countries.geojson
  polygon_selection_strategy: largest_only    # largest_only | all_merged
  cache_path: ./cache/country_cache.pkl

image_processing:
  max_upload_mb: 10
  blur_kernel: 7
  threshold_method: otsu                      # otsu | adaptive_gaussian
  morph_kernel: 5
  min_contour_area_ratio: 0.02                # reject if chapati contour < 2% of image area
  simplify_epsilon_pct: 0.5                   # % of arc length; 0 disables simplification

normalization:
  scale_norm_method: bounding_box_diagonal    # bounding_box_diagonal | sqrt_area | max_radius

matching:
  primary_method: CONTOURS_MATCH_I1           # CONTOURS_MATCH_I1 | I2 | I3
  score_formula: exponential                  # exponential | linear_clamped
  score_k: 5
  leaderboard_size: 5
  secondary_metric_enabled: false             # shape_context | hausdorff (future)

copy:
  templates_path: ./data/result_copy.json
```

## 9. Tech Stack (suggested — swap freely)

| Layer | Recommendation | Why |
|---|---|---|
| CV / matching | Python + `opencv-python` (+ `opencv-contrib-python` for optional secondary metrics) | Native `matchShapes`, mature ecosystem |
| Boundary parsing | `svgelements`/`svgpathtools` (SVG route) or `shapely` + `geopandas` (GeoJSON route) | Avoids hand-rolled path/polygon math |
| Backend API | FastAPI | Async, easy multipart upload handling, auto docs |
| Frontend | React (Vite), or Streamlit for a fast MVP | Streamlit gets to a working demo fastest; React gives a nicer shareable UI later |
| Image compositing | Pillow | Server-side shareable card generation |
| Caching | Flat file (pickle/JSON) — no DB needed | Country set is static, ~195 entries |

**MVP suggestion**: build the whole thing as a single Streamlit app first (Phase 1–4), then peel off FastAPI + React only if a polished shareable product is wanted (Phase 5).

## 10. Phased Delivery Plan

### Phase 0 — Data Spike (½–1 day)
- [ ] Download `wri-bounds` dist files; determine the actual structure of `dist/svgs.zip` (per-country paths or not).
- [ ] Decide SVG vs GeoJSON as primary source based on ease of parsing (default assumption: GeoJSON, since it sidesteps SVG path-parsing edge cases — revisit if the SVG source is genuinely clean and per-country).
- [ ] Extract and plot 3 sample countries (one simple — e.g. Chad; one complex — e.g. Norway; one archipelago — e.g. Philippines) to sanity-check the pipeline.

### Phase 1 — Offline Country Cache Builder
- [ ] `build_country_cache.py`: parse boundary source → per-country contour → normalize → Hu moments → save cache.
- [ ] Unit test: cache contains ~195 entries, no empty/degenerate contours.
- [ ] Visual smoke test: render a handful of cached outlines to confirm they're correct (not mirrored, not scaled wrong).

### Phase 2 — Chapati Contour Extraction
- [ ] Image upload + preprocessing pipeline.
- [ ] Contour detection + confirmation overlay.
- [ ] Handle failure case: no contour found / ambiguous contours → user-facing error + retake prompt.

### Phase 3 — Matching Engine
- [ ] Implement `matchShapes`-based comparator against cached country contours.
- [ ] Implement score formula; calibrate `score_k` against a small manual test set (5–10 photos, gut-check only — this is calibration for fun, not ground-truth accuracy).
- [ ] Return top-1 + leaderboard.

### Phase 4 — UI/UX & Shareability
- [ ] Result screen: score, country name, side-by-side outline overlay, leaderboard.
- [ ] Playful copy templates wired to score buckets.
- [ ] Shareable image export.

### Phase 5 — Polish / Stretch
- [ ] Mobile camera capture flow.
- [ ] "Chapati of the day" / community gallery (needs light backend storage — out of scope for v1).
- [ ] Alternate boundary sets for fun (US states, world rivers, constellations) — same pipeline, just swap `country_data.source`.
- [ ] Secondary matching metric (shape context / Hausdorff) as an A/B toggle.

## 11. Edge Cases & Error Handling

| Case | Handling |
|---|---|
| No object detected / background too similar in color to chapati | Reject; ask user to retake on a contrasting surface |
| Multiple similar-sized candidate contours (two chapatis in frame, plate rim also detected) | Pick largest by area; if top-2 areas are within a configurable margin, ask the user to confirm which one via the preview step |
| Torn/multi-piece chapati (fragmented contour) | Default: largest fragment only, with UI copy acknowledging "we matched your biggest piece"; `all_merged` available as an experimental option |
| Country with disputed/multiple boundary versions (WRI provides US/China/India perspectives) | Default to one perspective (`intl`/neutral) via config; this is a documented choice, not something the app decides dynamically |
| Upload isn't food at all | Out of scope for v1 — the app will happily "match" any closed outline; consistent with the deliberately-useless spirit, not treated as a bug |
| Perfectly circular chapati | Will match whichever country happens to be roundest — expected and fine |

## 12. Success Metrics (fun project, fun metrics)
- Same input photo → same result, every time (fully deterministic pipeline; no randomness anywhere except explicitly-labeled experimental features).
- End-to-end analyze time < 3 seconds on a typical laptop/cloud instance.
- Manual QA: 10 test photos produce visually plausible outline detection (traces the chapati, not the plate/shadow) ≥ 9/10 times.
- Shareability: result card renders legibly at social-media thumbnail size.

## 13. Licensing / Attribution
- `wri-bounds` is CC0-1.0 — no attribution legally required, but a small "boundary data: WRI (CC0)" footer credit is good practice.
- WRI's own disclaimer applies as-is: these boundary files don't imply any opinion on legal status or endorsement of country areas/boundaries — worth surfacing in an "about" page given the app draws country shapes for entertainment.
- Verify any flag-icon set used has a compatible license before shipping.

## 14. Open Questions
1. Does `dist/svgs.zip` in `wri-bounds` actually contain per-country SVG paths, or only whole-map SVGs like those at the repo root? *(Resolve in Phase 0 — determines SVG vs GeoJSON as primary source.)*
2. Should mirror-image matches count as a "match"? Hu moments under `matchShapes` may not fully distinguish chirality — fine for a joke app, but worth a deliberate decision rather than an accident.
3. Should country selection include non-UN territories/dependencies, or "primary countries" only (WRI provides both)? Default recommendation: primary/UN-member set, to keep the leaderboard meaningful.

---
*This PRD is intentionally structured with an explicit config reference (§8) and a task-checklist delivery plan (§10) so an agentic coding tool can implement it phase-by-phase and a human can retune behavior (thresholds, matching method, scoring, copy) without editing pipeline code.*
