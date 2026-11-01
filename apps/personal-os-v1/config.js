// Supabase project publishable browser key (NOT a service-role secret).
export const PROJECT_URL="https://mlmpcpkucurylkrobain.supabase.co";
export const PUBLISHABLE_KEY="sb_publishable_zSSyHUwfzwmireoFwTYDRA_df0E9u3h";

// Load optional AI advisor after application configuration initializes.
if (typeof document !== 'undefined' && typeof document.createElement === 'function' && document.head?.appendChild) { const sheet=document.createElement('link'); sheet.rel='stylesheet'; sheet.href='./ai-manager.css'; const theme=document.querySelector('link[href*="executive.css"]'); if(theme)document.head.insertBefore(sheet,theme); else document.head.appendChild(sheet); void import('./ai-manager.mjs'); }
