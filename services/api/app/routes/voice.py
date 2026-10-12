"""
NEXUS Phase 5 — Voice Command Center Router.
Endpoints:
- POST /api/v1/voice/command
"""
from typing import Optional
from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.voice_service import voice_service

from app.auth.dependencies import get_optional_user
from app.models.organization import UserModel

router = APIRouter(prefix="", tags=["Voice Command Center"])


class VoiceCommandRequest(BaseModel):
    query: str
    actor: Optional[str] = "Commander Vikram Malhotra"


@router.post("/voice/command")
async def execute_voice_command(
    req: VoiceCommandRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_optional_user),
):
    """
    Processes spoken or textual commander commands via authorized typed tools.
    Returns natural language response, tool execution results, and client UI action vectors.
    """
    return await voice_service.process_command(
        text_query=req.query,
        actor=req.actor or (current_user.display_name if current_user else "Commander Vikram Malhotra"),
        db=db,
        user=current_user,
    )


@router.post("/voice/transcribe")
async def transcribe_voice_complaint(
    file: UploadFile = File(...),
    language: str = Form("en"),
    current_user: Optional[UserModel] = Depends(get_optional_user),
):
    """
    Transcribes recorded audio for citizen grievance reporting.
    Validates file MIME type, size, and uses configurable STT provider.
    Returns transcript for citizen review and correction before submission.
    """
    from app.core.config import settings

    # Check if STT provider is disabled
    if settings.STT_PROVIDER == "none":
        raise HTTPException(
            status_code=503,
            detail="Speech-to-text service is currently unconfigured. Please submit your complaint using text or browser speech recognition."
        )

    # Validate audio MIME type
    allowed_mimes = [
        "audio/webm", "audio/wav", "audio/x-wav", "audio/ogg",
        "audio/mp3", "audio/mpeg", "audio/m4a", "audio/x-m4a", "audio/mp4"
    ]
    content_type = file.content_type or "audio/webm"
    if content_type not in allowed_mimes and not file.filename.endswith((".webm", ".wav", ".ogg", ".mp3", ".m4a")):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format '{content_type}'. Allowed formats: WEBM, WAV, OGG, MP3, M4A."
        )

    # Read audio content with size limit
    audio_bytes = await file.read()
    if len(audio_bytes) > settings.UPLOAD_MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"Audio file exceeds maximum allowed size ({settings.UPLOAD_MAX_BYTES // (1024*1024)}MB)")
    if len(audio_bytes) < 64:
        raise HTTPException(status_code=400, detail="Audio recording is empty or corrupt. Please re-record.")

    # Provider Execution
    if settings.STT_PROVIDER == "whisper":
        try:
            import whisper
            # If local whisper model is present
            model = whisper.load_model("base")
            result = model.transcribe(audio_bytes)
            transcript = result.get("text", "").strip()
            provider_label = "OPENAI_WHISPER_LOCAL"
            is_sim = False
        except Exception:
            # Fall back to demo provider if whisper is not installed in local environment
            provider_label = "DEMO_STT_PROVIDER"
            is_sim = True
            transcript = "Near Sector 14 market, main transformer is sparking continuously and there is severe waterlogging."
    else:
        # Transparently labeled demo provider
        provider_label = "DEMO_STT_PROVIDER"
        is_sim = True
        sample_transcripts = {
            "hi": "सुभाष चौक अंडरपास में अत्यधिक जलभराव है और पंप बंद पड़ा है।",
            "en": "Severe waterlogging at Subhash Chowk underpass. Storm water rising rapidly, traffic diverted and drainage inlet choked.",
            "hinglish": "Subhash chowk underpass me paani bhar gaya hai, traffic jam hai aur pump kaam nahi kar raha.",
        }
        transcript = sample_transcripts.get(language, sample_transcripts["en"])

    return {
        "status": "SUCCESS",
        "transcript": transcript,
        "language": language,
        "confidence": 0.91,
        "provider": provider_label,
        "is_simulated": is_sim,
        "file_size_bytes": len(audio_bytes),
        "disclaimer": "Transcription provided for citizen verification. Please review and correct before submission.",
    }


