import { useState, useEffect } from 'react';
import { MOCK_TRACKING_EVENTS } from '../data/mockTrackingEvents';

export function useFakeTracking() {
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isDelivered, setIsDelivered] = useState(false);

  useEffect(() => {
    const timers = MOCK_TRACKING_EVENTS.map((event, index) => {
      return setTimeout(() => {
        setCurrentEventIndex(index);
        if (index === MOCK_TRACKING_EVENTS.length - 1) {
          setIsDelivered(true);
        }
      }, event.time);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  return {
    currentStatus: MOCK_TRACKING_EVENTS[currentEventIndex].message,
    progress: currentEventIndex / (MOCK_TRACKING_EVENTS.length - 1),
    isDelivered
  };
}
