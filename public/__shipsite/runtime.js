// The site's own runtime. It ships inside the site and is served from the
// site's own origin: sign-in, the signed-in visitor's saved documents and the
// contact form go to this site's Worker (same origin, /api/auth/* and
// /api/_site/*), and statistics go to the analytics the page already loads
// (Plausible, Google Analytics, Microsoft Clarity). Nothing here calls the
// platform that built the site: a site keeps working, unchanged, whatever
// happens to that platform (owner rule 2026-11-12).
//
// It replaced the platform-hosted /api/runtime/sites/<project>/client.js.
// Everything that script did for the page (account state, delegated
// sign-in/checkout controls, motion behaviours, copy buttons, same-page calls
// to action) lives here; what it posted to the platform does not.
(() => {
  const script = document.currentScript;
  const PROJECT = (script && script.getAttribute('data-project')) || '';
  const PREVIEW = Boolean(script && script.getAttribute('data-preview') === 'true');
  // Whether this site's Worker signs visitors in (the build says so). A page
  // that renders a sign-in control asks too. A site without either has no
  // account routes, so the runtime never asks for them (no 404 per page).
  const ACCOUNTS = Boolean(script && script.getAttribute('data-accounts') === 'true');
  const wantsAccount = () => ACCOUNTS || Boolean(document.querySelector('[data-shipsite-google-login],[data-shipsite-billing-portal]'));

  function createSafeBrowserStorage(resolveStorage) {
    const memory = new Map();
    let persistent = true;
    return {
      getItem(key) {
        key = String(key);
        if (persistent) {
          try { const value = resolveStorage().getItem(key); if (value === null) memory.delete(key); else memory.set(key, value); return value; }
          catch { persistent = false; }
        }
        return memory.has(key) ? memory.get(key) : null;
      },
      setItem(key, value) {
        key = String(key); value = String(value); memory.set(key, value);
        if (persistent) { try { resolveStorage().setItem(key, value); } catch { persistent = false; } }
      },
      removeItem(key) {
        key = String(key); memory.delete(key);
        if (persistent) { try { resolveStorage().removeItem(key); } catch { persistent = false; } }
      },
    };
  }
  const tabStore = createSafeBrowserStorage(() => sessionStorage);
  const zh = () => /^zh/i.test(document.documentElement.lang || '');

  // ---------------------------------------------------------------------------
  // Statistics. An event goes to the analytics the page loads (Plausible
  // counts page views itself; custom events become Plausible goals, GA4
  // events and Clarity custom events) and into an in-page record the
  // platform's preview check reads with its own browser. No request carries
  // an event anywhere else.
  const eventLog = Array.isArray(window.__shipsiteEvents) ? window.__shipsiteEvents : [];
  window.__shipsiteEvents = eventLog;
  const eventName = (raw) => {
    const normalized = String(raw || 'interaction').trim().toLowerCase().replace(/[^a-z0-9_:-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80);
    return /^[a-z][a-z0-9_:-]{1,79}$/.test(normalized) ? normalized : 'interaction';
  };
  const cleanProps = (props) => {
    const out = {};
    for (const [key, value] of Object.entries(props || {})) {
      if (!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(key)) continue;
      if (typeof value === 'number' || typeof value === 'boolean') out[key] = value;
      else if (typeof value === 'string') out[key] = value.slice(0, 160);
    }
    return out;
  };
  const send = async (raw, props = {}) => {
    const name = eventName(raw);
    const clean = cleanProps(props);
    const entry = { name, props: clean, path: location.pathname, at: new Date().toISOString() };
    eventLog.push(entry);
    if (eventLog.length > 200) eventLog.splice(0, eventLog.length - 200);
    try { window.dispatchEvent(new CustomEvent('shipsite:event', { detail: entry })); } catch {}
    // The page view is counted by each tool's own page-view tracking.
    if (name !== 'page_view') {
      try { if (typeof window.plausible === 'function') window.plausible(name, { props: clean }); } catch {}
      try { if (typeof window.gtag === 'function') window.gtag('event', name, clean); } catch {}
      try { if (typeof window.clarity === 'function') window.clarity('event', name); } catch {}
    }
    return { accepted: true };
  };
  window.shipsite = Object.assign(window.shipsite || {}, { track: (name, props) => send(name, props) });

  // The platform's preview check opens a preview with ?shipsite_event_check=1:
  // the contact form and checkout then record their event without sending a
  // message or opening a payment. Production pages never enter this mode.
  const params = new URLSearchParams(location.search);
  if (PREVIEW && params.get('shipsite_event_check') === '1') {
    tabStore.setItem('shipsite_event_check', '1');
    params.delete('shipsite_event_check');
    try { history.replaceState(history.state, '', location.pathname + (params.toString() ? '?' + params.toString() : '') + location.hash); } catch {}
  }
  const eventCheck = PREVIEW && tabStore.getItem('shipsite_event_check') === '1';

  // ---------------------------------------------------------------------------
  // Account. The site's own Worker signs visitors in with Google (the owner's
  // own Google OAuth client) and keeps the session in the site's database as
  // an HttpOnly cookie, so this script never holds a token.
  let sessionUser = null;
  let accountsAvailable = null;
  const labelLoginControls = (user) => {
    document.querySelectorAll('[data-shipsite-google-login]').forEach((node) => {
      if (!node.getAttribute('data-shipsite-login-label')) node.setAttribute('data-shipsite-login-label', (node.textContent || 'Sign in with Google').trim());
      if (user && (user.email || user.name)) {
        node.textContent = user.name || user.email;
        node.setAttribute('data-shipsite-signed-in', 'true');
        node.setAttribute('aria-label', user.email || 'Account');
      } else if (node.getAttribute('data-shipsite-signed-in') === 'true') {
        node.textContent = node.getAttribute('data-shipsite-login-label') || 'Sign in with Google';
        node.removeAttribute('data-shipsite-signed-in');
        node.removeAttribute('aria-label');
      }
    });
  };
  const applySession = (user) => {
    const root = document.documentElement;
    if (user && user.id) { root.dataset.shipsiteUser = user.id; root.dataset.shipsiteEmail = user.email || ''; root.dataset.shipsitePlan = user.planKey || 'free'; }
    else { delete root.dataset.shipsiteUser; delete root.dataset.shipsiteEmail; delete root.dataset.shipsitePlan; }
    labelLoginControls(user);
    sessionUser = user || null;
    window.dispatchEvent(new CustomEvent('shipsite:session', { detail: { user: user || null } }));
  };
  const refreshSession = async () => {
    if (!wantsAccount()) { accountsAvailable = false; applySession(null); return null; }
    try {
      const response = await fetch('/api/auth/me', { credentials: 'same-origin', headers: { accept: 'application/json' } });
      // A site without a backend Worker has no account routes at all.
      accountsAvailable = response.status !== 404 && response.status !== 501;
      const body = await response.json().catch(() => ({}));
      if (response.ok && body && body.authenticated && body.user) {
        applySession({ ...body.user, planKey: body.plan || 'free' });
        return { user: body.user, plan: body.plan || 'free' };
      }
    } catch {}
    applySession(null);
    return null;
  };
  // A visitor returning from Google lands with ?signed_in=1 (or an error the
  // Worker names); the address is cleaned and the state read again.
  if (params.has('signed_in') || params.has('sign_in_error')) {
    const failed = params.get('sign_in_error');
    params.delete('signed_in'); params.delete('sign_in_error');
    try { history.replaceState(history.state, '', location.pathname + (params.toString() ? '?' + params.toString() : '') + location.hash); } catch {}
    if (failed) setTimeout(() => alert(zh() ? '没能完成 Google 登录，请再试一次。' : 'Google sign-in did not finish. Please try again.'), 0);
    else void send('signup', { method: 'google' });
  }
  void refreshSession();
  if ('MutationObserver' in window) new MutationObserver((records) => {
    if (records.some((record) => [...record.addedNodes].some((node) => node instanceof Element && (node.matches('[data-shipsite-google-login]') || node.querySelector('[data-shipsite-google-login]'))))) labelLoginControls(sessionUser);
  }).observe(document.documentElement, { childList: true, subtree: true });

  const signIn = async () => {
    if (!wantsAccount()) { alert(zh() ? '这个网站暂时不能登录。' : 'Sign in is not available on this site yet.'); return; }
    try {
      const returnTo = location.pathname + location.search;
      const response = await fetch('/api/auth/google/start?returnTo=' + encodeURIComponent(returnTo), { credentials: 'same-origin', headers: { accept: 'application/json' } });
      const body = await response.json().catch(() => ({}));
      if (response.ok && body.url) { location.href = body.url; return; }
      alert(body.error === 'google_auth_not_configured'
        ? (zh() ? '站长还没有完成 Google 登录设置，暂时无法登录。没有创建任何账号。' : 'The site owner still needs to finish Google sign-in setup. No account was created.')
        : (zh() ? '这个网站暂时不能登录。' : 'Sign in is not available on this site yet.'));
    } catch { alert(zh() ? '暂时无法登录，请稍后再试。' : 'Sign in is not available yet. Please try again.'); }
  };
  const signOut = () => {
    applySession(null);
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
  };

  // The signed-in visitor's own JSON documents, kept in the site's database.
  const storeUrl = (collection, id) => '/api/_site/store/' + encodeURIComponent(collection) + (id ? '/' + encodeURIComponent(id) : '');
  const storeCall = async (url, init) => {
    const response = await fetch(url, Object.assign({ credentials: 'same-origin' }, init, { headers: { 'content-type': 'application/json', accept: 'application/json' } }));
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error((body && body.error) || 'store_failed'); error.status = response.status; throw error; }
    return body;
  };
  Object.assign(window.shipsite, {
    session: refreshSession,
    signedIn: () => Boolean(document.documentElement.dataset.shipsiteUser),
    plan: () => document.documentElement.dataset.shipsitePlan || 'free',
    accountsAvailable: () => accountsAvailable,
    store: {
      list: async (collection) => (await storeCall(storeUrl(collection), { method: 'GET' })).documents || [],
      put: async (collection, id, data) => storeCall(storeUrl(collection, id), { method: 'POST', body: JSON.stringify({ data }) }),
      remove: async (collection, id) => storeCall(storeUrl(collection, id), { method: 'DELETE' }),
    },
  });

  // ---------------------------------------------------------------------------
  // Checkout and the billing portal: the site's own routes. The site sells
  // through its owner's own payment platform in its own Worker (GET
  // /api/pay/checkout starts the provider's hosted checkout for a tier; GET
  // /api/pay/portal opens the provider's customer portal where it has one).
  // A checkout CTA is a plain link to /api/pay/checkout and works without
  // this script; this only records the event before following it.
  const checkout = async (product, provider) => {
    provider = provider || ''; product = product || '';
    if (eventCheck) { await send('checkout', { provider, product: product.slice(0, 80), mode: 'instrumentation' }); return; }
    void send('checkout', { provider, product: product.slice(0, 80) });
    location.href = '/api/pay/checkout?plan=' + encodeURIComponent(product);
  };
  const manageBilling = async () => {
    if (!sessionUser) { await signIn(); return; }
    try {
      const response = await fetch('/api/pay/portal', { headers: { accept: 'application/json' }, credentials: 'same-origin' });
      const body = await response.json().catch(() => ({}));
      if (response.ok && body.url) { location.href = body.url; return; }
    } catch {}
    alert(zh() ? '请用付款邮箱收到的收据里的链接管理订阅。' : 'Use the link in your payment receipt email to manage your subscription.');
  };
  Object.assign(window.shipsite, { signIn, signOut, checkout, manageBilling });

  // A buyer returning from checkout is told what happened.
  const checkoutBanner = async () => {
    const outcome = params.get('checkout');
    if (outcome !== 'success' && outcome !== 'cancelled' && outcome !== 'pending') return;
    const body = outcome !== 'cancelled' ? await refreshSession() : null;
    const banner = document.createElement('div');
    banner.setAttribute('role', 'status');
    banner.setAttribute('data-shipsite-checkout-banner', outcome);
    banner.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483000;max-width:min(560px,calc(100vw - 32px));padding:14px 16px;border-radius:12px;background:#10261d;color:#fff;font:15px/1.45 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.25);display:flex;gap:12px;align-items:flex-start';
    const text = document.createElement('p');
    text.style.margin = '0';
    const signedIn = Boolean(body && body.user);
    const paid = Boolean(body && body.plan && body.plan !== 'free');
    text.textContent = outcome === 'cancelled'
      ? (zh() ? '已取消付款，没有扣款。' : 'Checkout was cancelled — you have not been charged.')
      : outcome === 'pending' && !paid ? (zh() ? '付款已提交，正在等付款平台确认，几秒后刷新页面即可。' : 'Payment submitted — waiting for the payment platform to confirm; refresh in a few seconds.')
      : signedIn && paid ? (zh() ? '付款成功，你的付费方案已生效。' : 'Payment received — your plan is active.')
      : signedIn ? (zh() ? '付款成功，方案正在激活，几秒后刷新页面即可使用。' : 'Payment received — your plan is activating; refresh in a few seconds.')
      : (zh() ? '付款成功。用付款时填写的同一个邮箱登录 Google，即可在任何设备上使用付费功能。' : 'Payment received. Sign in with Google using the email you paid with to unlock your plan on any device.');
    banner.appendChild(text);
    if (outcome === 'success' && !signedIn) {
      const action = document.createElement('button');
      action.type = 'button'; action.textContent = zh() ? '用 Google 登录' : 'Sign in with Google';
      action.style.cssText = 'flex:none;min-height:36px;padding:6px 12px;border:0;border-radius:8px;background:#fff;color:#10261d;font-weight:600;cursor:pointer';
      action.addEventListener('click', () => void signIn());
      banner.appendChild(action);
    }
    const close = document.createElement('button');
    close.type = 'button'; close.setAttribute('aria-label', zh() ? '关闭' : 'Dismiss'); close.textContent = '×';
    close.style.cssText = 'flex:none;min-width:36px;min-height:36px;border:0;background:transparent;color:#fff;font-size:20px;cursor:pointer';
    close.addEventListener('click', () => banner.remove());
    banner.appendChild(close);
    document.body.appendChild(banner);
    params.delete('checkout'); params.delete('session_id');
    try { history.replaceState(history.state, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash); } catch {}
  };
  if (params.get('checkout') === 'success') void send('checkout_success_return', { status: 'success' });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => void checkoutBanner(), { once: true });
  else void checkoutBanner();

  // ---------------------------------------------------------------------------
  // Page behaviours.
  const destutterVisitorCopy = () => {
    const isMoreContext = (value) => /^(more context|更多背景|更多上下文)$/i.test(String(value || '').trim());
    document.querySelectorAll('summary,button,a,[role="button"]').forEach((node) => {
      if (!isMoreContext(node.textContent)) return;
      const details = node.closest('details');
      if (details) {
        node.remove();
        const host = document.createDocumentFragment();
        while (details.firstChild) host.appendChild(details.firstChild);
        details.replaceWith(host);
      } else node.remove();
    });
    const prefix = /^(direct answer:\s*|ui proof:\s*|what the page can prove(?: today)?:\s*)/i;
    document.querySelectorAll('h1,h2,h3,h4,p,.lead,.eyebrow,.kicker').forEach((node) => {
      if (node.childNodes.length !== 1 || node.firstChild.nodeType !== 3) return;
      const text = (node.textContent || '').trim();
      if (!prefix.test(text)) return;
      node.textContent = text.replace(prefix, '').replace(/^([a-z])/, (ch) => ch.toUpperCase());
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', destutterVisitorCopy, { once: true });
  else destutterVisitorCopy();
  void send('page_view', { title: document.title.slice(0, 120) });

  // A call to action that points at the page it sits on brings the page's tool
  // into view and focuses its first control. Site chrome keeps navigating.
  const samePagePath = (path) => { let value = path || '/'; while (value.length > 1 && value.charAt(value.length - 1) === '/') value = value.slice(0, -1); return value; };
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link || link.closest('[data-capability]') || link.hasAttribute('data-shipsite-checkout')) return;
    const chrome = link.closest('header,nav,footer'); if (chrome && !chrome.closest('main')) return;
    let url; try { url = new URL(link.getAttribute('href') || '', location.href); } catch { return; }
    if (url.origin !== location.origin || url.hash || samePagePath(url.pathname) !== samePagePath(location.pathname)) return;
    const tool = document.querySelector('main [data-capability]') || document.querySelector('[data-capability]');
    if (!tool) return;
    event.preventDefault();
    tool.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const control = tool.querySelector('input:not([type="hidden"]),select,textarea,[data-jtbd-action],button');
    if (control) setTimeout(() => control.focus({ preventScroll: true }), 400);
  });
  document.addEventListener('click', async (event) => {
    const node = event.target instanceof Element ? event.target.closest('[data-copy-value]') : null;
    if (!node) return;
    const value = node.getAttribute('data-copy-value') || '';
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      const previous = node.textContent; node.textContent = 'Copied'; setTimeout(() => { node.textContent = previous; }, 1200);
      void send('copy_success', { column: (node.getAttribute('aria-label') || '').slice(0, 80) });
    } catch { void send('copy_failed'); }
  }, { capture: true });
  document.addEventListener('click', (event) => {
    const node = event.target instanceof Element ? event.target.closest('[data-shipsite-event],a,button') : null;
    if (!node || node.hasAttribute('data-copy-value') || node.hasAttribute('data-shipsite-checkout')) return;
    const raw = node.getAttribute('data-shipsite-event');
    const label = (node.textContent || node.getAttribute('href') || raw || 'click').trim().slice(0, 80);
    void send(raw || 'click', { label, href: (node.getAttribute('href') || '').slice(0, 160) });
  }, { capture: true });

  // Tool runs: only contract identifiers leave the tool, never inputs or output.
  const taskAttempts = new WeakMap();
  const taskProps = (root) => ({ capabilityId: (root.getAttribute('data-capability') || '').slice(0, 80), operation: (root.getAttribute('data-operation') || '').slice(0, 80) });
  const startTask = (root) => {
    if (!root || taskAttempts.get(root)) return;
    taskAttempts.set(root, true);
    void send('task_start', taskProps(root));
  };
  document.addEventListener('click', (event) => {
    const node = event.target instanceof Element ? event.target.closest('[data-jtbd-action],.capability-actions .primary') : null;
    if (!node || node.matches(':disabled,[aria-disabled="true"]')) return;
    startTask(node.closest('[data-capability]'));
  }, { capture: true });
  document.addEventListener('submit', (event) => {
    const form = event.target instanceof Element ? event.target.closest('form') : null;
    if (form) startTask(form.closest('[data-capability]'));
  }, { capture: true });
  new MutationObserver((records) => {
    for (let i = 0; i < records.length; i++) {
      const record = records[i], root = record.target;
      if (!root.matches('[data-capability]')) continue;
      const next = records.slice(i + 1).find((item) => item.target === root);
      const state = (next ? next.oldValue : root.getAttribute('data-state')) || 'idle';
      if (state === (record.oldValue || 'idle')) continue;
      if (state === 'working') { startTask(root); continue; }
      if (!['success', 'error', 'empty'].includes(state) || !taskAttempts.get(root)) continue;
      taskAttempts.set(root, false);
      const props = taskProps(root);
      if (state === 'success') void send('task_complete', props);
      else if (state === 'error') void send('task_error', props);
      else void send('task_empty', props);
    }
  }).observe(document.documentElement, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['data-state'] });

  // The contact form posts to the site's own Worker, which keeps the message
  // in the site's database for the owner.
  const loadedAt = Date.now();
  document.querySelectorAll('form[data-shipsite-contact]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = form.querySelector('[data-shipsite-status]');
    if (eventCheck) {
      await send('lead', { kind: 'contact', mode: 'instrumentation' });
      if (status) status.textContent = 'Instrumentation event recorded.';
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    if (status) status.textContent = zh() ? '正在发送…' : 'Sending…';
    try {
      const response = await fetch('/api/_site/contact', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...data, loadedAt, path: location.pathname }) });
      if (!response.ok) throw new Error();
      form.reset();
      if (status) status.textContent = zh() ? '已收到你的留言，谢谢。' : 'Thanks — message received.';
      void send('lead', { kind: 'contact' });
    } catch { if (status) status.textContent = zh() ? '没能发送，请再试一次。' : 'Could not send. Please try again.'; }
  }));

  // Sign-in, checkout and billing are delegated from the document, so a control
  // a tool renders after load works like one in the static HTML.
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const login = target.closest('[data-shipsite-google-login]');
    if (login) { event.preventDefault(); if (login.getAttribute('data-shipsite-signed-in') === 'true') signOut(); else void signIn(); return; }
    const billing = target.closest('[data-shipsite-billing-portal]');
    if (billing) { event.preventDefault(); void manageBilling(); return; }
    const node = target.closest('[data-shipsite-checkout]');
    if (!node) return;
    const product = node.getAttribute('data-product') || '';
    const href = node.getAttribute('href') || '';
    // A Pricing/Plans nav item is a path to the offer page, not a checkout CTA.
    if (!product && href.charAt(0) === '/') return;
    event.preventDefault();
    void checkout(product, node.getAttribute('data-provider') || '');
  });

  // Generic data-motion behaviours — attribute-driven, identical for every site.
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    const timeline = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()'));
    let revealEngaged = false;
    const engageReveals = () => {
      if (revealEngaged || (window.scrollY || 0) <= 0) return;
      revealEngaged = true;
      document.documentElement.classList.add('motion-scrolled');
      if (timeline || !('IntersectionObserver' in window)) return;
      const revealIo = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('revealed'); revealIo.unobserve(entry.target); } }); }, { rootMargin: '0px 0px -10% 0px' });
      document.querySelectorAll('[data-motion="scroll-reveal"]').forEach((el) => {
        const box = el.getBoundingClientRect();
        if (box.top < innerHeight * 0.92 && box.bottom > 0) el.classList.add('revealed');
        else { el.classList.add('motion-armed'); revealIo.observe(el); }
      });
    };
    addEventListener('scroll', engageReveals, { passive: true });
    engageReveals();
  }
  if (!reduceMotion && ('IntersectionObserver' in window)) {
    const staggerEls = [...document.querySelectorAll('[data-motion="stagger-reveal"]')].filter((el) => el.getBoundingClientRect().top > innerHeight * 0.85);
    if (staggerEls.length) {
      const staggerIo = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('revealed'); staggerIo.unobserve(entry.target); } }); }, { rootMargin: '0px 0px -12% 0px' });
      staggerEls.forEach((el) => { el.classList.add('stagger-armed'); staggerIo.observe(el); });
    }
  }
  if (!reduceMotion) {
    const countTargets = [];
    document.querySelectorAll('[data-motion="count-up"]').forEach((root) => {
      const own = (root.getAttribute('data-value') || '').trim();
      if (own || /^\s*-?[\d.,]+\s*$/.test(root.textContent || '')) countTargets.push(root);
      else root.querySelectorAll('[data-value],.status-count').forEach((el) => countTargets.push(el));
    });
    const rollCount = (el) => {
      const raw = (el.getAttribute('data-value') || el.textContent || '').trim();
      const match = raw.match(/^([^\d-]*)(-?[\d,]+(?:\.\d+)?)([\s\S]*)$/);
      if (!match) return;
      const target = parseFloat(match[2].replace(/,/g, ''));
      if (!isFinite(target)) return;
      const grouped = match[2].includes(',');
      const decimals = (match[2].split('.')[1] || '').length;
      const format = (value) => {
        let text = decimals ? Math.abs(value).toFixed(decimals) : String(Math.round(Math.abs(value)));
        if (grouped) { const parts = text.split('.'); parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); text = parts.join('.'); }
        return (value < 0 ? '-' : '') + text;
      };
      const startedAt = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - startedAt) / 1000);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = match[1] + format(target * eased) + match[3];
        if (t < 1) requestAnimationFrame(tick); else el.textContent = raw;
      };
      requestAnimationFrame(tick);
    };
    if (countTargets.length) {
      if (!('IntersectionObserver' in window)) countTargets.forEach(rollCount);
      else { const countIo = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { countIo.unobserve(entry.target); rollCount(entry.target); } }); }, { threshold: 0.4 }); countTargets.forEach((el) => countIo.observe(el)); }
    }
  }
})();
