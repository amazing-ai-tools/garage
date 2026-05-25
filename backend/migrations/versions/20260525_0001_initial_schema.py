"""initial garage schema

Revision ID: 20260525_0001
Revises:
Create Date: 2026-05-25
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260525_0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "vehicles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("make", sa.String(length=80), nullable=False),
        sa.Column("model", sa.String(length=100), nullable=False),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("odometer_km", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_vehicles_id"), "vehicles", ["id"], unique=False)

    op.create_table(
        "expenses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("description", sa.String(length=240), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("odometer_km", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_expenses_id"), "expenses", ["id"], unique=False)
    op.create_index(op.f("ix_expenses_vehicle_id"), "expenses", ["vehicle_id"], unique=False)

    op.create_table(
        "part_changes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("brand", sa.String(length=100), nullable=True),
        sa.Column("reference", sa.String(length=100), nullable=True),
        sa.Column("cost", sa.Numeric(10, 2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_part_changes_id"), "part_changes", ["id"], unique=False)
    op.create_index(op.f("ix_part_changes_vehicle_id"), "part_changes", ["vehicle_id"], unique=False)

    op.create_table(
        "reminders",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=140), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("due_odometer_km", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_reminders_id"), "reminders", ["id"], unique=False)
    op.create_index(op.f("ix_reminders_vehicle_id"), "reminders", ["vehicle_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_reminders_vehicle_id"), table_name="reminders")
    op.drop_index(op.f("ix_reminders_id"), table_name="reminders")
    op.drop_table("reminders")
    op.drop_index(op.f("ix_part_changes_vehicle_id"), table_name="part_changes")
    op.drop_index(op.f("ix_part_changes_id"), table_name="part_changes")
    op.drop_table("part_changes")
    op.drop_index(op.f("ix_expenses_vehicle_id"), table_name="expenses")
    op.drop_index(op.f("ix_expenses_id"), table_name="expenses")
    op.drop_table("expenses")
    op.drop_index(op.f("ix_vehicles_id"), table_name="vehicles")
    op.drop_table("vehicles")
