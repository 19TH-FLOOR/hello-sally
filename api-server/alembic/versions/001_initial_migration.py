"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2025-06-07 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create audio_files table
    op.create_table(
        'audio_files',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('s3_url', sa.String(length=500), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audio_files_id'), 'audio_files', ['id'], unique=False)


def downgrade() -> None:
    # Drop audio_files table
    op.drop_index(op.f('ix_audio_files_id'), table_name='audio_files')
    op.drop_table('audio_files') 