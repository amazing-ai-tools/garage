"""add google auth sessions

Revision ID: 20260526_0002
Revises: 20260525_0001
Create Date: 2026-05-26
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260526_0002"
down_revision: str | Sequence[str] | None = "20260525_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("google_sub", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=True),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("google_sub"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)
    op.create_index(op.f("ix_users_google_sub"), "users", ["google_sub"], unique=False)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index(op.f("ix_sessions_id"), "sessions", ["id"], unique=False)
    op.create_index(op.f("ix_sessions_token_hash"), "sessions", ["token_hash"], unique=False)
    op.create_index(op.f("ix_sessions_user_id"), "sessions", ["user_id"], unique=False)

    with op.batch_alter_table("vehicles") as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
        batch_op.create_index(op.f("ix_vehicles_user_id"), ["user_id"], unique=False)
        batch_op.create_foreign_key("fk_vehicles_user_id_users", "users", ["user_id"], ["id"], ondelete="CASCADE")


def downgrade() -> None:
    with op.batch_alter_table("vehicles") as batch_op:
        batch_op.drop_constraint("fk_vehicles_user_id_users", type_="foreignkey")
        batch_op.drop_index(op.f("ix_vehicles_user_id"))
        batch_op.drop_column("user_id")
    op.drop_index(op.f("ix_sessions_user_id"), table_name="sessions")
    op.drop_index(op.f("ix_sessions_token_hash"), table_name="sessions")
    op.drop_index(op.f("ix_sessions_id"), table_name="sessions")
    op.drop_table("sessions")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_google_sub"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
