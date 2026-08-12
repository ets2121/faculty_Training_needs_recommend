import json
from pathlib import Path

nb_path = Path("notebooks/QSU_Faculty_Training_Recommender_Colab.ipynb")
nb = json.loads(nb_path.read_text(encoding="utf-8"))

patched = False
for cell in nb["cells"]:
    if cell["cell_type"] == "code":
        src = "".join(cell["source"])
        if "scikit-learn" in src and "required" in src and "PINNED" not in src:
            cell["source"] = [
                "# === Install pinned libraries (must match backend requirements.txt) ===\n",
                "# CRITICAL: scikit-learn version MUST match the backend exactly.\n",
                "# Mismatched versions cause AttributeError when loading exported models.\n",
                "import sys\n",
                "\n",
                "# Pinned to match production backend requirements.txt\n",
                "PINNED = [\n",
                '    "scikit-learn==1.7.1",  # Must match backend scikit-learn version exactly\n',
                '    "joblib==1.5.1",        # Must match backend joblib version exactly\n',
                '    "pandas",\n',
                '    "numpy",\n',
                '    "matplotlib",\n',
                '    "seaborn",\n',
                "]\n",
                "\n",
                "try:\n",
                "    import google.colab\n",
                "    IN_COLAB = True\n",
                '    print("Running on Google Colab")\n',
                "except ImportError:\n",
                "    IN_COLAB = False\n",
                '    print("Running locally (not Colab)")\n',
                "\n",
                "if IN_COLAB:\n",
                "    import subprocess\n",
                '    print("Installing pinned versions: scikit-learn==1.7.1, joblib==1.5.1...")\n',
                "    subprocess.run([sys.executable, \"-m\", \"pip\", \"install\", \"-q\"] + PINNED, check=True)\n",
                '    print("Pinned install complete. Versions match backend.")\n',
            ]
            patched = True
            print("Patched install cell with pinned sklearn==1.7.1 + joblib==1.5.1.")
            break

if not patched:
    print("WARNING: Install cell not found or already patched.")

nb_path.write_text(json.dumps(nb, indent=1, ensure_ascii=False), encoding="utf-8")
print("Notebook saved:", nb_path.resolve())
