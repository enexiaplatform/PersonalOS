"""
vault_writer.py — Write Markdown notes atomically to the Obsidian vault.
"""
from __future__ import annotations

import os
import re
import unicodedata
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Note type → vault folder mapping
# ---------------------------------------------------------------------------

TYPE_TO_FOLDER: dict[str, str] = {
    "atomic":      "00_Inbox",
    "biowiki":     "10_Projects/BioWiki_Pro",
    "biomedia-si": "10_Projects/Biomedia_SI",
    "memoire":     "10_Projects/Memoire",
    "enexia-os":   "10_Projects/Enexia_Personal_OS",
    "resource":    "30_Resources",
    "daily":       "50_Daily",
    "project":     "10_Projects",
}

# ---------------------------------------------------------------------------
# Vietnamese diacritic → ASCII map
# ---------------------------------------------------------------------------

_VI_MAP: dict[str, str] = {
    # a
    "à": "a", "á": "a", "ả": "a", "ã": "a", "ạ": "a",
    "ă": "a", "ắ": "a", "ặ": "a", "ằ": "a", "ẳ": "a", "ẵ": "a",
    "â": "a", "ấ": "a", "ầ": "a", "ẩ": "a", "ẫ": "a", "ậ": "a",
    # e
    "è": "e", "é": "e", "ẻ": "e", "ẽ": "e", "ẹ": "e",
    "ê": "e", "ế": "e", "ề": "e", "ể": "e", "ễ": "e", "ệ": "e",
    # i
    "ì": "i", "í": "i", "ỉ": "i", "ĩ": "i", "ị": "i",
    # o
    "ò": "o", "ó": "o", "ỏ": "o", "õ": "o", "ọ": "o",
    "ô": "o", "ố": "o", "ồ": "o", "ổ": "o", "ỗ": "o", "ộ": "o",
    "ơ": "o", "ớ": "o", "ờ": "o", "ở": "o", "ỡ": "o", "ợ": "o",
    # u
    "ù": "u", "ú": "u", "ủ": "u", "ũ": "u", "ụ": "u",
    "ư": "u", "ứ": "u", "ừ": "u", "ử": "u", "ữ": "u", "ự": "u",
    # y
    "ỳ": "y", "ý": "y", "ỷ": "y", "ỹ": "y", "ỵ": "y",
    # d
    "đ": "d",
    # uppercase variants
    "À": "a", "Á": "a", "Ả": "a", "Ã": "a", "Ạ": "a",
    "Ă": "a", "Ắ": "a", "Ặ": "a", "Ằ": "a", "Ẳ": "a", "Ẵ": "a",
    "Â": "a", "Ấ": "a", "Ầ": "a", "Ẩ": "a", "Ẫ": "a", "Ậ": "a",
    "È": "e", "É": "e", "Ẻ": "e", "Ẽ": "e", "Ẹ": "e",
    "Ê": "e", "Ế": "e", "Ề": "e", "Ể": "e", "Ễ": "e", "Ệ": "e",
    "Ì": "i", "Í": "i", "Ỉ": "i", "Ĩ": "i", "Ị": "i",
    "Ò": "o", "Ó": "o", "Ỏ": "o", "Õ": "o", "Ọ": "o",
    "Ô": "o", "Ố": "o", "Ồ": "o", "Ổ": "o", "Ỗ": "o", "Ộ": "o",
    "Ơ": "o", "Ớ": "o", "Ờ": "o", "Ở": "o", "Ỡ": "o", "Ợ": "o",
    "Ù": "u", "Ú": "u", "Ủ": "u", "Ũ": "u", "Ụ": "u",
    "Ư": "u", "Ứ": "u", "Ừ": "u", "Ử": "u", "Ữ": "u", "Ự": "u",
    "Ỳ": "y", "Ý": "y", "Ỷ": "y", "Ỹ": "y", "Ỵ": "y",
    "Đ": "d",
}


# ---------------------------------------------------------------------------
# Slug helpers
# ---------------------------------------------------------------------------

def slugify(text: str, max_chars: int = 60) -> str:
    """
    Convert a title string to a URL/filename-safe slug.
    Handles Vietnamese diacritics explicitly before falling back to
    Unicode NFKD normalization.
    """
    # 1. Replace Vietnamese chars
    for vi_char, ascii_char in _VI_MAP.items():
        text = text.replace(vi_char, ascii_char)

    # 2. NFKD normalization → strip remaining combining marks
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))

    # 3. Lowercase
    text = text.lower()

    # 4. Replace non-alphanumeric with dash
    text = re.sub(r"[^a-z0-9]+", "-", text)

    # 5. Trim leading/trailing dashes and collapse multiples
    text = re.sub(r"-{2,}", "-", text).strip("-")

    return text[:max_chars]


def _build_filename(title: str) -> str:
    date_prefix = datetime.now().strftime("%Y-%m-%d")
    slug = slugify(title)
    return f"{date_prefix}_{slug}.md"


# ---------------------------------------------------------------------------
# Note frontmatter builder
# ---------------------------------------------------------------------------

def _render_frontmatter(
    title: str,
    note_type: str,
    tags: list[str],
    now: datetime,
) -> str:
    tags_str = ", ".join(tags)
    ts = now.strftime("%Y-%m-%dT%H:%M:%S")
    return (
        f"---\n"
        f'title: "{title}"\n'
        f"type: {note_type}\n"
        f"created_at: {ts}\n"
        f"updated_at: {ts}\n"
        f"tags: [{tags_str}]\n"
        f"source: groq\n"
        f"---\n"
    )


def _render_note(title: str, note_type: str, tags: list[str], body: str) -> str:
    now = datetime.now()
    frontmatter = _render_frontmatter(title, note_type, tags, now)
    return f"{frontmatter}\n# {title}\n\n{body}\n"


# ---------------------------------------------------------------------------
# Public write API
# ---------------------------------------------------------------------------

def save_note(
    vault_path: str,
    note_type: str,
    title: str,
    body: str,
    tags: list[str],
) -> str:
    """
    Write a note atomically to the vault.

    Args:
        vault_path: Absolute path to the Obsidian vault root.
        note_type:  One of the keys in TYPE_TO_FOLDER.
        title:      Note title (used for filename slug).
        body:       Markdown body content.
        tags:       List of tag strings.

    Returns:
        The absolute path to the written .md file.

    Raises:
        ValueError: If note_type is not recognised.
        OSError: If the file cannot be written.
    """
    if note_type not in TYPE_TO_FOLDER:
        raise ValueError(
            f"Unknown note type '{note_type}'. "
            f"Valid types: {list(TYPE_TO_FOLDER)}"
        )

    folder_rel = TYPE_TO_FOLDER[note_type]
    folder_abs = Path(vault_path) / folder_rel
    folder_abs.mkdir(parents=True, exist_ok=True)

    filename = _build_filename(title)
    target_path = folder_abs / filename
    tmp_path = target_path.with_suffix(".tmp")

    note_content = _render_note(title, note_type, tags, body)

    # Atomic write: write to .tmp → rename to .md
    tmp_path.write_text(note_content, encoding="utf-8")
    tmp_path.rename(target_path)

    return str(target_path)
