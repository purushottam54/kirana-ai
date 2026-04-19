# Kirana Cash Flow AI 🏪

**AI-powered remote cash flow underwriting for Indian kirana (grocery) stores.**  
Upload 3–5 shop photos + GPS location → get instant daily sales estimates, monthly revenue ranges, confidence scores, and fraud detection — no physical visit needed.  
Built for NBFCs and fintech lenders to assess credit risk at scale.

---

## ✨ Features
- 📸 **Vision AI** — Gemini 1.5 Pro analyzes shelf density, SKU diversity, inventory tier, and store condition
- 📍 **Geo Intelligence** — OpenStreetMap Overpass API (free, no key) detects nearby competition and footfall POIs
- 💰 **Cash Flow Model** — All estimates as calibrated ranges bounded to realistic Indian kirana values
- 🛡️ **Fraud Detection** — 5 rule-based checks with automatic confidence penalty
- 📊 **Results Dashboard** — Confidence gauge, recommendation badge, Leaflet map, explainability section
- 📄 **PDF Report** — Download full underwriting report via jsPDF
- 📱 **Mobile-first** — Works on any device; camera capture for field use

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Gemini API key (free at [aistudio.google.com](https://aistudio.google.com) → **Get API Key**)

### 1. Get Gemini API Key
1. Go to [https://aistudio.google.com](https://aistudio.google.com)
2. Sign in with a Google account
3. Click **Get API Key** → **Create API key**
4. Copy the key (starts with `AIza...`)

### 2. Set Up Environment
```bash
cp .env.example .env
# Edit .env and paste your GEMINI_API_KEY
```

### 3. Run Backend
```bash
cd backend
pip install -r requirements.txt
# Set your API key:
set GEMINI_API_KEY=your_key_here   # Windows
export GEMINI_API_KEY=your_key_here  # Mac/Linux
uvicorn main:app --reload
# Backend runs at http://localhost:8000
```

### 4. Run Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:3000
```

### 5. Test It
1. Open [http://localhost:3000](http://localhost:3000)
2. Upload 3 sample kirana store photos
3. Click "Use My Current Location" or enter coordinates manually
4. (Optional) Add shop size, rent, years in operation
5. Click **Analyze Now** — results appear in ~15–30 seconds

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                 BROWSER (Next.js 14)                 │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  Step 1  │  │  Step 2  │  │      Step 3        │ │
│  │  Upload  │→ │  GPS     │→ │  Optional Metadata │ │
│  │  Images  │  │  Capture │  │                    │ │
│  └──────────┘  └──────────┘  └────────────────────┘ │
│                       ↓ POST /api/analyze             │
└──────────────────────────────────────────────────────┘
                         │  multipart/form-data
                         ↓
┌──────────────────────────────────────────────────────┐
│               FASTAPI BACKEND (Python)                │
│                                                      │
│  vision_analyzer.py ──→ Google Gemini 1.5 Pro API   │
│         ↓                                            │
│  geo_analyzer.py ─────→ OpenStreetMap Overpass API  │
│         ↓                (free, no key required)     │
│  cash_flow_model.py   (deterministic estimation)    │
│         ↓                                            │
│  confidence_scorer.py (4-factor weighted score)     │
│         ↓                                            │
│  fraud_detector.py    (5-rule detection engine)     │
│         ↓                                            │
│  JSON response → stored in sessionStorage           │
└──────────────────────────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────┐
│              RESULTS DASHBOARD                        │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │ Daily    │  │ Monthly  │  │  Monthly Income    │ │
│  │ Sales    │  │ Revenue  │  │  Range             │ │
│  │ Range    │  │ Range    │  │                    │ │
│  └──────────┘  └──────────┘  └────────────────────┘ │
│                                                      │
│  [Confidence Gauge]  [Recommendation Badge]          │
│  [Risk Flags]        [Leaflet Map]                   │
│  [How Estimated?]    [Download PDF]                  │
└──────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
kirana-cashflow-ai/
├── frontend/
│   ├── app/
│   │   ├── page.tsx              ← 3-step wizard
│   │   ├── results/page.tsx      ← Output dashboard
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ImageUploader.tsx     ← Drag-drop + camera
│   │   ├── GPSCapture.tsx        ← Leaflet map + auto-detect
│   │   ├── LeafletMap.tsx        ← Leaflet wrapper (SSR-safe)
│   │   ├── MetadataForm.tsx      ← Optional fields
│   │   ├── ResultDashboard.tsx   ← Main results layout
│   │   ├── ConfidenceGauge.tsx   ← SVG arc gauge
│   │   ├── StoreMap.tsx          ← Map with competitor pins
│   │   └── EstimationExplainer.tsx ← Collapsible how-it-works
│   ├── lib/
│   │   └── formatINR.ts          ← Indian number formatting
│   └── package.json
├── backend/
│   ├── main.py                   ← FastAPI app
│   ├── vision_analyzer.py        ← Gemini vision calls
│   ├── geo_analyzer.py           ← Overpass API queries
│   ├── cash_flow_model.py        ← Estimation formulas
│   ├── fraud_detector.py         ← Fraud flag rules
│   ├── confidence_scorer.py      ← Confidence calculation
│   └── requirements.txt
├── .env.example
└── README.md
```

---

## 🧠 Model Design Decisions

| Decision | Rationale |
|---|---|
| All outputs are ranges | Forces uncertainty honesty; no false precision |
| 26 operating days/month | Standard for Indian kirana (closed ~4 Sundays) |
| 12–20% EBITDA margin | Industry benchmark for Indian grocery retail |
| ₹1,500–₹80,000 daily floor/ceiling | Validated against RBI kirana credit data |
| Competition factor `max(0.70, 1−n×0.05)` | Floor at 30% discount prevents over-penalization |
| Tenure boost (up to +15%) | Older stores have demonstrated viability |

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Gemini API key from Google AI Studio |
| `GOOGLE_PLACES_API_KEY` | ❌ No | Optional; Overpass handles geo by default |
| `NEXT_PUBLIC_API_URL` | ✅ Yes | Backend URL (default: http://localhost:8000) |

---

## ⚠️ Limitations & Disclaimer

- Estimates are based on visual and geo proxies — not financial statements
- AI confidence < 0.5 should trigger mandatory physical verification
- Not a substitute for field credit assessment
- For NBFC internal use only as a pre-screening tool

---

*Built for Hackathon · Stack: Next.js 14 + FastAPI + Gemini 1.5 Pro + OpenStreetMap*
