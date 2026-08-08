# MedNova — Smart AI-Powered Ventilator Telemetry System

MedNova is a high-fidelity, multi-tenant clinical telemetry and ventilator monitoring platform. It enables hospital staff (doctors, nurses, admins, and attendants) to manage patient admissions, review AI-driven weaning readiness scores, handle device pairings, and monitor real-time vitals streams.

---

## 📂 Repository Structure

The project is structured as a monorepo featuring shared packages, frontend platforms, and a FastAPI backend:

```text
├── apps/
│   ├── web/               # Vite + React Admin Dashboard
│   └── mobile/            # React Native + Expo Router Mobile Client
├── backend/               # FastAPI + SQLAlchemy + Supabase Auth Engine
├── firmware/              # Arduino / ESP32 Simulator for Ventilator Telemetry
├── frontend/              # Standalone Expo Mobile Client (React Navigation)
└── packages/              # Shared Monorepo Packages
    ├── api/               # Mapped Supabase & Database Repositories
    ├── constants/         # Shared System Codes, Roles & Statuses
    ├── hooks/             # Common React Query Custom Hooks
    ├── types/             # Shared TypeScript Entity Interfaces
    └── utils/             # Helper utilities and date formatters
```

---

## ⚡ Key Features

* **Real-time Telemetry**: WebSocket-driven vital streams (SpO2, Heart Rate, Temperature).
* **AI Weaning Ready Predictions**: Real-time AI confidence tracking, recommendations, and clinician follow-up note logging.
* **Role-Based Access Control (RBAC)**: Strict permission boundaries mapping `admin`, `doctor`, `nurse`, and `attendant` views.
* **Alert Center**: Critical and high-priority vital alerts with clinician resolve workflows.
* **Reports Engine**: Clinical patient summaries exporting to PDF and CSV formats.
* **Hospital Multitenancy**: Isolated clinical environments separated by unique hospital code links.

---

## 🚀 Getting Started

### 1. Backend Service Setup
The backend requires **Python 3.11** to build and run database dependencies cleanly.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the development server on port `8000`:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### 2. Frontend Web Dashboard
1. Install dependencies at the workspace root:
   ```bash
   npm install --legacy-peer-deps
   ```
2. Build the shared packages:
   ```bash
   npm run build
   ```
3. Start the Vite development server:
   ```bash
   npm run web
   ```
   *Dashboard will be active at `http://localhost:3000/` (or `http://localhost:3001/` if port is occupied).*

### 3. Mobile Client (Expo SDK 54)
To run either mobile application layout:
* **Standalone Mobile Client (`frontend/`)**:
  ```bash
  cd frontend
  npm install --legacy-peer-deps
  npx expo start -c
  ```
* **Monorepo Mobile Client (`apps/mobile/`)**:
  ```bash
  npm run mobile
  ```

---

## 🔐 Seeded Test Credentials

To sign in immediately on the dashboard or mobile apps, use these pre-registered test accounts:

| Clinical Role | Email | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@mednova.io` | `MedNova!Admin2026` |
| **Doctor** | `doctor@mednova.io` | `password123` |
| **Nurse** | `nurse@mednova.io` | `password123` |
| **Attendant** | `attendant@mednova.io` | `password123` |

---

## 🛠️ Production Build

To compile the web dashboard for production deployment:
1. Ensure the production API URL is set in `apps/web/.env.production`:
   ```env
   VITE_API_URL=https://mednova-9l87.onrender.com
   ```
2. Run the production build compiler:
   ```bash
   npm run build
   ```
3. The static distribution folder will be generated at `apps/web/dist` and copied directly to the root **`/build`** directory for quick deployment.