// ─────────────────────────────────────────────────────────────────
//  Learning Machines OS — Central Configuration
//  Edit this file each week to update links and settings.
// ─────────────────────────────────────────────────────────────────

window.LM_CONFIG = {

  // ── Supabase ──────────────────────────────────────────────────
  supabase: {
    url: 'https://zwwsoobzqwkziywolxrt.supabase.co',
    key: 'sb_publishable_ae1i3mpIaO4HAH1qePDKtQ_ZXrwLq5f'
  },

  // ── Camp calendar ─────────────────────────────────────────────
  camp: {
    start:  '2026-08-01T00:00:00-04:00',  // Saturday Week 1 opens
    cohort: '2026',
    themes: ['Ideas + Build', 'Launch', 'Feedback & Iterate', 'Growth & Monetization', 'Demo Day']
  },

  // ── Auth ──────────────────────────────────────────────────────
  auth: {
    // Set to true once you're ready to require login.
    // False = show page normally (good for pre-camp testing).
    required: false,

    // Auto-detects dev vs production for the magic link redirect.
    // Add BOTH URLs to Supabase: Authentication → URL Configuration → Redirect URLs.
    get redirectTo() {
      return window.location.hostname === 'localhost'
        ? 'http://localhost:8766/login'          // local dev
        : 'https://learningmachines.xyz/login';  // production (Vercel)
    }
  },

  // ── Weekly links — UPDATE THESE EACH SUNDAY NIGHT ────────────
  // Swap in the real URL for the week. Everything else is automatic.
  links: {
    announcement: 'https://ANNOUNCEMENT-URL',   // Notion / Substack post
    lecture:      'https://LECTURE-URL',         // YouTube / Loom
    officeHours:  'https://OFFICE-HOURS-URL',    // Zoom / Google Meet link
    resources:    'https://RESOURCES-URL',       // Notion / Google Drive
    discord:      'https://DISCORD-INVITE-URL'   // Discord server invite
  }

};
