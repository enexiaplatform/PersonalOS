"""
groq_client.py — Groq API integration for Enexia Personal OS.
Handles LLM calls and structured JSON response parsing.
"""
from __future__ import annotations

import json
import os
import re
from typing import TypedDict

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------

class NoteResult(TypedDict):
    title: str
    body: str
    tags: list[str]


# ---------------------------------------------------------------------------
# System prompt template (exact as specified)
# ---------------------------------------------------------------------------

SYSTEM_PROMPT_TEMPLATE = """\
You are a knowledge structuring assistant for a life-science professional in Vietnam.
Generate a concise, well-structured note based on the user's prompt.

Note type: {note_type}

Output STRICTLY in this JSON format (no markdown fences, no preamble):
{{
  "title": "Short descriptive title, 5-10 words",
  "body": "The main content in Markdown, 150-400 words. Use headings and bullet points where helpful.",
  "tags": ["tag1", "tag2", "tag3"]
}}

Rules:
- Tags are lowercase, no spaces (use dashes)
- Max 5 tags
- Body should be useful standalone content, not just a summary of the prompt
- Write in the language the user used (English or Vietnamese)
"""


# ---------------------------------------------------------------------------
# Client factory
# ---------------------------------------------------------------------------

def _get_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "GROQ_API_KEY is not set. Add it to your .env file."
        )
    return Groq(api_key=api_key)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_note(note_type: str, user_prompt: str) -> NoteResult:
    """
    Call Groq LLM and return a structured NoteResult dict.

    Args:
        note_type: One of atomic | biowiki | resource | daily | project
        user_prompt: The raw user input describing what to write.

    Returns:
        NoteResult with keys: title, body, tags

    Raises:
        EnvironmentError: If GROQ_API_KEY is missing.
        ValueError: If LLM output cannot be parsed as JSON.
        groq.APIError: On any Groq API-level failure.
    """
    client = _get_client()
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(note_type=note_type)

    completion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.7,
        max_tokens=1024,
    )

    raw_text = completion.choices[0].message.content.strip()

    try:
        # Try to parse directly first
        data = json.loads(raw_text)
    except json.JSONDecodeError:
        # If it fails, try to strip markdown fences
        match = re.search(r"```(?:json)?\s*(.*?)\s*```", raw_text, re.DOTALL)
        if match:
            cleaned_text = match.group(1).strip()
            try:
                data = json.loads(cleaned_text)
            except json.JSONDecodeError as exc:
                raise ValueError(
                    f"LLM returned non-JSON output even after stripping fences:\n\n{raw_text}"
                ) from exc
        else:
            raise ValueError(
                f"LLM returned non-JSON output:\n\n{raw_text}"
            )

    # Validate required keys
    for key in ("title", "body", "tags"):
        if key not in data:
            raise ValueError(f"LLM JSON missing required key: '{key}'")

    return NoteResult(
        title=str(data["title"]),
        body=str(data["body"]),
        tags=[str(t) for t in data.get("tags", [])[:5]],
    )
