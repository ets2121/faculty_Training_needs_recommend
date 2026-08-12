"""Template for converting a real questionnaire export into the ML schema.

Do NOT invent answers. Map each real questionnaire field to the canonical names
defined in app/ml/schema.py. Keep respondent identifiers separate or anonymize them.

Expected final training table:
- profile columns
- training history columns
- competency proficiency/importance
- emerging need columns
- priority_1 ... priority_5

The script intentionally does not guess column names because your actual Google Forms/Excel
export headers may differ.
"""

from pathlib import Path
import pandas as pd

INPUT = Path("data/raw/questionnaire_export.csv")
OUTPUT = Path("data/raw/faculty_training.csv")

if __name__ == "__main__":
    if not INPUT.exists():
        raise SystemExit(f"Put the real questionnaire export at {INPUT}")
    df = pd.read_csv(INPUT)
    print("Columns found:")
    for c in df.columns:
        print(" -", c)
    print("\nCreate the explicit column mapping in this script before exporting.")
