// Supabase project publishable browser key (NOT a service-role secret).
export const PROJECT_URL="https://mlmpcpkucurylkrobain.supabase.co";
export const PUBLISHABLE_KEY="sb_publishable_zSSyHUwfzwmireoFwTYDRA_df0E9u3h";

// Load optional AI advisor after application configuration initializes.
if (typeof document !== 'undefined') { const sheet=document.createElement('link'); sheet.rel='stylesheet'; sheet.href='./ai-manager.css'; document.head.appendChild(sheet); void import('./ai-manager.mjs'); }
