"""
NEXUS Phase 5 — Voice Command Center Router.
Endpoints:
- POST /api/v1/voice/command
"""
from typing import Optional
from fastapi import APIRouter, Depends, Form
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

