import json
from pathlib import Path

nb_path = Path("notebooks/QSU_Faculty_Training_Recommender_Colab.ipynb")
nb = json.loads(nb_path.read_text(encoding="utf-8"))

missing_imports = [
    "\n",
    "print(\"\\n📦 Importing libraries...\")\n",
    "\n",
    "import os\n",
    "import json\n",
    "import zipfile\n",
    "import warnings\n",
    "import itertools\n",
    "from pathlib import Path\n",
    "from datetime import datetime, timezone\n",
    "\n",
    "import numpy as np\n",
    "import pandas as pd\n",
    "import joblib\n",
    "import matplotlib.pyplot as plt\n",
    "import matplotlib.ticker as mticker\n",
    "import seaborn as sns\n",
    "\n",
    "from sklearn.compose import ColumnTransformer\n",
    "from sklearn.ensemble import RandomForestClassifier\n",
    "from sklearn.metrics import (\n",
    "    f1_score, precision_score, recall_score,\n",
    "    classification_report, multilabel_confusion_matrix\n",
    ")\n",
    "from sklearn.model_selection import train_test_split\n",
    "from sklearn.multiclass import OneVsRestClassifier\n",
    "from sklearn.pipeline import Pipeline\n",
    "from sklearn.preprocessing import (\n",
    "    MultiLabelBinarizer, OneHotEncoder, StandardScaler\n",
    ")\n",
    "\n",
    "warnings.filterwarnings(\"ignore\")\n",
    "sns.set_theme(style=\"whitegrid\", palette=\"muted\")\n",
    "\n",
    "print(\"✅ All libraries loaded successfully.\")\n"
]

patched = False
for cell in nb["cells"]:
    if cell["cell_type"] == "code":
        src = "".join(cell["source"])
        if "PINNED =" in src and "pandas as pd" not in src:
            cell["source"].extend(missing_imports)
            print("Successfully appended missing imports to Cell 1!")
            patched = True
            break

if patched:
    nb_path.write_text(json.dumps(nb, indent=1, ensure_ascii=False), encoding="utf-8")
    print("Notebook updated.")
else:
    print("No patch needed or cell not found.")
