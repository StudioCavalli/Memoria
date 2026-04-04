"""
S3-compatible storage service for audio files, PDFs, and other assets.
Supports AWS S3, MinIO, and other S3-compatible providers.
"""
from __future__ import annotations

import io
from datetime import datetime, timezone

from app.core.config import settings

try:
    import boto3
    from botocore.config import Config
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False


class StorageService:
    def __init__(self):
        if not HAS_BOTO3:
            self.client = None
            self.bucket = settings.s3_bucket
            return
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            config=Config(signature_version="s3v4"),
            region_name="us-east-1",
        )
        self.bucket = settings.s3_bucket

    def upload(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        """Upload bytes to S3 and return the URL."""
        if not self.client:
            return f"local://{self.bucket}/{key}"
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
        """Download a file from S3."""
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        return response["Body"].read()

    def get_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        """Generate a presigned URL for temporary access."""
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expires_in,
        )

    def delete(self, key: str):
        """Delete a file from S3."""
        self.client.delete_object(Bucket=self.bucket, Key=key)

    def list_files(self, prefix: str) -> list[str]:
        """List files under a prefix."""
        response = self.client.list_objects_v2(Bucket=self.bucket, Prefix=prefix)
        return [obj["Key"] for obj in response.get("Contents", [])]

    def _ensure_bucket(self):
        """Create the bucket if it doesn't exist."""
        try:
            self.client.head_bucket(Bucket=self.bucket)
        except Exception:
            try:
                self.client.create_bucket(Bucket=self.bucket)
            except Exception:
                pass  # Bucket might already exist
