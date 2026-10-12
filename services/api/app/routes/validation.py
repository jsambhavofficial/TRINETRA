"""
TRINETRA AI Validation Benchmark API Router.
Exposes reproducible 100-complaint multilingual test suite metrics to the frontend and Judge Mode.
"""
import json
from pathlib import Path
from typing import Any, Dict
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/validation", tags=["AI Validation Benchmark"])

RESULTS_FILE = Path(__file__).resolve().parent.parent.parent / "tests" / "ai_validation" / "validation_results.json"
DATASET_FILE = Path(__file__).resolve().parent.parent.parent / "tests" / "ai_validation" / "dataset_100.json"
GROUND_TRUTH_FILE = Path(__file__).resolve().parent.parent.parent / "tests" / "ai_validation" / "ground_truth.json"


@router.get("/results")
async def get_validation_results() -> Dict[str, Any]:
    """Returns the latest 100-complaint AI validation benchmark results."""
    if not RESULTS_FILE.exists():
        raise HTTPException(status_code=404, detail="Validation benchmark results not found. Run validation test first.")
    try:
        with open(RESULTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read validation results: {str(e)}")


@router.get("/dataset")
async def get_validation_dataset() -> Dict[str, Any]:
    """Returns the synthetic 100-complaint dataset and pre-defined ground-truth labels."""
    if not DATASET_FILE.exists() or not GROUND_TRUTH_FILE.exists():
        raise HTTPException(status_code=404, detail="Validation dataset or ground truth file not found.")
    try:
        with open(DATASET_FILE, "r", encoding="utf-8") as f:
            complaints = json.load(f)
        with open(GROUND_TRUTH_FILE, "r", encoding="utf-8") as f:
            ground_truth = json.load(f)
        return {
            "complaints": complaints,
            "ground_truth_summary": ground_truth.get("metrics_breakdown", {}),
            "total_pairs": ground_truth.get("total_pairs", 4950),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read validation dataset: {str(e)}")
