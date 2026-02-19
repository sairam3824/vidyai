"""Add question_cache table

Revision ID: 002
Revises: 001
Create Date: 2024-01-02 00:00:00.000000
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "question_cache",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("chapter_id", sa.Integer(), nullable=False),
        sa.Column("num_questions", sa.Integer(), nullable=False),
        sa.Column("questions_json", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("chapter_id", "num_questions", name="uq_question_cache"),
    )
    op.create_index("ix_question_cache_id", "question_cache", ["id"])
    op.create_index("ix_question_cache_chapter_id", "question_cache", ["chapter_id"])
    op.create_index("ix_question_cache_expires_at", "question_cache", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_question_cache_expires_at", table_name="question_cache")
    op.drop_index("ix_question_cache_chapter_id", table_name="question_cache")
    op.drop_index("ix_question_cache_id", table_name="question_cache")
    op.drop_table("question_cache")
