from datetime import datetime  
from typing import Optional  
from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text  
from sqlalchemy.orm import Mapped, mapped_column, relationship  
from app.models.base import TimeStampedModel  
  
  
class EvidenceItemModel(TimeStampedModel):  
    __tablename__ = 'evidence_items'  
    world_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)  
    report_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey('reports.id'), nullable=True, index=True)  
    incident_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey('incident_candidates.id'), nullable=True, index=True)  
    reporter_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)  
    evidence_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)  
    object_uri: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)  
    thumbnail_uri: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)  
    geometry: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  
    location_accuracy_m: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)  
    location_source: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  
    captured_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)  
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)  
    file_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  
    analysis: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  
    analysis_version: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)  
    analysis_model: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)  
    is_demo_analysis: Mapped[bool] = mapped_column(default=False, nullable=False)  
    processing_trace: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  
    status: Mapped[str] = mapped_column(String(32), default='UPLOADED', nullable=False, index=True)  
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  
    source: Mapped[str] = mapped_column(String(64), default='CITIZEN', nullable=False)  
    privacy_state: Mapped[str] = mapped_column(String(32), default='RESTRICTED', nullable=False)  
    text_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  
    detected_language: Mapped[Optional[str]] = mapped_column(String(16), nullable=True) 
    report: Mapped[Optional['ReportModel']] = relationship('ReportModel', back_populates='evidence_items')  
    candidate_incident: Mapped[Optional['IncidentCandidateModel']] = relationship(  
        'IncidentCandidateModel', back_populates='evidence_items', foreign_keys='EvidenceItemModel.incident_id'  
    )  
    jobs: Mapped[list['ProcessingJobModel']] = relationship(  
        'ProcessingJobModel', back_populates='evidence', cascade='all, delete-orphan'  
    )  
  
  
class ReportModel(TimeStampedModel):  
    __tablename__ = 'reports'  
    world_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)  
    reporter_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)  
    status: Mapped[str] = mapped_column(String(32), default='RECEIVED', nullable=False, index=True)  
    geometry: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  
    location_accuracy_m: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)  
    location_source: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  
    candidate_incident_id: Mapped[Optional[str]] = mapped_column(  
        String(64), ForeignKey('incident_candidates.id'), nullable=True, index=True  
    )  
    evidence_items: Mapped[list['EvidenceItemModel']] = relationship(  
        'EvidenceItemModel', back_populates='report', cascade='all, delete-orphan'  
    )  
    candidate_incident: Mapped[Optional['IncidentCandidateModel']] = relationship(  
        'IncidentCandidateModel', back_populates='reports', foreign_keys='ReportModel.candidate_incident_id'  
    ) 
  
  
class IncidentCandidateModel(TimeStampedModel):  
    __tablename__ = 'incident_candidates'  
    world_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)  
    incident_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)  
    title: Mapped[str] = mapped_column(String(256), nullable=False)  
    summary: Mapped[str] = mapped_column(String(1024), default='', nullable=False)  
    status: Mapped[str] = mapped_column(String(32), default='CANDIDATE', nullable=False, index=True)  
    severity_hint: Mapped[str] = mapped_column(String(32), default='MEDIUM', nullable=False)  
    severity: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)  
    confidence: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)  
    epistemic_status: Mapped[str] = mapped_column(String(32), default='OBSERVED', nullable=False)  
    geometry: Mapped[dict] = mapped_column(JSON, nullable=False)  
    affected_radius_meters: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)  
    resolved_entity_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  
    entity_match_confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  
    entity_candidates: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  
    evidence_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)  
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)  
    review_note: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)  
    operational_incident_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  
    evidence_items: Mapped[list['EvidenceItemModel']] = relationship(  
        'EvidenceItemModel', back_populates='candidate_incident', foreign_keys='EvidenceItemModel.incident_id'  
    )  
    reports: Mapped[list['ReportModel']] = relationship(  
        'ReportModel', back_populates='candidate_incident', foreign_keys='ReportModel.candidate_incident_id'  
    )  
  
  
class ProcessingJobModel(TimeStampedModel):  
    __tablename__ = 'processing_jobs'  
    evidence_id: Mapped[str] = mapped_column(String(64), ForeignKey('evidence_items.id'), nullable=False, index=True)  
    job_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)  
    status: Mapped[str] = mapped_column(String(32), default='QUEUED', nullable=False, index=True)  
    retries: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  
    max_retries: Mapped[int] = mapped_column(Integer, default=3, nullable=False)  
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)  
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)  
    error_message: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)  
    result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  
    model_provider: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  
    model_version: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)  
    inference_duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  
    evidence: Mapped['EvidenceItemModel'] = relationship('EvidenceItemModel', back_populates='jobs') 
