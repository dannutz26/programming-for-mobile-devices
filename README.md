# Ionic 3 — Task Manager with Camera, Maps, Filesystem & Animations

A full-stack, offline-first mobile application built with **Ionic 9**, **Angular 22**, **Capacitor 8**, and **Node.js/Express**, implementing all requirements for the **Ionic 3** university assignment.

---

## 📋 Assessment Criteria & Feature Mapping (8 Points Total)

| Category | Requirement | Points | Implementation Details & Location |
| :--- | :--- | :---: | :--- |
| **Camera** | In edit context allow user to take photo | **1.0p** | `TaskDetailPage` (edit mode) & `TaskCreateModalComponent` offer a **Take Photo** button using `@capacitor/camera` (`Camera.getPhoto()`) with camera capture / file picker. |
| **Camera** | Show photo when resource is shown (list/view/edit) | **1.0p** | - **List page**: Task items display photo thumbnails (`<ion-thumbnail>`).<br>- **View page**: `TaskDetailPage` displays full hero photo card.<br>- **Edit page**: Interactive photo preview with change/delete controls. |
| **Camera** | Save photo on device | **1.0p** | `PhotoService.savePhotoToDevice()` uses `@capacitor/filesystem` (`Filesystem.writeFile()`) to persist captured images directly into device storage (`Directory.Data`). |
| **Camera** | Upload photo | **1.0p** | Backend endpoint `POST /api/tasks/:id/photo` & `POST /api/upload` receive photos (base64/binary), store them on disk, and serve publicly via `/uploads`. Auto-uploads online and synchronizes offline photos. |
| **Maps** | Open map in edit page to select location | **1.5p** | `MapModalComponent` opens Leaflet interactive map with custom pin markers. User taps anywhere on the map to pin coordinates, or taps **My Location** using `@capacitor/geolocation`. |
| **Maps** | Open map later to locate resource | **1.5p** | In `TaskDetailPage`, clicking **Locate on Map** opens Leaflet centered on the task's location with pin popup and calculates **distance from current user** in km. |
| **Animations** | Animate some components | **1.0p** | - Staggered fade/slide-in entry for task list items (`.animated-item`).<br>- Continuous subtle pulsing glow on the Add Task FAB (`.pulse-animation`).<br>- Reactive scale pulse animation when toggling task status button. |
| **Animations** | Override existing component animations | **1.0p** | - Overrides Ionic's default navigation page transition with `customNavAnimation` in `main.ts` (`provideIonicAngular({ navAnimation: customNavAnimation })`).<br>- Overrides Ionic's default modal transition with `customModalEnterAnimation` & `customModalLeaveAnimation` for create & map modals. |
| **Total** | | **8.0p** | Full marks |

---

## 🛠️ Technology Stack

- **Framework**: Ionic 9 + Angular 22 (Standalone Components, Zoneless Change Detection)
- **Native Device APIs**:
  - `@capacitor/camera` (device camera & photo library picker)
  - `@capacitor/filesystem` (device file storage persistence)
  - `@capacitor/geolocation` (GPS coordinates & location positioning)
- **Mapping & GIS**: Leaflet 1.9 + OpenStreetMap tiles + custom SVG divIcon markers
- **Animations**: Ionic `AnimationController` / `createAnimation` API + CSS keyframe animations
- **Backend**: Node.js, Express 4, `jsonwebtoken` (JWT), WebSocket (`ws`), Static file serving (`/uploads`)
- **Testing**: Automated 14-step integration test runner (`server/test-api.js`)

---

## 📁 Project Structure

```
ionic1/
├── src/
│   ├── app/
│   │   ├── animations/
│   │   │   └── custom-animations.ts    # Overrides Ionic modal & nav transitions; component pulse
│   │   ├── components/
│   │   │   └── map-modal/              # Leaflet map modal (select & locate modes, GPS distance)
│   │   │       └── map-modal.component.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts           # authGuard & loginGuard
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts     # Injects Authorization: Bearer <token>
│   │   ├── models/
│   │   │   └── task.model.ts           # Task (photoUrl, localPhotoPath, location), TaskLocation
│   │   ├── services/
│   │   │   ├── photo.service.ts        # Camera.getPhoto(), Filesystem.writeFile(), photo uploads
│   │   │   ├── location.service.ts     # Geolocation.getCurrentPosition(), GPS distance calculation
│   │   │   ├── auth.service.ts         # JWT handling, login/register/logout, localStorage
│   │   │   ├── network.service.ts      # Reactive online/offline detection + simulation toggle
│   │   │   ├── storage.service.ts      # Local cache & offline sync tracking
│   │   │   ├── sync.service.ts         # Auto-sync on network reconnection
│   │   │   ├── task.service.ts         # Offline-first Task API (REST + local fallback)
│   │   │   └── notification.service.ts # Secured WebSocket client (?token=...)
│   │   ├── login/                      # Authentication Page
│   │   └── tasks/
│   │       ├── task-list/              # Thumbnails in items, location chips, animations, pagination
│   │       ├── task-detail/            # Hero photo header, locate on map, full edit mode (photo/map)
│   │       └── task-create/            # Modal with Camera capture & Map location selector
│   ├── global.scss                     # Leaflet styles + keyframe animation classes
│   └── main.ts                         # Angular bootstrap with customNavAnimation override
├── server/
│   ├── index.js                        # Express REST API, WS Server, Photo upload & /uploads static
│   ├── test-api.js                     # 14-step automated test suite
│   ├── run-tests.js                    # Automated server + test launcher
│   └── uploads/                        # Persisted uploaded photos & sample SVG images
├── package.json
└── README.md
```

---

## 🚀 How to Run the Project

All commands can be executed from the **root folder**:

### 1. Start the Backend Server
```bash
npm run server
```
*Runs on `http://localhost:3000` (REST API: `/api`, WebSockets: `/ws`, Uploads: `/uploads`).*

Pre-seeded accounts:
- **Username**: `alice` | **Password**: `password` *(12 tasks with sample photos & Cluj-Napoca locations)*
- **Username**: `bob` | **Password**: `password` *(5 tasks)*

### 2. Start the Frontend Application
In a separate terminal:
```bash
npm start
```
*App opens on `http://localhost:4200`.*

### 3. Run Automated Server Tests
```bash
npm run test:server
```
*Executes all 14 backend test cases covering authentication, isolation, pagination, camera upload, geolocation update, offline sync, and WebSockets.*

---

## 🎬 Step-by-Step Showcase Guide for Evaluation

### 1. Show Camera & Photo Features (4 Points)
1. **Show photos in list**: Log in as `alice` / `password`. Notice the first tasks in the list have photo thumbnails (`sample_campus.svg`, `sample_library.svg`).
2. **Show photo in view page**: Tap task 1 (*"Complete project proposal"*). Notice the hero photo banner displayed prominently at the top of the detail view.
3. **Take photo in edit page**: Tap the **Edit** icon in the toolbar (or "Edit Task Details / Photo / Location" at bottom). Tap **Change Photo** (or **Take Photo**). A camera prompt opens (web file picker or camera). Choose any image.
4. **Save photo to device**: Notice the file is stored locally using Capacitor Filesystem.
5. **Upload photo**: The photo is uploaded to `http://localhost:3000/uploads/...` and confirmed by toast notification. Save edits and return to the list—the new photo is reflected everywhere!
6. **Photo in create page**: Tap the **+** FAB button on the list page. Notice the **Photo Attachment** section with **Take Photo** and instant preview.

### 2. Show Maps & Location Features (3 Points)
1. **Select location in edit page (1.5p)**:
   - On the task detail page, switch to Edit mode (or in the Create Task modal).
   - Tap **Select on Map** (or **Change Map Pin**).
   - An interactive Leaflet map modal opens.
   - Tap anywhere on the map to drop/move the blue marker pin.
   - Alternatively, tap **My Location** to automatically center on current GPS coordinates using `@capacitor/geolocation`.
   - Tap **Save** in the top-right toolbar. The selected coordinates and address are saved to the task.
2. **Locate resource on map later (1.5p)**:
   - In view mode on task detail page, scroll to the **Resource Location** card.
   - Tap **Locate on Map**.
   - The map modal opens centered directly on the task pin with a popup showing task title and location.
   - Tap **My Location** to see your position relative to the task and the real-time distance in kilometers (e.g., *"Distance from you: 1.2 km"*).

### 3. Show Animations (2 Points)
1. **Component animations (1.0p)**:
   - **FAB Button**: Observe the pulsing glow effect on the bottom-right **+** FAB button (`.pulse-animation`).
   - **List Items**: Tasks slide and fade in with staggered entry delay when loading or navigating pages.
   - **Status Button**: Tap **Mark as Completed** / **Mark as Pending** in task details. The button performs a bounce/pulse animation before updating.
2. **Override existing component animations (1.0p)**:
   - **Modal animation override**: Notice the smooth custom scale + slide + backdrop fade effect when opening the Create Task modal or Map modal (`customModalEnterAnimation` & `customModalLeaveAnimation`).
   - **Page transition override**: Notice the custom horizontal slide + fade animation when navigating between the list and detail pages (`provideIonicAngular({ navAnimation: customNavAnimation })`).
