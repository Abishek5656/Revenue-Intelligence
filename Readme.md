# SkyGeni Revenue Intelligence Dashboard

A comprehensive dashboard for visualizing sales performance, revenue trends, and actionable insights. Built with a modern tech stack focusing on performance, scalability, and premium UX.

## 🚀 Tech Stack

### Frontend

- **Core:** React 19, TypeScript, Vite
- **UI Framework:** Material UI (MUI) v6
- **Styling:** Emotion, Custom Dark Theme
- **Visualization:** D3.js (for custom trend charts)
- **State/Data:** React Hooks (Suspense/Lazy), Fetch API

### Backend

- **Runtime:** Node.js
- **Framework:** Express v5 (Beta)
- **Database:** PostgreSQL (Neon DB)
- **Key Libraries:**
  - `pg` (Postgres Client)
  - `node-cache` (In-memory caching)
  - `winston` & `morgan` (Logging)
  - `helmet` & `cors` (Security)
  - `express-rate-limit` (DDoS protection)

## 📂 Project Structure

```bash
skygeni/
├── backend/            # Express API Server
│   ├── src/
│   │   ├── controllers/# Route Logic
│   │   ├── db/         # Database connection & schema
│   │   ├── routers/    # API Route definitions
│   │   └── server.ts   # Entry point
├── frontend/           # React Application
│   ├── src/
│   │   ├── components/ # UI Components (Dashboard, Charts)
│   │   ├── api.ts      # API Integration layer
│   │   └── App.tsx     # Main Component & Theme Config
├── data/               # Raw JSON data for seeding
└── THINKING.md         # Architectural documentation
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js (v18+ recommended)
- Neon DB (PostgreSQL) account and connection string

### 1. Backend Setup

```bash
cd backend
npm install

# Create a .env file based on your configuration
# Example .env:
# PORT=5000
#DATABASE_URL=

```

**Database Initialization:**
Ensure your Neon DB instance is running and accessible. You may need to create the database `skygeni_db` first if not using the default.

```bash
# Initialize Schema
npm run db:init

# Seed Data (Optional)
npm run db:seed
```

**Start Server:**

```bash
npm run dev
```

Server will start at `http://localhost:5000`.

### 2. Frontend Setup

```bash
cd frontend
npm install
```

**Configuration:**
By default, the frontend is configured to point to a production API. For local development, update `src/api.ts` or ensure the Vite proxy is correctly set in `vite.config.ts`.

**Start Client:**

```bash
npm run dev
```

Open `http://localhost:5173` to view the dashboard.

## ✨ Key Features

1.  **Executive Summary:** At-a-glance view of Quarterly Targets, Revenue, and Progress.
2.  **Revenue Drivers:** Track key metrics like Win Rate, Deal Size, and Pipeline Value.
3.  **Risk Analysis:** Intelligent identification of "at-risk" deals (e.g., stalled negotiation, low activity).
4.  **Trend Analysis:** Visual history of revenue performance over the last 6 months using D3.js.
5.  **Smart Recommendations:** AI-driven or rule-based suggestions for Reps to improve outcomes.

## 📡 API Endpoints

The backend exposes the following RESTful endpoints under the `/api` prefix:

### Summary

- `GET /api/summary?quarter=1&year=2025` - Get executive summary (revenue, targets, progress).
- `GET /api/summary/trend` - Get 6-month revenue trend data.

### Drivers

- `GET /api/drivers?quarter=1&year=2025` - Get key performance drivers (Metrics, Win Rate, etc.).

### Risk Factors

- `GET /api/risk-factors` - Identify at-risk deals and accounts.

### Recommendations

- `GET /api/recommendations` - Get actionable next steps for sales reps.

## ⚡ Performance Optimizations

- **Database Indexing:** Optimization for date-range and category-based queries.
- **API Caching:** 100-second TTL cache for dashboard summary endpoints.
- **Lazy Loading:** React Suspense used to defer loading of heavy dashboard components.
- **Vite Chunking:** Manual chunk splitting for efficient browser caching.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
