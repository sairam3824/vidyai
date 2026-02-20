from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Profile(Base):
    """User profile linked to Supabase Auth (auth.users).

    The UUID primary key matches auth.users.id — created automatically
    via a Supabase trigger on every new signup.
    """

    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True)  # Set by Supabase Auth
    full_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    subscription_tier = Column(String(20), default="free", nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    usage_tracking = relationship(
        "UsageTracking", back_populates="user", cascade="all, delete-orphan"
    )
    generated_tests = relationship(
        "GeneratedTest", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Profile id={self.id} email={self.email}>"
