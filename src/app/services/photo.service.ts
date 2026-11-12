import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { firstValueFrom } from 'rxjs';

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
  base64?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  /**
   * Capture a photo using the device camera or photo library.
   * Works on native mobile and in web browsers.
   */
  async takePhoto(): Promise<{ base64Data: string; dataUrl: string }> {
    try {
      const capturedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt,
        quality: 85,
        allowEditing: false,
      });

      if (!capturedPhoto.base64String) {
        throw new Error('No image data returned from camera');
      }

      const format = capturedPhoto.format || 'jpeg';
      const dataUrl = `data:image/${format};base64,${capturedPhoto.base64String}`;
      return {
        base64Data: capturedPhoto.base64String,
        dataUrl,
      };
    } catch (err: unknown) {
      // Fallback for desktop browsers if Capacitor Camera fails or is rejected
      console.warn('Camera plugin failed, using web file picker fallback:', err);
      return this.pickPhotoFromBrowser();
    }
  }

  /**
   * Fallback for browser file selection when camera plugin is unavailable.
   */
  private pickPhotoFromBrowser(): Promise<{ base64Data: string; dataUrl: string }> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const base64Data = dataUrl.split(',')[1] || '';
          resolve({ base64Data, dataUrl });
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }

  /**
   * Save photo to device storage using Capacitor Filesystem.
   */
  async savePhotoToDevice(taskId: string, base64OrDataUrl: string): Promise<string> {
    try {
      const filename = `task_${taskId}_${Date.now()}.jpg`;
      const cleanBase64 = base64OrDataUrl.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

      const savedFile = await Filesystem.writeFile({
        path: `photos/${filename}`,
        data: cleanBase64,
        directory: Directory.Data,
        recursive: true,
      });

      console.log(`[PhotoService] Saved photo to device: ${savedFile.uri}`);
      return savedFile.uri;
    } catch (err) {
      console.warn('[PhotoService] Filesystem writeFile failed (desktop fallback to localStorage):', err);
      const fallbackKey = `photo_cache_${taskId}_${Date.now()}`;
      try {
        localStorage.setItem(fallbackKey, base64OrDataUrl.substring(0, 100000));
      } catch (e) {
        // quota exceeded
      }
      return `local://${fallbackKey}`;
    }
  }

  /**
   * Read photo from device storage.
   */
  async loadPhotoFromDevice(path: string): Promise<string | null> {
    try {
      if (path.startsWith('local://')) {
        const key = path.replace('local://', '');
        return localStorage.getItem(key);
      }
      const file = await Filesystem.readFile({
        path,
        directory: Directory.Data,
      });
      return `data:image/jpeg;base64,${file.data}`;
    } catch (err) {
      console.warn('[PhotoService] Could not read file from device:', err);
      return null;
    }
  }

  /**
   * Upload photo to the backend server.
   */
  async uploadPhoto(taskId: string, photoData: string): Promise<string> {
    const res = await firstValueFrom(
      this.http.post<{ success: boolean; photoUrl: string }>(
        `${this.apiUrl}/tasks/${taskId}/photo`,
        { photo: photoData }
      )
    );
    return res.photoUrl;
  }

  /**
   * Standalone photo upload before task is created.
   */
  async uploadStandalonePhoto(photoData: string): Promise<string> {
    const res = await firstValueFrom(
      this.http.post<{ success: boolean; photoUrl: string }>(
        `${this.apiUrl}/upload`,
        { photo: photoData }
      )
    );
    return res.photoUrl;
  }
}
