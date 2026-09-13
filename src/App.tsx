import React, { useState, useRef, useEffect } from 'react';
import { Coordinates, LocationItem, RouteData, AppPhase, PresetRoute } from './types';
import { generateLongWayRouteCoordinates, generateShortestRouteCoordinates, computeRouteTelemetry } from './utils/route';
import { PRESET_ROUTES } from './services/presets';
import { GlobeView } from './components/Visualization/GlobeView';
import { MapView } from './components/Visualization/MapView';
import { LocalSectorView } from './components/Visualization/LocalSectorView';
import { HeaderHUD } from './components/HUD/HeaderHUD';
import { GoogleEarthControls } from './components/HUD/GoogleEarthControls';
import { BottomStatusBar } from './components/HUD/BottomStatusBar';
import { LocationPanel } from './components/Panels/LocationPanel';
import { ResultPanel } from './components/Panels/ResultPanel';
import { PresetRoutes } from './components/Panels/PresetRoutes';
import { AboutModal } from './components/Panels/AboutModal';
import { DashboardStats } from './components/HUD/DashboardStats';
import { LandingPage } from './components/Landing/LandingPage';

export const App: React.FC = () => {
  // View mode: landing front page vs interactive 3D navigator deck
  const [viewMode, setViewMode] = useState<'landing' | 'navigator'>('landing');

  // Navigation & Location state (defaults to Paris preset)
  const [fromLocation, setFromLocation] = useState<LocationItem | null>(PRESET_ROUTES[0].from);
  const [toLocation, setToLocation] = useState<LocationItem | null>(PRESET_ROUTES[0].to);
  const [routeData, setRouteData] = useState<RouteData | null>(null);

  // Visualization mode
  const [is3D, setIs3D] = useState(true);

  // Animation timeline phase
  const [phase, setPhase] = useState<AppPhase>('idle');
  const [drawProgress, setDrawProgress] = useState(0); // 0 to 1
  const [sectorTransitionProgress, setSectorTransitionProgress] = useState(0); // 0 to 1
  const [isCalculating, setIsCalculating] = useState(false);

  // UI modal and panel toggles
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Telemetry updates from 3D camera & cursor
  const [cursorCoords, setCursorCoords] = useState<Coordinates | null>({ lat: 48.8584, lng: 2.2945 });
  const [cameraInfo, setCameraInfo] = useState({ heading: 0, tilt: 20, cameraAltKm: 14032 });

  // External controller ref for Google Earth controls
  const externalControlsRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    resetNorth: () => void;
    resetView: () => void;
  } | null>(null);

  // Initialize initial route data on mount
  useEffect(() => {
    if (fromLocation && toLocation) {
      calculateRoute(false);
    }
  }, []);

  const calculateRoute = (triggerAnimation: boolean = true) => {
    if (!fromLocation || !toLocation) return;
    setIsCalculating(true);

    const telemetry = computeRouteTelemetry(fromLocation.coords, toLocation.coords);
    const coordinates = generateLongWayRouteCoordinates(fromLocation.coords, toLocation.coords, 400);
    const shortestCoordinates = generateShortestRouteCoordinates(fromLocation.coords, toLocation.coords, 60);

    const newRoute: RouteData = {
      from: fromLocation,
      to: toLocation,
      telemetry,
      coordinates,
      shortestCoordinates,
    };

    setRouteData(newRoute);
    setIsCalculating(false);

    if (triggerAnimation) {
      runCinematicSequence();
    } else {
      setDrawProgress(1);
    }
  };

  /**
   * Seamless Cinematic Sequence:
   * 1. 3D Camera dives smoothly from space orbit down into departure coordinates (1.4s)
   * 2. Locks onto 2D display of the 80km x 80km sector with departure azimuth vector (1.6s)
   * 3. Smooth zoom-out transition back to orbital 3D globe (1.4s)
   * 4. Glowing trajectory sweeps across Earth's surface (3.2s)
   * 5. Camera settles into overview & navigation summary panel appears
   */
  const runCinematicSequence = () => {
    setViewMode('navigator');
    setIsPanelMinimized(true);
    setIsResultOpen(false);
    setDrawProgress(0);
    setSectorTransitionProgress(0);

    // Ensure 3D mode is active for the globe backdrop
    setIs3D(true);

    // Step 1: Smooth 3D camera dive from space orbit into departure airfield (1.4s)
    setPhase('dive_to_departure');

    setTimeout(() => {
      // Step 2: Lock onto 80km x 80km 2D Local Sector Display (1.6s)
      setPhase('local_sector_2d');

      setTimeout(() => {
        // Step 3: Smooth zoom out transition from 80km display out to 3D Globe (1.4s)
        setPhase('zoom_out_to_globe');

        const zoomOutStart = performance.now();
        const zoomOutDuration = 1400;

        const stepZoomOut = (now: number) => {
          const elapsed = now - zoomOutStart;
          const progress = Math.min(1, elapsed / zoomOutDuration);
          // Smooth cubic ease-in-out
          const eased = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

          setSectorTransitionProgress(eased);

          if (progress < 1) {
            requestAnimationFrame(stepZoomOut);
          } else {
            // Step 4: Draw glowing trajectory across Earth over 3.2 seconds
            setPhase('drawing_route');
            const drawStart = performance.now();
            const drawDuration = 3200;

            const stepDraw = (t: number) => {
              const drawElapsed = t - drawStart;
              const drawP = Math.min(1, drawElapsed / drawDuration);
              // Ease in-out quad
              const easedDraw = drawP < 0.5 ? 2 * drawP * drawP : 1 - Math.pow(-2 * drawP + 2, 2) / 2;
              setDrawProgress(easedDraw);

              if (drawP < 1) {
                requestAnimationFrame(stepDraw);
              } else {
                // Step 5: Camera settles into final overview & reveal navigation results
                setPhase('settled');
                setIsResultOpen(true);
              }
            };

            requestAnimationFrame(stepDraw);
          }
        };

        requestAnimationFrame(stepZoomOut);
      }, 1600);
    }, 1400);
  };

  const handleSelectPreset = (preset: PresetRoute) => {
    setViewMode('navigator');
    setFromLocation(preset.from);
    setToLocation(preset.to);
    setIsPanelMinimized(false);

    // Compute route with animation
    const telemetry = computeRouteTelemetry(preset.from.coords, preset.to.coords);
    const coordinates = generateLongWayRouteCoordinates(preset.from.coords, preset.to.coords, 400);
    const shortestCoordinates = generateShortestRouteCoordinates(preset.from.coords, preset.to.coords, 60);

    const newRoute: RouteData = {
      from: preset.from,
      to: preset.to,
      telemetry,
      coordinates,
      shortestCoordinates,
    };

    setRouteData(newRoute);
    runCinematicSequence();
  };

  const handleSwap = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  if (viewMode === 'landing') {
    return (
      <LandingPage
        onStartNavigation={() => setViewMode('navigator')}
        onSelectPreset={handleSelectPreset}
      />
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-space-950 font-sans select-none">
      {/* Background Visualizer: 3D High-Contrast Grayscale Globe or 2D Flat Map */}
      {is3D ? (
        <GlobeView
          routeData={routeData}
          phase={phase}
          drawProgress={drawProgress}
          onCursorMove={setCursorCoords}
          onCameraChange={setCameraInfo}
          externalControlRef={externalControlsRef}
        />
      ) : (
        <MapView
          routeData={routeData}
          drawProgress={drawProgress}
          onCursorMove={setCursorCoords}
        />
      )}

      {/* 2D 80km x 80km Local Sector Display Overlay */}
      <LocalSectorView
        location={fromLocation}
        bearing={routeData?.telemetry.longWayBearing ?? 0}
        bearingCompass={routeData?.telemetry.longWayBearingCompass ?? 'N'}
        visible={phase === 'local_sector_2d' || phase === 'zoom_out_to_globe'}
        transitionProgress={sectorTransitionProgress}
      />

      {/* Top Navigation System Header */}
      <HeaderHUD
        is3D={is3D}
        onToggleView={() => setIs3D(!is3D)}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onReturnToLanding={() => setViewMode('landing')}
        hasActiveRoute={Boolean(routeData)}
      />

      {/* Floating Route Search & Location Input Deck */}
      <LocationPanel
        fromLocation={fromLocation}
        toLocation={toLocation}
        onSelectFrom={setFromLocation}
        onSelectTo={setToLocation}
        onSwapLocations={handleSwap}
        onCalculateRoute={() => calculateRoute(true)}
        isCalculating={isCalculating}
        minimized={isPanelMinimized}
        onToggleMinimize={() => setIsPanelMinimized(!isPanelMinimized)}
      />

      {/* Right-hand Landing Dashboard Stats (Global Geodesic Metrics & Featured Routes) */}
      <DashboardStats
        routeData={routeData}
        onSelectPreset={handleSelectPreset}
        visible={!isResultOpen && !isPanelMinimized && phase !== 'local_sector_2d' && phase !== 'zoom_out_to_globe'}
      />

      {/* Google Earth Navigation Gizmos (Bottom Right) */}
      <div className="absolute bottom-11 right-4 z-20">
        <GoogleEarthControls
          heading={cameraInfo.heading}
          tilt={cameraInfo.tilt}
          is3D={is3D}
          onResetNorth={() => externalControlsRef.current?.resetNorth()}
          onToggle3D={() => setIs3D(!is3D)}
          onZoomIn={() => externalControlsRef.current?.zoomIn()}
          onZoomOut={() => externalControlsRef.current?.zoomOut()}
          onResetView={() => externalControlsRef.current?.resetView()}
        />
      </div>

      {/* Results HUD Panel */}
      {isResultOpen && (
        <ResultPanel
          routeData={routeData}
          onClose={() => setIsResultOpen(false)}
          onReplayAnimation={runCinematicSequence}
        />
      )}

      {/* Modals */}
      <PresetRoutes
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Authentic Google Earth Bottom Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <BottomStatusBar
          cursorCoords={cursorCoords}
          cameraAltKm={cameraInfo.cameraAltKm}
          headingDegrees={cameraInfo.heading}
        />
      </div>
    </div>
  );
};
