"""add user preferences

Revision ID: 20260526_0003
Revises: 20260526_0002
Create Date: 2026-05-26
"""

from alembic import op
import sqlalchemy as sa


revision = "20260526_0003"
down_revision = "20260526_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("language", sa.String(length=12), nullable=False, server_default="fr-CA"))
        batch_op.add_column(sa.Column("country", sa.String(length=2), nullable=False, server_default="CA"))
        batch_op.add_column(sa.Column("currency", sa.String(length=3), nullable=False, server_default="CAD"))


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("currency")
        batch_op.drop_column("country")
        batch_op.drop_column("language")
