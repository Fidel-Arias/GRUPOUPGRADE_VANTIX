"""drop_old_plan_status_check_constraint

Revision ID: aea1fecc9502
Revises: 66fa52eb1945
Create Date: 2026-03-03 16:13:03.253788

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aea1fecc9502'
down_revision: Union[str, Sequence[str], None] = '66fa52eb1945'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TABLE plan_trabajo_semanal DROP CONSTRAINT IF EXISTS plan_trabajo_semanal_estado_check")


def downgrade() -> None:
    """Downgrade schema."""
    pass
