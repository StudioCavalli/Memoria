"""Dump the FastAPI OpenAPI schema to JSON (source for the frontend type codegen).

Usage:
    python scripts/export_openapi.py [output_path]

Default output: <repo>/website/openapi.json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from app.main import app


def main() -> None:
    if len(sys.argv) > 1:
        out = Path(sys.argv[1])
    else:
        out = Path(__file__).resolve().parents[2] / "website" / "openapi.json"
    out.write_text(
        json.dumps(app.openapi(), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"OpenAPI schema written to {out}")


if __name__ == "__main__":
    main()
