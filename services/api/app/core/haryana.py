"""
Canonical Haryana Administrative Geodata and Spatial Reference.
Contains all 22 Haryana districts, centroids, bounding box, and line departments.
"""
import math
from typing import Dict, List, Optional, Tuple

HARYANA_BOUNDS = {
    "min_lat": 27.60,
    "max_lat": 31.00,
    "min_lng": 74.40,
    "max_lng": 77.70,
}

HARYANA_DISTRICTS: List[Dict[str, any]] = [
    {"id": "HR-AM", "name": "Ambala", "lat": 30.3782, "lng": 76.7767},
    {"id": "HR-BW", "name": "Bhiwani", "lat": 28.7932, "lng": 76.1390},
    {"id": "HR-CD", "name": "Charkhi Dadri", "lat": 28.5921, "lng": 76.2653},
    {"id": "HR-FA", "name": "Faridabad", "lat": 28.4089, "lng": 77.3178},
    {"id": "HR-FT", "name": "Fatehabad", "lat": 29.5133, "lng": 75.4528},
    {"id": "HR-GU", "name": "Gurugram", "lat": 28.4595, "lng": 77.0266},
    {"id": "HR-HI", "name": "Hisar", "lat": 29.1492, "lng": 75.7217},
    {"id": "HR-JJ", "name": "Jhajjar", "lat": 28.6063, "lng": 76.6565},
    {"id": "HR-JH", "name": "Jind", "lat": 29.3167, "lng": 76.3167},
    {"id": "HR-KT", "name": "Kaithal", "lat": 29.8015, "lng": 76.3996},
    {"id": "HR-KR", "name": "Karnal", "lat": 29.6857, "lng": 76.9905},
    {"id": "HR-KU", "name": "Kurukshetra", "lat": 29.9695, "lng": 76.8783},
    {"id": "HR-MA", "name": "Mahendragarh", "lat": 28.0444, "lng": 76.1089},
    {"id": "HR-NU", "name": "Nuh", "lat": 28.1070, "lng": 77.0150},
    {"id": "HR-PW", "name": "Palwal", "lat": 27.9962, "lng": 77.3695},
    {"id": "HR-PK", "name": "Panchkula", "lat": 30.6942, "lng": 76.8606},
    {"id": "HR-PP", "name": "Panipat", "lat": 29.3909, "lng": 76.9635},
    {"id": "HR-RE", "name": "Rewari", "lat": 28.1833, "lng": 76.6167},
    {"id": "HR-RO", "name": "Rohtak", "lat": 28.8955, "lng": 76.6066},
    {"id": "HR-SI", "name": "Sirsa", "lat": 29.5321, "lng": 75.0318},
    {"id": "HR-SO", "name": "Sonipat", "lat": 28.9931, "lng": 77.0151},
    {"id": "HR-YN", "name": "Yamunanagar", "lat": 30.1727, "lng": 77.2989},
]

HARYANA_DISTRICTS_BY_ID: Dict[str, Dict[str, any]] = {
    d["id"]: d for d in HARYANA_DISTRICTS
}

# Alias mapping (e.g. HR-KA -> HR-KR for Karnal)
HARYANA_DISTRICTS_BY_ID["HR-KA"] = HARYANA_DISTRICTS_BY_ID["HR-KR"]


def is_in_haryana(lat: float, lng: float) -> bool:
    """Checks if coordinates are strictly within Haryana spatial envelope."""
    return (
        HARYANA_BOUNDS["min_lat"] <= lat <= HARYANA_BOUNDS["max_lat"]
        and HARYANA_BOUNDS["min_lng"] <= lng <= HARYANA_BOUNDS["max_lng"]
    )


def find_nearest_district(lat: float, lng: float) -> Dict[str, any]:
    """Finds the nearest Haryana district center by Haversine distance."""
    min_dist = float("inf")
    nearest = HARYANA_DISTRICTS[0]
    for d in HARYANA_DISTRICTS:
        dlat = math.radians(d["lat"] - lat)
        dlng = math.radians(d["lng"] - lng)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat))
            * math.cos(math.radians(d["lat"]))
            * math.sin(dlng / 2) ** 2
        )
        dist = 6371 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        if dist < min_dist:
            min_dist = dist
            nearest = d
    return nearest
