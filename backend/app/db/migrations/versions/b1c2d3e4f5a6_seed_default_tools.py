"""seed default tools

Revision ID: b1c2d3e4f5a6
Revises: 9f3a6b7d2c11
Create Date: 2026-03-04 12:20:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, Sequence[str], None] = "9f3a6b7d2c11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            INSERT INTO tools (id, name, slug, description, system_prompt_template, input_schema, is_active, version)
            VALUES
            (
                '9d5c3e69-63bf-47a8-a8ec-0f457f53a1a1',
                'Resume Analyzer',
                'resume-analyzer',
                'Analyze resumes and provide structured professional feedback.',
                'Analyze the following resume professionally. Provide strengths, weaknesses, and concrete improvement steps.\\n\\n{{input}}',
                '{}'::json,
                true,
                1
            ),
            (
                '2c6287db-9f90-4b87-8c0f-d766b39df101',
                'PDF Summarizer',
                'pdf-summarizer',
                'Summarize PDF content into concise, readable insights.',
                'Summarize the following PDF content clearly and concisely. Include key points and action items.\\n\\n{{input}}',
                '{}'::json,
                true,
                1
            ),
            (
                '3fd6f75b-873c-4f70-baba-78ca50f6dd32',
                'Business Idea Generator',
                'business-idea-generator',
                'Generate and evaluate practical business ideas.',
                'Generate high-quality business ideas based on the user context below. Include market, monetization, risks, and first steps.\\n\\n{{input}}',
                '{}'::json,
                true,
                1
            )
            ON CONFLICT (slug) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                system_prompt_template = EXCLUDED.system_prompt_template,
                input_schema = EXCLUDED.input_schema,
                is_active = EXCLUDED.is_active,
                version = EXCLUDED.version,
                updated_at = now();
            """
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            DELETE FROM tools
            WHERE slug IN ('resume-analyzer', 'pdf-summarizer', 'business-idea-generator');
            """
        )
    )
