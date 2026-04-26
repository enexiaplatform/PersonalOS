"""
app.py - Enexia Personal OS Dashboard

A dashboard-first Streamlit app with CSV-backed mock data and the existing
Groq note generation pipeline.

Run:
    streamlit run app.py
"""
from __future__ import annotations

import os
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
import streamlit as st
from dotenv import load_dotenv

# Load .env before any module-level env reads.
APP_DIR = Path(__file__).parent
DATA_DIR = APP_DIR / "data"
load_dotenv(APP_DIR / ".env")

# ---------------------------------------------------------------------------
# Page configuration - MUST be the first Streamlit call
# ---------------------------------------------------------------------------

st.set_page_config(
    page_title="Enexia Personal OS",
    page_icon="E",
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
# Custom CSS
# ---------------------------------------------------------------------------

CUSTOM_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
    --bg-deep: #0d1117;
    --bg-card: rgba(22, 30, 46, 0.85);
    --bg-glass: rgba(255,255,255,0.04);
    --accent: #7c6af7;
    --accent-alt: #5ecef6;
    --text-1: #e6edf3;
    --text-2: #8b949e;
    --border: rgba(255,255,255,0.08);
    --success: #3fb950;
}

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
    background-color: var(--bg-deep) !important;
    color: var(--text-1) !important;
}

section[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #0f1623 0%, #0d1117 100%);
    border-right: 1px solid var(--border);
}

.main .block-container {
    padding: 2rem 2rem 4rem;
    max-width: 1400px;
}

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
    margin-bottom: 1rem;
}

.glass-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.25rem;
    margin-bottom: 1rem;
}

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
}

.folder-label {
    color: var(--text-2);
    font-size: 0.72rem;
    font-family: 'JetBrains Mono', monospace;
}

.note-counter {
    color: var(--accent);
    font-weight: 700;
    font-size: 1.4rem;
}

.stButton > button {
    width: 100%;
    border-radius: 8px;
    font-size: 0.85rem;
}

button[kind="primary"] {
    background: linear-gradient(135deg, var(--accent), #5c4fd6) !important;
    border: none !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
}

hr {
    border-color: var(--border) !important;
}
</style>
"""

st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

# ---------------------------------------------------------------------------
# Environment and state
# ---------------------------------------------------------------------------

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
VAULT_PATH = os.getenv("VAULT_PATH", "")


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
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


_init_state()


# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------

@st.cache_data(show_spinner=False)
def load_csv(filename: str) -> pd.DataFrame:
    path = DATA_DIR / filename
    if not path.exists():
        return pd.DataFrame()
    return pd.read_csv(path)


def filter_by_choice(
    df: pd.DataFrame,
    column: str,
    label: str,
    key: str,
) -> pd.DataFrame:
    if df.empty or column not in df.columns:
        return df

    values = sorted(df[column].dropna().astype(str).unique())
    selected = st.selectbox(label, ["All", *values], key=key)
    if selected == "All":
        return df
    return df[df[column].astype(str) == selected]


def render_table(df: pd.DataFrame, empty_message: str) -> None:
    if df.empty:
        st.info(empty_message)
        return

    st.dataframe(
        df,
        use_container_width=True,
        hide_index=True,
    )


def parse_due_dates(df: pd.DataFrame, column: str = "due_date") -> pd.DataFrame:
    if df.empty or column not in df.columns:
        return df
    result = df.copy()
    result[column] = pd.to_datetime(result[column], errors="coerce").dt.date
    return result


# ---------------------------------------------------------------------------
# Sidebar - recent notes
# ---------------------------------------------------------------------------

vault_ok = Path(VAULT_PATH).exists() if VAULT_PATH else False

with st.sidebar:
    st.markdown(
        '<div class="hero-title" style="font-size:1.4rem;">Enexia OS</div>',
        unsafe_allow_html=True,
    )
    st.markdown(
        '<div class="hero-sub">Personal Knowledge Engine</div>',
        unsafe_allow_html=True,
    )
    st.divider()

    if not vault_ok:
        st.warning(
            f"Vault not found:\n`{VAULT_PATH}`\n\nCheck `VAULT_PATH` in `.env`."
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
                '<div style="color:#8b949e;font-size:0.75rem;">recent edits</div>',
                unsafe_allow_html=True,
            )

        st.markdown("#### Recent Notes")
        if not recent:
            st.caption("No notes yet. Generate your first note from the Notes tab.")
        else:
            for note in recent:
                label = note["name"]
                folder_disp = note["folder"] or "/"
                btn_label = f"{label[:36]}..." if len(label) > 36 else label
                if st.button(
                    btn_label,
                    key=f"sidebar_note_{note['path']}",
                    help=f"Folder: {folder_disp}",
                ):
                    st.session_state["selected_note_path"] = note["path"]

    st.divider()
    st.caption("Prepared for n8n, Google Sheets, and Telegram integrations.")


# ---------------------------------------------------------------------------
# Page header
# ---------------------------------------------------------------------------

st.markdown(
    '<div class="hero-title">Enexia Personal OS</div>'
    '<div class="hero-sub">Dashboard-first operating hub for inbox, tasks, follow-ups, contacts, and notes.</div>',
    unsafe_allow_html=True,
)

inbox_df = load_csv("inbox.csv")
tasks_df = load_csv("tasks.csv")
followups_df = parse_due_dates(load_csv("followups.csv"))
contacts_df = load_csv("contacts.csv")

dashboard_tab, inbox_tab, tasks_tab, followups_tab, contacts_tab, notes_tab = st.tabs(
    ["Dashboard", "Inbox", "Tasks", "Follow-ups", "Contacts", "Note Generator"]
)


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

with dashboard_tab:
    st.subheader("Today")

    today = date.today()
    open_tasks = 0
    if not tasks_df.empty and "status" in tasks_df.columns:
        open_tasks = len(
            tasks_df[
                ~tasks_df["status"]
                .fillna("")
                .astype(str)
                .str.lower()
                .isin(["done", "completed", "closed"])
            ]
        )

    due_followups = 0
    if not followups_df.empty and "due_date" in followups_df.columns:
        due_followups = len(followups_df[followups_df["due_date"] <= today])

    metric_cols = st.columns(4)
    metric_cols[0].metric("Inbox items", len(inbox_df))
    metric_cols[1].metric("Open tasks", open_tasks)
    metric_cols[2].metric("Follow-ups due", due_followups)
    metric_cols[3].metric("Contacts", len(contacts_df))

    st.divider()
    left_col, right_col = st.columns(2, gap="large")

    with left_col:
        st.markdown("#### Recent Inbox")
        render_table(
            inbox_df.head(5),
            "No inbox mock data yet. Add rows to data/inbox.csv.",
        )

    with right_col:
        st.markdown("#### Upcoming Follow-ups")
        upcoming = followups_df.copy()
        if not upcoming.empty and "due_date" in upcoming.columns:
            upcoming = upcoming.sort_values("due_date", na_position="last").head(5)
        render_table(
            upcoming,
            "No follow-up mock data yet. Add rows to data/followups.csv.",
        )


# ---------------------------------------------------------------------------
# Inbox
# ---------------------------------------------------------------------------

with inbox_tab:
    st.subheader("Inbox")
    col_a, col_b = st.columns(2)
    with col_a:
        filtered_inbox = filter_by_choice(inbox_df, "source", "Source", "inbox_source")
    with col_b:
        filtered_inbox = filter_by_choice(
            filtered_inbox,
            "type",
            "Type",
            "inbox_type",
        )
    render_table(filtered_inbox, "No inbox mock data found in data/inbox.csv.")


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

with tasks_tab:
    st.subheader("Tasks")
    filtered_tasks = filter_by_choice(tasks_df, "status", "Status", "task_status")
    render_table(filtered_tasks, "No task mock data found in data/tasks.csv.")


# ---------------------------------------------------------------------------
# Follow-ups
# ---------------------------------------------------------------------------

with followups_tab:
    st.subheader("Follow-ups")
    filtered_followups = followups_df.copy()

    if not filtered_followups.empty and "due_date" in filtered_followups.columns:
        due_filter = st.selectbox(
            "Due date",
            ["All", "Overdue", "Today", "Next 7 days", "Future"],
            key="followup_due_date",
        )

        if due_filter == "Overdue":
            filtered_followups = filtered_followups[
                filtered_followups["due_date"] < today
            ]
        elif due_filter == "Today":
            filtered_followups = filtered_followups[
                filtered_followups["due_date"] == today
            ]
        elif due_filter == "Next 7 days":
            filtered_followups = filtered_followups[
                (filtered_followups["due_date"] >= today)
                & (filtered_followups["due_date"] <= today + timedelta(days=7))
            ]
        elif due_filter == "Future":
            filtered_followups = filtered_followups[
                filtered_followups["due_date"] > today
            ]

        filtered_followups = filtered_followups.sort_values(
            "due_date",
            na_position="last",
        )

    render_table(
        filtered_followups,
        "No follow-up mock data found in data/followups.csv.",
    )


# ---------------------------------------------------------------------------
# Contacts
# ---------------------------------------------------------------------------

with contacts_tab:
    st.subheader("Contacts")
    render_table(contacts_df, "No contact mock data found in data/contacts.csv.")


# ---------------------------------------------------------------------------
# Note generator - existing Groq feature
# ---------------------------------------------------------------------------

with notes_tab:
    st.subheader("Generate a Note")

    if not GROQ_API_KEY:
        st.error(
            "GROQ_API_KEY is not set. Add it to `Enexia/App/.env` and restart the app."
        )

    left_col, right_col = st.columns([3, 2], gap="large")

    with left_col:
        note_type = st.selectbox(
            "Note type",
            options=list(TYPE_TO_FOLDER.keys()),
            index=list(TYPE_TO_FOLDER.keys()).index(
                st.session_state.get("note_type", "atomic")
            ),
            format_func=lambda t: {
                "atomic": "Atomic - quick idea / concept",
                "biowiki": "BioWiki - life-science reference",
                "biomedia-si": "Biomedia - sales intelligence",
                "memoire": "Memoire - memory OS",
                "enexia-os": "Enexia - personal OS",
                "resource": "Resource - external link / book note",
                "daily": "Daily - daily log / journal",
                "project": "Project - project planning / notes",
            }.get(t, t),
            key="note_type_select",
        )
        st.session_state["note_type"] = note_type

        folder_dest = TYPE_TO_FOLDER[note_type]
        st.markdown(
            f'<div class="folder-label">Vault destination: <code>{folder_dest}</code></div>',
            unsafe_allow_html=True,
        )

        user_prompt = st.text_area(
            "What should the note be about?",
            height=120,
            placeholder=(
                "e.g. Explain the CRISPR-Cas9 mechanism and its applications "
                "in gene therapy."
            ),
            key="prompt_input",
        )

        generate_clicked = st.button(
            "Generate Note",
            type="primary",
            disabled=not user_prompt.strip() or not GROQ_API_KEY,
            use_container_width=True,
            key="generate_btn",
        )

        if generate_clicked and user_prompt.strip():
            with st.spinner("Calling Groq AI..."):
                try:
                    result = generate_note(note_type, user_prompt.strip())
                    st.session_state["generated_title"] = result["title"]
                    st.session_state["generated_body"] = result["body"]
                    st.session_state["generated_tags"] = result["tags"]
                    st.session_state["last_saved_path"] = None
                    st.toast("Note generated!")
                except EnvironmentError as exc:
                    st.error(f"Configuration error: {exc}")
                except ValueError as exc:
                    st.error(f"Parse error: {exc}")
                except Exception as exc:
                    st.error(f"Groq API error: {type(exc).__name__}: {exc}")

        has_content = bool(st.session_state.get("generated_body"))

        if has_content:
            st.divider()
            st.markdown("### Review & Edit")

            edited_title = st.text_input(
                "Title",
                value=st.session_state["generated_title"],
                key="edited_title",
            )

            raw_tags_str = ", ".join(st.session_state["generated_tags"])
            edited_tags_str = st.text_input(
                "Tags (comma-separated, no spaces, use dashes)",
                value=raw_tags_str,
                key="edited_tags",
            )
            edited_tags = [
                tag.strip().lower().replace(" ", "-")
                for tag in edited_tags_str.split(",")
                if tag.strip()
            ][:5]

            if edited_tags:
                pills_html = "".join(
                    f'<span class="tag-pill">#{tag}</span>' for tag in edited_tags
                )
                st.markdown(pills_html, unsafe_allow_html=True)

            st.markdown("**Body preview:**")
            st.markdown(
                f'<div class="note-preview">{st.session_state["generated_body"]}</div>',
                unsafe_allow_html=True,
            )

            save_clicked = st.button(
                "Save to Vault",
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
                        st.session_state["selected_note_path"] = saved_path
                        st.toast("Saved to vault!")
                        st.success(f"Note saved successfully: `{saved_path}`")
                        st.balloons()
                    except Exception as exc:
                        st.error(
                            f"Failed to save note: {type(exc).__name__}: {exc}"
                        )

        elif not generate_clicked:
            st.markdown(
                '<div class="glass-card" style="text-align:center;padding:2.5rem;">'
                "<p style='color:#8b949e;'>Select a note type, enter your prompt, "
                "and click <strong>Generate Note</strong> to begin.</p>"
                "</div>",
                unsafe_allow_html=True,
            )

    with right_col:
        selected_path = st.session_state.get("selected_note_path")

        if selected_path and Path(selected_path).exists():
            note_name = Path(selected_path).stem
            st.markdown(f"### Preview: `{note_name}`")

            try:
                rel = str(Path(selected_path).parent.relative_to(Path(VAULT_PATH)))
            except ValueError:
                rel = "-"

            st.markdown(
                f'<div class="folder-label">Folder: {rel}</div><br>',
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
            st.markdown("### Note Preview")
            st.markdown(
                '<div class="glass-card" style="text-align:center;padding:3rem;">'
                "<p style='color:#8b949e;'>Click a note in the sidebar to preview it here.</p>"
                "</div>",
                unsafe_allow_html=True,
            )

        if vault_ok:
            st.markdown("### Vault Overview")
            vault_root = Path(VAULT_PATH)
            stats_rows: list[tuple[str, int]] = []
            for folder_name in sorted(vault_root.iterdir(), key=lambda path: path.name):
                if folder_name.is_dir():
                    count = sum(1 for _ in folder_name.rglob("*.md"))
                    if count > 0:
                        stats_rows.append((folder_name.name, count))

            if stats_rows:
                total = sum(count for _, count in stats_rows)
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
