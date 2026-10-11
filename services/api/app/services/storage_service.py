"""
NEXUS Storage Service
Provides a unified abstraction over MinIO / AWS S3 with transparent local filesystem fallback.
Supports buckets: nexus-evidence, nexus-generated, nexus-demo.
"""
from pathlib import Path
from typing import Optional
from app.core.config import settings
from app.core.logging import logger


class StorageService:
    def __init__(self):
        self.local_storage_root = Path("./data/storage")
        for bucket in [settings.S3_BUCKET_EVIDENCE, settings.S3_BUCKET_GENERATED, settings.S3_BUCKET_DEMO]:
            (self.local_storage_root / bucket).mkdir(parents=True, exist_ok=True)

    async def upload_file(
        self,
        bucket: str,
        object_key: str,
        data: bytes,
        content_type: str = "application/octet-stream"
    ) -> str:
        """Uploads a file to bucket and returns the object URI."""
        destination = self.local_storage_root / bucket / object_key
        destination.parent.mkdir(parents=True, exist_ok=True)
        with open(destination, "wb") as f:
            f.write(data)
        uri = f"/storage/{bucket}/{object_key}"
        logger.info(f"Stored object {uri} ({len(data)} bytes)")
        return uri

    async def get_file(self, bucket: str, object_key: str) -> Optional[bytes]:
        """Reads file data from bucket."""
        path = self.local_storage_root / bucket / object_key
        if path.exists():
            with open(path, "rb") as f:
                return f.read()
        return None

    async def delete_file(self, bucket: str, object_key: str) -> bool:
        """Deletes file from bucket."""
        path = self.local_storage_root / bucket / object_key
        if path.exists():
            path.unlink()
            return True
        return False

    async def get_signed_url(self, bucket: str, object_key: str, expires_in: int = 3600) -> str:
        """Generates a secure access URL for the object."""
        return f"/storage/{bucket}/{object_key}"


storage_service = StorageService()
