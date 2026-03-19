// js/auth.js
// Handles Supabase Magic Link auth.
// Include this script on every protected page BEFORE other scripts.

// ── Supabase config ─────────────────────────────────────────
// These are PUBLIC keys — safe to expose in frontend
// They only allow what Supabase RLS (Row Level Security) permits
const SUPABASE_URL     = window.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';

// ── Load Supabase JS client from CDN ────────────────────────
// We use the UMD build so no bundler is needed
let supabase = null;

async function initSupabase() {
  if (supabase) return supabase;
  // Dynamically load Supabase client
  await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabase;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ── Session management ──────────────────────────────────────

async function getSession() {
  const sb = await initSupabase();
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

async function signOut() {
  const sb = await initSupabase();
  await sb.auth.signOut();
  location.href = loginUrl();
}

function loginUrl() {
  // Works whether files are at root or in pages/ subfolder
  const depth = location.pathname.includes('/pages/') ? '../' : '';
  return `${depth}login.html`;
}

// ── Auth guard ──────────────────────────────────────────────
// Call this at the top of every protected page.
// Redirects to login if no valid session.
// Returns the user object if authenticated.

async function requireAuth() {
  const sb   = await initSupabase();
  const user = await getUser();

  if (!user) {
    // Save current page so we can redirect back after login
    sessionStorage.setItem('redirect_after_login', location.href);
    location.href = loginUrl();
    return null;
  }

  // Check if email is in allowed_emails table
  const { data, error } = await sb
    .from('allowed_emails')
    .select('email, name')
    .eq('email', user.email)
    .single();

  if (error || !data) {
    // Authenticated with Supabase but not on the family list
    await sb.auth.signOut();
    location.href = loginUrl() + '?error=not_allowed';
    return null;
  }

  return { ...user, display_name: data.name };
}

// ── Send magic link ─────────────────────────────────────────

async function sendMagicLink(email) {
  const sb = await initSupabase();

  // Check allowed_emails BEFORE sending the link
  const { data, error } = await sb
    .from('allowed_emails')
    .select('email')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !data) {
    throw new Error("This email isn't on the guest list. Contact the admin to get access.");
  }

  const redirectTo = `${location.origin}${location.pathname.replace('login.html', '')}pages/auth-callback.html`;

  const { error: sendError } = await sb.auth.signInWithOtp({
    email: email.toLowerCase().trim(),
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });

  if (sendError) throw new Error(sendError.message);
}

// ── Render user badge in nav ────────────────────────────────
// Call after requireAuth() to show who is logged in

function renderUserBadge(user) {
  const nav = document.querySelector('.nav-links');
  if (!nav || !user) return;

  const badge = document.createElement('div');
  badge.style.cssText = 'display:flex;align-items:center;gap:8px;margin-left:auto;';
  badge.innerHTML = `
    <span style="font-size:12px;color:var(--text3);">${user.display_name || user.email}</span>
    <button onclick="signOut()" style="padding:5px 12px;border-radius:20px;border:1px solid var(--border2);background:var(--bg2);color:var(--text2);font-size:12px;cursor:pointer;">
      Sign out
    </button>`;
  nav.appendChild(badge);
}
