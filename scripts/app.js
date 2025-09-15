/*********************
 *  AYARLAR & GLOBAL
 *********************/
const CLIENT_ID = '55853861-u5lbmr4l02lsphi39iu1he03b9m30sru.apps.googleusercontent.com';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

// Basit uygulama kullanıcıları (güncel liste)
const BASIC_USERS = {
  admin: 'hoze2025',
  ozan: 'hoze2025',   // Ozan Bektaş
  ismail: 'hoze2025', // İsmail Kol
  azra: 'hoze2025',   // Azra Lale
  burak: 'hoze2025',  // Burak Özçandır
  yusuf: 'hoze2025'   // Yusuf Doğruer
};

// Görünen adlar (avatar ve atama için)
const USER_DISPLAY = {
  admin: 'Admin',
  ozan: 'Ozan Bektaş',
  ismail: 'İsmail Kol',
  azra: 'Azra Lale',
  burak: 'Burak Özçandır',
  yusuf: 'Yusuf Doğruer'
};

// Sekme anahtarları
const TAB_KEYS = { home: 'home', cal: 'cal', fin: 'fin' };

// Sekme atamaları (localStorage ile kalıcı)
let TAB_ASSIGN = null;

/** Sekme atamalarını yükle; yoksa admin’e ver ve kaydet */
function loadTabAssignments() {
  try {
    TAB_ASSIGN = JSON.parse(localStorage.getItem('tabAssignments') || 'null');
  } catch { TAB_ASSIGN = null; }
  if (!TAB_ASSIGN || typeof TAB_ASSIGN !== 'object') {
    TAB_ASSIGN = { home: ['admin'], cal: ['admin'], fin: ['admin'] };
    saveTabAssignments();
  } else {
    ['home','cal','fin'].forEach(k=>{
      const arr = Array.isArray(TAB_ASSIGN[k]) ? TAB_ASSIGN[k] : [];
      if (!arr.includes('admin')) arr.push('admin');
      TAB_ASSIGN[k] = Array.from(new Set(arr));
    });
  }
}
function saveTabAssignments() {
  localStorage.setItem('tabAssignments', JSON.stringify(TAB_ASSIGN));
}
function userHasAccess(tabKey, username){
  if (!username) return false;
  const list = Array.isArray(TAB_ASSIGN?.[tabKey]) ? TAB_ASSIGN[tabKey] : [];
  return list.includes(username);
}
function isAdmin(){
  return currentUser()?.username === 'admin';
}

/** Sekme görünürlüğünü güncelle (buton ve içerik) */
function updateTabVisibility() {
  loadTabAssignments();

  const user = currentUser();
  const uname = user?.username || null;

  const tabHomeBtn = document.getElementById('tab-home');
  const tabCalBtn  = document.getElementById('tab-cal');
  const tabFinBtn  = document.getElementById('tab-fin');

  const homeMain = document.getElementById('home');
  const calMain  = document.getElementById('main');
  const finMain  = document.getElementById('finance');

  const canHome = userHasAccess('home', uname);
  const canCal  = userHasAccess('cal', uname);
  const canFin  = userHasAccess('fin', uname);

  if (tabHomeBtn) tabHomeBtn.style.display = canHome ? '' : 'none';
  if (tabCalBtn)  tabCalBtn .style.display = canCal  ? '' : 'none';
  if (tabFinBtn)  tabFinBtn .style.display = canFin  ? '' : 'none';

  if (homeMain) { if (!canHome) homeMain.classList.add('hidden'); }
  if (calMain)  { if (!canCal)  calMain .classList.add('hidden'); }
  if (finMain)  { if (!canFin)  finMain .classList.add('hidden'); }

  const allowedOrder = [];
  if (canHome) allowedOrder.push('home');
  if (canCal)  allowedOrder.push('cal');
  if (canFin)  allowedOrder.push('fin');

  const isHomeActive = homeMain && !homeMain.classList.contains('hidden');
  const isCalActive  = calMain  && !calMain .classList.contains('hidden');
  const isFinActive  = finMain  && !finMain .classList.contains('hidden');

  let needSwitch = false;
  if (isHomeActive && !canHome) needSwitch = true;
  if (isCalActive  && !canCal ) needSwitch = true;
  if (isFinActive  && !canFin ) needSwitch = true;

  if (needSwitch) {
    if (allowedOrder.length === 0) {
      if (homeMain) homeMain.classList.add('hidden');
      if (calMain ) calMain .classList.add('hidden');
      if (finMain ) finMain .classList.add('hidden');
    } else {
      const k = allowedOrder[0];
      if (k === 'home') document.getElementById('tab-home')?.onclick();
      if (k === 'cal')  document.getElementById('tab-cal') ?.onclick();
      if (k === 'fin')  document.getElementById('tab-fin') ?.onclick();
    }
  }
}

/** Admin için: sekmeye kullanıcı atama menüsü (sağ tık) */
let tabAssignMenuEl = null;
function ensureTabAssignMenu(){
  if (tabAssignMenuEl) return tabAssignMenuEl;
  const menu = document.createElement('div');
  menu.id = 'tabAssignMenu';
  menu.style.position = 'fixed';
  menu.style.minWidth = '260px';
  menu.style.border = '1px solid var(--border)';
  menu.style.background = 'var(--surface)';
  menu.style.color = 'var(--text)';
  menu.style.borderRadius = '12px';
  menu.style.boxShadow = '0 10px 30px rgba(0,0,0,.35)';
  menu.style.zIndex = '70';
  menu.style.display = 'none';
  menu.style.overflow = 'hidden';
  document.body.appendChild(menu);

  document.addEventListener('click', (e)=>{
    if (menu.style.display !== 'block') return;
    if (menu.contains(e.target)) return;
    hideTabAssignMenu();
  });
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') hideTabAssignMenu();
  });

  tabAssignMenuEl = menu;
  return menu;
}
function hideTabAssignMenu(){
  if (tabAssignMenuEl) tabAssignMenuEl.style.display = 'none';
}
function openTabAssignMenu(tabKey, anchorRect){
  if (!isAdmin()) return;
  loadTabAssignments();
  const menu = ensureTabAssignMenu();
  menu.innerHTML = '';

  const title = document.createElement('div');
  const tabName = tabKey === 'home' ? 'Ana Sayfa' : tabKey === 'cal' ? 'Takvim' : 'Finans';
  title.textContent = `Sekmeye erişim — ${tabName}`;
  title.style.padding = '12px';
  title.style.fontWeight = '900';
  title.style.borderBottom = '1px solid var(--border)';
  menu.appendChild(title);

  const body = document.createElement('div');
  body.style.maxHeight = '300px';
  body.style.overflow = 'auto';
  Object.entries(USER_DISPLAY).forEach(([u, d])=>{
    const row = document.createElement('label');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '10px';
    row.style.padding = '10px 12px';
    row.style.cursor = 'pointer';
    row.onmouseenter = ()=> row.style.background = 'var(--surface-2)';
    row.onmouseleave = ()=> row.style.background = 'transparent';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = (TAB_ASSIGN?.[tabKey] || []).includes(u);
    if (u === 'admin') cb.disabled = true;

    const av = document.createElement('div');
    av.className = 'avatar';
    av.dataset.user = u;
    av.textContent = getInitials(d);
    av.style.width = '20px';
    av.style.height = '20px';
    av.style.borderRadius = '9999px';
    av.style.display = 'inline-flex';
    av.style.alignItems = 'center';
    av.style.justifyContent = 'center';
    av.style.fontSize = '10px';
    av.style.fontWeight = '900';
    av.style.background = 'var(--accent)';
    av.style.color = '#fff';

    const name = document.createElement('div');
    name.textContent = d;
    name.style.fontWeight = '700';

    row.appendChild(cb);
    row.appendChild(av);
    row.appendChild(name);
    body.appendChild(row);
  });
  menu.appendChild(body);

  const foot = document.createElement('div');
  foot.style.display = 'flex';
  foot.style.gap = '8px';
  foot.style.justifyContent = 'flex-end';
  foot.style.borderTop = '1px solid var(--border)';
  foot.style.padding = '10px 12px';

  const cancel = document.createElement('button');
  cancel.className = 'btn';
  cancel.textContent = 'İptal';
  cancel.onclick = ()=> hideTabAssignMenu();

  const save = document.createElement('button');
  save.className = 'btn primary';
  save.textContent = 'Kaydet';
  save.onclick = ()=>{
    const checks = Array.from(body.querySelectorAll('input[type=checkbox]'));
    const selected = checks.filter(c=>c.checked).map((c,i)=>{
      const label = c.parentElement;
      const name = label?.querySelector('div:last-child')?.textContent || '';
      const entry = Object.entries(USER_DISPLAY).find(([,d])=>d===name);
      return entry ? entry[0] : null;
    }).filter(Boolean);

    if (!selected.includes('admin')) selected.push('admin');

    TAB_ASSIGN[tabKey] = Array.from(new Set(selected));
    saveTabAssignments();
    hideTabAssignMenu();
    updateTabVisibility();
  };

  foot.appendChild(cancel);
  foot.appendChild(save);
  menu.appendChild(foot);

  const top = anchorRect.bottom + 8;
  const left = Math.max(8, Math.min(window.innerWidth - 300, anchorRect.left));
  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
  menu.style.display = 'block';

  // Avatarları renklendir
  colorize(menu);
}

// Varsayılan seçili kalacak takvim adları
const DEFAULT_SELECTED_NAMES = [
  'Emre Fel','TUANA','Booking','Ozan Bektaş','Pınar Alkan','Yasemin Rosa'
];
const DEFAULT_SELECTED_SET = new Set(
  DEFAULT_SELECTED_NAMES.map(n => n.replace(/["']/g,'').trim().toLowerCase())
);

// Global durum
let tokenClient, calendar, calendars = [], calendarColors = {};
let gapiInited = false, gisInited = false, authed = false;
let currentEvent = null, infoEditMode = false;
let financeInited = false;

// --- Performans cache ve fetch sırası koruması ---
const EVENT_CACHE = new Map();   // key: `${calId}|${min}|${max}` -> { t, data }
let fetchSeq = 0;                // son çağrıyı ekrana yazmak için

// Tema (kalıcı)
(function initTheme(){
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  const t = document.getElementById('themeToggle');
  if (t) t.onclick = () => {
    const cur = document.documentElement.getAttribute('data-theme');
    theNext = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theNext);
    localStorage.setItem('theme', theNext);
    fitToViewport();
  };
})();

/* ===========================================================
   AVATAR RENK ATAMA — Stabil, çakışmasız, otomatik
   (CSS tarafındaki .u-0 ... .u-11 sınıflarını kullanır)
   =========================================================== */
const AVATAR_PALETTE = ['u-0','u-1','u-2','u-3','u-4','u-5','u-6','u-7','u-8','u-9','u-10','u-11'];

function avatarStableIndex(key) {
  if (!key) return 0;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % AVATAR_PALETTE.length;
}
function stripAvatarRings(node) {
  if (!node) return;
  node.style.boxShadow = 'none';
  node.style.border = 'none';
  node.style.outline = 'none';
  if (parseFloat(getComputedStyle(node).padding) > 0) node.style.padding = '0';
}
function colorize(scope) {
  const root = scope || document;
  const avatars = root.querySelectorAll('.avatar, .task-avatar, .user-avatar, .assignee, [class*="avatar"]');
  avatars.forEach(el => {
    // renk sınıflarını temizle
    AVATAR_PALETTE.forEach(c => el.classList.remove(c));
    const key = (
      el.dataset.user ||
      el.getAttribute('data-user-id') ||
      el.dataset.initials ||
      el.getAttribute('title') ||
      el.textContent || ''
    ).trim().toUpperCase();
    el.classList.add(AVATAR_PALETTE[avatarStableIndex(key)]);
    stripAvatarRings(el);
    stripAvatarRings(el.parentElement);
  });
}
// İlk yükleme + dinleme
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => colorize());
} else {
  colorize();
}
new MutationObserver(() => colorize()).observe(document.body, { childList: true, subtree: true });

/*********************
 *  GİRİŞ / ÇIKIŞ
 *********************/
window.onload = () => {
  gapiLoaded();
  gisLoaded();
  wireUI();
  showAuthIfNeeded();
  updateTabVisibility();
};

function gapiLoaded() {
  gapi.load('client', async () => {
    await gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
    gapiInited = true;
    maybeEnable();
  });
}
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID, scope: SCOPES, callback: ''
  });
  gisInited = true; maybeEnable();
}
function maybeEnable(){
  const ready = gapiInited && gisInited;
  const btn = document.getElementById('loginBtn');
  if (btn) btn.disabled = !ready;
}

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

if (loginBtn) loginBtn.onclick = () => {
  tokenClient.callback = async res => {
    if (res.error) throw res;
    authed = true;
    document.getElementById('loginBtn').classList.add('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
    renderUserAvatar();
    updateTabVisibility();
    await bootAfterAuth();
  };
  tokenClient.requestAccessToken({ prompt: 'consent' });
};

// --- BASIC logout yardımcıları ---
function basicLogout(andReload = true){
  try {
    sessionStorage.removeItem('authUser');
    localStorage.removeItem('rememberUser');
  } catch {}
  const m = document.getElementById('authModal');
  if (m) m.style.display = 'grid';
  document.body.classList.add('auth-pending');
  const lb = document.getElementById('logoutBtn');
  if (lb) lb.classList.add('hidden');
  const av = document.getElementById('userAvatar');
  if (av) av.remove();
  if (andReload) location.reload();
}

// === Çıkış menüsü (iki seçenek) ===
function ensureLogoutMenu(){
  let menu = document.getElementById('logoutMenu');
  if (menu) return menu;

  menu = document.createElement('div');
  menu.id = 'logoutMenu';
  menu.style.position = 'fixed';
  menu.style.minWidth = '260px';
  menu.style.border = '1px solid var(--border)';
  menu.style.background = 'var(--surface)';
  menu.style.color = 'var(--text)';
  menu.style.borderRadius = '12px';
  menu.style.boxShadow = '0 10px 30px rgba(0,0,0,.35)';
  menu.style.zIndex = '60';
  menu.style.display = 'none';
  menu.style.overflow = 'hidden';

  const mkItem = (label, handler, disabled=false) => {
    const it = document.createElement('div');
    it.textContent = label;
    it.style.padding = '10px 12px';
    it.style.cursor = disabled ? 'default' : 'pointer';
    it.style.fontWeight = '700';
    it.style.userSelect = 'none';
    it.style.opacity = disabled ? '.5' : '1';
    it.onmouseenter = ()=>{ if(!disabled) it.style.background = 'var(--surface-2)'; };
    it.onmouseleave = ()=>{ it.style.background = 'transparent'; };
    it.onclick = () => { if(disabled) return; hideLogoutMenu(); handler(); };
    menu.appendChild(it);
  };

  mkItem('Google hesabından çıkış yap', googleSignOutOnly);
  mkItem('Kullanıcı oturumunu sonlandır', basicSignOutOnly);

  document.body.appendChild(menu);

  document.addEventListener('click', (e)=>{
    const avatar = document.getElementById('userAvatar');
    if (!menu) return;
    if (menu.style.display !== 'block') return;
    if (menu.contains(e.target)) return;
    if (avatar && avatar.contains(e.target)) return;
    hideLogoutMenu();
  });
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') hideLogoutMenu();
  });

  return menu;
}
function toggleLogoutMenu(){
  const anchor = document.getElementById('userAvatar');
  if (!anchor) return;
  const menu = ensureLogoutMenu();
  if (menu.style.display === 'block') {
    hideLogoutMenu();
    return;
  }
  const r = anchor.getBoundingClientRect();
  const top = r.bottom + 8;
  const left = Math.max(8, r.right - 280);
  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
  menu.style.display = 'block';
}
function hideLogoutMenu(){
  const menu = document.getElementById('logoutMenu');
  if (menu) menu.style.display = 'none';
}

// Seçenek 1: Sadece Google hesabından çıkış
function googleSignOutOnly(){
  const token = gapi?.client?.getToken?.();
  if (token && token.access_token) {
    google.accounts.oauth2.revoke(token.access_token, () => {
      gapi.client.setToken('');
      authed = false;
      const lb = document.getElementById('loginBtn');
      if (lb) lb.classList.remove('hidden');
      alert('Google hesabından çıkış yapıldı.');
    });
  } else {
    alert('Google hesabı zaten bağlı değil.');
  }
}

// Seçenek 2: Sadece basic kullanıcı oturumunu sonlandır
function basicSignOutOnly(){
  basicLogout(true);
}

if (logoutBtn) logoutBtn.onclick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  toggleLogoutMenu();
};

/*********************
 *  KULLANICI & AVATAR YARDIMCILARI
 *********************/
function currentUser(){
  const u = sessionStorage.getItem('authUser');
  if (!u || !USER_DISPLAY[u]) return null;
  return { username: u, displayName: USER_DISPLAY[u], initials: getInitials(USER_DISPLAY[u]) };
}
function getInitials(name){
  const parts = String(name||'').trim().split(/\s+/).filter(Boolean);
  const first2 = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  return first2.toLocaleUpperCase('tr-TR');
}
function renderUserAvatar(){
  const actions = document.querySelector('.actions');
  if (!actions) return;
  const profile = currentUser();

  if (!profile){
    const old = document.getElementById('userAvatar');
    if (old) old.remove();
    return;
  }

  let btn = document.getElementById('userAvatar');
  if (!btn){
    btn = document.createElement('button');
    btn.id = 'userAvatar';
    btn.className = 'btn';
    btn.style.width = '32px';
    btn.style.height = '32px';
    btn.style.padding = '0';
    btn.style.borderRadius = '9999px';
    btn.style.background = 'var(--accent)';
    btn.style.borderColor = 'var(--accent)';
    btn.style.color = '#fff';
    btn.style.fontWeight = '900';
    btn.style.letterSpacing = '.3px';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.fontFamily = 'inherit';
    btn.onclick = (e)=>{ e.preventDefault(); e.stopPropagation(); toggleLogoutMenu(); };
    const logout = document.getElementById('logoutBtn');
    if (logout && logout.parentElement === actions){
      actions.insertBefore(btn, logout);
    } else {
      actions.appendChild(btn);
    }
  }
  btn.textContent = profile.initials;
  btn.title = profile.displayName;
  btn.setAttribute('aria-label', profile.displayName);
}

/*********************
 *  UYGULAMA GİRİŞ MODALI
 *********************/
function showAuthIfNeeded(){
  const remembered = localStorage.getItem('rememberUser');
  if (remembered && BASIC_USERS[remembered]) {
    sessionStorage.setItem('authUser', remembered);
    document.body.classList.remove('auth-pending');
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('logoutBtn').classList.add('hidden');
    renderUserAvatar();
    updateTabVisibility();
    checkPendingNotifications();
  } else {
    document.body.classList.add('auth-pending');
    document.getElementById('authModal').style.display = 'grid';
    renderUserAvatar();
  }
}
document.getElementById('authSubmit')?.addEventListener('click', doBasicLogin);
document.getElementById('authPass')?.addEventListener('keydown', (e)=>{
  if (e.key === 'Enter') doBasicLogin();
});
function doBasicLogin(){
  const u = (document.getElementById('authUser').value || '').trim();
  const p = document.getElementById('authPass').value || '';
  const remember = document.getElementById('authRemember').checked;
  if (BASIC_USERS[u] && BASIC_USERS[u] === p) {
    sessionStorage.setItem('authUser', u);
    if (remember) localStorage.setItem('rememberUser', u);
    document.getElementById('authModal').style.display = 'none';
    document.body.classList.remove('auth-pending');
    document.getElementById('logoutBtn').classList.add('hidden');
    renderUserAvatar();
    updateTabVisibility();
    checkPendingNotifications();
    renderNotifications(); // girişte gelen kutusu
  } else {
    alert('Kullanıcı adı veya şifre hatalı.');
  }
}

/*********************
 *  BİLDİRİM (OS) KONTROLÜ — VAR OLAN
 *********************/
function checkPendingNotifications(){
  const user = currentUser(); if (!user) return;
  const key = 'notif:' + user.username;
  let arr = [];
  try { arr = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
  if (!arr.length) return;

  const show = () => {
    arr.slice(0,5).forEach(n=>{
      try {
        new Notification(`Yeni mesaj — ${n.from}`, { body: n.text });
      } catch { /* sessiz */ }
    });
  };

  if ('Notification' in window) {
    if (Notification.permission === 'granted') show();
    else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(perm => { if (perm === 'granted') show(); });
    }
  }
  localStorage.removeItem(key);
}

/*********************
 *  UI BAĞLANTILARI
 *********************/
function wireUI(){
  // Sekmeler
  const tabHome = document.getElementById('tab-home');
  const tabCal  = document.getElementById('tab-cal');
  const tabFin  = document.getElementById('tab-fin');

  tabHome.onclick = () => {
    tabHome.classList.add('active'); tabCal.classList.remove('active'); tabFin.classList.remove('active');
    document.getElementById('home').classList.remove('hidden');
    document.getElementById('main').classList.add('hidden');
    document.getElementById('finance').classList.add('hidden');
    document.body.classList.add('drawer-hidden');
    refreshHomeToday();
  };

  tabCal.onclick = () => {
    tabCal.classList.add('active'); tabHome.classList.remove('active'); tabFin.classList.remove('active');
    document.getElementById('finance').classList.add('hidden');
    document.getElementById('home').classList.add('hidden');
    document.getElementById('main').classList.remove('hidden');
    document.body.classList.remove('drawer-hidden');
    fitToViewport();
  };

  tabFin.onclick = () => {
    tabFin.classList.add('active'); tabHome.classList.remove('active'); tabCal.classList.remove('active');
    document.getElementById('main').classList.add('hidden');
    document.getElementById('home').classList.add('hidden');
    document.getElementById('finance').classList.remove('hidden');
    document.body.classList.add('drawer-hidden');
    if (!financeInited) { initFinance(); financeInited = true; }
  };

  // Admin: sekme butonunda sağ tıkla erişim menüsü
  [ ['home', tabHome], ['cal', tabCal], ['fin', tabFin] ].forEach(([key, el])=>{
    el.addEventListener('contextmenu', (e)=>{
      if (!isAdmin()) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      openTabAssignMenu(key, r);
    });
  });

  // Takvim toolbar
  document.getElementById('prevBtn').onclick = () => { calendar?.prev(); fitToViewportSoon(); };
  document.getElementById('nextBtn').onclick = () => { calendar?.next(); fitToViewportSoon(); };
  document.getElementById('todayBtn').onclick = () => { calendar?.today(); fitToViewportSoon(); };

  document.getElementById('btnMonth').onclick = ()=>{ calendar?.changeView('dayGridMonth'); fitToViewportSoon(); };
  document.getElementById('btnWeek').onclick  = ()=>{ calendar?.changeView('timeGridWeek'); fitToViewportSoon(); };
  document.getElementById('btnDay').onclick   = ()=>{ calendar?.changeView('timeGridDay'); fitToViewportSoon(); };
  document.getElementById('btnYear').onclick  = ()=>{ calendar?.changeView('multiMonthYear'); fitToViewportSoon(); };

  // Hızlı ekle (takvim)
  document.getElementById('addQuickBtn').onclick = () => openAddModal();

  // Modallar
  const addM = document.getElementById('addModal');
  document.getElementById('addClose').onclick = ()=> addM.style.display = 'none';
  document.getElementById('addCancel').onclick= ()=> addM.style.display = 'none';
  document.getElementById('addSave').onclick  = saveNewEvent;

  const infoM = document.getElementById('infoModal');
  document.getElementById('infoClose').onclick = ()=> infoM.style.display='none';
  document.getElementById('infoOk').onclick    = saveEdit;
  document.getElementById('infoEdit').onclick  = enterEditMode;
  document.getElementById('infoDelete').onclick= deleteCurrentEvent;

  // Ana Sayfa (todo) bağla
  initHome();
}

async function bootAfterAuth(){
  await loadCalendars();
  buildSidebar();
  initCalendar();
  await refreshCalendar();
  await refreshHomeToday();
}

/*********************
 *  TAKVİM LİSTESİ
 *********************/
async function loadCalendars(){
  const res = await gapi.client.calendar.calendarList.list();
  calendars = (res.result.items || []).map(c => ({
    id: c.id, summary: c.summary,
    backgroundColor: c.backgroundColor || '#3788d8'
  }));
  calendarColors = {};
  calendars.forEach(c => calendarColors[c.id] = c.backgroundColor);
}

function buildSidebar(){
  const wrap = document.getElementById('calendarList');
  wrap.innerHTML = '';
  calendars.forEach((c) => {
    const isDefault = DEFAULT_SELECTED_SET.has((c.summary || '').trim().toLowerCase());
    const row = document.createElement('label');
    row.className = 'cal-item';
    row.innerHTML = `
      <input type="checkbox" ${isDefault ? 'checked' : ''} data-cal="${c.id}">
      <span class="dot" style="background:${c.backgroundColor}"></span>
      <span class="cal-name" title="${c.summary}">${c.summary}</span>
    `;
    row.querySelector('input').onchange = () => { refreshCalendar(); refreshHomeToday(); };
    wrap.appendChild(row);
  });

  const sel = document.getElementById('addCal');
  sel.innerHTML = calendars.map(c => `<option value="${c.id}">${c.summary}</option>`).join('');

  refreshCalendar();
}

function selectedCalendarIds(){
  return Array.from(document.querySelectorAll('#calendarList input[type=checkbox]'))
    .filter(cb => cb.checked).map(cb => cb.dataset.cal);
}

/*********************
 *  FULLCALENDAR
 *********************/
function initCalendar(){
  const calEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calEl, {
    initialView: 'dayGridMonth',
    locale: 'tr',
    timeZone: 'Europe/Istanbul',
    firstDay: 1,
    headerToolbar: false,
    height: '100%',
    dayMaxEventRows: false,
    dayMaxEvents: false,
    views: {
      dayGridMonth: { titleFormat: { year: 'numeric', month: 'long' }, dayMaxEvents: 3, moreLinkContent: (arg)=>`${arg.num} tane daha` },
      multiMonthYear: { dayMaxEvents: 3, moreLinkContent: (arg)=>`${arg.num} tane daha` }
    },
    dateClick: (info) => openAddModal(info.dateStr),
    eventClick: (info) => openInfo(info.event),
    events: [],
    datesSet: () => { updateTitle(); refreshCalendar(); }
  });
  calendar.render();
  updateTitle();
  fitToViewportSoon();
}

/* Google renk ID haritası */
const GOOGLE_COLORS = { 1:'#a4bdfc',2:'#7ae7bf',3:'#dbadff',4:'#ff887c',5:'#fbd75b',6:'#ffb878',7:'#46d6db',8:'#e1e1e1',9:'#5484ed',10:'#51b749',11:'#dc2127' };
const COLOR_OPTIONS = [
  { id:'', label:'Varsayılan (takvim rengi)' },{ id:'1',label:'Açık mavi' },{ id:'2',label:'Açık yeşil' },{ id:'3',label:'Lavanta' },
  { id:'4',label:'Koral' },{ id:'5',label:'Sarı' },{ id:'6',label:'Turuncu' },{ id:'7',label:'Turkuaz' },{ id:'8',label:'Gri' },{ id:'9',label:'Mavi' },{ id:'10',label:'Yeşil' },{ id:'11',label:'Kırmızı' }
];
function buildColorSelect(selectEl, selectedId){ if (!selectEl) return; selectEl.innerHTML = COLOR_OPTIONS.map(c=>`<option value="${c.id}">${c.label}</option>`).join(''); selectEl.value = selectedId || ''; }

/*********************
 *  HIZLI & PARALEL VERİ ÇEKME + CACHE
 *********************/
async function fetchEventsFor(calId, min, max){
  const key = `${calId}|${min}|${max}`;
  const cached = EVENT_CACHE.get(key);
  if (cached && (Date.now() - cached.t) < 30000) return cached.data;

  const res = await gapi.client.calendar.events.list({
    calendarId: calId,
    timeMin: min,
    timeMax: max,
    singleEvents: true,
    orderBy: 'startTime',
    showDeleted: false,
    maxResults: 2500,
    fields: 'items(id,summary,start,end,colorId,creator(displayName,email),location,description)'
  });
  const items = res.result.items || [];
  const mapped = items.map(ev => {
    const color = ev.colorId ? GOOGLE_COLORS[ev.colorId] : (calendarColors[calId] || '#3788d8');
    return {
      id: ev.id,
      title: ev.summary || '(Başlıksız)',
      start: ev.start.dateTime || ev.start.date,
      end: ev.end?.dateTime || ev.end?.date || null,
      allDay: !ev.start.dateTime,
      backgroundColor: color, borderColor: color, textColor: '#000',
      extendedProps: { calendarId: calId, raw: ev }
    };
  });
  EVENT_CACHE.set(key, { t: Date.now(), data: mapped });
  return mapped;
}

async function refreshCalendar(){
  if (!calendar) return;
  const mySeq = ++fetchSeq;
  const ids = selectedCalendarIds();
  const min = new Date(calendar.view.activeStart).toISOString();
  const max = new Date(calendar.view.activeEnd).toISOString();

  const tasks = ids.map(id => fetchEventsFor(id, min, max));
  const results = await Promise.allSettled(tasks);
  if (mySeq !== fetchSeq) return;

  let all = [];
  for (const r of results) if (r.status === 'fulfilled') all = all.concat(r.value);

  calendar.removeAllEvents();
  calendar.addEventSource(all);

  try { syncReleaseTodosFromEvents(all); } catch(_) {}

  fitToViewportSoon();
}

/*********************
 *  MODAL — EKLE
 *********************/
function openAddModal(dateISO){
  if (!authed) return;
  const m = document.getElementById('addModal');
  const base = dateISO ? new Date(dateISO) : new Date();
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0);
  const end   = new Date(start.getTime() + 24*60*60*1000);
  document.getElementById('addTitle').value = '';
  document.getElementById('addStart').value = fmtLocal(start);
  document.getElementById('addEnd').value   = fmtLocal(end);
  document.getElementById('addAllDay').checked = true;
  buildColorSelect(document.getElementById('addColor'), '');
  m.style.display = 'grid';
}
function fmtLocal(d){
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function saveNewEvent(){
  if (!confirm('Bu etkinliği kaydetmek istediğine emin misin?')) return;
  const calId = document.getElementById('addCal').value;
  const title = document.getElementById('addTitle').value?.trim() || '(Başlıksız)';
  const allDay = document.getElementById('addAllDay').checked;
  const s = new Date(document.getElementById('addStart').value);
  const e = new Date(document.getElementById('addEnd').value);
  const colorId = document.getElementById('addColor').value;

  const body = allDay
    ? { summary: title, start:{date: s.toISOString().slice(0,10)}, end:{date: e.toISOString().slice(0,10)} }
    : { summary: title, start:{dateTime: s.toISOString()}, end:{dateTime: e.toISOString()} };
  if (colorId) body.colorId = colorId;

  try {
    await gapi.client.calendar.events.insert({ calendarId: calId, resource: body });
    document.getElementById('addModal').style.display='none';
    await refreshCalendar();
    await refreshHomeToday();
  } catch(e){
    alert('Kaydedilemedi: ' + (e?.message || ''));
  }
}

/*********************
 *  MODAL — BİLGİ (görüntüle/düzenle/sil)
 *********************/
function openInfo(ev){
  currentEvent = ev; infoEditMode = false;
  const raw = ev.extendedProps?.raw || {};
  const calId = ev.extendedProps?.calendarId;
  const color = ev.backgroundColor || '#888';
  const creator = (raw.creator && (raw.creator.displayName || raw.creator.email)) || '';
  const body = document.getElementById('infoBody');
  const range = formatRange(new Date(ev.start), ev.end ? new Date(ev.end) : null, ev.allDay);
  body.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <span class="dot" style="background:${color};"></span>
      <div class="event-title">${escapeHtml(ev.title)}</div>
    </div>
    <div class="muted">${range}</div>
    <div class="muted">Takvim: ${escapeHtml((calendars.find(c=>c.id===calId)||{}).summary||'')}</div>
    ${creator ? `<div class="muted">Oluşturan: ${escapeHtml(creator)}</div>`:''}
    ${raw.location ? `<div>📍 ${escapeHtml(raw.location)}</div>`:''}
    ${raw.description ? `<div style="white-space:pre-wrap">${escapeHtml(raw.description)}</div>`:''}
  `;
  document.getElementById('infoModal').style.display='grid';
}

function enterEditMode(){
  if (!currentEvent) return;
  infoEditMode = true;
  const raw = currentEvent.extendedProps?.raw || {};
  const allDay = !!raw.start?.date && !raw.start?.dateTime;
  const s = allDay ? new Date(raw.start.date) : new Date(raw.start.dateTime);
  const e = raw.end ? (raw.end.date ? new Date(raw.end.date) : new Date(raw.end.dateTime)) : s;
  const body = document.getElementById('infoBody');
  body.innerHTML = `
    <div class="row"><label>Başlık</label><input id="editTitle" class="input" value="${escapeHtml(raw.summary||'')}" /></div>
    <div class="row"><label>Başlangıç</label><input id="editStart" type="datetime-local" class="input" value="${fmtLocal(s)}"/></div>
    <div class="row"><label>Bitiş</label><input id="editEnd" type="datetime-local" class="input" value="${fmtLocal(e)}"/></div>
    <div class="row"><label>Tüm gün</label><input id="editAllDay" type="checkbox" ${allDay ? 'checked':''}/></div>
    <div class="row"><label>Konum</label><input id="editLocation" class="input" value="${escapeHtml(raw.location||'')}" /></div>
    <div class="row"><label>Açıklama</label><textarea id="editDesc" class="input" style="height:80px; padding:8px;">${escapeHtml(raw.description||'')}</textarea></div>
    <div class="row"><label>Renk</label><select id="editColor"></select></div>
  `;
  buildColorSelect(document.getElementById('editColor'), raw.colorId || '');
}

async function saveEdit(){
  const m = document.getElementById('infoModal');
  if (!currentEvent){ m.style.display='none'; return; }
  if (!infoEditMode){ m.style.display='none'; return; }
  if (!confirm('Değişiklikleri kaydetmek istediğine emin misin?')) return;

  const calId = currentEvent.extendedProps?.calendarId;
  const id = currentEvent.id;
  const title = (document.getElementById('editTitle').value || '').trim() || '(Başlıksız)';
  const allDay = document.getElementById('editAllDay').checked;
  const s = new Date(document.getElementById('editStart').value);
  const e = new Date(document.getElementById('editEnd').value);
  const location = document.getElementById('editLocation').value || '';
  const description = document.getElementById('editDesc').value || '';
  const colorId = document.getElementById('editColor').value;

  const body = { summary: title, location, description };
  if (allDay) { body.start = { date: s.toISOString().slice(0,10) }; body.end = { date: e.toISOString().slice(0,10) }; }
  else { body.start = { dateTime: s.toISOString() }; body.end = { dateTime: e.toISOString() }; }
  if (colorId) body.colorId = colorId; else body.colorId = null;

  try {
    await gapi.client.calendar.events.update({ calendarId: calId, eventId: id, resource: body });
    m.style.display='none';
    await refreshCalendar();
    await refreshHomeToday();
  } catch(e){
    alert('Güncellenemedi: ' + (e?.message||'')); }
}

function formatRange(s, e, allDay){
  const fmtDate = (d) => d.toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long' });
  const fmtTime = (d) => d.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' });
  if (allDay) {
    if (!e || s.toDateString()===e.toDateString()) return fmtDate(s);
    const ee = new Date(e.getTime() - 1);
    return `${fmtDate(s)} — ${fmtDate(ee)}`;
  } else {
    if (!e || s.toDateString()===e.toDateString()) return `${fmtDate(s)}, ${fmtTime(s)} — ${fmtTime(e||s)}`;
    return `${fmtDate(s)} ${fmtTime(s)} — ${fmtDate(e)} ${fmtTime(e)}`;
  }
}

async function deleteCurrentEvent(){
  if (!currentEvent) return;
  if (!confirm('Bu etkinliği silmek istediğine emin misin?')) return;
  const calId = currentEvent.extendedProps?.calendarId;
  try {
    await gapi.client.calendar.events.delete({ calendarId: calId, eventId: currentEvent.id });
    document.getElementById('infoModal').style.display='none';
    await refreshCalendar();
    await refreshHomeToday();
  } catch(e){
    alert('Silinemedi: ' + (e?.message||'')); }
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

/*********************
 *  ÖLÇEKLEME
 *********************/
function fitToViewport(){
  const wrap = document.getElementById('calendarWrap');
  const scaleBox = document.getElementById('scale');
  if (!wrap || !scaleBox) return;
  scaleBox.style.transform = 'scale(1)';
  const neededW = scaleBox.scrollWidth, neededH = scaleBox.scrollHeight;
  const availW = wrap.clientWidth, availH = wrap.clientHeight;
  const k = Math.min(1, availW/neededW, availH/neededH);
  scaleBox.style.transform = `scale(${k})`;
}
const fitToViewportSoon = () => setTimeout(fitToViewport, 50);
window.addEventListener('resize', fitToViewportSoon);

function updateTitle() {
  if (!calendar) return;
  const d = calendar.getDate ? calendar.getDate() : new Date();
  const title = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const el = document.getElementById('calTitle'); if (el) el.textContent = title;
  fitToViewportSoon();
}
document.addEventListener('DOMContentLoaded', () => {
  const observer = new MutationObserver(fitToViewportSoon);
  const calEl = document.getElementById('calendar'); if (calEl) observer.observe(calEl, { childList:true, subtree:true });
});

/*********************
 *  BİLDİRİM KUTUSU (GELEN KUTUSU) — PERSISTENT
 *********************/
// storage key: inbox:<username>, item: {id, taskId, taskTitle, from, text, type, time}
function inboxKey(u){ return 'inbox:'+u; }
function readInbox(u){
  try { return JSON.parse(localStorage.getItem(inboxKey(u))||'[]') || []; } catch { return []; }
}
function writeInbox(u, arr){
  localStorage.setItem(inboxKey(u), JSON.stringify(arr.slice(-300)));
}
function addInboxNotification(users, payload){
  const arrUsers = Array.isArray(users) ? users : [users];
  const me = currentUser();
  arrUsers.forEach(u=>{
    const list = readInbox(u);
    list.push({
      id: 'n_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
      ...payload
    });
    writeInbox(u, list);
    if (me && me.username === u) renderNotifications();
  });
}

/*********************
 *  ANA SAYFA — TODO ve sütunlar (+ INBOX sadece bildirim)
 *********************/
// TODO veri yapısı: { id, text, done, createdAt, dueAt, monthKey, completedAt?, stage?, assignees?:[], assignee?, notes?, priority?, messages? }
let TODOS = [];

function loadTodos(){
  try { TODOS = JSON.parse(localStorage.getItem('todos') || '[]'); } catch { TODOS = []; }
  if (!Array.isArray(TODOS)) TODOS = [];
  let changed = false;
  TODOS.forEach(t=>{
    if (!t.stage) { t.stage = t.done ? 'done' : 'todo'; changed = true; }
    if (typeof t.notes === 'undefined') { t.notes = ''; changed = true; }
    if (typeof t.priority === 'undefined') { t.priority = null; changed = true; }
    if (!Array.isArray(t.messages)) { t.messages = []; changed = true; }
    if (!Array.isArray(t.assignees)) {
      t.assignees = [];
      if (t.assignee) t.assignees.push(t.assignee);
      changed = true;
    }
  });
  if (changed) saveTodos();
}
function saveTodos(){ localStorage.setItem('todos', JSON.stringify(TODOS)); }

function monthKeyFromDate(d){
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
}

function ensureHomeSections(){
  const home = document.getElementById('home');
  if (!home) return;
  const grid = home.querySelector('.home-grid');
  if (!grid) return;

  // --- TODO kartını güvenli şekilde bul (id=todoList olan kart) ---
  let todoCard = null;
  const todoListEl = document.getElementById('todoList');
  if (todoListEl) todoCard = todoListEl.closest('.fin-card');

  // Başlık & alt "+ Görev Ekle" (Yalnızca TODO sütunu)
  if (todoCard) {
    const head = todoCard.querySelector('.head');
    if (head) {
      head.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <span>Yapılacak Görevler Listesi</span>
        </div>`;
    }
    const body = todoCard.querySelector('.body');

    // Üstteki "Görev ekle..." + Ekle butonu varsa KALDIR
    if (body) {
      // input placeholder "Görev ekle" ise satırı tamamen kaldır
      const addInput = body.querySelector('input[placeholder*="Görev ekle" i]');
      if (addInput) {
        const row = addInput.closest('.row') || addInput.parentElement;
        if (row) row.remove();
      }
      // "Ekle" yazan düğme yakınındaysa kaldır
      Array.from(body.querySelectorAll('button, .btn')).forEach(b=>{
        const txt = (b.textContent||'').trim().toLowerCase();
        if (txt === 'ekle') b.remove();
      });
    }

    if (body && !body.querySelector('[data-add-bottom="todo"]')) {
      const foot = document.createElement('div');
      foot.className = 'card-foot';
      foot.style.justifyContent = 'flex-start';
      foot.innerHTML = `<button class="link-add" data-add-bottom="todo"
        style="background:none;border:0;padding:0;height:auto;color:var(--muted);opacity:.7;font-weight:800;cursor:pointer;">+ Görev Ekle</button>`;
      body.appendChild(foot);
    }
  }

  // --- GELEN KUTUSU (bildirim listesi) — GÖREV EKLE YOK, DRAG&DROP YOK ---
  if (!document.getElementById('inboxList')) {
    const inbox = document.createElement('div');
    inbox.className = 'fin-card';
    inbox.innerHTML = `
      <div class="head">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <span>Gelen Kutusu</span>
        </div>
      </div>
      <div class="body">
        <ul id="inboxList" class="todo-list"></ul>
      </div>
    `;
    if (todoCard && grid.contains(todoCard)) {
      grid.insertBefore(inbox, todoCard);
    } else {
      grid.prepend(inbox);
    }
  }

  // Bugünkü etkinlikler kartı varsa kaldır
  const todayCard = Array.from(grid.querySelectorAll('.fin-card'))
    .find(c => c.querySelector('#todayEvents') || /Bugünkü Etkinlikler/i.test(c.querySelector('.head')?.textContent||''));
  if (todayCard) todayCard.remove();

  // Doing / Done / Draft kartları
  if (!document.getElementById('doingList')) {
    const doing = document.createElement('div');
    doing.className = 'fin-card';
    doing.innerHTML = `
      <div class="head">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <span>Anlık Yapılan Görevler</span>
        </div>
      </div>
      <div class="body">
        <ul id="doingList" class="todo-list" data-drop-stage="doing"></ul>
        <div class="card-foot" style="justify-content:flex-start;">
          <button class="link-add" data-add-bottom="doing"
            style="background:none;border:0;padding:0;height:auto;color:var(--muted);opacity:.7;font-weight:800;cursor:pointer;">+ Görev Ekle</button>
        </div>
      </div>
    `;
    grid.appendChild(doing);
  }
  if (!document.getElementById('doneList')) {
    const done = document.createElement('div');
    done.className = 'fin-card';
    done.innerHTML = `
      <div class="head">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <span>Tamamlanan Görevler</span>
        </div>
      </div>
      <div class="body">
        <ul id="doneList" class="todo-list" data-drop-stage="done"></ul>
        <div class="card-foot" style="justify-content:flex-start;">
          <button class="link-add" data-add-bottom="done"
            style="background:none;border:0;padding:0;height:auto;color:var(--muted);opacity:.7;font-weight:800;cursor:pointer;">+ Görev Ekle</button>
        </div>
      </div>
    `;
    grid.appendChild(done);
  }
  if (!document.getElementById('draftList')) {
    const draft = document.createElement('div');
    draft.className = 'fin-card';
    draft.innerHTML = `
      <div class="head">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <span>Taslak Görevler</span>
        </div>
      </div>
      <div class="body">
        <ul id="draftList" class="todo-list" data-drop-stage="draft"></ul>
        <div class="card-foot" style="justify-content:flex-start;">
          <button class="link-add" data-add-bottom="draft"
            style="background:none;border:0;padding:0;height:auto;color:var(--muted);opacity:.7;font-weight:800;cursor:pointer;">+ Görev Ekle</button>
        </div>
      </div>
    `;
    grid.appendChild(draft);
  }

  // Drop bölgeleri bağla (GELEN KUTUSU bağlanmıyor!)
  bindDropZone(document.getElementById('todoList'));
  bindDropZone(document.getElementById('doingList'));
  bindDropZone(document.getElementById('doneList'));
  bindDropZone(document.getElementById('draftList'));

  // Alt metin “+ Görev Ekle” tıklamaları (GELEN KUTUSU yok!)
  grid.querySelectorAll('[data-add-bottom]').forEach(btn=>{
    btn.onclick = () => addTaskToStage(btn.getAttribute('data-add-bottom'));
  });
}

function bindDropZone(ul){
  if (!ul) return;
  ul.addEventListener('dragover',(e)=>{ e.preventDefault(); });
  ul.addEventListener('drop',(e)=>{
    e.preventDefault();
    const id = e.dataTransfer.getData('text/todo-id');
    const targetStage = ul.getAttribute('data-drop-stage');
    if (id && targetStage) moveTaskToStage(id, targetStage);
  });
}

function moveTaskToStage(id, stage){
  const idx = TODOS.findIndex(t=>t.id===id);
  if (idx<0) return;
  const t = TODOS[idx];
  const oldStage = t.stage;
  t.stage = stage;
  if (stage === 'done') {
    t.done = true;
    t.completedAt = new Date().toISOString();
  } else {
    t.done = false;
    t.completedAt = null;
  }
  saveTodos();
  renderTodos();

  if (oldStage !== stage) {
    notifyAssigneesOfChange(t, `Aşama: ${stage}`);
  }
}

/* ===== Görev Ekle MODALI ===== */
let taskAddModalEl = null;
function ensureTaskAddModal(){
  if (taskAddModalEl) return taskAddModalEl;
  const m = document.createElement('div');
  m.id = 'taskAddModal';
  m.className = 'modal';
  m.style.display = 'none';
  m.innerHTML = `
    <div class="card" style="width:min(520px,92vw);">
      <div class="card-head"><div>Yeni Görev</div><button class="btn" id="taskAddClose">Kapat</button></div>
      <div class="card-body">
        <div class="row"><label>Başlık</label><input id="taskAddTitle" class="input" placeholder="Görev başlığı"/></div>
        <div class="row"><label>Aşama</label>
          <select id="taskAddStage" class="input">
            <option value="inbox">Gelen Kutusu</option>
            <option value="todo">Yapılacak</option>
            <option value="doing">Anlık Yapılan</option>
            <option value="done">Tamamlanan</option>
            <option value="draft">Taslak</option>
          </select>
        </div>
        <div class="row"><label>Son Tarih</label><input id="taskAddDue" type="date" class="input"/></div>
        <div class="row"><label>Kişi</label><select id="taskAddAssignee" class="input"></select></div>
        <div class="row"><label>Notlar</label><textarea id="taskAddNotes" class="input" style="height:80px; padding:8px;" placeholder="Kısa notlar..."></textarea></div>
      </div>
      <div class="card-foot">
        <button class="btn" id="taskAddCancel">Vazgeç</button>
        <button class="btn primary" id="taskAddSave">Kaydet</button>
      </div>
    </div>`;
  document.body.appendChild(m);

  m.querySelector('#taskAddClose').onclick = ()=> m.style.display='none';
  m.querySelector('#taskAddCancel').onclick = ()=> m.style.display='none';
  m.querySelector('#taskAddSave').onclick = saveNewTaskFromModal;

  taskAddModalEl = m;
  return m;
}
function fillUserSelect(selectEl, selected){
  if (!selectEl) return;
  const opts = ['<option value="">— Atanmadı —</option>']
    .concat(Object.entries(USER_DISPLAY).map(([u,d])=>`<option value="${u}">${d}</option>`));
  selectEl.innerHTML = opts.join('');
  selectEl.value = selected || '';
}
function openTaskAddModal(stage){
  const m = ensureTaskAddModal();
  m.style.display = 'grid';
  document.getElementById('taskAddTitle').value = '';
  document.getElementById('taskAddStage').value = stage || 'todo';
  document.getElementById('taskAddDue').value = '';
  document.getElementById('taskAddNotes').value = '';
  fillUserSelect(document.getElementById('taskAddAssignee'), '');
}
function saveNewTaskFromModal(){
  const m = ensureTaskAddModal();
  const title = (document.getElementById('taskAddTitle').value||'').trim();
  if (!title){ alert('Başlık boş olamaz.'); return; }
  const stage = document.getElementById('taskAddStage').value || 'todo';
  const dueVal = document.getElementById('taskAddDue').value || '';
  const assignee = document.getElementById('taskAddAssignee').value || '';
  const notes = document.getElementById('taskAddNotes').value || '';

  const now = new Date();
  const id = 't_' + now.getTime() + '_' + Math.random().toString(36).slice(2,8);
  const createdAt = now.toISOString();
  const base = {
    id, text: title, createdAt,
    dueAt: dueVal ? new Date(dueVal+'T12:00:00').toISOString() : null,
    monthKey: monthKeyFromDate(createdAt),
    completedAt: null, stage, done: stage==='done',
    assignees: assignee ? [assignee] : [],
    assignee: assignee || null,
    notes, priority: null, messages: []
  };
  if (stage === 'done') base.completedAt = now.toISOString();

  TODOS.push(base);
  saveTodos();
  renderTodos();
  m.style.display = 'none';

  // Bildirim: yeni görev ataması
  if (assignee) {
    addInboxNotification(assignee, {
      taskId: base.id,
      taskTitle: base.text,
      from: currentUser()?.displayName || 'Sistem',
      text: 'Size yeni bir görev atandı.',
      type: 'assign',
      time: new Date().toISOString()
    });
  }
}
function addTaskToStage(stage){ openTaskAddModal(stage); }

/* ===== Görev menüsü / atama ===== */
let taskMenuEl = null;
let assigneeMenuEl = null;
let openTaskId = null;

function ensureTaskMenu(){
  if (taskMenuEl) return taskMenuEl;
  const menu = document.createElement('div');
  menu.id = 'taskMenu';
  menu.style.position = 'fixed';
  menu.style.minWidth = '220px';
  menu.style.border = '1px solid var(--border)';
  menu.style.background = 'var(--surface)';
  menu.style.color = 'var(--text)';
  menu.style.borderRadius = '12px';
  menu.style.boxShadow = '0 10px 30px rgba(0,0,0,.35)';
  menu.style.zIndex = '61';
  menu.style.display = 'none';
  menu.style.overflow = 'hidden';

  const mk = (label, key, enabled=true) => {
    const it = document.createElement('div');
    it.textContent = label;
    it.dataset.action = key;
    it.style.padding = '10px 12px';
    it.style.cursor = enabled ? 'pointer' : 'default';
    it.style.fontWeight = '700';
    it.style.userSelect = 'none';
    it.style.opacity = enabled ? '1' : '.5';
    it.onmouseenter = ()=>{ if(enabled) it.style.background = 'var(--surface-2)'; };
    it.onmouseleave = ()=>{ it.style.background = 'transparent'; };
    if (enabled) {
      it.onclick = (e)=>{
        e.stopPropagation();
        handleTaskMenuAction(key);
      };
    }
    menu.appendChild(it);
  };

  mk('Kişi ata', 'assign', true);
  mk('Düzenle', 'edit', true);
  mk('Sil', 'delete', true);

  document.body.appendChild(menu);
  taskMenuEl = menu;

  document.addEventListener('click', (e)=>{
    if (menu.style.display !== 'block') return;
    if (menu.contains(e.target)) return;
    if (assigneeMenuEl && assigneeMenuEl.contains(e.target)) return;
    hideTaskMenus();
  });
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') hideTaskMenus();
  });

  return menu;
}
function ensureAssigneeMenu(){
  if (assigneeMenuEl) return assigneeMenuEl;
  const menu = document.createElement('div');
  menu.id = 'assigneeMenu';
  menu.style.position = 'fixed';
  menu.style.minWidth = '260px';
  menu.style.border = '1px solid var(--border)';
  menu.style.background = 'var(--surface)';
  menu.style.color = 'var(--text)';
  menu.style.borderRadius = '12px';
  menu.style.boxShadow = '0 10px 30px rgba(0,0,0,.35)';
  menu.style.zIndex = '62';
  menu.style.display = 'none';
  menu.style.overflow = 'hidden';
  document.body.appendChild(menu);
  assigneeMenuEl = menu;
  return menu;
}
function hideTaskMenus(){
  if (taskMenuEl) taskMenuEl.style.display = 'none';
  if (assigneeMenuEl) assigneeMenuEl.style.display = 'none';
  openTaskId = null;
}
function showTaskMenuForTask(taskId, anchorRect){
  const menu = ensureTaskMenu();
  openTaskId = taskId;
  const top = anchorRect.bottom + 6;
  const left = Math.max(8, Math.min(window.innerWidth - 260, anchorRect.left));
  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
  menu.style.display = 'block';
  if (assigneeMenuEl) assigneeMenuEl.style.display = 'none';
}
function handleTaskMenuAction(key){
  if (!openTaskId) return;
  const idx = TODOS.findIndex(t=>t.id===openTaskId);
  if (idx<0) return;

  if (key === 'assign'){
    const btnRect = taskMenuEl.getBoundingClientRect();
    openAssigneePicker(openTaskId, { top: btnRect.top, left: btnRect.right + 6 });
  } else if (key === 'edit'){
    openTaskDetail(openTaskId);
    hideTaskMenus();
  } else if (key === 'delete'){
    deleteTodo(openTaskId);
    hideTaskMenus();
  }
}

/* === Çoklu kişi atama penceresi === */
function openAssigneePicker(taskId, pos){
  const menu = ensureAssigneeMenu();
  menu.innerHTML = '';

  const tIndex = TODOS.findIndex(t=>t.id===taskId);
  if (tIndex < 0) return;
  const t = TODOS[tIndex];
  const beforeSet = new Set(Array.isArray(t.assignees) ? t.assignees : (t.assignee ? [t.assignee] : []));

  const title = document.createElement('div');
  title.textContent = 'Kişi ata';
  title.style.padding = '10px 12px';
  title.style.fontWeight = '900';
  title.style.borderBottom = '1px solid var(--border)';
  menu.appendChild(title);

  const body = document.createElement('div');
  body.style.maxHeight = '300px';
  body.style.overflow = 'auto';

  Object.entries(USER_DISPLAY).forEach(([u, d])=>{
    const row = document.createElement('label');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '10px';
    row.style.padding = '10px 12px';
    row.style.cursor = 'pointer';
    row.onmouseenter = ()=> row.style.background = 'var(--surface-2)';
    row.onmouseleave = ()=> row.style.background = 'transparent';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = beforeSet.has(u);

    const av = document.createElement('div');
    av.className = 'avatar';
    av.dataset.user = u;
    av.textContent = getInitials(d);
    av.style.width = '20px';
    av.style.height = '20px';
    av.style.borderRadius = '9999px';
    av.style.display = 'inline-flex';
    av.style.alignItems = 'center';
    av.style.justifyContent = 'center';
    av.style.fontSize = '10px';
    av.style.fontWeight = '900';
    av.style.background = 'var(--accent)';
    av.style.color = '#fff';

    const name = document.createElement('div');
    name.textContent = d;
    name.style.fontWeight = '700';

    row.appendChild(cb);
    row.appendChild(av);
    row.appendChild(name);
    body.appendChild(row);
  });
  menu.appendChild(body);

  const foot = document.createElement('div');
  foot.style.display = 'flex';
  foot.style.gap = '8px';
  foot.style.justifyContent = 'space-between';
  foot.style.borderTop = '1px solid var(--border)';
  foot.style.padding = '10px 12px';

  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn';
  clearBtn.textContent = 'Seçimi Temizle';
  clearBtn.onclick = ()=>{
    body.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false);
  };

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn primary';
  saveBtn.textContent = 'Kaydet';
  saveBtn.onclick = ()=>{
    const picked = Array.from(body.querySelectorAll('input[type=checkbox]'))
      .map((cb,i)=>{
        if (!cb.checked) return null;
        const label = cb.parentElement;
        const name = label?.querySelector('div:last-child')?.textContent || '';
        const entry = Object.entries(USER_DISPLAY).find(([,d])=>d===name);
        return entry ? entry[0] : null;
      })
      .filter(Boolean);

    const afterSet = new Set(picked);
    TODOS[tIndex].assignees = Array.from(afterSet);
    TODOS[tIndex].assignee = TODOS[tIndex].assignees[0] || null;
    saveTodos();
    renderTodos();
    hideTaskMenus();

    // Bildirim: atama güncellendi
    const added = Array.from(afterSet).filter(u=>!beforeSet.has(u));
    if (added.length){
      addInboxNotification(added, {
        taskId: TODOS[tIndex].id,
        taskTitle: TODOS[tIndex].text,
        from: currentUser()?.displayName || 'Sistem',
        text: 'Size bir görev atandı.',
        type: 'assign',
        time: new Date().toISOString()
      });
    }
    if (afterSet.size){
      addInboxNotification(Array.from(afterSet), {
        taskId: TODOS[tIndex].id,
        taskTitle: TODOS[tIndex].text,
        from: currentUser()?.displayName || 'Sistem',
        text: 'Görev atamaları güncellendi.',
        type: 'change',
        time: new Date().toISOString()
      });
    }
  };

  foot.appendChild(clearBtn);
  foot.appendChild(saveBtn);
  menu.appendChild(foot);

  const top = Math.max(8, Math.min(window.innerHeight - 340, pos.top));
  const left = Math.max(8, Math.min(window.innerWidth - 300, pos.left));
  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
  menu.style.display = 'block';

  // Avatar renklendirme
  colorize(menu);
}

/* === Avatar yığını (sağ alt) — çoklu === */
function assigneesInlineHTML(t){
  const users = Array.isArray(t.assignees) ? t.assignees : (t.assignee ? [t.assignee] : []);
  if (!users.length) return '';
  const items = users.slice(0,4).map((u,idx)=>{
    const dn = USER_DISPLAY[u] || u;
    const ini = getInitials(dn);
    return `
      <div class="avatar u-auto" data-user="${u}" title="${escapeHtml(dn)}" style="
        width:20px;height:20px;border-radius:9999px;
        display:inline-flex;align-items:center;justify-content:center;
        font-size:10px;font-weight:900;background:var(--accent);color:#fff;
        border:2px solid var(--card-bg);
        margin-left:${idx ? '-6px' : '0'};
        box-shadow:0 1px 2px rgba(0,0,0,.25);
      ">${ini}</div>`;
  }).join('');
  return `
    <div style="position:absolute; right:6px; bottom:6px; display:flex; align-items:center;">
      ${items}
      ${users.length>4 ? `<div style="margin-left:-6px;width:20px;height:20px;border-radius:9999px;background:var(--surface-2);border:2px solid var(--card-bg);display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;opacity:.8">+${users.length-4}</div>`:''}
    </div>`;
}
function assigneeInlineHTML(t){ return assigneesInlineHTML(t); }

/* === Öncelik rozeti (küçük ve başlık ÜSTÜNDE gösterilecek) === */
function priorityChipHTML(t){
  const v = t.priority || '';
  if (!v) return '';
  const map = {
    high: { color: '#ff3b30', text: 'Yüksek Öncelikli' },
    medium: { color: '#fbd75b', text: 'Orta Öncelikli' },
    low: { color: '#0a84ff', text: 'Düşük Öncelikli' }
  };
  const m = map[v]; if (!m) return '';
  return `
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
      <span style="display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border);
        background:var(--surface-2);border-radius:10px;padding:1px 6px;font-size:.70rem;font-weight:800;">
        <span style="width:10px;height:10px;border-radius:3px;background:${m.color};display:inline-block"></span>
        <span>${m.text}</span>
      </span>
    </div>`;
}

/* === Görev Detay MODALI ve Chat === */
let taskDetailModalEl = null;
let taskDetailOpenId = null;
function ensureTaskDetailModal(){
  if (taskDetailModalEl) return taskDetailModalEl;
  const m = document.createElement('div');
  m.id = 'taskDetailModal';
  m.className = 'modal';
  m.style.display = 'none';
  m.innerHTML = `
    <div class="card" style="width:min(720px,96vw);">
      <div class="card-head"><div>Görev Detayı</div><button class="btn" id="taskDetailClose">Kapat</button></div>
      <div class="card-body">
        <div class="row"><label>Başlık</label><input id="tdTitle" class="input"/></div>
        <div class="row"><label>Aşama</label>
          <select id="tdStage" class="input">
            <option value="inbox">Gelen Kutusu</option>
            <option value="todo">Yapılacak</option>
            <option value="doing">Anlık Yapılan</option>
            <option value="done">Tamamlanan</option>
            <option value="draft">Taslak</option>
          </select>
        </div>
        <div class="row"><label>Son Tarih</label><input id="tdDue" type="date" class="input"/></div>
        <div class="row"><label>Kişi</label><select id="tdAssignee" class="input"></select></div>

        <div class="row"><label>Öncelik</label>
          <div id="tdPriority" style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" class="btn" data-prio="high"
              style="height:28px;border-radius:10px;background:var(--surface-2);border:1px solid var(--border);display:inline-flex;align-items:center;gap:8px;">
              <span style="width:12px;height:12px;background:#ff3b30;border-radius:3px;display:inline-block;"></span>
              <span style="font-weight:800;">Yüksek Öncelikli</span>
            </button>
            <button type="button" class="btn" data-prio="medium"
              style="height:28px;border-radius:10px;background:var(--surface-2);border:1px solid var(--border);display:inline-flex;align-items:center;gap:8px;">
              <span style="width:12px;height:12px;background:#fbd75b;border-radius:3px;display:inline-block;"></span>
              <span style="font-weight:800;">Orta Öncelikli</span>
            </button>
            <button type="button" class="btn" data-prio="low"
              style="height:28px;border-radius:10px;background:var(--surface-2);border:1px solid var(--border);display:inline-flex;align-items:center;gap:8px;">
              <span style="width:12px;height:12px;background:#0a84ff;border-radius:3px;display:inline-block;"></span>
              <span style="font-weight:800;">Düşük Öncelikli</span>
            </button>
            <button type="button" class="btn" data-prio=""
              style="height:28px;border-radius:10px;background:transparent;border:1px solid var(--border);">Temizle</button>
          </div>
        </div>

        <div class="row"><label>Notlar</label><textarea id="tdNotes" class="input" style="height:140px; padding:10px;" placeholder="Detaylar, linkler, maddeler..."></textarea></div>
        <div class="row"><label>Oluşturma</label><div id="tdCreated" class="muted"></div></div>
        <div class="row"><label>Tamamlandı</label><div id="tdCompleted" class="muted"></div></div>

        <div style="font-weight:800;opacity:.9;margin-top:6px;">Mesajlar</div>
        <div id="tdChatList" style="display:grid;gap:6px;max-height:240px;overflow:auto;padding:6px 0;"></div>
        <div style="display:flex;gap:8px;align-items:flex-end;position:relative;">
          <div id="tdChatInput" contenteditable="true" data-ph="Mesaj yaz... (@ ile birini etiketle)"
               class="input" style="min-height:38px;padding:8px 10px;overflow:auto;"></div>
          <button class="btn primary" id="tdChatSend">Gönder</button>
          <div id="tdMentionBox" class="hidden" style="
            position:absolute;left:0;bottom:48px;z-index:5;min-width:240px;
            border:1px solid var(--border);background:var(--surface);border-radius:10px;
            box-shadow:0 10px 20px rgba(0,0,0,.3);overflow:auto;max-height:200px;display:none;">
          </div>
        </div>
      </div>
      <div class="card-foot">
        <button class="btn" id="tdDelete">Sil</button>
        <div style="flex:1"></div>
        <button class="btn" id="tdCancel">İptal</button>
        <button class="btn primary" id="tdSave">Kaydet</button>
      </div>
    </div>`;
  document.body.appendChild(m);

  m.querySelector('#taskDetailClose').onclick = ()=> m.style.display='none';
  m.querySelector('#tdCancel').onclick = ()=> m.style.display='none';
  m.querySelector('#tdSave').onclick = saveTaskDetail;
  m.querySelector('#tdDelete').onclick = deleteTaskFromDetail;

  taskDetailModalEl = m;
  return m;
}
function openTaskDetail(id){
  const t = TODOS.find(x=>x.id===id); if (!t) return;
  taskDetailOpenId = id;
  const m = ensureTaskDetailModal();
  m.style.display = 'grid';

  document.getElementById('tdTitle').value = t.text || '';
  document.getElementById('tdStage').value = t.stage || 'todo';
  document.getElementById('tdDue').value = t.dueAt ? new Date(t.dueAt).toISOString().slice(0,10) : '';
  fillUserSelect(document.getElementById('tdAssignee'), (Array.isArray(t.assignees) && t.assignees[0]) ? t.assignees[0] : (t.assignee || ''));
  document.getElementById('tdNotes').value = t.notes || '';
  document.getElementById('tdCreated').textContent = t.createdAt ? new Date(t.createdAt).toLocaleString('tr-TR') : '—';
  document.getElementById('tdCompleted').textContent = t.completedAt ? new Date(t.completedAt).toLocaleString('tr-TR') : '—';

  // Öncelik UI
  setPriorityUI(t.priority || null);
  const pr = document.getElementById('tdPriority');
  pr.querySelectorAll('[data-prio]').forEach(btn=>{
    btn.onclick = ()=> { setPriorityUI(btn.dataset.prio || null); };
  });

  // Chat
  renderTaskChat(id);
  setupChatHandlers(id);
}
function setPriorityUI(value){
  const wrap = document.getElementById('tdPriority'); if (!wrap) return;
  wrap.dataset.value = value || '';
  wrap.querySelectorAll('[data-prio]').forEach(b=>{
    b.style.borderColor = (b.dataset.prio === (value||'')) ? 'var(--accent)' : 'var(--border)';
  });
}
function getPriorityFromUI(){
  const wrap = document.getElementById('tdPriority'); if (!wrap) return null;
  const v = wrap.dataset.value || '';
  return v || null;
}
function saveTaskDetail(){
  const id = taskDetailOpenId; if (!id) return;
  const i = TODOS.findIndex(t=>t.id===id); if (i<0) return;
  const t = TODOS[i];

  // eski değerleri not al
  const before = {
    text: t.text, stage: t.stage, dueAt: t.dueAt, notes: t.notes, priority: t.priority,
    assignees: Array.isArray(t.assignees) ? [...t.assignees] : (t.assignee ? [t.assignee] : [])
  };

  t.text = (document.getElementById('tdTitle').value||'').trim() || t.text;
  const newStage = document.getElementById('tdStage').value || t.stage;
  t.stage = newStage;
  const dueVal = document.getElementById('tdDue').value || '';
  t.dueAt = dueVal ? new Date(dueVal+'T12:00:00').toISOString() : null;
  const asg = document.getElementById('tdAssignee').value || '';

  if (!Array.isArray(t.assignees)) t.assignees = [];
  if (asg) {
    if (!t.assignees.includes(asg)) t.assignees.push(asg);
  }
  t.assignee = t.assignees[0] || null;

  t.notes = document.getElementById('tdNotes').value || '';
  t.priority = getPriorityFromUI();

  if (newStage === 'done') {
    t.done = true;
    if (!t.completedAt) t.completedAt = new Date().toISOString();
  } else {
    t.done = false;
    t.completedAt = null;
  }

  saveTodos();
  renderTodos();
  ensureTaskDetailModal().style.display = 'none';

  // değişim özeti & bildirim
  const changes = [];
  if (before.text !== t.text) changes.push('Başlık güncellendi');
  if (before.stage !== t.stage) changes.push('Aşama değişti');
  if ((before.dueAt||'') !== (t.dueAt||'')) changes.push('Son tarih güncellendi');
  if ((before.priority||'') !== (t.priority||'')) changes.push('Öncelik güncellendi');
  if ((before.notes||'') !== (t.notes||'')) changes.push('Notlar güncellendi');

  const beforeSet = new Set(before.assignees||[]);
  const afterSet  = new Set(t.assignees||[]);
  if (JSON.stringify([...beforeSet].sort()) !== JSON.stringify([...afterSet].sort())){
    changes.push('Atamalar güncellendi');
  }

  if (changes.length && afterSet.size){
    notifyAssigneesOfChange(t, changes.join(', '));
  }
}
function deleteTaskFromDetail(){
  const id = taskDetailOpenId; if (!id) return;
  if (!confirm('Bu görevi silmek istiyor musun?')) return;
  const t = TODOS.find(x=>x.id===id);
  const assignees = Array.isArray(t?.assignees) ? t.assignees : [];
  TODOS = TODOS.filter(t=>t.id!==id);
  saveTodos();
  renderTodos();
  ensureTaskDetailModal().style.display = 'none';

  if (assignees.length){
    addInboxNotification(assignees, {
      taskId: id,
      taskTitle: t?.text || 'Görev',
      from: currentUser()?.displayName || 'Sistem',
      text: 'Görev silindi.',
      type: 'change',
      time: new Date().toISOString()
    });
  }
}

/* === Chat === */
function renderTaskChat(id){
  const t = TODOS.find(x=>x.id===id); if (!t) return;
  const list = document.getElementById('tdChatList'); if (!list) return;
  list.innerHTML = '';
  (t.messages || []).forEach(msg=>{
    const row = document.createElement('div');
    row.className = 'chat-msg';
    row.style.border = '1px solid var(--border)';
    row.style.borderRadius = '10px';
    row.style.background = 'var(--surface-2)';
    const author = USER_DISPLAY[msg.user] || msg.user;
    const time = new Date(msg.time).toLocaleString('tr-TR');
    row.innerHTML = `
      <div><span class="chat-author" style="font-weight:800">${escapeHtml(author)}</span>
      <span class="chat-time" style="color:var(--muted);font-size:.85em">${time}</span></div>
      <div class="chat-text" style="white-space:pre-wrap">${highlightMentionsHTML(msg.text)}</div>
    `;
    list.appendChild(row);
  });
  list.scrollTop = list.scrollHeight;
}
function setupChatHandlers(id){
  const inp = document.getElementById('tdChatInput');
  const send = document.getElementById('tdChatSend');
  const box = document.getElementById('tdMentionBox');

  const hideBox = ()=>{ box.style.display='none'; box.innerHTML=''; };
  const showBox = (items)=>{
    box.innerHTML='';
    items.forEach(([u,d])=>{
      const it = document.createElement('div');
      it.className = 'mention-item';
      it.style.padding='8px 10px';
      it.style.cursor='pointer';
      it.style.display='flex';
      it.style.gap='8px';
      it.style.alignItems='center';
      it.onmouseenter = ()=> it.style.background = 'var(--surface-2)';
      it.onmouseleave = ()=> it.style.background = 'transparent';
      const b = document.createElement('div');
      b.className = 'avatar';
      b.dataset.user = u;
      b.textContent = getInitials(d);
      b.style.width='18px'; b.style.height='18px'; b.style.borderRadius='9999px';
      b.style.display='inline-flex'; b.style.alignItems='center'; b.style.justifyContent='center';
      b.style.fontSize='10px'; b.style.fontWeight='900';
      b.style.background='var(--accent)'; b.style.color='#fff';
      const nm = document.createElement('div'); nm.textContent = d; nm.style.fontWeight='700';
      it.appendChild(b); it.appendChild(nm);
      it.onclick = ()=>{
        const plain = inp.innerText;
        const replaced = plain.replace(/@([^\s]{0,20})$/,'@'+d+' ');
        inp.innerText = replaced;
        placeCaretAtEnd(inp);
        hideBox();
      };
      box.appendChild(it);
    });
    box.style.display = items.length ? 'block' : 'none';
    colorize(box);
  };

  const handleMention = ()=>{
    const text = inp.innerText;
    const tail = text.slice(-24);
    const m = tail.match(/@([^\s@]{0,20})$/);
    if (!m){ hideBox(); return; }
    const q = (m[1]||'').toLocaleLowerCase('tr-TR');
    const items = Object.entries(USER_DISPLAY)
      .filter(([u,d])=>{
        const dl = d.toLocaleLowerCase('tr-TR');
        return dl.includes(q) || u.includes(q);
      })
      .slice(0,8);
    showBox(items);
  };

  inp.addEventListener('keyup', handleMention);
  inp.addEventListener('input', handleMention);
  inp.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' && !e.shiftKey){
      e.preventDefault();
      send.click();
    } else if (e.key === 'Escape'){
      hideBox();
    }
  });

  send.onclick = ()=>{
    const t = TODOS.find(x=>x.id===id); if (!t) return;
    const text = (inp.innerText || '').trim();
    if (!text) return;
    const me = currentUser(); if (!me) { alert('Oturum gerekli.'); return; }
    const mentions = parseMentionsFromText(text);
    const msg = {
      id: 'm_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
      user: me.username, text, time: new Date().toISOString(), mentions
    };
    t.messages = Array.isArray(t.messages) ? t.messages : [];
    t.messages.push(msg);
    saveTodos();
    renderTaskChat(id);
    inp.innerText = '';

    // OS mention bildirimi ve GELEN KUTUSU
    pushMentionNotifications(mentions, t, text);
    // Assignee'lere chat bildirimi
    pushChatToAssignees(t, me.displayName, text);
  };

  document.addEventListener('click',(e)=>{
    if (!box.contains(e.target) && e.target!==inp) box.style.display='none';
  }, { once:false });
}
function parseMentionsFromText(text){
  const out = [];
  const low = text.toLocaleLowerCase('tr-TR');
  Object.entries(USER_DISPLAY).forEach(([u,d])=>{
    const dl = d.toLocaleLowerCase('tr-TR');
    if (low.includes('@'+dl) || low.includes('@'+u)) out.push(u);
  });
  return Array.from(new Set(out));
}
function highlightMentionsHTML(text){
  let html = escapeHtml(text);
  Object.entries(USER_DISPLAY).forEach(([u,d])=>{
    const name = d.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const re = new RegExp('@'+name,'g');
    html = html.replace(re, `<span style="background:#0a84ff22;border-radius:4px;padding:0 4px;">@${escapeHtml(d)}</span>`);
  });
  return html;
}
function pushMentionNotifications(usernames, task, preview){
  const me = currentUser(); if (!me) return;
  usernames.forEach(u=>{
    if (u === me.username) return;
    const key = 'notif:'+u;
    let arr=[]; try { arr = JSON.parse(localStorage.getItem(key)||'[]'); } catch {}
    arr.push({ from: me.displayName, taskId: task.id, text: preview, time: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(arr));
    // Gelen kutusuna da yaz
    addInboxNotification(u, {
      taskId: task.id,
      taskTitle: task.text,
      from: me.displayName,
      text: 'Mesajda sizi etiketledi: '+preview,
      type: 'chat',
      time: new Date().toISOString()
    });
  });
  if ('Notification' in window && Notification.permission !== 'denied'){
    Notification.requestPermission().then(perm=>{ if (perm==='granted'){ try{ new Notification('Mesaj gönderildi'); }catch{} }});
  }
}
function pushChatToAssignees(task, fromDisplayName, preview){
  const me = currentUser();
  const assignees = Array.isArray(task.assignees) ? task.assignees : [];
  const targets = assignees.filter(u => u !== me?.username);
  if (!targets.length) return;
  addInboxNotification(targets, {
    taskId: task.id,
    taskTitle: task.text,
    from: fromDisplayName || 'Sistem',
    text: 'Yeni mesaj: ' + preview,
    type: 'chat',
    time: new Date().toISOString()
  });
}
function notifyAssigneesOfChange(task, changeSummary){
  const assignees = Array.isArray(task.assignees) ? task.assignees : [];
  if (!assignees.length) return;
  addInboxNotification(assignees, {
    taskId: task.id,
    taskTitle: task.text,
    from: currentUser()?.displayName || 'Sistem',
    text: 'Görev güncellendi — ' + changeSummary,
    type: 'change',
    time: new Date().toISOString()
  });
}
function placeCaretAtEnd(el){
  el.focus();
  if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

/* -------- Bildirim Listesi (Gelen Kutusu) -------- */
function renderNotifications(){
  const ul = document.getElementById('inboxList');
  if (!ul) return;
  ul.innerHTML = '';

  const me = currentUser();
  if (!me){
    const li = document.createElement('li');
    li.className='todo-item';
    li.innerHTML = `<div class="muted">Gelen kutusunu görmek için oturum aç.</div>`;
    ul.appendChild(li);
    return;
  }

  const list = readInbox(me.username).sort((a,b)=> new Date(b.time) - new Date(a.time));

  if (!list.length){
    const li = document.createElement('li');
    li.className='todo-item';
    li.innerHTML = `<div class="muted">Bildirim yok.</div>`;
    ul.appendChild(li);
    return;
  }

  list.forEach(n=>{
    const fromIni = getInitials(n.from || 'Sistem');
    const timeTxt = n.time ? new Date(n.time).toLocaleString('tr-TR') : '';
    const li = document.createElement('li');
    li.className='todo-item';
    li.style.cursor='pointer';
    li.innerHTML = `
      <div style="display:flex;gap:10px;align-items:flex-start;">
        <div class="avatar" data-user="${(n.from||'Sistem')}" style="width:20px;height:20px;border-radius:9999px;background:var(--accent);color:#fff;font-weight:900;font-size:10px;display:inline-flex;align-items:center;justify-content:center;flex:none;">${fromIni}</div>
        <div style="display:grid;gap:2px;">
          <div style="font-weight:800;">${escapeHtml(n.from || 'Sistem')}</div>
          <div class="muted" style="font-size:.85em">${escapeHtml(n.text || '')}</div>
          <div class="muted" style="font-size:.80em">Görev: ${escapeHtml(n.taskTitle || '')}</div>
          <div class="muted" style="font-size:.75em">${timeTxt}</div>
        </div>
      </div>
    `;
    li.onclick = ()=>{
      if (n.taskId) openTaskDetail(n.taskId);
    };
    ul.appendChild(li);
  });

  // Avatarları renklendir
  colorize(ul);
}

/* -------- Listeler (inbox artık bildirim), todo/doing/done/draft -------- */
function renderTodos(){
  // GELEN KUTUSU — bildirimleri getir
  renderNotifications();

  // TODO
  const ul = document.getElementById('todoList'); if (!ul) return;
  ul.innerHTML = '';

  const list = TODOS
    .filter(t => (t.stage || (t.done ? 'done' : 'todo')) === 'todo')
    .sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

  if (list.length === 0){
    const li = document.createElement('li');
    li.className='todo-item';
    li.innerHTML = `<div class="muted">Görev yok.</div>`;
    ul.appendChild(li);
  } else {
    list.forEach(t=>{
      const li = document.createElement('li');
      li.className='todo-item';
      li.setAttribute('draggable','true');
      li.style.position = 'relative';
      li.addEventListener('dragstart',(e)=> e.dataTransfer.setData('text/todo-id', t.id));

      const createdTxt = new Date(t.createdAt).toLocaleDateString('tr-TR');
      const dueTxt = t.dueAt ? new Date(t.dueAt).toLocaleDateString('tr-TR') : '—';

      li.innerHTML = `
        <div style="flex:1; padding-right:56px;">
          ${priorityChipHTML(t)}
          <div style="font-weight:800;">${escapeHtml(t.text)}</div>
          <div class="muted" style="font-size:.85em;">Oluşturma: ${createdTxt} • Son Tarih: ${dueTxt}</div>
        </div>
        ${assigneesInlineHTML(t)}
      `;

      li.addEventListener('click', ()=> openTaskDetail(t.id));
      li.addEventListener('contextmenu',(e)=>{
        e.preventDefault(); e.stopPropagation();
        const r = li.getBoundingClientRect();
        showTaskMenuForTask(t.id, r);
      });

      ul.appendChild(li);
    });
  }

  renderDoingList();
  renderDoneList();
  renderDraftList();

  // Avatarları renklendir
  colorize(document.getElementById('home'));
}

function renderDoingList(){
  const ul = document.getElementById('doingList'); if (!ul) return;
  ul.innerHTML = '';

  const list = TODOS.filter(t=> (t.stage || 'todo') === 'doing')
    .sort((a,b)=> new Date(a.dueAt||a.createdAt) - new Date(b.dueAt||b.createdAt));

  if (list.length === 0){
    const li = document.createElement('li');
    li.className='todo-item';
    li.innerHTML = `<div style="flex:1;"><div class="muted">Şu an için görev yok.</div></div>`;
    ul.appendChild(li);
    return;
  }

  list.forEach(t=>{
    const dueTxt = t.dueAt ? new Date(t.dueAt).toLocaleDateString('tr-TR') : '—';
    const li = document.createElement('li');
    li.className='todo-item';
    li.setAttribute('draggable','true');
    li.style.position='relative';
    li.addEventListener('dragstart',(e)=> e.dataTransfer.setData('text/todo-id', t.id));
    li.innerHTML = `
      <div style="flex:1; padding-right:56px;">
        ${priorityChipHTML(t)}
        <div style="font-weight:800;">${escapeHtml(t.text)}</div>
        <div class="muted" style="font-size:.85em;">Son Tarih: ${dueTxt}</div>
      </div>
      ${assigneesInlineHTML(t)}
    `;
    li.addEventListener('click', ()=> openTaskDetail(t.id));
    li.addEventListener('contextmenu',(e)=>{ e.preventDefault(); e.stopPropagation(); const r = li.getBoundingClientRect(); showTaskMenuForTask(t.id, r); });
    ul.appendChild(li);
  });
}

function renderDoneList(){
  const ul = document.getElementById('doneList'); if (!ul) return;
  ul.innerHTML = '';

  const list = TODOS.filter(t=> (t.stage || (t.done?'done':'todo')) === 'done')
    .sort((a,b)=> new Date(b.completedAt || 0) - new Date(a.completedAt || 0))
    .slice(0,50);

  if (list.length === 0){
    const li = document.createElement('li');
    li.className='todo-item';
    li.innerHTML = `<div class="muted">Henüz tamamlanan görev yok.</div>`;
    ul.appendChild(li);
    return;
  }

  list.forEach(t=>{
    const compTxt = t.completedAt ? new Date(t.completedAt).toLocaleDateString('tr-TR') : '';
    const li = document.createElement('li');
    li.className='todo-item completed';
    li.setAttribute('draggable','true');
    li.style.position='relative';
    li.addEventListener('dragstart',(e)=> e.dataTransfer.setData('text/todo-id', t.id));
    li.innerHTML = `
      <div style="flex:1; padding-right:56px;">
        ${priorityChipHTML(t)}
        <div style="font-weight:800;">${escapeHtml(t.text)}</div>
        <div class="muted" style="font-size:.85em;">Tamamlandı: ${compTxt}</div>
      </div>
      ${assigneesInlineHTML(t)}
    `;
    li.addEventListener('click', ()=> openTaskDetail(t.id));
    li.addEventListener('contextmenu',(e)=>{ e.preventDefault(); e.stopPropagation(); const r = li.getBoundingClientRect(); showTaskMenuForTask(t.id, r); });
    ul.appendChild(li);
  });
}

function renderDraftList(){
  const ul = document.getElementById('draftList'); if (!ul) return;
  ul.innerHTML = '';

  const list = TODOS.filter(t=> (t.stage || 'todo') === 'draft')
    .sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt));

  if (list.length === 0){
    const li = document.createElement('li');
    li.className='todo-item';
    li.innerHTML = `<div class="muted">Taslak görev yok.</div>`;
    ul.appendChild(li);
    return;
  }

  list.forEach(t=>{
    const li = document.createElement('li');
    li.className='todo-item';
    li.setAttribute('draggable','true');
    li.style.position='relative';
    li.addEventListener('dragstart',(e)=> e.dataTransfer.setData('text/todo-id', t.id));
    li.innerHTML = `
      <div style="flex:1; padding-right:56px;">
        ${priorityChipHTML(t)}
        <div style="font-weight:800;">${escapeHtml(t.text)}</div>
        <div class="muted" style="font-size:.85em;">Oluşturma: ${new Date(t.createdAt).toLocaleDateString('tr-TR')}</div>
      </div>
      ${assigneesInlineHTML(t)}
    `;
    li.addEventListener('click', ()=> openTaskDetail(t.id));
    li.addEventListener('contextmenu',(e)=>{ e.preventDefault(); e.stopPropagation(); const r = li.getBoundingClientRect(); showTaskMenuForTask(t.id, r); });
    ul.appendChild(li);
  });
}

/*********************
 *  BUGÜNKÜ ETKİNLİKLER (kart kaldırıldıysa pasif)
 *********************/
async function refreshHomeToday(){
  const listEl = document.getElementById('todayEvents');
  const statusEl = document.getElementById('todayEventsStatus');
  if (!listEl || !statusEl) return;

  listEl.innerHTML = '';
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0);
  const end   = new Date(start.getTime() + 24*60*60*1000);

  if (!authed) {
    statusEl.textContent = 'Bugünkü etkinlikleri görmek için Google hesabını bağla.';
    return;
  }
  const ids = selectedCalendarIds();
  if (ids.length === 0) { statusEl.textContent = 'Seçili takvim yok.'; return; }

  statusEl.textContent = 'Yükleniyor...';
  try {
    const results = await Promise.allSettled(ids.map(id => fetchEventsFor(id, start.toISOString(), end.toISOString())));
    let events = [];
    for (const r of results) if (r.status === 'fulfilled') events = events.concat(r.value);

    // yinelenenleri ayıkla
    const seen = new Set();
    const uniq = [];
    for (const ev of events) {
      const key = `${ev.title}|${ev.start}|${ev.allDay?'all':'part'}`;
      if (!seen.has(key)) { seen.add(key); uniq.push(ev); }
    }

    uniq.sort((a,b)=> new Date(a.start) - new Date(b.start));

    if (uniq.length === 0) {
      statusEl.textContent = 'Bugün etkinlik yok.';
      return;
    }
    statusEl.textContent = '';
    const fmtTime = (d) => d.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' });

    for (const ev of uniq) {
      const row = document.createElement('div');
      row.className = 'evt-row';
      const color = ev.backgroundColor || '#888';
      let timeTxt = 'Tüm gün';
      if (!ev.allDay) {
        const s = new Date(ev.start);
        const e = ev.end ? new Date(ev.end) : null;
        timeTxt = e ? `${fmtTime(s)} - ${fmtTime(e)}` : fmtTime(s);
      }
      row.innerHTML = `
        <span class="dot" style="background:${color}"></span>
        <div class="evt-time">${timeTxt}</div>
        <div style="flex:1; font-weight:700;">${escapeHtml(ev.title)}</div>
      `;
      listEl.appendChild(row);
    }
  } catch (e) {
    statusEl.textContent = 'Yüklenirken bir sorun oluştu.';
    console.warn(e);
  }
}

/*********************
 *  FİNANS — İç Sekmeler ve Bileşenler
 *********************/
function initFinance(){
  document.querySelectorAll('.fin-tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.fin-tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const paneId = btn.dataset.pane;
      document.querySelectorAll('.fin-pane').forEach(p=>p.classList.add('hidden'));
      document.getElementById(paneId).classList.remove('hidden');
    });
  });

  const recalcGenel = ()=>{
    const sum = (sel)=>Array.from(document.querySelectorAll(`${sel} .fin-money`)).reduce((a,i)=>a+(parseFloat(i.value||0)||0),0);
    const g1 = sum('#tblGelir'); const g2 = sum('#tblGider');
    document.getElementById('totGelir').textContent = g1.toLocaleString('tr-TR');
    document.getElementById('totGider').textContent = g2.toLocaleString('tr-TR');
    document.getElementById('sumGelir').textContent = g1.toLocaleString('tr-TR') + '₺';
    document.getElementById('sumGider').textContent = g2.toLocaleString('tr-TR') + '₺';
    document.getElementById('sumNet').textContent   = (g1-g2).toLocaleString('tr-TR') + '₺';
  };
  document.querySelectorAll('#tblGelir .fin-money, #tblGider .fin-money').forEach(i=>i.addEventListener('input', recalcGenel));
  recalcGenel();

  document.querySelectorAll('#fin-gunluk [data-add]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const card = btn.closest('.fin-card');
      const tbody = card.querySelector('tbody');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="date" class="input"></td>
        <td><input type="number" step="0.01" class="input amt"></td>
        <td><input type="text" class="input" placeholder="Açıklama"></td>
        <td><button class="fin-del">Sil</button></td>`;
      tbody.appendChild(tr);
      tr.querySelector('.amt').addEventListener('input', ()=>recalcTable(card));
      tr.querySelector('.fin-del').addEventListener('click', ()=>{ tr.remove(); recalcTable(card); });
      recalcTable(card);
    });
  });
  function recalcTable(card){
    const sum = Array.from(card.querySelectorAll('.amt')).reduce((a,i)=>a+(parseFloat(i.value||0)||0),0);
    card.querySelector('.sum').textContent = sum.toLocaleString('tr-TR') + '₺';
  }

  document.getElementById('evtAdd').addEventListener('click', ()=>addEventCard());
  addEventCard();
}

function addEventCard(){
  const grid = document.getElementById('evtGrid');
  const wrap = document.createElement('div');
  wrap.className = 'fin-card';
  wrap.innerHTML = `
    <div class="head">
      <input class="input" style="height:30px" placeholder="Etkinlik adı (örn. İstanbul Festival)"/>
      <span class="pill blue" style="font-size:.85rem">Bütçe</span>
    </div>
    <div class="body">
      <div class="fin-grid" style="grid-template-columns:repeat(2,minmax(120px,1fr)); gap:8px;">
        ${['Ekip','Ulaşım','Reklam','Konaklama','Ekstra','Yemek'].map(k=>`
          <div class="row" style="grid-template-columns:1fr 120px;">
            <label>${k}</label><input type="number" step="0.01" class="input evt-amt">
          </div>`).join('')}
      </div>
      <div class="row" style="grid-template-columns:1fr 120px;">
        <label>Toplam Masraf</label><input class="input" id="evtMasraf" disabled>
      </div>
      <div class="fin-grid" style="grid-template-columns:repeat(2,minmax(120px,1fr)); gap:8px;">
        <div class="row" style="grid-template-columns:1fr 120px;"><label>Kaşe</label><input type="number" step="0.01" class="input evt-kase"></div>
        <div class="row" style="grid-template-columns:1fr 120px;"><label>Emre</label><input type="number" step="0.01" class="input evt-emre"></div>
      </div>
      <div class="evt-footer">
        <div style="font-weight:800;">HOZE: <span class="evt-hoze">0</span>₺</div>
        <button class="evt-del">Kartı Sil</button>
      </div>
    </div>`;
  grid.appendChild(wrap);

  const recalc = ()=>{
    const masraf = Array.from(wrap.querySelectorAll('.evt-amt')).reduce((a,i)=>a+(parseFloat(i.value||0)||0),0);
    wrap.querySelector('#evtMasraf').value = masraf.toLocaleString('tr-TR') + '₺';
    const kase = parseFloat(wrap.querySelector('.evt-kase').value||0)||0;
    const emre = parseFloat(wrap.querySelector('.evt-emre').value||0)||0;
    const hoze = kase + emre - masraf;
    wrap.querySelector('.evt-hoze').textContent = hoze.toLocaleString('tr-TR');
  };
  wrap.querySelectorAll('input').forEach(i=>i.addEventListener('input', recalc));
  wrap.querySelector('.evt-del').addEventListener('click', ()=>wrap.remove());
  recalc();
}

/*********************
 *  OZAN BEKTAŞ — Release → TODO eşlemesi
 *********************/
function normalize(str){ return (str||'').toString().normalize('NFKD').toLowerCase('tr').replace(/\s+/g,' ').trim(); }
function parseArtistSong(title){
  const t = (title||'').replace(/release/ig,'').trim();
  const parts = t.split(/\s+/);
  if (parts.length <= 2) return { artist: t, song: '' };
  const song = parts.slice(-2).join(' ');
  const artist = parts.slice(0, -2).join(' ');
  return { artist: artist.trim(), song: song.trim() };
}
function ensureReleaseTodosFor(title, dateISO){
  const { artist, song } = parseArtistSong(title);
  const createdAt = new Date().toISOString();
  const addIfMissing = (text, due) => {
    const key = normalize(text);
    if (TODOS.some(t=>normalize(t.text)===key)) return;
    TODOS.push({
      id: 't_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
      text, done:false, createdAt, dueAt: due ? new Date(due).toISOString() : null,
      monthKey: monthKeyFromDate(createdAt), completedAt: null, stage: 'todo',
      assignees: [], assignee: null, notes: '', priority: null, messages: []
    });
  };
  const rel = new Date(dateISO);
  const d1 = prevWeekday(rel, 3, 7); addIfMissing(`${artist ? artist + ' ' : ''}${song ? `'${song}' ` : ''}- Single Kapağı`.trim(), d1);
  const d2 = prevWeekday(rel, 3, 0); addIfMissing(`${artist ? artist + ' ' : ''}${song ? `'${song}' ` : ''}- Lyric, Audio ve Canvas`.trim(), d2);
  const d3 = prevWeekday(rel, 1, 0); addIfMissing(`${artist ? artist + ' ' : ''}${song ? `'${song}' ` : ''}- Klip Son Teslim`.trim(), d3);
}
function prevWeekday(date, targetDow, minusWeeks){
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - (minusWeeks||0)*7);
  const diff = ( ( (d.getDay() + 7) - targetDow ) % 7 ) || 7;
  d.setDate(d.getDate() - diff);
  d.setHours(12,0,0,0);
  return d;
}
function syncReleaseTodosFromEvents(allEvents){
  try { loadTodos(); } catch {}
  const targetCalIds = new Set(
    calendars.filter(c=>normalize(c.summary)==='ozan bektaş').map(c=>c.id)
  );
  if (!targetCalIds.size) return;

  allEvents.forEach(ev=>{
    const calId = ev.extendedProps?.calendarId;
    if (!targetCalIds.has(calId)) return;
    if (!/release/i.test(ev.title||'')) return;
    const startISO = ev.start;
    const d = new Date(startISO);
    ensureReleaseTodosFor(ev.title, d);
  });

  saveTodos();
  renderTodos();
}

/*********************
 *  GİRİŞTE YÜKLEMELER
 *********************/
function initHome(){
  ensureHomeSections();
  loadTodos();
  renderTodos();
}
