/// <reference types="google.maps" />

let googleMapsPromise: Promise<typeof google> | null = null;

/**
 * Wait for Google Maps API to be fully initialized
 * Google Maps loads in stages, so we need to wait for the Map constructor
 */
function waitForGoogleMaps(): Promise<typeof google> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max (50 * 100ms)

    const checkGoogleMaps = () => {
      if (typeof google !== 'undefined' &&
          google.maps &&
          google.maps.Map &&
          typeof google.maps.Map === 'function') {
        resolve(google);
        return;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        reject(new Error('Google Maps API failed to initialize after 5 seconds'));
        return;
      }

      setTimeout(checkGoogleMaps, 100);
    };

    checkGoogleMaps();
  });
}

export function loadGoogleMaps(): Promise<typeof google> {
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // If Google Maps is already fully loaded, return it
    if (typeof google !== 'undefined' &&
        google.maps &&
        google.maps.Map &&
        typeof google.maps.Map === 'function') {
      resolve(google);
      return;
    }

    // If script is already in DOM but not fully loaded, wait for it
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      waitForGoogleMaps().then(resolve).catch(reject);
      return;
    }

    // Load the script
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error('Google Maps API key not configured'));
      return;
    }

    // Use callback approach for more reliable loading
    const callbackName = `initGoogleMaps_${Date.now()}`;
    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      waitForGoogleMaps().then(resolve).catch(reject);
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    script.onerror = (event) => {
      googleMapsPromise = null; // Reset so we can retry
      delete (window as any)[callbackName];
      console.error('Google Maps script load error:', event);
      reject(new Error('Google Maps script failed to load. Check if the API key is valid and the Maps JavaScript API is enabled in Google Cloud Console.'));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
