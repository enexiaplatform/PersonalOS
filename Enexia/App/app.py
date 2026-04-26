"""
app.py — Enexia Personal OS Dashboard
A Streamlit-based AI note generation pipeline connected to Groq and an
Obsidian vault.

Run:
    streamlit run app.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# Load .env before any module-level env reads
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

import streamlit as st

# ---------------------------------------------------------------------------
# Page configuration — MUST be the first Streamlit call
# ---------------------------------------------------------------------------

st.set_page_config(
    page_title="Enexia Personal OS",
    page_icon="🧬",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ---------------------------------------------------------------------------
# Internal imports (after dotenv + st.set_page_config)
# ---------------------------------------------------------------------------

from modules.groq_client import generate_note
from modules.vault_reader import list_recent_notes, read_note_preview
from modules.vault_writer import TYPE_TO_FOLDER, save_note

# ---------------------------------------------------------------------------
# Custom CSS — premium dark glassmorphism theme
# ---------------------------------------------------------------------------

CUSTOM_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

/* ---- Root & Body ---- */
:root {
    --bg-deep:    #0d1117;
    --bg-card:    rgba(22, 30, 46, 0.85);
    --bg-glass:   rgba(255,255,255,0.04);
    --accent:     #7c6af7;
    --accent-alt: #5ecef6;
    --text-1:     #e6edf3;
    --text-2:     #8b949e;
    --border:     rgba(255,255,255,0.08);
    --success:    #3fb950;
    --warn:       #d29922;
    --error:      #f85149;
}

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
    background-color: var(--bg-deep) !important;
    color: var(--text-1) !important;
}

/* ---- Sidebar ---- */
section[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #0f1623 0%, #0d1117 100%);
    border-right: 1px solid var(--border);
}
section[data-testid="stSidebar"] .block-container {
    padding: 1.5rem 1rem;
}

/* ---- Main container ---- */
.main .block-container {
    padding: 2rem 2rem 4rem;
    max-width: 1400px;
}

/* ---- Cards / glass panels ---- */
.glass-card {
    background: var(--bg-card);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
}

/* ---- Headings ---- */
h1, h2, h3, h4 {
    color: var(--text-1) !important;
    font-weight: 600;
}

/* ---- Accent header ---- */
.hero-title {
    font-size: 2rem;
    font-weight: 700;
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-alt) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.25rem;
}

.hero-sub {
    color: var(--text-2);
    font-size: 0.9rem;
    margin-bottom: 2rem;
}

/* ---- Tag pills ---- */
.tag-pill {
    display: inline-block;
    background: rgba(124, 106, 247, 0.18);
    border: 1px solid rgba(124, 106, 247, 0.4);
    color: #c9b8ff;
    border-radius: 20px;
    padding: 0.15rem 0.65rem;
    font-size: 0.75rem;
    margin: 0.15rem;
    font-family: 'JetBrains Mono', monospace;
}

/* ---- Note preview box ---- */
.note-preview {
    background: rgba(13, 17, 23, 0.9);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.25rem 1.5rem;
    font-size: 0.88rem;
    line-height: 1.7;
    min-height: 200px;
    max-height: 520px;
    overflow-y: auto;
    font-family: 'Inter', sans-serif;
}

/* ---- Sidebar note buttons ---- */
.stButton > button {
    width: 100%;
    background: var(--bg-glass);
    border: 1px solid var(--border);
    color: var(--text-1);
    border-radius: 8px;
    font-size: 0.8rem;
    text-align: left;
    padding: 0.5rem 0.75rem;
    transition: all 0.2s ease;
}
.stButton > button:hover {
    background: rgba(124, 106, 247, 0.15);
    border-color: var(--accent);
    color: #fff;
}
.stButton > button:active {
    background: rgba(124, 106, 247, 0.35);
}

/* ---- Inputs ---- */
.stTextArea textarea,
.stTextInput input,
.stSelectbox select {
    background: rgba(22, 30, 46, 0.6) !important;
    border: 1px solid var(--border) !important;
    color: var(--text-1) !important;
    border-radius: 8px !important;
    font-family: 'Inter', sans-serif !important;
}
.stTextArea textarea:focus,
.stTextInput input:focus {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 2px rgba(124,106,247,0.25) !important;
}

/* ---- Primary button ---- */
button[kind="primary"] {
    background: linear-gradient(135deg, var(--accent), #5c4fd6) !important;
    border: none !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
    letter-spacing: 0.02em !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 4px 15px rgba(124,106,247,0.35) !important;
}
button[kind="primary"]:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 20px rgba(124,106,247,0.5) !important;
}

/* ---- Section dividers ---- */
hr {
    border-color: var(--border) !important;
}

/* ---- Status badges ---- */
.badge-success {
    background: rgba(63,185,80,0.15);
    border: 1px solid rgba(63,185,80,0.4);
    color: var(--success);
    border-radius: 6px;
    padding: 0.25rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 500;
}

/* ---- Folder label ---- */
.folder-label {
    color: var(--text-2);
    font-size: 0.72rem;
    font-family: 'JetBrains Mono', monospace;
}

/* ---- Note counter ---- */
.note-counter {
    color: var(--accent);
    font-weight: 700;
    font-size: 1.4rem;
}

/* ---- Scrollbar ---- */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent); }
</style>
"""

st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

# ---------------------------------------------------------------------------
# Environment validation
# ---------------------------------------------------------------------------

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
VAULT_PATH = os.getenv("VAULT_PATH", "")

if not GROQ_API_KEY:
    st.error(
        "⛔ **GROQ_API_KEY is not set.**  \n"
        "Add it to `Enexia/App/.env` and restart the app."
    )
    st.stop()

# ---------------------------------------------------------------------------
# Session state initialization
# ---------------------------------------------------------------------------

def _init_state() -> None:
    defaults = {
        "generated_title": "",
        "generated_body": "",
        "generated_tags": [],
        "note_type": "atomic",
        "selected_note_path": None,
        "last_saved_path": None,
        "generating": False,
    }
    for key, val in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = val


_init_state()

# ---------------------------------------------------------------------------
# Sidebar — recent notes
# ---------------------------------------------------------------------------

with st.sidebar:
    st.markdown(
        '<div class="hero-title" style="font-size:1.4rem;">🧬 Enexia OS</div>',
        unsafe_allow_html=True,
    )
    st.markdown(
        '<div class="hero-sub">Personal Knowledge Engine</div>',
        unsafe_allow_html=True,
    )
    st.divider()

    # Vault status
    vault_ok = Path(VAULT_PATH).exists() if VAULT_PATH else False
    if not vault_ok:
        st.warning(
            f"⚠️ Vault not found:\n`{VAULT_PATH}`  \n"
            "Check `VAULT_PATH` in `.env`."
        )
    else:
        recent = list_recent_notes(VAULT_PATH)
        note_count = sum(1 for _ in Path(VAULT_PATH).rglob("*.md"))
        col_a, col_b = st.columns([1, 1])
        with col_a:
            st.markdown(
                f'<div class="note-counter">{note_count}</div>'
                '<div style="color:#8b949e;font-size:0.75rem;">total notes</div>',
                unsafe_allow_html=True,
            )
        with col_b:
            st.markdown(
                f'<div class="note-counter">{len(recent)}</div>'
                '<div style="color:#8b949e;font-size:0.75rem;">recently edited</div>',
                unsafe_allow_html=True,
            )

        st.markdown("#### 📄 Recent Notes")
        if not recent:
            st.caption("No notes yet. Generate your first note →")
        else:
            for note in recent:
                label = note["name"]
                folder_disp = note["folder"] or "/"
                btn_label = f"{label[:36]}…" if len(label) > 36 else label
                if st.button(
                    btn_label,
                    key=f"sidebar_note_{note['path']}",
                    help=f"📁 {folder_disp}",
                ):
                    st.session_state["selected_note_path"] = note["path"]

    st.divider()
    st.markdown(
        '<div style="color:#8b949e;font-size:0.72rem;">'
        "Powered by Groq · llama-3.3-70b-versatile<br>"
        "Vault: Obsidian-compatible Markdown"
        "</div>",
        unsafe_allow_html=True,
    )

# ---------------------------------------------------------------------------
# Page header
# ---------------------------------------------------------------------------

st.markdown(
    '<div class="hero-title">Enexia Personal OS</div>'
    '<div class="hero-sub">AI-powered knowledge capture · Generate → Review → Save to Vault</div>',
    unsafe_allow_html=True,
)
st.divider()

# ---------------------------------------------------------------------------
# Main two-column layout (3:2)
# ---------------------------------------------------------------------------

left_col, right_col = st.columns([3, 2], gap="large")

# =============================================================================
# LEFT COLUMN — Generate & Save
# =============================================================================

with left_col:
    st.markdown("### ✍️ Generate a Note")

    # -- Note type selector
    note_type = st.selectbox(
        "Note type",
        options=list(TYPE_TO_FOLDER.keys()),
        index=list(TYPE_TO_FOLDER.keys()).index(
            st.session_state.get("note_type", "atomic")
        ),
        format_func=lambda t: {
            "atomic":      "🔹 Atomic — quick idea / concept",
            "biowiki":     "🧬 BioWiki — life-science reference",
            "biomedia-si": "🏢 Biomedia — sales intelligence",
            "memoire":     "🧠 Memoire — memory OS",
            "enexia-os":   "🧬 Enexia — personal OS",
            "resource":    "📚 Resource — external link / book note",
            "daily":       "📅 Daily — daily log / journal",
            "project":     "🗂️ Project — project planning / notes",
        }.get(t, t),
        key="note_type_select",
    )
    st.session_state["note_type"] = note_type

    # Destination badge
    folder_dest = TYPE_TO_FOLDER[note_type]
    st.markdown(
        f'<div class="folder-label">→ Vault destination: <code>{folder_dest}</code></div>',
        unsafe_allow_html=True,
    )

    st.markdown("<br>", unsafe_allow_html=True)

    # -- Prompt input
    user_prompt = st.text_area(
        "What should the note be about?",
        height=120,
        placeholder=(
            "e.g. 'Explain the CRISPR-Cas9 mechanism and its applications in gene therapy' "
            "or 'Phương pháp Zettelkasten là gì và cách áp dụng?'"
        ),
        key="prompt_input",
    )

    # -- Generate button
    generate_clicked = st.button(
        "⚡ Generate Note",
        type="primary",
        disabled=not user_prompt.strip(),
        use_container_width=True,
        key="generate_btn",
    )

    if generate_clicked and user_prompt.strip():
        with st.spinner("Calling Groq AI…"):
            try:
                result = generate_note(note_type, user_prompt.strip())
                st.session_state["generated_title"] = result["title"]
                st.session_state["generated_body"] = result["body"]
                st.session_state["generated_tags"] = result["tags"]
                st.session_state["last_saved_path"] = None
                st.toast("✅ Note generated!", icon="⚡")
            except EnvironmentError as exc:
                st.error(f"⛔ Configuration error: {exc}")
            except ValueError as exc:
                st.error(f"⚠️ Parse error: {exc}")
            except Exception as exc:
                st.error(f"❌ Groq API error: {type(exc).__name__}: {exc}")

    # ---------------------------------------------------------------------------
    # Generated content preview & editing
    # ---------------------------------------------------------------------------

    has_content = bool(st.session_state.get("generated_body"))

    if has_content:
        st.divider()
        st.markdown("### 📝 Review & Edit")

        # Editable title
        edited_title = st.text_input(
            "Title",
            value=st.session_state["generated_title"],
            key="edited_title",
        )

        # Tags editor (comma-separated)
        raw_tags_str = ", ".join(st.session_state["generated_tags"])
        edited_tags_str = st.text_input(
            "Tags (comma-separated, no spaces, use dashes)",
            value=raw_tags_str,
            key="edited_tags",
        )
        edited_tags = [
            t.strip().lower().replace(" ", "-")
            for t in edited_tags_str.split(",")
            if t.strip()
        ][:5]

        # Tag pill display
        if edited_tags:
            pills_html = "".join(
                f'<span class="tag-pill">#{t}</span>' for t in edited_tags
            )
            st.markdown(pills_html, unsafe_allow_html=True)

        # Body preview
        st.markdown("**Body preview:**")
        with st.container():
            st.markdown(
                f'<div class="note-preview">{st.session_state["generated_body"]}</div>',
                unsafe_allow_html=True,
            )

        # -- Save button
        st.markdown("<br>", unsafe_allow_html=True)
        save_clicked = st.button(
            "💾 Save to Vault",
            type="primary",
            use_container_width=True,
            key="save_btn",
            disabled=not vault_ok,
        )

        if save_clicked:
            if not edited_title.strip():
                st.warning("Please enter a title before saving.")
            else:
                try:
                    saved_path = save_note(
                        vault_path=VAULT_PATH,
                        note_type=note_type,
                        title=edited_title.strip(),
                        body=st.session_state["generated_body"],
                        tags=edited_tags,
                    )
                    st.session_state["last_saved_path"] = saved_path
                    # Auto-select the new note in the right panel
                    st.session_state["selected_note_path"] = saved_path
                    st.toast("✅ Saved to vault!", icon="💾")
                    st.success(
                        f"✅ **Note saved successfully!**  \n"
                        f"`{saved_path}`"
                    )
                    st.balloons()
                except Exception as exc:
                    st.error(
                        f"❌ Failed to save note: {type(exc).__name__}: {exc}"
                    )

    elif not generate_clicked:
        st.markdown(
            '<div class="glass-card" style="text-align:center;padding:2.5rem;">'
            "<p style='font-size:2.5rem;margin-bottom:0.5rem;'>✨</p>"
            "<p style='color:#8b949e;'>Select a note type, enter your prompt,<br>and click <strong>Generate Note</strong> to begin.</p>"
            "</div>",
            unsafe_allow_html=True,
        )

# =============================================================================
# RIGHT COLUMN — Note preview panel
# =============================================================================

with right_col:
    selected_path = st.session_state.get("selected_note_path")

    if selected_path and Path(selected_path).exists():
        note_name = Path(selected_path).stem
        st.markdown(f"### 🔍 Preview: `{note_name}`")

        # Folder badge
        try:
            rel = str(
                Path(selected_path)
                .parent.relative_to(Path(VAULT_PATH))
            )
        except ValueError:
            rel = "—"

        st.markdown(
            f'<div class="folder-label">📁 {rel}</div><br>',
            unsafe_allow_html=True,
        )

        try:
            preview_text = read_note_preview(selected_path)
            st.markdown(
                f'<div class="note-preview">{preview_text}</div>',
                unsafe_allow_html=True,
            )
        except Exception as exc:
            st.error(f"Could not read note: {exc}")

    else:
        st.markdown("### 🔍 Note Preview")
        st.markdown(
            '<div class="glass-card" style="text-align:center;padding:3rem;">'
            "<p style='font-size:2rem;margin-bottom:0.5rem;'>📖</p>"
            "<p style='color:#8b949e;'>Click a note in the sidebar<br>to preview it here.</p>"
            "</div>",
            unsafe_allow_html=True,
        )

    # -- Vault stats panel (always visible in right col)
    if vault_ok:
        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown("### 📊 Vault Overview")

        vault_root = Path(VAULT_PATH)
        stats_rows: list[tuple[str, int]] = []
        for folder_name in sorted(vault_root.iterdir(), key=lambda p: p.name):
            if folder_name.is_dir():
                count = sum(1 for _ in folder_name.rglob("*.md"))
                if count > 0:
                    stats_rows.append((folder_name.name, count))

        if stats_rows:
            total = sum(c for _, c in stats_rows)
            for folder_name, count in stats_rows:
                pct = (count / total * 100) if total else 0
                st.markdown(
                    f'<div style="display:flex;justify-content:space-between;'
                    f'align-items:center;margin-bottom:0.2rem;">'
                    f'<span class="folder-label">{folder_name}</span>'
                    f'<span style="color:#7c6af7;font-weight:600;font-size:0.85rem;">{count}</span>'
                    f"</div>",
                    unsafe_allow_html=True,
                )
                st.progress(pct / 100)
        else:
            st.caption("No notes found yet.")
