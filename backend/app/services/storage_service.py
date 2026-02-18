from __future__ import annotations

import logging
from pathlib import Path
from typing import BinaryIO, Optional

from app.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """
    Abstraction over local filesystem and AWS S3.
    Switch via STORAGE_MODE env var: "local" | "s3"
    PDFs are uploaded once; embeddings are stored in PostgreSQL.
    During RAG, embeddings are retrieved from DB — never from S3.
    """

    def __init__(self) -> None:
        self.mode = settings.STORAGE_MODE
        if self.mode == "local":
            Path(settings.LOCAL_STORAGE_PATH).mkdir(parents=True, exist_ok=True)
        elif self.mode == "s3":
            import boto3  # lazy import — optional in dev

            self._s3 = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
            )
            self._bucket = settings.S3_BUCKET_NAME

    def upload(
        self,
        file: BinaryIO,
        key: str,
        content_type: str = "application/pdf",
    ) -> str:
        """Upload *file* and return a URI string."""
        if self.mode == "local":
            dest = Path(settings.LOCAL_STORAGE_PATH) / key
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(file.read())
            logger.info(f"[storage:local] saved {dest}")
            return str(dest)

        # S3
        self._s3.upload_fileobj(
            file,
            self._bucket,
            key,
            ExtraArgs={"ContentType": content_type},
        )
        uri = f"s3://{self._bucket}/{key}"
        logger.info(f"[storage:s3] uploaded {uri}")
        return uri

    def download(self, key: str) -> bytes:
        if self.mode == "local":
            return (Path(settings.LOCAL_STORAGE_PATH) / key).read_bytes()
        obj = self._s3.get_object(Bucket=self._bucket, Key=key)
        return obj["Body"].read()

    def presigned_url(self, key: str, expires_in: int = 3600) -> Optional[str]:
        if self.mode == "s3":
            return self._s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket, "Key": key},
                ExpiresIn=expires_in,
            )
        return None


storage_service = StorageService()
