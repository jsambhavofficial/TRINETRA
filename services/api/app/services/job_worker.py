# NEXUS Phase 3 Background Job Worker.
# Processes QUEUED jobs for evidence analysis, location resolution, and candidate incident creation.
# Runs as an asyncio background task alongside the FastAPI server.
import asyncio
from datetime import datetime, timezone
from typing import Optional
from app.core.config import settings
from app.core.logging import logger
from app.db.session import async_session_factory
from app.models.evidence import EvidenceItemModel, IncidentCandidateModel, ProcessingJobModel, ReportModel
from app.services.ai_pipeline import (
    audio_transcriber,
    location_resolver,
    text_extractor,
    video_analyzer,
    vision_analyzer,
)
from app.services.event_hub import event_hub
from app.services.storage_service import storage_service
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid


POLL_INTERVAL_SEC = 2.0
MAX_CONCURRENT_JOBS = 3


async def _mark_job(db: AsyncSession, job: ProcessingJobModel, status: str, error: str = None, result: dict = None):
    job.status = status
    if status == 'RUNNING':
        job.started_at = datetime.now(timezone.utc)
    elif status in ('SUCCEEDED', 'FAILED'):
        job.completed_at = datetime.now(timezone.utc)
    if error:
        job.error_message = error[:512]
    if result:
        job.result = result
    await db.commit()
    await db.refresh(job)


async def _update_evidence_trace(db: AsyncSession, evidence: EvidenceItemModel, step: str):
    trace = evidence.processing_trace or {}
    trace[step] = datetime.now(timezone.utc).isoformat()
    evidence.processing_trace = trace
    await db.commit()


async def _process_analyze_image(db: AsyncSession, job: ProcessingJobModel, evidence: EvidenceItemModel):
    await _mark_job(db, job, 'RUNNING')
    try:
        raw = await storage_service.get_file('nexus-evidence', f'evidence/{evidence.id}/original')
        filename = (evidence.file_metadata or {}).get('original_filename', 'image.jpg')
        if not raw:
            raw = b''  # Demo will ignore bytes anyway

        result = await vision_analyzer.analyze(raw, filename=filename, demo_mode=settings.DEMO_MODE)

        evidence.analysis = result
        evidence.analysis_version = result.get('analysis_version', 'v1')
        evidence.analysis_model = result.get('model_provider', 'DEMO_FALLBACK')
        evidence.is_demo_analysis = result.get('is_demo', False)
        evidence.confidence = result.get('severity_hint', {}).get('confidence', 0.7)
        evidence.status = 'ANALYZED'
        await _update_evidence_trace(db, evidence, 'analyzed')
        await _mark_job(db, job, 'SUCCEEDED', result={'analysis_done': True})
        logger.info(f'Image analysis complete for evidence {evidence.id}')
        return result
    except Exception as e:
        logger.error(f'Image analysis failed for {evidence.id}: {e}', exc_info=True)
        evidence.status = 'NEEDS_REVIEW'
        await db.commit()
        await _mark_job(db, job, 'FAILED', error=str(e))
        return None


async def _process_analyze_video(db: AsyncSession, job: ProcessingJobModel, evidence: EvidenceItemModel):
    await _mark_job(db, job, 'RUNNING')
    try:
        raw = await storage_service.get_file('nexus-evidence', f'evidence/{evidence.id}/original')
        filename = (evidence.file_metadata or {}).get('original_filename', 'video.mp4')
        result = await video_analyzer.analyze(raw or b'', filename=filename, demo_mode=settings.DEMO_MODE)

        evidence.analysis = result
        evidence.analysis_version = result.get('analysis_version', 'v1')
        evidence.analysis_model = result.get('model_provider', 'DEMO_FALLBACK')
        evidence.is_demo_analysis = result.get('is_demo', False)
        evidence.confidence = result.get('severity_hint', {}).get('confidence', 0.7)
        evidence.status = 'ANALYZED'
        await _update_evidence_trace(db, evidence, 'analyzed')
        await _mark_job(db, job, 'SUCCEEDED', result={'analysis_done': True})
        return result
    except Exception as e:
        logger.error(f'Video analysis failed for {evidence.id}: {e}', exc_info=True)
        evidence.status = 'NEEDS_REVIEW'
        await db.commit()
        await _mark_job(db, job, 'FAILED', error=str(e))
        return None


async def _process_transcribe_audio(db: AsyncSession, job: ProcessingJobModel, evidence: EvidenceItemModel):
    await _mark_job(db, job, 'RUNNING')
    try:
        raw = await storage_service.get_file('nexus-evidence', f'evidence/{evidence.id}/original')
        filename = (evidence.file_metadata or {}).get('original_filename', 'audio.wav')
        result = await audio_transcriber.transcribe(raw or b'', filename=filename, demo_mode=settings.DEMO_MODE)

        evidence.analysis = result
        evidence.text_content = result.get('transcript', '')
        evidence.detected_language = result.get('detected_language', 'en')
        evidence.analysis_version = result.get('analysis_version', 'v1')
        evidence.analysis_model = result.get('model_provider', 'DEMO_FALLBACK')
        evidence.is_demo_analysis = result.get('is_demo', False)
        evidence.confidence = result.get('severity_hint', {}).get('confidence', 0.7)
        evidence.status = 'ANALYZED'
        await _update_evidence_trace(db, evidence, 'analyzed')
        await _mark_job(db, job, 'SUCCEEDED', result={'transcribed': True})
        return result
    except Exception as e:
        logger.error(f'Audio transcription failed for {evidence.id}: {e}', exc_info=True)
        evidence.status = 'NEEDS_REVIEW'
        await db.commit()
        await _mark_job(db, job, 'FAILED', error=str(e))
        return None


async def _process_extract_text_event(db: AsyncSession, job: ProcessingJobModel, evidence: EvidenceItemModel):
    await _mark_job(db, job, 'RUNNING')
    try:
        text = evidence.text_content or ''
        result = await text_extractor.extract(text, demo_mode=settings.DEMO_MODE)

        evidence.analysis = result
        evidence.analysis_version = result.get('analysis_version', 'v1')
        evidence.analysis_model = result.get('model_provider', 'KEYWORD_EXTRACTOR')
        evidence.is_demo_analysis = result.get('is_demo', False)
        evidence.confidence = result.get('severity_hint', {}).get('confidence', 0.7)
        evidence.status = 'ANALYZED'
        await _update_evidence_trace(db, evidence, 'analyzed')
        await _mark_job(db, job, 'SUCCEEDED', result={'extracted': True})
        return result
    except Exception as e:
        logger.error(f'Text extraction failed for {evidence.id}: {e}', exc_info=True)
        evidence.status = 'NEEDS_REVIEW'
        await db.commit()
        await _mark_job(db, job, 'FAILED', error=str(e))
        return None


async def _process_resolve_location(db: AsyncSession, job: ProcessingJobModel, evidence: EvidenceItemModel):
    await _mark_job(db, job, 'RUNNING')
    try:
        analysis = evidence.analysis or {}
        location_hints = analysis.get('location_hints', [])
        text = evidence.text_content or analysis.get('summary', '')
        resolution = await location_resolver.resolve(location_hints, text=text)

        # Embed resolution into analysis
        analysis['entity_resolution'] = resolution
        evidence.analysis = analysis
        await _update_evidence_trace(db, evidence, 'location_resolved')
        await _mark_job(db, job, 'SUCCEEDED', result=resolution)
        return resolution
    except Exception as e:
        logger.error(f'Location resolution failed for {evidence.id}: {e}', exc_info=True)
        await _mark_job(db, job, 'FAILED', error=str(e))
        return None


async def _process_create_candidate(db: AsyncSession, job: ProcessingJobModel, evidence: EvidenceItemModel):
    await _mark_job(db, job, 'RUNNING')
    try:
        analysis = evidence.analysis or {}
        event_candidates = analysis.get('event_candidates', [])
        severity_hint = analysis.get('severity_hint', {})
        resolution = analysis.get('entity_resolution', {})
        best_match = resolution.get('best_match')

        if not event_candidates:
            await _mark_job(db, job, 'SUCCEEDED', result={'skipped': 'no event candidates'})
            return

        top_event = event_candidates[0]
        incident_type = top_event['type']
        confidence = top_event['confidence']

        # Determine geometry: use evidence location or resolved entity location
        if evidence.geometry:
            geometry = evidence.geometry
        elif best_match:
            geometry = {'type': 'Point', 'coordinates': [best_match['longitude'], best_match['latitude']]}
        else:
            geometry = {'type': 'Point', 'coordinates': [75.791, 26.917]}  # NEXUS City center fallback

        summary = analysis.get('summary', f'Possible {incident_type} event detected from submitted evidence.')

        candidate = IncidentCandidateModel(
            id=f'cand-{uuid.uuid4().hex[:12]}',
            world_id=evidence.world_id,
            incident_type=incident_type,
            title=f'[CANDIDATE] {incident_type.replace("_", " ").title()} — Evidence Submitted',
            summary=summary,
            status='CANDIDATE',
            severity_hint=severity_hint.get('value', 'MEDIUM'),
            confidence=round(confidence, 3),
            epistemic_status='OBSERVED',
            geometry=geometry,
            affected_radius_meters=200.0,
            resolved_entity_id=best_match['entity_id'] if best_match else None,
            entity_match_confidence=best_match['match_confidence'] if best_match else 0.0,
            entity_candidates={'candidates': resolution.get('candidates', [])},
            evidence_count=1,
        )
        db.add(candidate)

        # Link evidence to candidate
        evidence.incident_id = candidate.id
        evidence.status = 'ACCEPTED'

        # Link report to candidate if present
        if evidence.report_id:
            report_result = await db.execute(select(ReportModel).where(ReportModel.id == evidence.report_id))
            report = report_result.scalars().first()
            if report:
                report.candidate_incident_id = candidate.id
                report.status = 'ANALYZED'

        await db.commit()
        await db.refresh(candidate)
        await _update_evidence_trace(db, evidence, 'candidate_created')

        # Broadcast to world via WebSocket
        await event_hub.broadcast_event(
            world_id=evidence.world_id,
            event_type='CANDIDATE_INCIDENT_CREATED',
            payload={
                'id': candidate.id,
                'incident_type': candidate.incident_type,
                'title': candidate.title,
                'severity_hint': candidate.severity_hint,
                'confidence': candidate.confidence,
                'geometry': candidate.geometry,
                'affected_radius_meters': candidate.affected_radius_meters,
                'status': 'CANDIDATE',
                'evidence_count': 1,
                'message': f'New candidate incident: {candidate.title}',
            }
        )

        await _mark_job(db, job, 'SUCCEEDED', result={'candidate_id': candidate.id})
        logger.info(f'Candidate incident created: {candidate.id} for evidence {evidence.id}')
    except Exception as e:
        logger.error(f'Candidate creation failed for {evidence.id}: {e}', exc_info=True)
        await _mark_job(db, job, 'FAILED', error=str(e))


JOB_PROCESSORS = {
    'ANALYZE_IMAGE': _process_analyze_image,
    'ANALYZE_VIDEO': _process_analyze_video,
    'TRANSCRIBE_AUDIO': _process_transcribe_audio,
    'EXTRACT_TEXT_EVENT': _process_extract_text_event,
    'RESOLVE_LOCATION': _process_resolve_location,
    'CREATE_CANDIDATE_INCIDENT': _process_create_candidate,
}


async def _run_job(job_id: str):
    "Execute a single job by ID, sequencing dependent steps."
    async with async_session_factory() as db:
        result = await db.execute(select(ProcessingJobModel).where(ProcessingJobModel.id == job_id))
        job = result.scalars().first()
        if not job or job.status not in ('QUEUED', 'RETRYING'):
            return

        ev_result = await db.execute(select(EvidenceItemModel).where(EvidenceItemModel.id == job.evidence_id))
        evidence = ev_result.scalars().first()
        if not evidence:
            return

        processor = JOB_PROCESSORS.get(job.job_type)
        if processor:
            analysis = await processor(db, job, evidence)

            # Chain: after analysis, auto-queue resolve_location then create_candidate
            if job.job_type in ('ANALYZE_IMAGE', 'ANALYZE_VIDEO', 'TRANSCRIBE_AUDIO', 'EXTRACT_TEXT_EVENT') and analysis:
                # Queue location resolution
                resolve_job = ProcessingJobModel(
                    id=f'job-{uuid.uuid4().hex[:12]}',
                    evidence_id=evidence.id,
                    job_type='RESOLVE_LOCATION',
                    status='QUEUED',
                )
                db.add(resolve_job)
                await db.commit()
                await db.refresh(resolve_job)

                # Run resolve synchronously in chain
                await asyncio.sleep(0.1)
                await _process_resolve_location(db, resolve_job, evidence)

                # Queue candidate incident creation
                candidate_job = ProcessingJobModel(
                    id=f'job-{uuid.uuid4().hex[:12]}',
                    evidence_id=evidence.id,
                    job_type='CREATE_CANDIDATE_INCIDENT',
                    status='QUEUED',
                )
                db.add(candidate_job)
                await db.commit()
                await db.refresh(candidate_job)

                await asyncio.sleep(0.1)
                await _process_create_candidate(db, candidate_job, evidence)


class JobWorker:
    "Background job worker that polls the DB for QUEUED jobs and processes them."

    def __init__(self):
        self._task: Optional[asyncio.Task] = None
        self._semaphore = asyncio.Semaphore(MAX_CONCURRENT_JOBS)

    def start(self):
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._poll_loop())
            logger.info('JobWorker started.')

    async def _poll_loop(self):
        while True:
            try:
                await self._process_pending()
            except Exception as e:
                logger.error(f'JobWorker poll error: {e}', exc_info=True)
            await asyncio.sleep(POLL_INTERVAL_SEC)

    async def _process_pending(self):
        async with async_session_factory() as db:
            stmt = (
                select(ProcessingJobModel)
                .where(ProcessingJobModel.status.in_(['QUEUED', 'RETRYING']))
                .order_by(ProcessingJobModel.created_at)
                .limit(MAX_CONCURRENT_JOBS)
            )
            result = await db.execute(stmt)
            pending = result.scalars().all()

        for job in pending:
            asyncio.create_task(self._run_with_semaphore(job.id))

    async def _run_with_semaphore(self, job_id: str):
        async with self._semaphore:
            await _run_job(job_id)


job_worker = JobWorker()
