import { PresetRoute } from '../types';

export const PRESET_ROUTES: PresetRoute[] = [
  {
    id: 'paris-eiffel-louvre',
    title: 'Eiffel Tower → The Louvre',
    description: 'Paris, France',
    from: {
      id: 'eiffel-tower',
      name: 'Eiffel Tower, Champ de Mars, Paris, France',
      shortName: 'Eiffel Tower, Paris',
      coords: { lat: 48.8584, lng: 2.2945 }
    },
    to: {
      id: 'louvre-museum',
      name: 'Louvre Museum, Rue de Rivoli, Paris, France',
      shortName: 'The Louvre, Paris',
      coords: { lat: 48.8606, lng: 2.3376 }
    },
    standardDistanceKm: 3.5,
    longDistanceKm: 40071.5,
    multiplier: 11449,
    highlight: 'Via the South Pacific, Cape Horn, and Indian Ocean'
  },
  {
    id: 'nyc-empire-times',
    title: 'Empire State → Times Square',
    description: 'New York City, USA',
    from: {
      id: 'empire-state',
      name: 'Empire State Building, 5th Ave, New York, NY, USA',
      shortName: 'Empire State Building',
      coords: { lat: 40.7484, lng: -73.9857 }
    },
    to: {
      id: 'times-square',
      name: 'Times Square, Broadway, New York, NY, USA',
      shortName: 'Times Square, Manhattan',
      coords: { lat: 40.7580, lng: -73.9855 }
    },
    standardDistanceKm: 1.1,
    longDistanceKm: 40073.9,
    multiplier: 36430,
    highlight: 'Via Antarctica, Western Australia, and the North Pole'
  },
  {
    id: 'tokyo-tower-shibuya',
    title: 'Tokyo Tower → Shibuya Crossing',
    description: 'Tokyo, Japan',
    from: {
      id: 'tokyo-tower',
      name: 'Tokyo Tower, Shibakoen, Minato City, Tokyo, Japan',
      shortName: 'Tokyo Tower',
      coords: { lat: 35.6586, lng: 139.7454 }
    },
    to: {
      id: 'shibuya-crossing',
      name: 'Shibuya Scramble Crossing, Shibuya City, Tokyo, Japan',
      shortName: 'Shibuya Crossing',
      coords: { lat: 35.6595, lng: 139.7005 }
    },
    standardDistanceKm: 4.1,
    longDistanceKm: 40070.9,
    multiplier: 9773,
    highlight: 'Via the Atlantic Ocean, Southern Africa, and the Bering Strait'
  },
  {
    id: 'london-ben-tower',
    title: 'Big Ben → Tower of London',
    description: 'London, United Kingdom',
    from: {
      id: 'big-ben',
      name: 'Big Ben, Westminster, London, UK',
      shortName: 'Big Ben, London',
      coords: { lat: 51.5007, lng: -0.1246 }
    },
    to: {
      id: 'tower-of-london',
      name: 'Tower of London, London, UK',
      shortName: 'Tower of London',
      coords: { lat: 51.5081, lng: -0.0759 }
    },
    standardDistanceKm: 3.6,
    longDistanceKm: 40071.4,
    multiplier: 11130,
    highlight: 'Via the Drake Passage, New Zealand, and Scandinavia'
  },
  {
    id: 'sf-bridge-alcatraz',
    title: 'Golden Gate → Alcatraz Island',
    description: 'San Francisco, USA',
    from: {
      id: 'golden-gate',
      name: 'Golden Gate Bridge, San Francisco, CA, USA',
      shortName: 'Golden Gate Bridge',
      coords: { lat: 37.8199, lng: -122.4783 }
    },
    to: {
      id: 'alcatraz',
      name: 'Alcatraz Island, San Francisco Bay, CA, USA',
      shortName: 'Alcatraz Island',
      coords: { lat: 37.8267, lng: -122.4230 }
    },
    standardDistanceKm: 4.9,
    longDistanceKm: 40070.1,
    multiplier: 8177,
    highlight: 'Via Madagascar, Central Asia, and the Arctic Ice Shelf'
  }
];
