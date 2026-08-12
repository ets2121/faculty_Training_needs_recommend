import json
from pathlib import Path

nb_path = Path('notebooks/QSU_Faculty_Training_Recommender_Colab.ipynb')
nb = json.loads(nb_path.read_text(encoding='utf-8'))

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        src = ''.join(cell['source'])
        
        # 1. Add version check to Cell 1
        if 'PINNED =' in src and 'os.kill' not in src:
            new_source = []
            for line in cell['source']:
                new_source.append(line)
                if 'print("Pinned install complete. Versions match backend.")' in line:
                    new_source.extend([
                        '\n',
                        '    # Verify installation\n',
                        '    import sklearn\n',
                        '    if sklearn.__version__ != "1.7.1":\n',
                        '        print("\\n" + "="*60)\n',
                        '        print("🚨 CRITICAL: scikit-learn version is still ", sklearn.__version__)\n',
                        '        print("You must RESTART THE RUNTIME for the new version to take effect.")\n',
                        '        print("Click: Runtime -> Restart Session, then Run All again.")\n',
                        '        print("="*60 + "\\n")\n',
                        '        import os\n',
                        '        os.kill(os.getpid(), 9) # Force restart\n'
                    ])
            cell['source'] = new_source
            print('Patched install cell to enforce restart.')
            
        # 2. Fix active.json paths in export cell
        if 'active_dict = {' in src and 'exported_model' in src:
            new_source = []
            for line in cell['source']:
                # Replace str(model_path) with f'models/{model_filename}' for metadata/active dicts
                if '"artifact": str(model_path)' in line:
                    line = line.replace('str(model_path)', 'f"models/{model_filename}"')
                elif '"labels": str(labels_path)' in line:
                    line = line.replace('str(labels_path)', 'f"models/{labels_filename}"')
                elif '"metadata": str(metadata_path)' in line:
                    line = line.replace('str(metadata_path)', 'f"models/{metadata_filename}"')
                new_source.append(line)
            cell['source'] = new_source
            print('Patched active.json export paths.')

nb_path.write_text(json.dumps(nb, indent=1, ensure_ascii=False), encoding='utf-8')
print('Notebook patched successfully.')
