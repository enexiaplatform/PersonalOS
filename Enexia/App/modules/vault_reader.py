"""
vault_reader.py — Read and list notes from the Obsidian vault.
"""
from __future__ import annotations

import os
import re
from pathlib import Path


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

EXCLUDE_FOLDERS = {"60_Templates"}
MAX_RECENT = 20
PREVIEW_CHARS = 800


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _strip_frontmatter(text: str) -> str:
    """Remove YAML frontmatter block (--- ... ---) from note text."""
    if text.startswith("---"):
        # Find the closing ---
        end = text.find("\n---", 3)
        if end != -1:
            return text[end + 4:].lstrip()
    return text


def _is_excluded(path: Path, vault_root: Path) -> bool:
    """Return True if the path falls inside an excluded folder."""
    try:
        rel = path.relative_to(vault_root)
    except ValueError:
        return False
    parts = rel.parts
    return bool(parts and parts[0] in EXCLUDE_FOLDERS)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def list_recent_notes(vault_path: str) -> list[dict]:
    """
    Return the 20 most recently modified .md files in the vault,
    excluding the 60_Templates folder.

    Each entry is a dict with:
        path      — absolute string path to the file
        name      — filename without extension
        modified  — float mtime (seconds since epoch)
        folder    — relative parent folder name
    """
    vault_root = Path(vault_path)
    if not vault_root.exists():
        return []

    md_files: list[dict] = []
    for md_file in vault_root.rglob("*.md"):
        if _is_excluded(md_file, vault_root):
            continue
        try:
            mtime = md_file.stat().st_mtime
        except OSError:
            continue
        try:
            rel_folder = str(md_file.parent.relative_to(vault_root))
        except ValueError:
            rel_folder = ""

        md_files.append(
            {
                "path": str(md_file),
                "name": md_file.stem,
                "modified": mtime,
                "folder": rel_folder,
            }
        )

    # Sort newest first, take top 20
    md_files.sort(key=lambda x: x["modified"], reverse=True)
    return md_files[:MAX_RECENT]


def read_note_preview(file_path: str) -> str:
    """
    Read a note and return up to PREVIEW_CHARS characters with
    frontmatter stripped.

    Args:
        file_path: Absolute path to the .md file.

    Returns:
        Truncated plain Markdown string.

    Raises:
        OSError: If the file cannot be read.
    """
    text = Path(file_path).read_text(encoding="utf-8")
    stripped = _strip_frontmatter(text)
    if len(stripped) > PREVIEW_CHARS:
        return stripped[:PREVIEW_CHARS] + "\n\n*…(truncated)*"
    return stripped


def read_note_full(file_path: str) -> str:
    """Return the full raw text of a note (including frontmatter)."""
    return Path(file_path).read_text(encoding="utf-8")
