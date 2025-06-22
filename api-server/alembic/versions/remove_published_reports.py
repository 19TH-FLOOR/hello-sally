"""remove_published_reports

Revision ID: remove_published_reports
Revises: e52d01358bce
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'remove_published_reports'
down_revision = 'e52d01358bce'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove published_reports table
    op.drop_index(op.f('ix_published_reports_id'), table_name='published_reports')
    op.drop_table('published_reports')


def downgrade() -> None:
    # Recreate published_reports table
    op.create_table('published_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.Column('canva_design_id', sa.String(length=255), nullable=True),
        sa.Column('pdf_url', sa.String(length=500), nullable=True),
        sa.Column('published_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['report_id'], ['reports.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_published_reports_id'), 'published_reports', ['id'], unique=False) 