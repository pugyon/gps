import { useState, useEffect, useRef, useCallback } from 'react';
import { CurrentLocation } from '../types';

interface UseGeoSensorsOptions {
  onLocationUpdate?: (location: CurrentLocation) => void;
  simulationMode?: boolean;
}

export function useGeoSensors({ onLocationUpdate, simulationMode = false }: UseGeoSensorsOptions = {}) {
  const [location, setLocation] = useState<CurrentLocation | null>(null);
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [hasCompassSupport, setHasCompassSupport] = useState<boolean>(false);
  const [needsCompassPermission, setNeedsCompassPermission] = useState<boolean>(false);
  const [isLoadingGps, setIsLoadingGps] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);

  // Check if iOS DeviceOrientationEvent permission is required
  useEffect(() => {
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      const DeviceOrientationEventAny = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
      if (typeof DeviceOrientationEventAny.requestPermission === 'function') {
        setNeedsCompassPermission(true);
      } else {
        setHasCompassSupport(true);
      }
    }
  }, []);

  // Request iOS Compass Permission
  const requestCompassPermission = useCallback(async () => {
    if (typeof window === 'undefined') return false;
    const DeviceOrientationEventAny = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof DeviceOrientationEventAny.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEventAny.requestPermission();
        if (response === 'granted') {
          setNeedsCompassPermission(false);
          setHasCompassSupport(true);
          return true;
        } else {
          setGpsError('コンパスセンサーへのアクセスが拒否されました。設定で許可してください。');
          return false;
        }
      } catch (err) {
        console.error('Compass permission error:', err);
        return false;
      }
    }
    return true;
  }, []);

  // Listen to Device Orientation (Electronic Compass)
  useEffect(() => {
    if (simulationMode) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      let heading: number | null = null;

      // iOS Safari provides webkitCompassHeading directly (0 = True North, clockwise)
      const webkitEvent = e as unknown as { webkitCompassHeading?: number; webkitCompassAccuracy?: number };
      if (typeof webkitEvent.webkitCompassHeading === 'number' && webkitEvent.webkitCompassHeading >= 0) {
        heading = webkitEvent.webkitCompassHeading;
      } else if (e.alpha !== null) {
        // Android / W3C: alpha is angle around z-axis [0, 360)
        // If absolute is true, 0 is North. For normal compass clockwise heading:
        if (e.absolute) {
          heading = (360 - e.alpha) % 360;
        } else {
          heading = (360 - e.alpha) % 360;
        }
      }

      if (heading !== null) {
        setHasCompassSupport(true);
        setCompassHeading(Math.round(heading));
      }
    };

    // First try deviceorientationabsolute (better for True North), then fallback
    const eventName = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(eventName, handleOrientation as EventListener, true);

    return () => {
      window.removeEventListener(eventName, handleOrientation as EventListener, true);
    };
  }, [simulationMode]);

  // Handle position update
  const handlePositionSuccess = useCallback((pos: GeolocationPosition) => {
    setGpsError(null);
    setIsLoadingGps(false);

    const newLocation: CurrentLocation = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      altitude: pos.coords.altitude !== null ? Math.round(pos.coords.altitude * 10) / 10 : null,
      altitudeAccuracy: pos.coords.altitudeAccuracy !== null ? Math.round(pos.coords.altitudeAccuracy * 10) / 10 : null,
      accuracy: Math.round(pos.coords.accuracy),
      heading: pos.coords.heading !== null && !isNaN(pos.coords.heading) ? Math.round(pos.coords.heading) : null,
      speed: pos.coords.speed !== null ? Math.round(pos.coords.speed * 10) / 10 : null,
      timestamp: pos.timestamp,
    };

    setLocation(newLocation);
    if (onLocationUpdate) {
      onLocationUpdate(newLocation);
    }
  }, [onLocationUpdate]);

  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    setIsLoadingGps(false);
    switch (err.code) {
      case err.PERMISSION_DENIED:
        setGpsError('位置情報の利用が許可されていません。ブラウザ設定で位置情報を許可してください。');
        break;
      case err.POSITION_UNAVAILABLE:
        setGpsError('GPS信号を取得できませんでした。屋外など電波の良い場所でお試しください。');
        break;
      case err.TIMEOUT:
        setGpsError('GPSの測位がタイムアウトしました。電波状況をご確認ください。');
        break;
      default:
        setGpsError('GPSエラーが発生しました。');
        break;
    }
  }, []);

  // Single fetch current location (e.g. for Record Location button)
  const getCurrentPosition = useCallback((): Promise<CurrentLocation> => {
    setIsLoadingGps(true);
    setGpsError(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = 'お使いのブラウザはGPS（位置情報）に対応していません。';
        setGpsError(err);
        setIsLoadingGps(false);
        reject(new Error(err));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handlePositionSuccess(pos);
          const loc: CurrentLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            altitude: pos.coords.altitude !== null ? Math.round(pos.coords.altitude * 10) / 10 : null,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            accuracy: Math.round(pos.coords.accuracy),
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
          };
          resolve(loc);
        },
        (err) => {
          handlePositionError(err);
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        }
      );
    });
  }, [handlePositionSuccess, handlePositionError]);

  // Start continuous tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('GPS機能が利用できません。');
      return;
    }

    setIsTracking(true);
    setIsLoadingGps(true);
    setGpsError(null);

    // Initial immediate position fetch
    navigator.geolocation.getCurrentPosition(
      handlePositionSuccess,
      handlePositionError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Watch position
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000,
      }
    );
  }, [handlePositionSuccess, handlePositionError]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    location,
    setLocation,
    compassHeading,
    setCompassHeading,
    isTracking,
    isLoadingGps,
    gpsError,
    setGpsError,
    hasCompassSupport,
    needsCompassPermission,
    requestCompassPermission,
    getCurrentPosition,
    startTracking,
    stopTracking,
  };
}
