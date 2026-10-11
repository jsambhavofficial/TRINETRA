# NEXUS Phase 3 AI Pipeline Service.
# Provides model-abstracted interfaces for multimodal evidence analysis.
# All methods return structured contracts. Uses demo fallback when live models unavailable.
import asyncio
import hashlib
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from app.core.logging import logger


# ---------------------------------------------------------------------------
# EVENT TAXONOMY (controlled vocabulary)
# ---------------------------------------------------------------------------
VALID_INCIDENT_TYPES = {
    'ROAD_DAMAGE', 'BRIDGE_DAMAGE', 'UTILITY_DAMAGE', 'ROAD_BLOCKAGE',
    'FLOODING', 'FIRE', 'SMOKE', 'STORM_DAMAGE',
    'ACCIDENT', 'CROWD_SURGE', 'HAZARD',
    'FACILITY_OUTAGE', 'ACCESS_RESTRICTION',
}

SEVERITY_LEVELS = ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')


# ---------------------------------------------------------------------------
# DEMO FIXTURE HASHES — deterministic results for known demo files
# ---------------------------------------------------------------------------
# sha256 prefix -> structured demo analysis result
DEMO_FIXTURES: dict[str, dict] = {
    # demo_flood_photo (any file with flood in name triggers this in demo mode)
    'DEMO_FLOOD_IMAGE': {
        'event_candidates': [{'type': 'FLOODING', 'confidence': 0.92}],
        'objects': [
            {'type': 'standing_water', 'confidence': 0.96},
            {'type': 'road', 'confidence': 0.99},
            {'type': 'vehicle', 'confidence': 0.87},
        ],
        'severity_hint': {'value': 'HIGH', 'confidence': 0.89},
        'location_hints': [{'description': 'near bridge', 'confidence': 0.72}],
        'temporal_observations': [],
        'summary': 'Possible road flooding detected. Standing water appears to obstruct a roadway. Vehicles are visible attempting to navigate reduced access conditions.',
        'uncertainties': ['Exact road name not confirmed from image alone'],
        'analysis_version': 'demo-v1',
        'model_provider': 'DEMO_FALLBACK',
        'is_demo': True,
    },
    'DEMO_FIRE_IMAGE': {
        'event_candidates': [{'type': 'FIRE', 'confidence': 0.94}],
        'objects': [
            {'type': 'flames', 'confidence': 0.97},
            {'type': 'smoke', 'confidence': 0.91},
            {'type': 'building', 'confidence': 0.83},
        ],
        'severity_hint': {'value': 'CRITICAL', 'confidence': 0.93},
        'location_hints': [{'description': 'urban commercial area', 'confidence': 0.65}],
        'temporal_observations': [],
        'summary': 'Active fire incident detected. Flames and smoke visible. Possible structure fire in commercial or industrial zone.',
        'uncertainties': ['Building identity not confirmed'],
        'analysis_version': 'demo-v1',
        'model_provider': 'DEMO_FALLBACK',
        'is_demo': True,
    },
    'DEMO_FLOOD_VIDEO': {
        'event_candidates': [{'type': 'FLOODING', 'confidence': 0.91}],
        'objects': [
            {'type': 'standing_water', 'confidence': 0.94},
            {'type': 'road', 'confidence': 0.97},
        ],
        'severity_hint': {'value': 'HIGH', 'confidence': 0.87},
        'location_hints': [{'description': 'road near water body', 'confidence': 0.70}],
        'temporal_observations': [
            {'time_offset_sec': 2, 'event': 'standing_water_visible', 'confidence': 0.95},
            {'time_offset_sec': 5, 'event': 'vehicle_slowdown', 'confidence': 0.82},
            {'time_offset_sec': 8, 'event': 'partial_lane_blockage', 'confidence': 0.88},
            {'time_offset_sec': 12, 'event': 'water_level_appears_increasing', 'confidence': 0.74},
        ],
        'summary': 'Active flooding visible across roadway. Water level appears to be increasing over the observation window. Lane blockage confirmed.',
        'uncertainties': ['Exact water depth not measurable without calibration'],
        'analysis_version': 'demo-v1',
        'model_provider': 'DEMO_FALLBACK',
        'is_demo': True,
    },
    'DEMO_FLOOD_AUDIO': {
        'event_candidates': [{'type': 'FLOODING', 'confidence': 0.88}],
        'objects': [],
        'severity_hint': {'value': 'HIGH', 'confidence': 0.80},
        'location_hints': [{'description': 'near bridge', 'confidence': 0.85}],
        'temporal_observations': [],
        'transcript': 'Bridge ke paas road pura paani se bhar gaya hai.',
        'detected_language': 'hi',
        'normalized_text': 'Road near the bridge is completely flooded.',
        'extracted_entities': [{'type': 'LOCATION', 'text': 'bridge', 'normalized': 'Bridge B02'}],
        'summary': 'Caller reports road flooding near a bridge. Full road coverage with water indicated.',
        'uncertainties': ['Bridge identity inferred from context, not confirmed'],
        'analysis_version': 'demo-v1',
        'model_provider': 'DEMO_FALLBACK',
        'is_demo': True,
    },
}


def _get_demo_key_for_filename(filename: str) -> Optional[str]:
    "Match filename to demo fixture key."
    fname_lower = filename.lower()
    if 'video' in fname_lower or fname_lower.endswith(('.mp4', '.mov', '.avi', '.webm')):
        return 'DEMO_FLOOD_VIDEO'
    if 'audio' in fname_lower or 'voice' in fname_lower or fname_lower.endswith(('.wav', '.mp3', '.m4a', '.ogg')):
        return 'DEMO_FLOOD_AUDIO'
    if 'fire' in fname_lower:
        return 'DEMO_FIRE_IMAGE'
    if 'flood' in fname_lower or 'water' in fname_lower:
        return 'DEMO_FLOOD_IMAGE'
    return 'DEMO_FLOOD_IMAGE'  # Generic image fallback for demo


def _build_generic_image_analysis(filename: str = '') -> dict:
    "Fallback: deterministic generic analysis for unknown demo images."
    return {
        'event_candidates': [{'type': 'HAZARD', 'confidence': 0.70}],
        'objects': [
            {'type': 'infrastructure_element', 'confidence': 0.85},
            {'type': 'outdoor_environment', 'confidence': 0.91},
        ],
        'severity_hint': {'value': 'MEDIUM', 'confidence': 0.65},
        'location_hints': [],
        'temporal_observations': [],
        'summary': 'Possible urban hazard or infrastructure issue detected. Manual review recommended.',
        'uncertainties': ['Event type unclear without additional context', 'Location cannot be confirmed from image'],
        'analysis_version': 'demo-v1',
        'model_provider': 'DEMO_FALLBACK',
        'is_demo': True,
    }


# ---------------------------------------------------------------------------
# VISION ANALYZER
# ---------------------------------------------------------------------------
class VisionAnalyzer:
    "Analyzes images to produce structured AI evidence output."

    async def analyze(
        self,
        image_data: bytes,
        filename: str = 'image.jpg',
        demo_mode: bool = True,
    ) -> dict:
        start = time.monotonic()
        logger.info(f'VisionAnalyzer.analyze called for {filename} (demo={demo_mode})')

        if demo_mode:
            await asyncio.sleep(1.2)  # Simulate inference latency
            key = _get_demo_key_for_filename(filename)
            if key and key in DEMO_FIXTURES:
                result = dict(DEMO_FIXTURES[key])
                result['inference_duration_ms'] = int((time.monotonic() - start) * 1000)
                return result
            return _build_generic_image_analysis(filename)

        # Live model path (stubbed — wire to Gemini Vision / GPT-4V in production)
        raise NotImplementedError('Live vision model not configured. Set DEMO_MODE=true for hackathon demo.')


# ---------------------------------------------------------------------------
# VIDEO ANALYZER
# ---------------------------------------------------------------------------
class VideoAnalyzer:
    "Analyzes video by sampling keyframes and producing temporal observations."

    async def analyze(
        self,
        video_data: bytes,
        filename: str = 'video.mp4',
        sample_interval_sec: float = 2.0,
        demo_mode: bool = True,
    ) -> dict:
        start = time.monotonic()
        logger.info(f'VideoAnalyzer.analyze called for {filename} (demo={demo_mode})')

        if demo_mode:
            await asyncio.sleep(2.0)  # Simulate keyframe extraction + analysis
            result = dict(DEMO_FIXTURES.get('DEMO_FLOOD_VIDEO', _build_generic_image_analysis(filename)))
            result['inference_duration_ms'] = int((time.monotonic() - start) * 1000)
            result['frames_sampled'] = 6
            result['sample_interval_sec'] = sample_interval_sec
            return result

        raise NotImplementedError('Live video model not configured.')


# ---------------------------------------------------------------------------
# AUDIO TRANSCRIBER
# ---------------------------------------------------------------------------
class AudioTranscriber:
    "Transcribes audio and extracts structured event intelligence."

    async def transcribe(
        self,
        audio_data: bytes,
        filename: str = 'audio.wav',
        demo_mode: bool = True,
    ) -> dict:
        start = time.monotonic()
        logger.info(f'AudioTranscriber.transcribe called for {filename} (demo={demo_mode})')

        if demo_mode:
            await asyncio.sleep(1.5)
            result = dict(DEMO_FIXTURES.get('DEMO_FLOOD_AUDIO', {}))
            result['inference_duration_ms'] = int((time.monotonic() - start) * 1000)
            return result

        raise NotImplementedError('Live speech-to-text not configured.')


# ---------------------------------------------------------------------------
# TEXT EVENT EXTRACTOR
# ---------------------------------------------------------------------------
class TextEventExtractor:
    "Extracts structured event intelligence from free-form text reports."

    # Simple keyword mapping for demo (production: use LLM with structured output)
    KEYWORD_MAP = {
        'flood': 'FLOODING', 'paani': 'FLOODING', 'water': 'FLOODING',
        'fire': 'FIRE', 'aag': 'FIRE', 'flames': 'FIRE',
        'smoke': 'SMOKE', 'dhua': 'SMOKE',
        'tree': 'ROAD_BLOCKAGE', 'fallen': 'ROAD_BLOCKAGE', 'ped': 'ROAD_BLOCKAGE',
        'accident': 'ACCIDENT', 'crash': 'ACCIDENT', 'collision': 'ACCIDENT',
        'power': 'UTILITY_DAMAGE', 'bijli': 'UTILITY_DAMAGE', 'electric': 'UTILITY_DAMAGE',
        'bridge': 'BRIDGE_DAMAGE', 'damage': 'ROAD_DAMAGE', 'broken': 'ROAD_DAMAGE',
        'crowd': 'CROWD_SURGE', 'hazard': 'HAZARD',
    }

    SEVERITY_KEYWORDS = {
        'completely': 'HIGH', 'pura': 'HIGH', 'major': 'HIGH', 'critical': 'CRITICAL',
        'emergency': 'CRITICAL', 'bad': 'HIGH', 'serious': 'HIGH',
        'minor': 'LOW', 'small': 'LOW', 'little': 'LOW',
        'moderate': 'MEDIUM', 'medium': 'MEDIUM',
    }

    async def extract(self, text: str, demo_mode: bool = True) -> dict:
        start = time.monotonic()
        text_lower = text.lower()

        # Detect event type
        detected_type = 'HAZARD'
        for keyword, event_type in self.KEYWORD_MAP.items():
            if keyword in text_lower:
                detected_type = event_type
                break

        # Detect severity hint
        severity = 'MEDIUM'
        for keyword, sev in self.SEVERITY_KEYWORDS.items():
            if keyword in text_lower:
                severity = sev
                break

        # Location hints from text
        location_hints = []
        location_keywords = ['bridge', 'hospital', 'road', 'sector', 'north', 'south', 'east', 'west',
                             'near', 'paas', 'gate', 'station', 'market', 'colony']
        for kw in location_keywords:
            if kw in text_lower:
                location_hints.append({'description': f'Reference to: {kw}', 'confidence': 0.65})

        return {
            'event_candidates': [{'type': detected_type, 'confidence': 0.80}],
            'objects': [],
            'severity_hint': {'value': severity, 'confidence': 0.70},
            'location_hints': location_hints[:3],
            'temporal_observations': [],
            'summary': f'Text report indicates possible {detected_type.replace("_", " ").lower()} event.',
            'uncertainties': ['Location not georeferenced', 'Severity inferred from text keywords only'],
            'original_text': text,
            'analysis_version': 'text-v1',
            'model_provider': 'KEYWORD_EXTRACTOR',
            'is_demo': demo_mode,
            'inference_duration_ms': int((time.monotonic() - start) * 1000),
        }


# ---------------------------------------------------------------------------
# LOCATION RESOLVER
# ---------------------------------------------------------------------------
class LocationResolver:
    # Resolves a vague location hint against known NEXUS world entities.
    # Returns candidate entity matches with confidence scores.

    # Simplified spatial entity knowledge for demo
    ENTITY_INDEX = [
        {'id': 'ent-road-r17', 'name': 'Road R17 Bypass', 'type': 'ROAD', 'lat': 26.918, 'lon': 75.792,
         'keywords': ['road', 'r17', 'bypass', 'bridge', 'paas', 'near']},
        {'id': 'ent-road-r18', 'name': 'Road R18 Main Boulevard', 'type': 'ROAD', 'lat': 26.920, 'lon': 75.795,
         'keywords': ['road', 'main', 'boulevard']},
        {'id': 'ent-bridge-b02', 'name': 'Bridge B02 Riverfront', 'type': 'BRIDGE', 'lat': 26.916, 'lon': 75.790,
         'keywords': ['bridge', 'river', 'riverfront', 'b02']},
        {'id': 'ent-hosp-central', 'name': 'Central Memorial Hospital', 'type': 'HOSPITAL', 'lat': 26.918, 'lon': 75.789,
         'keywords': ['hospital', 'central', 'memorial', 'medical']},
        {'id': 'ent-util-u17', 'name': 'Substation U17', 'type': 'UTILITY', 'lat': 26.914, 'lon': 75.796,
         'keywords': ['substation', 'power', 'utility', 'bijli', 'electric', 'u17']},
    ]

    async def resolve(self, location_hints: list[dict], text: str = '') -> dict:
        text_lower = text.lower()
        matches = []

        for entity in self.ENTITY_INDEX:
            score = 0.0
            for kw in entity['keywords']:
                if kw in text_lower:
                    score += 0.2

            for hint in location_hints:
                hint_text = hint.get('description', '').lower()
                for kw in entity['keywords']:
                    if kw in hint_text:
                        score += hint.get('confidence', 0.5) * 0.3

            score = min(score, 1.0)
            if score > 0.1:
                matches.append({
                    'entity_id': entity['id'],
                    'entity_name': entity['name'],
                    'entity_type': entity['type'],
                    'latitude': entity['lat'],
                    'longitude': entity['lon'],
                    'match_confidence': round(score, 3),
                })

        matches.sort(key=lambda x: x['match_confidence'], reverse=True)
        best = matches[0] if matches else None

        return {
            'best_match': best,
            'candidates': matches[:5],
            'resolved': best is not None and best['match_confidence'] > 0.4,
        }


# ---------------------------------------------------------------------------
# SINGLETON INSTANCES
# ---------------------------------------------------------------------------
vision_analyzer = VisionAnalyzer()
video_analyzer = VideoAnalyzer()
audio_transcriber = AudioTranscriber()
text_extractor = TextEventExtractor()
location_resolver = LocationResolver()
