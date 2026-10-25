"""
Stand-alone synchronization script for the QSU Model Registry.
Scans the models/ directory for all user-defined model folders and legacy flat models,
inspects metadata, updates MySQL model_registry table, and ensures exactly ONE model
is marked is_active=True according to models/active.json.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Configure utf-8 stdout for Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.db.models import ModelRegistry
from app.ml.registry import (
    detect_model_folders,
    resolve_active_model,
    sync_registry_with_db,
)


def main():
    settings = get_settings()
    models_dir = Path(settings.model_dir)

    print("=" * 60)
    print("  QSU MODEL REGISTRY & FOLDER SYNCHRONIZATION")
    print("=" * 60)
    print(f"Scanning models directory: {models_dir.resolve()}\n")

    # 1. Resolve Active Model
    active_info = resolve_active_model(models_dir)
    print("📌 Active Model Pointer (from active.json):")
    if active_info.get("ready"):
        print(f"   ✓ Status:      READY (HEALTHY)")
        print(f"   ✓ Version:     {active_info.get('version')}")
        print(f"   ✓ Folder:      {active_info.get('folder_name') or '(flat root)'}")
        print(f"   ✓ Artifact:    {active_info.get('artifact_path')}")
        print(f"   ✓ Labels:      {active_info.get('labels_path')}")
        micro_f1 = active_info.get("metrics", {}).get("micro_f1")
        if micro_f1 is not None:
            print(f"   ✓ Micro F1:    {micro_f1:.4f}")
    else:
        print(f"   ❌ Status:     NOT READY / ERROR")
        print(f"   ❌ Error:      {active_info.get('error')}")

    print("\n📂 Discovered Model Folders on Disk:")
    detected = detect_model_folders(models_dir)
    if not detected:
        print("   (No model folders or artifacts found)")
    for idx, m in enumerate(detected, 1):
        status_icon = "🟢" if m["is_active"] else ("⚪" if m["status"] == "ready" else "⚠️")
        active_tag = " [ACTIVE]" if m["is_active"] else ""
        print(f"   {idx}. {status_icon} {m['display_name']}{active_tag}")
        print(f"      Version:   {m['version']}")
        print(f"      Status:    {m['status']}")
        print(f"      Artifact:  {m['artifact_path']}")
        metrics = m.get("metrics", {})
        if metrics:
            print(f"      Metrics:   micro_f1={metrics.get('micro_f1', 0):.4f}, precision={metrics.get('micro_precision', 0):.4f}")

    # 2. Synchronize with Database
    print("\n🔄 Synchronizing with MySQL model_registry table...")
    db = SessionLocal()
    try:
        sync_result = sync_registry_with_db(db, models_dir)
        print(f"   ✓ Synced {sync_result['synced_count']} model record(s).")
        print(f"   ✓ Active Version in DB: {sync_result['active_version']}")
        if sync_result.get("active_error"):
            print(f"   ⚠️ Active Warning: {sync_result['active_error']}")

        # Verify DB records
        print("\n📋 Current Database Registry Records:")
        db_records = db.query(ModelRegistry).order_by(ModelRegistry.id.desc()).all()
        for r in db_records:
            active_marker = "★ ACTIVE" if r.is_active else "         "
            print(f"   [{r.id:2d}] {active_marker} | Version: {r.version:<25} | Path: {r.artifact_path}")
    finally:
        db.close()

    print("\n" + "=" * 60)
    print("  SYNCHRONIZATION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
