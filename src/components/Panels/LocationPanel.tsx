import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Crosshair,
  ArrowUpDown,
  Search,
  Loader2,
  X,
  Navigation2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { LocationItem } from '../../types';
import { searchLocations, getCurrentPosition } from '../../services/geocoding';

interface LocationPanelProps {
  fromLocation: LocationItem | null;
  toLocation: LocationItem | null;
  onSelectFrom: (loc: LocationItem) => void;
  onSelectTo: (loc: LocationItem) => void;
  onSwapLocations: () => void;
  onCalculateRoute: () => void;
  isCalculating: boolean;
  minimized: boolean;
  onToggleMinimize: () => void;
}

export const LocationPanel: React.FC<LocationPanelProps> = ({
  fromLocation,
  toLocation,
  onSelectFrom,
  onSelectTo,
  onSwapLocations,
  onCalculateRoute,
  isCalculating,
  minimized,
  onToggleMinimize,
}) => {
  const [fromQuery, setFromQuery] = useState(fromLocation?.name || '');
  const [toQuery, setToQuery] = useState(toLocation?.name || '');
  const [fromResults, setFromResults] = useState<LocationItem[]>([]);
  const [toResults, setToResults] = useState<LocationItem[]>([]);
  const [isSearchingFrom, setIsSearchingFrom] = useState(false);
  const [isSearchingTo, setIsSearchingTo] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'from' | 'to' | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state if locations change externally (e.g. from preset selection)
  useEffect(() => {
    if (fromLocation) setFromQuery(fromLocation.shortName || fromLocation.name);
  }, [fromLocation]);

  useEffect(() => {
    if (toLocation) setToQuery(toLocation.shortName || toLocation.name);
  }, [toLocation]);

  // Handle outside click to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for FROM input
  useEffect(() => {
    if (activeDropdown !== 'from') return;
    if (!fromQuery || fromQuery.trim().length < 2) {
      setFromResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingFrom(true);
      const results = await searchLocations(fromQuery);
      setFromResults(results);
      setIsSearchingFrom(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [fromQuery, activeDropdown]);

  // Debounced search for TO input
  useEffect(() => {
    if (activeDropdown !== 'to') return;
    if (!toQuery || toQuery.trim().length < 2) {
      setToResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingTo(true);
      const results = await searchLocations(toQuery);
      setToResults(results);
      setIsSearchingTo(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [toQuery, activeDropdown]);

  const handleUseMyLocation = async () => {
    setGeoLoading(true);
    setErrorMessage(null);
    try {
      const loc = await getCurrentPosition();
      onSelectFrom(loc);
      setFromQuery(loc.shortName || loc.name);
      setActiveDropdown(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Geolocation failed. Enter location manually.');
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSwap = () => {
    onSwapLocations();
    const temp = fromQuery;
    setFromQuery(toQuery);
    setToQuery(temp);
  };

  const canCalculate = Boolean(fromLocation && toLocation);

  return (
    <div
      ref={containerRef}
      className={`absolute top-20 left-4 z-20 w-[calc(100vw-2rem)] max-w-md transition-all duration-300 pointer-events-auto ${
        minimized ? 'opacity-90 hover:opacity-100' : ''
      }`}
    >
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {/* Header bar of panel */}
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-subtle" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Route Parameters
            </span>
          </div>
          <button
            onClick={onToggleMinimize}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            title={minimized ? 'Expand route search' : 'Minimize route search'}
          >
            {minimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {/* Collapsed Pill View */}
        {minimized && (
          <div
            onClick={onToggleMinimize}
            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap text-xs">
              <span className="font-medium text-emerald-400">
                {fromLocation ? fromLocation.shortName || fromLocation.name : 'Origin'}
              </span>
              <span className="text-slate-500">→</span>
              <span className="font-medium text-rose-400">
                {toLocation ? toLocation.shortName || toLocation.name : 'Destination'}
              </span>
            </div>
            <span className="text-[11px] text-cyan-400 font-medium ml-2 shrink-0">Expand</span>
          </div>
        )}

        {/* Expanded Form View */}
        {!minimized && (
          <div className="p-4 space-y-3">
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <span className="text-rose-400 font-bold">!</span>
                <span>{errorMessage}</span>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="ml-auto text-rose-400 hover:text-rose-200"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Inputs Container */}
            <div className="relative space-y-2">
              {/* FROM Location Input */}
              <div className="relative">
                <div className="flex items-center gap-2 bg-space-950/60 rounded-xl px-3 py-2.5 border border-white/10 focus-within:border-cyan-500/50 transition-all">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-400 shrink-0" />
                  <input
                    type="text"
                    value={fromQuery}
                    onChange={(e) => {
                      setFromQuery(e.target.value);
                      setActiveDropdown('from');
                    }}
                    onFocus={() => setActiveDropdown('from')}
                    placeholder="Enter starting location..."
                    className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                  {isSearchingFrom && <Loader2 size={14} className="animate-spin text-slate-400 shrink-0" />}
                  {fromQuery && !isSearchingFrom && (
                    <button
                      onClick={() => {
                        setFromQuery('');
                        setFromResults([]);
                      }}
                      className="text-slate-500 hover:text-slate-300 p-0.5"
                    >
                      <X size={13} />
                    </button>
                  )}
                  <button
                    onClick={handleUseMyLocation}
                    disabled={geoLoading}
                    title="Use my current GPS location"
                    className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-colors shrink-0 disabled:opacity-50"
                  >
                    {geoLoading ? <Loader2 size={15} className="animate-spin text-cyan-400" /> : <Crosshair size={15} />}
                  </button>
                </div>

                {/* FROM Autocomplete Dropdown */}
                {activeDropdown === 'from' && fromResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 max-h-56 overflow-y-auto rounded-xl bg-space-900/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50">
                    {fromResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectFrom(item);
                          setFromQuery(item.shortName || item.name);
                          setActiveDropdown(null);
                        }}
                        className="px-3.5 py-2.5 text-xs hover:bg-cyan-500/10 hover:text-cyan-300 cursor-pointer border-b border-white/5 last:border-0 flex items-start gap-2.5 transition-colors"
                      >
                        <MapPin size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                        <div className="overflow-hidden">
                          <p className="font-medium text-slate-200 truncate">{item.shortName}</p>
                          <p className="text-[10px] text-slate-400 truncate">{item.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Swap Button In-Between */}
              <div className="flex justify-end pr-3 -my-1 relative z-10">
                <button
                  onClick={handleSwap}
                  title="Swap Starting and Destination points"
                  className="w-7 h-7 rounded-full glass-panel flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 hover:scale-110 active:scale-95 transition-all shadow-md"
                >
                  <ArrowUpDown size={12} />
                </button>
              </div>

              {/* TO Location Input */}
              <div className="relative">
                <div className="flex items-center gap-2 bg-space-950/60 rounded-xl px-3 py-2.5 border border-white/10 focus-within:border-cyan-500/50 transition-all">
                  <MapPin size={14} className="text-rose-400 shrink-0" />
                  <input
                    type="text"
                    value={toQuery}
                    onChange={(e) => {
                      setToQuery(e.target.value);
                      setActiveDropdown('to');
                    }}
                    onFocus={() => setActiveDropdown('to')}
                    placeholder="Enter destination..."
                    className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                  {isSearchingTo && <Loader2 size={14} className="animate-spin text-slate-400 shrink-0" />}
                  {toQuery && !isSearchingTo && (
                    <button
                      onClick={() => {
                        setToQuery('');
                        setToResults([]);
                      }}
                      className="text-slate-500 hover:text-slate-300 p-0.5"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* TO Autocomplete Dropdown */}
                {activeDropdown === 'to' && toResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 max-h-56 overflow-y-auto rounded-xl bg-space-900/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50">
                    {toResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectTo(item);
                          setToQuery(item.shortName || item.name);
                          setActiveDropdown(null);
                        }}
                        className="px-3.5 py-2.5 text-xs hover:bg-cyan-500/10 hover:text-cyan-300 cursor-pointer border-b border-white/5 last:border-0 flex items-start gap-2.5 transition-colors"
                      >
                        <MapPin size={14} className="text-rose-400 shrink-0 mt-0.5" />
                        <div className="overflow-hidden">
                          <p className="font-medium text-slate-200 truncate">{item.shortName}</p>
                          <p className="text-[10px] text-slate-400 truncate">{item.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Calculate Action Button */}
            <button
              onClick={onCalculateRoute}
              disabled={!canCalculate || isCalculating}
              className={`w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-200 ${
                canCalculate && !isCalculating
                  ? 'bg-gradient-to-r from-cyan-600 via-cyan-500 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-[0.98]'
                  : 'bg-slate-800/60 text-slate-500 border border-white/5 cursor-not-allowed'
              }`}
            >
              {isCalculating ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Calculating Global Trajectory...</span>
                </>
              ) : (
                <>
                  <Navigation2 size={16} className="fill-white" />
                  <span>Find Path</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
