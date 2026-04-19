"""
main.py — FastAPI backend for Kirana Cash Flow AI
Endpoints:
  POST /api/analyze  — multipart form: images + geo + optional metadata
  GET  /api/health   — liveness check
"""

import os
import uuid
import logging
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from vision_analyzer import analyze_images
from geo_analyzer import analyze_location
from cash_flow_model import estimate_cash_flow
from confidence_scorer import compute_confidence
from fraud_detector import detect_fraud

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Kirana Cash Flow AI", version="1.0.0")

# CORS configuration - read from environment or use defaults
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_BASE = Path(tempfile.gettempdir()) / "kirana_upload"
UPLOAD_BASE.mkdir(parents=True, exist_ok=True)


@app.get("/api/health")
async def health():
    return {"status": "ok", "model": "gemini-2.0-flash"}


@app.post("/api/analyze")
async def analyze(
    images: List[UploadFile] = File(...),
    lat: float = Form(...),
    lon: float = Form(...),
    shop_size: Optional[float] = Form(None),
    rent: Optional[float] = Form(None),
    years_operating: Optional[float] = Form(None),
):
    # ── Validate image count ───────────────────────────────────────────────
    if len(images) < 3:
        raise HTTPException(status_code=422, detail="Minimum 3 images required.")
    if len(images) > 10:
        raise HTTPException(status_code=422, detail="Maximum 10 images allowed.")

    # ── Save images to temp dir ────────────────────────────────────────────
    session_id = uuid.uuid4().hex
    session_dir = UPLOAD_BASE / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    saved_paths: List[str] = []

    try:
        for img_file in images:
            suffix = Path(img_file.filename or "img.jpg").suffix or ".jpg"
            dest = session_dir / f"{uuid.uuid4().hex}{suffix}"
            with dest.open("wb") as f:
                content = await img_file.read()
                if len(content) > 10 * 1024 * 1024:
                    raise HTTPException(
                        status_code=413,
                        detail=f"Image {img_file.filename} exceeds 10 MB limit.",
                    )
                f.write(content)
            saved_paths.append(str(dest))

        # ── Vision analysis ────────────────────────────────────────────────
        logger.info(f"[{session_id}] Running vision analysis on {len(saved_paths)} images.")
        vision_signals = analyze_images(saved_paths)

        # ── Geo analysis ───────────────────────────────────────────────────
        logger.info(f"[{session_id}] Running geo analysis at ({lat}, {lon}).")
        geo_signals = analyze_location(lat, lon)

        # ── Count optional fields ──────────────────────────────────────────
        optional_provided = sum(
            1 for v in [shop_size, rent, years_operating] if v is not None
        )

        # ── Cash flow model ────────────────────────────────────────────────
        cash_flow = estimate_cash_flow(
            vision=vision_signals,
            geo=geo_signals,
            shop_size_sqft=shop_size,
            rent_monthly=rent,
            years_operating=years_operating,
        )

        # ── Confidence score ───────────────────────────────────────────────
        confidence = compute_confidence(
            vision=vision_signals,
            geo=geo_signals,
            num_optional_fields=optional_provided,
        )

        # ── Fraud detection ────────────────────────────────────────────────
        risk_flags, final_confidence, recommendation = detect_fraud(
            vision=vision_signals,
            geo=geo_signals,
            cash_flow=cash_flow,
            confidence=confidence,
        )

        # ── Build response ─────────────────────────────────────────────────
        result = {
            "daily_sales_range": cash_flow["daily_sales_range"],
            "monthly_revenue_range": cash_flow["monthly_revenue_range"],
            "monthly_income_range": cash_flow["monthly_income_range"],
            "confidence_score": final_confidence,
            "recommendation": recommendation,
            "risk_flags": risk_flags,
            "vision_signals": vision_signals,
            "geo_signals": geo_signals,
            "reasoning": vision_signals.get("reasoning", ""),
            "estimated_at": datetime.now(timezone.utc).isoformat(),
            "_diagnostics": {
                "raw_score": cash_flow.get("_raw_score"),
                "adjusted_score": cash_flow.get("_adjusted_score"),
                "competition_factor": cash_flow.get("_competition_factor"),
                "optional_fields_provided": optional_provided,
            },
        }

        logger.info(f"[{session_id}] Analysis complete. Recommendation: {recommendation}")
        return JSONResponse(content=result)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[{session_id}] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        # Clean up temp files
        try:
            shutil.rmtree(session_dir, ignore_errors=True)
        except Exception:
            pass
