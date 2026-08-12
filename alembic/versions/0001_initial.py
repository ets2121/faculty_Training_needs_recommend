from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "training_responses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("faculty_id", sa.String(length=100), nullable=True),
        sa.Column("department", sa.String(length=100), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_training_responses_faculty_id", "training_responses", ["faculty_id"])
    op.create_index("ix_training_responses_department", "training_responses", ["department"])

    op.create_table(
        "model_registry",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("version", sa.String(length=100), nullable=False, unique=True),
        sa.Column("artifact_path", sa.String(length=500), nullable=False),
        sa.Column("metrics_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

def downgrade():
    op.drop_table("model_registry")
    op.drop_index("ix_training_responses_faculty_id", table_name="training_responses")
    op.drop_index("ix_training_responses_department", table_name="training_responses")
    op.drop_table("training_responses")
