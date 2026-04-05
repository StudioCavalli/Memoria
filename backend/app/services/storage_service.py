"""
S3-compatible storage service with local filesystem fallback.
When S3/boto3 is not available, files are saved locally in backend/uploads/
and served via FastAPI StaticFiles.
"""
from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import settings

try:
    import boto3
    from botocore.config import Config
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False

UPLOADS_DIR = Path(__file__).parent.parent.parent / "uploads"


class StorageService:
    def __init__(self):
        if HAS_BOTO3 and settings.s3_access_key and settings.s3_access_key != "minioadmin":
            self.client = boto3.client(
                "s3",
                endpoint_url=settings.s3_endpoint,
                aws_access_key_id=settings.s3_access_key,
                aws_secret_access_key=settings.s3_secret_key,
                config=Config(signature_version="s3v4"),
                region_name="us-east-1",
            )
            self.use_local = False
        else:
            self.client = None
            self.use_local = True
            UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

        self.bucket = settings.s3_bucket

    def upload(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        """Upload bytes and return the URL."""
        if self.use_local:
            return self._local_upload(key, data)
        self._ensure_bucket()
        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return f"{settings.s3_endpoint}/{self.bucket}/{key}"

    def upload_audio(self, session_id: int, audio_data: bytes, format: str = "webm") -> str:
        """Upload a session audio recording."""
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        key = f"audio/sessions/{session_id}/{timestamp}.{format}"
        content_type_map = {
            "webm": "audio/webm",
            "mp3": "audio/mpeg",
            "wav": "audio/wav",
            "ogg": "audio/ogg",
            "opus": "audio/opus",
        }
        return self.upload(key, audio_data, content_type_map.get(format, "audio/webm"))

    def download(self, key: str) -> bytes:
        """Download a file."""
        if self.use_local:
            return self._local_download(key)
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        return response["Body"].read()

    def get_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        """Generate a URL for temporary access."""
        if self.use_local:
            return f"/uploads/{key}"
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expires_in,
        )

    def delete(self, key: str):
        """Delete a file."""
        if self.use_local:
            path = UPLOADS_DIR / key
            path.unlink(missing_ok=True)
            return
        self.client.delete_object(Bucket=self.bucket, Key=key)

    def list_files(self, prefix: str) -> list[str]:
        """List files under a prefix."""
        if self.use_local:
            base = UPLOADS_DIR / prefix
            if not base.exists():
                return []
            return [str(p.relative_to(UPLOADS_DIR)) for p in base.rglob("*") if p.is_file()]
        response = self.client.list_objects_v2(Bucket=self.bucket, Prefix=prefix)
        return [obj["Key"] for obj in response.get("Contents", [])]

    # --- Local filesystem ---

    def _local_upload(self, key: str, data: bytes) -> str:
        """Save file to local uploads/ directory."""
        path = UPLOADS_DIR / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return f"/uploads/{key}"

    def _local_download(self, key: str) -> bytes:
        """Read file from local uploads/ directory."""
        path = UPLOADS_DIR / key
        if not path.exists():
            raise FileNotFoundError(f"File not found: {key}")
        return path.read_bytes()

    # --- S3 helpers ---

    def _ensure_bucket(self):
        """Create the S3 bucket if it doesn't exist."""
        try:
            self.client.head_bucket(Bucket=self.bucket)
        except Exception:
            try:
                self.client.create_bucket(Bucket=self.bucket)
            except Exception:
                pass
