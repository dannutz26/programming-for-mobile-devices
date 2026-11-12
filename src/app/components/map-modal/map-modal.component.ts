import { Component, Input, OnInit, AfterViewInit, OnDestroy, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonChip,
  IonLabel,
  IonFooter,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkOutline, locateOutline, navigateOutline, pinOutline } from 'ionicons/icons';
import * as L from 'leaflet';
import { TaskLocation } from '../../models/task.model';
import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-map-modal',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    IonChip,
    IonLabel,
    IonFooter,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>
          {{ mode === 'select' ? 'Select Location' : 'Task Location' }}
        </ion-title>
        <ion-buttons slot="start">
          <ion-button (click)="cancel()">
            <ion-icon name="close-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          @if (mode === 'select') {
            <ion-button (click)="confirmLocation()" [disabled]="!selectedLocation">
              <ion-icon name="checkmark-outline" slot="start"></ion-icon>
              Save
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="map-content">
      <div #mapContainer class="leaflet-container-box"></div>

      <!-- Floating Controls Overlay -->
      <div class="map-overlay-controls">
        <ion-button size="small" fill="solid" color="light" class="locate-btn" (click)="locateUser()">
          <ion-icon name="locate-outline" slot="start"></ion-icon>
          My Location
        </ion-button>
      </div>

      <!-- Info Footer / Banner -->
      @if (selectedLocation) {
        <div class="location-banner">
          <ion-chip color="primary">
            <ion-icon name="pin-outline"></ion-icon>
            <ion-label>
              {{ selectedLocation.lat | number: '1.4-4' }}, {{ selectedLocation.lng | number: '1.4-4' }}
            </ion-label>
          </ion-chip>
          @if (selectedLocation.address) {
            <p class="address-text">{{ selectedLocation.address }}</p>
          }
          @if (userDistance !== null) {
            <p class="distance-text">
              <ion-icon name="navigate-outline"></ion-icon>
              Distance from you: <strong>{{ userDistance }} km</strong>
            </p>
          }
        </div>
      }
    </ion-content>

    @if (mode === 'select') {
      <ion-footer>
        <ion-toolbar>
          <div class="instructions">
            <p>Tap anywhere on the map to place the location pin</p>
          </div>
        </ion-toolbar>
      </ion-footer>
    }
  `,
  styles: [
    `
      .map-content {
        position: relative;
        --padding-top: 0;
        --padding-bottom: 0;
        --padding-start: 0;
        --padding-end: 0;
      }

      .leaflet-container-box {
        width: 100%;
        height: 100%;
        min-height: 400px;
        z-index: 1;
      }

      .map-overlay-controls {
        position: absolute;
        top: 16px;
        right: 16px;
        z-index: 1000;
      }

      .locate-btn {
        --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        font-weight: 600;
      }

      .location-banner {
        position: absolute;
        bottom: 20px;
        left: 16px;
        right: 16px;
        background: var(--ion-background-color, #ffffff);
        color: var(--ion-text-color, #000000);
        padding: 12px 16px;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .address-text {
        font-size: 0.85rem;
        margin: 2px 0 0 0;
        color: var(--ion-color-step-600, #666);
      }

      .distance-text {
        font-size: 0.82rem;
        margin: 4px 0 0 0;
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--ion-color-primary, #3880ff);
      }

      .instructions {
        text-align: center;
        padding: 4px 12px;
        font-size: 0.85rem;
        color: var(--ion-color-step-600, #666);
      }
      .instructions p {
        margin: 0;
      }
    `,
  ],
})
export class MapModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() mode: 'select' | 'view' = 'select';
  @Input() initialLocation?: TaskLocation;
  @Input() taskTitle?: string;

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLDivElement>;

  private modalCtrl = inject(ModalController);
  private locationService = inject(LocationService);

  private map?: L.Map;
  private marker?: L.Marker;
  private userMarker?: L.Marker;

  selectedLocation?: TaskLocation;
  userDistance: number | null = null;

  constructor() {
    addIcons({ closeOutline, checkmarkOutline, locateOutline, navigateOutline, pinOutline });
  }

  ngOnInit() {
    if (this.initialLocation) {
      this.selectedLocation = { ...this.initialLocation };
    } else {
      this.selectedLocation = { ...this.locationService.DEFAULT_LOCATION };
    }
  }

  ngAfterViewInit() {
    // Delay slightly to ensure modal container dimensions are calculated
    setTimeout(() => {
      this.initMap();
    }, 150);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private createCustomPin(color: string): L.DivIcon {
    return L.divIcon({
      className: 'custom-pin-marker',
      html: `
        <div style="transform: translate(-17px, -42px); cursor: pointer;">
          <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 0C7.61116 0 0 7.61116 0 17C0 27.5 17 42 17 42C17 42 34 27.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="${color}"/>
            <circle cx="17" cy="17" r="7" fill="#ffffff"/>
          </svg>
        </div>`,
      iconSize: [34, 42],
      iconAnchor: [17, 42],
    });
  }

  private initMap() {
    if (!this.mapContainer?.nativeElement) return;

    const lat = this.selectedLocation?.lat || this.locationService.DEFAULT_LOCATION.lat;
    const lng = this.selectedLocation?.lng || this.locationService.DEFAULT_LOCATION.lng;

    this.map = L.map(this.mapContainer.nativeElement).setView([lat, lng], 14);

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    // Add marker for initial/selected position
    const pinIcon = this.createCustomPin('#3880ff');
    this.marker = L.marker([lat, lng], { icon: pinIcon }).addTo(this.map);

    if (this.taskTitle) {
      this.marker.bindPopup(`<strong>${this.taskTitle}</strong><br>${this.selectedLocation?.address || ''}`).openPopup();
    }

    // In 'select' mode, allow clicking on map to set position
    if (this.mode === 'select') {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        this.updateSelectedLocation(lat, lng);
      });
    }

    // Invalidate size after modal animation completes
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 250);
  }

  private updateSelectedLocation(lat: number, lng: number, address?: string) {
    this.selectedLocation = {
      lat,
      lng,
      address: address || `Selected Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    };

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else if (this.map) {
      const pinIcon = this.createCustomPin('#3880ff');
      this.marker = L.marker([lat, lng], { icon: pinIcon }).addTo(this.map);
    }
  }

  async locateUser() {
    try {
      const currentPos = await this.locationService.getCurrentPosition();
      if (!this.map) return;

      const userIcon = this.createCustomPin('#2dd36f');
      if (this.userMarker) {
        this.userMarker.setLatLng([currentPos.lat, currentPos.lng]);
      } else {
        this.userMarker = L.marker([currentPos.lat, currentPos.lng], { icon: userIcon })
          .addTo(this.map)
          .bindPopup('<strong>Your Location</strong>');
      }

      this.map.flyTo([currentPos.lat, currentPos.lng], 15);

      if (this.mode === 'select') {
        this.updateSelectedLocation(currentPos.lat, currentPos.lng, currentPos.address);
      }

      if (this.selectedLocation) {
        this.userDistance = this.locationService.calculateDistance(
          currentPos.lat,
          currentPos.lng,
          this.selectedLocation.lat,
          this.selectedLocation.lng
        );
      }
    } catch (err) {
      console.error('Failed to get user location:', err);
    }
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirmLocation() {
    this.modalCtrl.dismiss(this.selectedLocation, 'confirm');
  }
}
