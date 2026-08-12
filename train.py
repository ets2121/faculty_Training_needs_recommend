from pathlib import Path
import pandas as pd
from app.core.config import get_settings
from app.ml.trainer import train_from_dataframe

if __name__ == "__main__":
    settings = get_settings()
    path = Path(settings.raw_data_path)
    if not path.exists():
        raise SystemExit(f"Dataset not found: {path}")
    df = pd.read_csv(path)
    result = train_from_dataframe(df, settings.model_dir)
    print(result)
