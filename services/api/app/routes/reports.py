# NEXUS Phase 3 Reports and Evidence API Router  
import hashlib  
import uuid  
from datetime import datetime, timezone  
from typing import List, Optional  
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile, status  
from fastapi.responses import FileResponse  
from sqlalchemy import select  
from sqlalchemy.ext.asyncio import AsyncSession  
from app.core.config import settings  
from app.core.logging import logger  
from app.db.session import get_db  
from app.models.evidence import EvidenceItemModel, IncidentCandidateModel, ProcessingJobModel, ReportModel  
from app.services.storage_service import storage_service  
from app.services.job_worker import job_worker 
  
router = APIRouter(prefix='', tags=['Reports and Evidence'])  
  
ALLOWED_IMAGE_MIME = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}  
ALLOWED_VIDEO_MIME = {'video/mp4', 'video/webm', 'video/quicktime'}  
ALLOWED_AUDIO_MIME = {'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/webm'}  
MAX_FILE_SIZE_MB = 50  
  
  
def _get_job_type(evidence_type):  
    return {'IMAGE': 'ANALYZE_IMAGE', 'VIDEO': 'ANALYZE_VIDEO', 'AUDIO': 'TRANSCRIBE_AUDIO', 'TEXT': 'EXTRACT_TEXT_EVENT'}.get(evidence_type, 'ANALYZE_IMAGE')  
  
  
def _detect_type(mime, filename):  
    if mime.startswith('image/'): return 'IMAGE'  
    if mime.startswith('video/'): return 'VIDEO'  
    if mime.startswith('audio/'): return 'AUDIO'  
    ext = filename.lower().rsplit('.', 1)[-1] if '.' in filename else ''  
    return {'jpg': 'IMAGE', 'jpeg': 'IMAGE', 'png': 'IMAGE', 'mp4': 'VIDEO', 'mov': 'VIDEO', 'wav': 'AUDIO', 'mp3': 'AUDIO', 'txt': 'TEXT'}.get(ext, 'IMAGE') 
  
@router.post('/evidence/upload', status_code=202)  
async def upload_evidence(  
    file: UploadFile = File(...),  
    world_id: str = Form(default='world-nexus-city-01'),  
    latitude: Optional[float] = Form(default=None),  
    longitude: Optional[float] = Form(default=None),  
    location_accuracy_m: float = Form(default=100.0),  
    location_source: str = Form(default='user_selected'),  
    text_content: Optional[str] = Form(default=None),  
    reporter_id: Optional[str] = Form(default=None),  
    report_id: Optional[str] = Form(default=None),  
    db: AsyncSession = Depends(get_db),  
):  
    file_data = await file.read()  
    file_size = len(file_data)  
    if file_size > MAX_FILE_SIZE_MB * 1024 * 1024:  
        raise HTTPException(status_code=413, detail='File too large. Maximum 50MB.')  

    filename = file.filename or 'upload'
    ext = filename.lower().rsplit('.', 1)[-1] if '.' in filename else ''
    DISALLOWED_EXTENSIONS = {'exe', 'sh', 'bat', 'cmd', 'ps1', 'php', 'py', 'pl', 'jsp', 'asp', 'aspx', 'dll', 'so'}
    if ext in DISALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f'File type .{ext} is prohibited for security reasons.')

    mime = file.content_type or 'application/octet-stream'  
    evidence_type = _detect_type(mime, filename)  
    evidence_id = 'ev-' + uuid.uuid4().hex[:16]  
    sha256 = hashlib.sha256(file_data).hexdigest()  

    now = datetime.now(timezone.utc)  
    object_key = 'evidence/' + evidence_id + '/original'  
    object_uri = await storage_service.upload_file('nexus-evidence', object_key, file_data, mime)  
    geometry = None  
    if latitude is not None and longitude is not None:  
        geometry = {'type': 'Point', 'coordinates': [longitude, latitude]}  
    file_meta = {'mime_type': mime, 'size_bytes': file_size, 'sha256': sha256, 'original_filename': file.filename or 'upload'}  
    evidence = EvidenceItemModel(id=evidence_id, world_id=world_id, report_id=report_id, reporter_id=reporter_id, evidence_type=evidence_type, object_uri=object_uri, geometry=geometry, location_accuracy_m=location_accuracy_m, location_source=location_source, received_at=now, captured_at=now, file_metadata=file_meta, status='UPLOADED', source='CITIZEN', privacy_state='RESTRICTED', text_content=text_content, processing_trace={'received': now.isoformat(), 'stored': now.isoformat()})  
    db.add(evidence)  
    job_id = 'job-' + uuid.uuid4().hex[:12]  
    job = ProcessingJobModel(id=job_id, evidence_id=evidence_id, job_type=_get_job_type(evidence_type), status='QUEUED')  
    db.add(job)  
    await db.commit()  
    job_worker.start()  
    return {'evidence_id': evidence_id, 'job_id': job_id, 'status': 'PROCESSING', 'evidence_type': evidence_type, 'file_size_bytes': file_size, 'message': 'Evidence received. Analysis in progress.'} 
  
@router.post('/reports', status_code=202)  
async def create_text_report(world_id: str = Form(default='world-nexus-city-01'), text_content: str = Form(...), latitude: Optional[float] = Form(default=None), longitude: Optional[float] = Form(default=None), location_accuracy_m: float = Form(default=200.0), location_source: str = Form(default='user_selected'), reporter_id: Optional[str] = Form(default=None), db: AsyncSession = Depends(get_db)):  
    now = datetime.now(timezone.utc)  
    report_id = 'rep-' + uuid.uuid4().hex[:12]  
    evidence_id = 'ev-' + uuid.uuid4().hex[:16]  
    geometry = {'type': 'Point', 'coordinates': [longitude, latitude]} if latitude is not None and longitude is not None else None  
    report = ReportModel(id=report_id, world_id=world_id, reporter_id=reporter_id, status='PROCESSING', geometry=geometry, location_accuracy_m=location_accuracy_m, location_source=location_source, description=text_content)  
    db.add(report)  
    evidence = EvidenceItemModel(id=evidence_id, world_id=world_id, report_id=report_id, reporter_id=reporter_id, evidence_type='TEXT', geometry=geometry, location_accuracy_m=location_accuracy_m, location_source=location_source, received_at=now, captured_at=now, status='UPLOADED', source='CITIZEN', privacy_state='RESTRICTED', text_content=text_content, processing_trace={'received': now.isoformat()})  
    db.add(evidence)  
    job = ProcessingJobModel(id='job-' + uuid.uuid4().hex[:12], evidence_id=evidence_id, job_type='EXTRACT_TEXT_EVENT', status='QUEUED')  
    db.add(job)  
    await db.commit()  
    job_worker.start()  
    return {'report_id': report_id, 'evidence_id': evidence_id, 'status': 'PROCESSING', 'message': 'Text report received. Analysis in progress.'} 
  
@router.get('/evidence/{evidence_id}')  
async def get_evidence(evidence_id: str, db: AsyncSession = Depends(get_db)):  
    r = await db.execute(select(EvidenceItemModel).where(EvidenceItemModel.id == evidence_id))  
    ev = r.scalars().first()  
    if not ev: raise HTTPException(status_code=404, detail='Evidence not found')  
    return {'id': ev.id, 'world_id': ev.world_id, 'report_id': ev.report_id, 'incident_id': ev.incident_id, 'evidence_type': ev.evidence_type, 'object_uri': ev.object_uri, 'geometry': ev.geometry, 'location_accuracy_m': ev.location_accuracy_m, 'location_source': ev.location_source, 'captured_at': ev.captured_at.isoformat() if ev.captured_at else None, 'received_at': ev.received_at.isoformat() if ev.received_at else None, 'file_metadata': ev.file_metadata, 'status': ev.status, 'confidence': ev.confidence, 'source': ev.source, 'text_content': ev.text_content, 'detected_language': ev.detected_language, 'analysis_version': ev.analysis_version, 'analysis_model': ev.analysis_model, 'is_demo_analysis': ev.is_demo_analysis, 'processing_trace': ev.processing_trace, 'created_at': ev.created_at.isoformat() if ev.created_at else None}  
  
@router.get('/evidence/{evidence_id}/analysis')  
async def get_evidence_analysis(evidence_id: str, db: AsyncSession = Depends(get_db)):  
    r = await db.execute(select(EvidenceItemModel).where(EvidenceItemModel.id == evidence_id))  
    ev = r.scalars().first()  
    if not ev: raise HTTPException(status_code=404, detail='Evidence not found')  
    return {'evidence_id': evidence_id, 'status': ev.status, 'analysis': ev.analysis, 'confidence': ev.confidence, 'is_demo_analysis': ev.is_demo_analysis, 'analysis_model': ev.analysis_model, 'processing_trace': ev.processing_trace} 
  
@router.get('/reports/{report_id}')  
async def get_report(report_id: str, db: AsyncSession = Depends(get_db)):  
    r = await db.execute(select(ReportModel).where(ReportModel.id == report_id))  
    report = r.scalars().first()  
    if not report: raise HTTPException(status_code=404, detail='Report not found')  
    evr = await db.execute(select(EvidenceItemModel).where(EvidenceItemModel.report_id == report_id))  
    evs = evr.scalars().all()  
    return {'id': report.id, 'world_id': report.world_id, 'status': report.status, 'geometry': report.geometry, 'description': report.description, 'candidate_incident_id': report.candidate_incident_id, 'evidence_count': len(evs), 'evidence_items': [{'id': e.id, 'type': e.evidence_type, 'status': e.status} for e in evs], 'created_at': report.created_at.isoformat() if report.created_at else None}  
  
@router.get('/incidents/candidates')  
async def list_candidates(world_id: Optional[str] = Query(default=None), status_filter: Optional[str] = Query(default=None, alias='status'), db: AsyncSession = Depends(get_db)):  
    stmt = select(IncidentCandidateModel).order_by(IncidentCandidateModel.created_at.desc())  
    if world_id: stmt = stmt.where(IncidentCandidateModel.world_id == world_id)  
    if status_filter: stmt = stmt.where(IncidentCandidateModel.status == status_filter.upper())  
    r = await db.execute(stmt)  
    candidates = r.scalars().all()  
    return [{'id': c.id, 'world_id': c.world_id, 'incident_type': c.incident_type, 'title': c.title, 'summary': c.summary, 'status': c.status, 'severity_hint': c.severity_hint, 'confidence': c.confidence, 'epistemic_status': c.epistemic_status, 'geometry': c.geometry, 'affected_radius_meters': c.affected_radius_meters, 'resolved_entity_id': c.resolved_entity_id, 'evidence_count': c.evidence_count, 'created_at': c.created_at.isoformat() if c.created_at else None} for c in candidates]  
  
@router.get('/incidents/candidates/{candidate_id}')  
async def get_candidate(candidate_id: str, db: AsyncSession = Depends(get_db)):  
    r = await db.execute(select(IncidentCandidateModel).where(IncidentCandidateModel.id == candidate_id))  
    c = r.scalars().first()  
    if not c: raise HTTPException(status_code=404, detail='Candidate not found')  
    evr = await db.execute(select(EvidenceItemModel).where(EvidenceItemModel.incident_id == candidate_id))  
    evs = evr.scalars().all()  
    return {'id': c.id, 'world_id': c.world_id, 'incident_type': c.incident_type, 'title': c.title, 'summary': c.summary, 'status': c.status, 'severity_hint': c.severity_hint, 'confidence': c.confidence, 'epistemic_status': c.epistemic_status, 'geometry': c.geometry, 'affected_radius_meters': c.affected_radius_meters, 'resolved_entity_id': c.resolved_entity_id, 'entity_match_confidence': c.entity_match_confidence, 'entity_candidates': c.entity_candidates, 'evidence_count': c.evidence_count, 'reviewed_by': c.reviewed_by, 'reviewed_at': c.reviewed_at.isoformat() if c.reviewed_at else None, 'review_note': c.review_note, 'evidence_items': [{'id': e.id, 'type': e.evidence_type, 'status': e.status, 'confidence': e.confidence} for e in evs], 'created_at': c.created_at.isoformat() if c.created_at else None}  
  
@router.post('/incidents/candidates/{candidate_id}/confirm')  
async def confirm_candidate(candidate_id: str, reviewer_id: str = Form(default='operator'), note: Optional[str] = Form(default=None), db: AsyncSession = Depends(get_db)):  
    from app.services.event_hub import event_hub  
    r = await db.execute(select(IncidentCandidateModel).where(IncidentCandidateModel.id == candidate_id))  
    c = r.scalars().first()  
    if not c: raise HTTPException(status_code=404, detail='Candidate not found')  
    c.status = 'CONFIRMED'; c.severity = c.severity_hint; c.reviewed_by = reviewer_id; c.reviewed_at = datetime.now(timezone.utc); c.review_note = note  
    await db.commit()  
    await event_hub.broadcast_event(world_id=c.world_id, event_type='CANDIDATE_INCIDENT_CONFIRMED', payload={'id': c.id, 'status': 'CONFIRMED', 'incident_type': c.incident_type, 'severity': c.severity})  
    return {'id': c.id, 'status': 'CONFIRMED', 'severity': c.severity}  
  
@router.post('/incidents/candidates/{candidate_id}/reject')  
async def reject_candidate(candidate_id: str, reviewer_id: str = Form(default='operator'), note: Optional[str] = Form(default=None), db: AsyncSession = Depends(get_db)):  
    r = await db.execute(select(IncidentCandidateModel).where(IncidentCandidateModel.id == candidate_id))  
    c = r.scalars().first()  
    if not c: raise HTTPException(status_code=404, detail='Candidate not found')  
    c.status = 'REJECTED'; c.reviewed_by = reviewer_id; c.reviewed_at = datetime.now(timezone.utc); c.review_note = note  
    await db.commit()  
    return {'id': c.id, 'status': 'REJECTED'}  
  
@router.get('/entities/resolve')  
async def resolve_entities(q: str = Query(...), db: AsyncSession = Depends(get_db)):  
    from app.services.ai_pipeline import location_resolver  
    return await location_resolver.resolve([{'description': q, 'confidence': 0.8}], text=q)  
  
@router.get('/storage/{bucket}/{path:path}')  
async def serve_media(bucket: str, path: str):  
    from pathlib import Path  
    fp = Path('./data/storage') / bucket / path  
    if not fp.exists(): raise HTTPException(status_code=404, detail='File not found')  
    return FileResponse(str(fp)) 
