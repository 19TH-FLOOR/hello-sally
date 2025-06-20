"""rename_report_template_to_ai_prompt_for_report

Revision ID: e52d01358bce
Revises: 6e59e4297f50
Create Date: 2025-06-20 19:58:54.151717

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e52d01358bce'
down_revision = '6e59e4297f50'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 테이블명 변경: report_templates -> ai_prompts_for_report
    op.rename_table('report_templates', 'ai_prompts_for_report')
    
    # report_data 테이블의 template_id 컬럼을 ai_prompt_id로 변경
    op.alter_column('report_data', 'template_id', 
                    new_column_name='ai_prompt_id',
                    existing_type=sa.Integer())


def downgrade() -> None:
    # 롤백: ai_prompt_id -> template_id
    op.alter_column('report_data', 'ai_prompt_id', 
                    new_column_name='template_id',
                    existing_type=sa.Integer())
    
    # 롤백: ai_prompts_for_report -> report_templates
    op.rename_table('ai_prompts_for_report', 'report_templates') 