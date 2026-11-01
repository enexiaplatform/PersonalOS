# Manus AI Manager — Personal OS

## Deployed scope
- Floating AI Manager panel in the existing Personal OS. Does not add or reorder domains/menu.
- Supabase-authenticated, single-owner backend route: `/api/ai-manager`.
- Manus API v2 `task.create`, `task.detail`, `task.listMessages` through the server.
- Vietnamese advice with snapshot coverage, evidence limits, Must-Win priorities and source uncertainty.
- Read-only. No Manus connectors or writeback permissions are enabled.
- Personal Notion snapshot metadata is summarized. Task text is sent only after explicitly checking the opt-in box.

## Required operator action
The Vercel connector cannot set environment variables (permission/safety block). The integration remains unavailable until configured.

1. Revoke the Manus key exposed in chat and generate a NEW key in the Manus developer settings.
2. In Vercel project `henry-personal-os`, open Settings -> Environment Variables.
3. Add `MANUS_API_KEY` as an encrypted/secret environment variable for Production. Paste the NEW key there. Do not place it in GitHub, browser code, chat, or screenshots.
4. Redeploy the latest commit to pick up the environment variable.
5. Log in and use the AI Manager button. Test with a non-sensitive question and verify that the returned answer originates from the Manus task.

## Security and limits
- Server verifies Supabase bearer session and the designated account owner for every operation.
- Polling uses a signed task ticket; no Manus key appears in browser traffic.
- Manus runs asynchronously; the UI polls for up to two minutes, with a Manus task link for longer runs.
- No automatic Notion writeback or access to sensitive commercial module snapshots.
- Every task can consume Manus credits. There is no guarantee of zero cost.
- Existing daily/weekly automations and their source-of-truth rules remain unchanged.

## Validation
- GitHub and Vercel deployment READY indicates published files, not a successful provider connection.
- Confirm environment variable provisioning and a successful live `task.create` / `task.listMessages` after rotation.
- Review Vercel function logs and Manus credit usage after the first test.
