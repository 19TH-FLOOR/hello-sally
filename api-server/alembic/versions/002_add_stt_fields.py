"""Add STT fields to AudioFile

Revision ID: 002
Revises: 001
Create Date: 2025-06-15 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add STT fields to audio_files table
    op.add_column('audio_files', sa.Column('stt_status', sa.String(length=50), nullable=True, default='pending'))
    op.add_column('audio_files', sa.Column('stt_transcript', sa.Text(), nullable=True))
    op.add_column('audio_files', sa.Column('stt_processed_at', sa.DateTime(), nullable=True))
    op.add_column('audio_files', sa.Column('stt_error_message', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove STT fields from audio_files table
    op.drop_column('audio_files', 'stt_error_message')
    op.drop_column('audio_files', 'stt_processed_at')
    op.drop_column('audio_files', 'stt_transcript')
    op.drop_column('audio_files', 'stt_status') 