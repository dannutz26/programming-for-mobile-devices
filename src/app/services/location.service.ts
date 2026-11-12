import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { TaskLocation } from '../models/task.model';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  // Default to Cluj-Napoca city center
  readonly DEFAULT_LOCATION: TaskLocation = {
    lat: 46.7712,
    lng: 23.6236,
    address: 'Cluj-Napoca, Romania',
  };

  /**
   * Get the current device GPS position with fallbacks.
   */
  async getCurrentPosition(): Promise<TaskLocation> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 8000,
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      return {
        lat,
        lng,
        address: `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      };
    } catch (err) {
      console.warn('[LocationService] Geolocation failed or denied, trying browser navigator:', err);

      if ('geolocation' in navigator) {
        try {
          const browserPos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          const lat = browserPos.coords.latitude;
          const lng = browserPos.coords.longitude;
          return {
            lat,
            lng,
            address: `Browser Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          };
        } catch (navErr) {
          console.warn('[LocationService] Navigator geolocation also failed:', navErr);
        }
      }

      // Return default location if all else fails
      return { ...this.DEFAULT_LOCATION };
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers.
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
