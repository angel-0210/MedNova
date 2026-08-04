# MedNova AI-Powered Ventilator Monitoring Platform (Backend)

An enterprise-grade, healthcare-ready, multi-tenant FastAPI backend for the **MedNova** continuous ventilator telemetry, AI risk analysis, and clinical alert escalation system.

---

## 🚀 Key Features

- **Multi-Tenant Isolation**: Row Level Security (RLS) and service-layer constraints isolate patient data by `hospital_id`.
- **Supabase Authentication**: Integrated Auth handles logins, token verification, and role-based permissions (Admin, Doctor, Nurse, Attendant).
- **IoT Telemetry Ingest**: Real-time validation, MAC address mapping, and assignment resolving on `POST /api/v1/iot/readings`.
- **AI Risk Estimation**: Modular TensorFlow Lite executor (with robust rule-based clinical fallback) evaluates physiological variables and generates alerts.
- **Alert & Escalation Engines**: Implements high-low hazard triggers, alert cooldown limits, and automated role-based escalation (Nurse -> Doctor -> Admin).
- **Real-Time WebSockets**: Live broadcast channels (`/ws/dashboard`) dispatch telemetry, AI ratings, and warnings to authorized hospital rooms.
- **Append-Only Auditing**: Custom logging model and Postgres triggers block updates/deletes to audit tables.

---

## 🛠️ Tech Stack

- **Framework**: FastAPI (Python 3.10+)
- **Database**: Supabase PostgreSQL + SQLAlchemy 2.0 (Async) + Alembic
- **Real-time**: WebSockets + Firebase Cloud Messaging (FCM)
- **AI Inference**: TensorFlow Lite / NumPy
- **Deploy**: Docker / Docker Compose

---

## ⚙️ Project Structure

```text
d:\MedNova\backend\
├── app/
│   ├── api/             # API Routers & Endpoints
│   ├── core/            # Global Config, Security & Logging
│   ├── database/        # Async Session, Models & Repositories
│   ├── middleware/      # Performance & Request Logging
│   ├── schemas/         # Pydantic V2 Validation schemas
│   ├── services/        # AI, Alert, Notification & Escalation Services
│   └── websocket/       # WebSocket Broadcast Connection Manager
├── tests/               # Test suites
├── Dockerfile           # Production container build definition
└── docker-compose.yml   # Dev/Production container orchestration
```

---

## 🏁 Quick Start

### 1. Prerequisite Environment Setup
Copy and configure environment variables in `.env`:
```ini
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWKS_URL=https://<your-project>.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_CONNECTION_URL=postgresql://postgres:<password>@db.<your-project>.supabase.co:5432/postgres
```

### 2. Local Installation
```bash
# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

### 3. Running the Server
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Alternative Docs (ReDoc): [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 📡 API Endpoints

### Ingestion (IoT)
- `POST /api/v1/iot/readings` - Ingest real-time ESP32 measurements.

### Authentication
- `POST /api/v1/auth/register` - Create user and sync with public database.
- `POST /api/v1/auth/login` - Authenticate credentials and get JWT.
- `POST /api/v1/auth/refresh` - Refresh access token session.
- `POST /api/v1/auth/me` - Fetch profile of current session.

### Entity CRUDs (Multi-tenant filtered)
- `/api/v1/patients`
- `/api/v1/devices`
- `/api/v1/assignments`
- `/api/v1/alerts`
- `/api/v1/predictions`

### Real-Time Live Feed
- `/ws/dashboard?token=<JWT>` - Establish dashboard WebSocket channel.
