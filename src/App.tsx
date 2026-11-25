import { useEffect, useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import {
  ChevronDown, Globe2, LogIn, LogOut, Menu, Search, Shield, ShieldCheck,
  Upload, X, Bell, Bookmark, Heart, ShoppingCart, Sun, Moon, Eye, EyeOff,
  Settings, Download, Trash2, Send, AlertTriangle, Check, XCircle, Crown,
  MessageSquare, ExternalLink, Home, Filter, Tag, Image as ImageIcon, Video,
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getIcon } from '@/icons';
import { DiscordIcon } from '@/components/DiscordIcon';
import type { AuthMode, Role, Route, Profile, Mod, Community, Comment, Notification, LeaderboardEntry, CartItem } from '@/types';
import {
  CATEGORIES, SPECIAL_CATEGORIES, SUBCATEGORIES, DISCORD_INVITE_URL, OWNER_EMAIL,
  MAX_FILE_GB, COUNTRIES, SOCIAL_FIELDS, FOOTER_LINKS,
} from '@/constants';

const languages = ['English', 'Español', 'Deutsch', 'Français', 'Italiano', 'Português', '日本語', '中文', 'العربية'];

const translations: Record<string, { discord: string; upload: string; login: string; welcome: string; prompt: string }> = {
  English: { discord: 'Grand Five Mods on Discord', upload: 'Upload', login: 'LOG IN / REGISTER', welcome: 'Welcome to Grand Five Mods', prompt: 'Pick a category below to start browsing GTA 5 PC mods:' },
  Español: { discord: 'Grand Five Mods en Discord', upload: 'Subir', login: 'INICIAR SESIÓN / REGISTRARSE', welcome: 'Bienvenido a Grand Five Mods', prompt: 'Elige una categoría para explorar mods de GTA 5:' },
  Deutsch: { discord: 'Grand Five Mods auf Discord', upload: 'Hochladen', login: 'ANMELDEN / REGISTRIEREN', welcome: 'Willkommen bei Grand Five Mods', prompt: 'Wähle eine Kategorie für GTA 5 PC-Mods:' },
  Français: { discord: 'Grand Five Mods sur Discord', upload: 'Importer', login: 'CONNEXION / INSCRIPTION', welcome: 'Bienvenue sur Grand Five Mods', prompt: 'Choisissez une catégorie pour parcourir les mods GTA 5:' },
  日本語: { discord: 'DiscordでGrand Five Mods', upload: 'アップロード', login: 'ログイン / 登録', welcome: 'Grand Five Modsへようこそ', prompt: 'カテゴリーを選んでGTA 5 PCのModを探しましょう:' },
  中文: { discord: 'Grand Five Mods Discord', upload: '上传', login: '登录 / 注册', welcome: '欢迎来到 Grand Five Mods', prompt: '选择分类，开始浏览 GTA 5 PC 模组:' },
  العربية: { discord: 'جراند فايف مودز على ديسكورد', upload: 'رفع', login: 'تسجيل الدخول / التسجيل', welcome: 'مرحباً بك في جراند فايف مودز', prompt: 'اختر تصنيفاً لتصفح تعديلات GTA 5:' },
};

function parseHash(): Route {
  const hash = window.location.hash.slice(1);
  if (!hash || hash === 'top' || hash === 'home') return { name: 'home' };
  const parts = hash.split('/');
  if (parts[0] === 'category' && parts[1]) {
    return { name: 'category', category: parts[1], subcategory: parts[2] };
  }
  if (parts[0] === 'communities') return { name: 'communities' };
  if (parts[0] === 'mod' && parts[1]) return { name: 'mod', id: parts[1] };
  if (parts[0] === 'profile' && parts[1]) return { name: 'profile', userId: parts[1] };
  if (parts[0] === 'leaderboard') return { name: 'leaderboard' };
  if (parts[0] === 'pending') return { name: 'pending' };
  if (parts[0] === 'my-uploads') return { name: 'my-uploads' };
  if (parts[0] === 'my-bookmarks') return { name: 'my-bookmarks' };
  if (parts[0] === 'my-likes') return { name: 'my-likes' };
  if (parts[0] === 'my-follows') return { name: 'my-follows' };
  if (parts[0] === 'account-settings') return { name: 'account-settings' };
  return { name: 'home' };
}

export function navigate(route: Route) {
  let hash = '';
  switch (route.name) {
    case 'home': hash = ''; break;
    case 'category': hash = `category/${route.category}${route.subcategory ? '/' + route.subcategory : ''}`; break;
    case 'communities': hash = 'communities'; break;
    case 'mod': hash = `mod/${route.id}`; break;
    case 'profile': hash = `profile/${route.userId}`; break;
    case 'leaderboard': hash = 'leaderboard'; break;
    case 'pending': hash = 'pending'; break;
    case 'my-uploads': hash = 'my-uploads'; break;
    case 'my-bookmarks': hash = 'my-bookmarks'; break;
    case 'my-likes': hash = 'my-likes'; break;
    case 'my-follows': hash = 'my-follows'; break;
    case 'account-settings': hash = 'account-settings'; break;
  }
  window.location.hash = hash;
  window.scrollTo(0, 0);
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [language, setLanguage] = useState('English');
  const [languageOpen, setLanguageOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [route, setRoute] = useState<Route>(parseHash());
  const [cartCount, setCartCount] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const copy = translations[language] ?? translations.English;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setCartCount(0);
        setUnreadNotifs(0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const loadProfile = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('profiles')
      .select('id,email,display_name,role,is_banned,avatar_url,location,country,socials,profile_picture_type,show_adult_content,dark_mode,strikes')
      .eq('id', session.user.id)
      .maybeSingle();
    setProfile(data as Profile | null);
  }, [session]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!session) return;
    supabase.from('cart_items').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id)
      .then(({ count }) => setCartCount(count ?? 0));
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('is_read', false)
      .then(({ count }) => setUnreadNotifs(count ?? 0));
  }, [session, route, cartOpen]);

  const openUpload = () => {
    if (!session) { setAuthMode('login'); return; }
    setAccountOpen(false);
    setProfileMenuOpen(false);
    setUploadOpen(true);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAccountOpen(false);
    setProfileMenuOpen(false);
    navigate({ name: 'home' });
  };

  const selectCategory = (key: string) => {
    navigate({ name: 'category', category: key });
    setMenuOpen(false);
  };

  const goHome = () => { navigate({ name: 'home' }); setMenuOpen(false); };

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <button className="mobile-menu" onClick={() => setMenuOpen((o) => !o)} aria-label="Open navigation"><Menu size={20} /></button>
          <button className="site-logo" onClick={goHome} aria-label="Grand Five Mods"><img src="/image copy.png" alt="Grand Five Mods" /></button>
          <nav className={menuOpen ? 'site-nav is-open' : 'site-nav'}>
            <a className="discord-link" href={DISCORD_INVITE_URL} target="_blank" rel="noreferrer"><DiscordIcon size={15} /> {copy.discord}</a>
            <div className="language-control">
              <button className="language-link" onClick={() => setLanguageOpen((o) => !o)}><Globe2 size={16} /> {language} <ChevronDown size={14} /></button>
              {languageOpen && <div className="language-list">{languages.map((item) => <button key={item} onClick={() => { setLanguage(item); setLanguageOpen(false); }}>{item}</button>)}</div>}
            </div>
          </nav>
          <div className="header-actions">
            <button className="header-upload" onClick={openUpload}><Upload size={16} /> {copy.upload}</button>
            {session ? (
              <div style={{ position: 'relative' }}>
                <button className="header-login" onClick={() => setProfileMenuOpen((o) => !o)}>
                  <div className="profile-avatar" style={{ width: 24, height: 24, fontSize: 11 }}>
                    {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : (profile?.display_name?.slice(0, 1).toUpperCase() ?? 'G')}
                  </div>
                  {profile?.display_name ?? 'Account'}
                  <ChevronDown size={14} />
                </button>
                {profileMenuOpen && (
                  <ProfileDropdown
                    profile={profile}
                    session={session}
                    cartCount={cartCount}
                    onClose={() => setProfileMenuOpen(false)}
                    onUpload={openUpload}
                    onSettings={() => { setProfileMenuOpen(false); setSettingsOpen(true); }}
                    onStaff={() => { setProfileMenuOpen(false); setStaffOpen(true); }}
                    onSignOut={signOut}
                    onCart={() => { setProfileMenuOpen(false); setCartOpen(true); }}
                    onNavigate={(r) => { setProfileMenuOpen(false); navigate(r); }}
                  />
                )}
              </div>
            ) : (
              <button className="header-login" onClick={() => setAuthMode('login')}>{copy.login}</button>
            )}
            <button className="header-notification" onClick={() => session && setNotifOpen((o) => !o)} aria-label="Notifications">
              <Bell size={20} />
              {unreadNotifs > 0 && <span className="notif-badge">{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>}
            </button>
            <button className="header-search" aria-label="Search" onClick={() => navigate({ name: 'category', category: 'tools' })}><Search size={21} /></button>
          </div>
        </div>
      </header>

      {notifOpen && session && (
        <NotificationsPanel userId={session.user.id} onClose={() => setNotifOpen(false)} />
      )}

      <main>
        {route.name === 'home' && <HomePage copy={copy} onSelectCategory={selectCategory} session={session} onUpload={openUpload} />}
        {route.name === 'category' && <CategoryPage category={route.category} subcategory={route.subcategory} session={session} profile={profile} onUpload={openUpload} />}
        {route.name === 'communities' && <CommunitiesPage session={session} profile={profile} onUpload={openUpload} />}
        {route.name === 'mod' && <ModDetailPage modId={route.id} session={session} profile={profile} onUpload={openUpload} />}
        {route.name === 'profile' && <ProfilePage userId={route.userId} session={session} />}
        {route.name === 'leaderboard' && <LeaderboardPage profile={profile} />}
        {route.name === 'pending' && session && <PendingPage session={session} />}
        {route.name === 'my-uploads' && session && <MyUploadsPage session={session} />}
        {route.name === 'my-bookmarks' && session && <MyBookmarksPage session={session} />}
        {route.name === 'my-likes' && session && <MyLikesPage session={session} />}
        {route.name === 'my-follows' && session && <MyFollowsPage session={session} />}
        {route.name === 'account-settings' && session && <></>}
      </main>

      <Footer onSelectCategory={selectCategory} onUpload={openUpload} />

      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSwitch={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} onDone={loadProfile} />}
      {uploadOpen && <UploadModal profile={profile} session={session} onClose={() => setUploadOpen(false)} />}
      {settingsOpen && session && profile && <SettingsModal profile={profile} session={session} onClose={() => { setSettingsOpen(false); loadProfile(); }} />}
      {cartOpen && session && <CartModal userId={session.user.id} onClose={() => setCartOpen(false)} />}
      {staffOpen && profile && <StaffPanel profile={profile} onClose={() => setStaffOpen(false)} />}
    </div>
  );
}

// ============ HOME PAGE ============
function HomePage({ copy, onSelectCategory, session, onUpload }: { copy: { welcome: string; prompt: string; discord: string }; onSelectCategory: (key: string) => void; session: Session | null; onUpload: () => void }) {
  const [featured, setFeatured] = useState<Mod[]>([]);
  const [downloaded, setDownloaded] = useState<Mod[]>([]);
  const [liked, setLiked] = useState<Mod[]>([]);

  useEffect(() => {
    supabase.from('mods').select('id,title,author,category,subcategory,image_url,download_count,like_count,tags,created_at').eq('status', 'approved').eq('is_featured', true).order('created_at', { ascending: false }).limit(8)
      .then(({ data }) => setFeatured((data as Mod[]) ?? []));
    supabase.from('mods').select('id,title,author,category,subcategory,image_url,download_count,like_count,tags,created_at').eq('status', 'approved').order('download_count', { ascending: false }).limit(8)
      .then(({ data }) => setDownloaded((data as Mod[]) ?? []));
    supabase.from('mods').select('id,title,author,category,subcategory,image_url,download_count,like_count,tags,created_at').eq('status', 'approved').order('like_count', { ascending: false }).limit(8)
      .then(({ data }) => setLiked((data as Mod[]) ?? []));
  }, []);

  return (
    <>
      <section className="welcome-band">
        <div className="welcome-heading"><img src="/image copy 2.png" alt="Grand Five Mods crest" /><h1>{copy.welcome}</h1></div>
        <p>{copy.prompt}</p>
        <div className="category-row">{CATEGORIES.map(({ label, key, icon }) => { const Icon = getIcon(icon); return <button key={key} className="category-tile" onClick={() => onSelectCategory(key)}><Icon size={42} strokeWidth={2.2} /><span>{label}</span></button>; })}</div>
        <div className="special-category-row">{SPECIAL_CATEGORIES.map(({ label, key, icon }) => { const Icon = getIcon(icon); return <button key={key} className="special-category" onClick={() => onSelectCategory(key)}><Icon size={17} /><span>{label}</span>{key === 'leaks' && <small>Vehicles · MLOs · Scripts · EUP · Weapons · Liveries</small>}{key === 'fivem' && <small>MLOs · Scripts · Weapons · Paint Jobs · Vehicles · Tools · Misc · Other</small>}{key === 'communities' && <small>Discord servers, profiles, links and galleries</small>}</button>; })}</div>
      </section>
      <section className="category-page">
        <ModSection title="FEATURED FILES" mods={featured} emptyText="No featured files yet." />
        <ModSection title="MOST DOWNLOADED FILES" mods={downloaded} emptyText="Nothing has been downloaded yet." />
        <ModSection title="MOST LIKED FILES" mods={liked} emptyText="Nothing has been liked yet." />
      </section>
      <section className="category-page" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, maxWidth: 1360 }}>
        <div></div>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="sidebar-action-card" style={{ textAlign: 'center' }}>
            <img src="/image copy 2.png" alt="Grand Five Mods" style={{ width: 80, height: 80, margin: '0 auto' }} />
            <h2 style={{ fontSize: 17, margin: '12px 0 8px', color: '#17293d' }}>Join the community</h2>
            <p style={{ color: '#718091', fontSize: 14, lineHeight: 1.45, margin: 0 }}>Get help installing mods, share screenshots and meet other modders.</p>
            <a className="publish-btn" style={{ display: 'flex', justifyContent: 'center', marginTop: 18, background: '#5865F2' }} href={DISCORD_INVITE_URL} target="_blank" rel="noreferrer"><DiscordIcon size={16} /> {copy.discord}</a>
          </div>
          <div className="sidebar-action-card">
            <h2 style={{ fontSize: 17, margin: '0 0 8px', color: '#17293d' }}>Made a mod?</h2>
            <p style={{ color: '#718091', fontSize: 14, lineHeight: 1.45, margin: '0 0 14px' }}>Upload it and let thousands of players download it.</p>
            <button className="publish-btn" style={{ width: '100%' }} onClick={onUpload}><Upload size={16} /> Upload a file</button>
          </div>
        </aside>
      </section>
    </>
  );
}

function ModSection({ title, mods, emptyText }: { title: string; mods: Mod[]; emptyText: string }) {
  return (
    <section className="file-section" style={{ marginBottom: 35 }}>
      <div className="file-section-heading" style={{ borderBottom: '1px solid #d4d4d4', minHeight: 38, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, padding: '0 0 10px 12px', borderLeft: '4px solid #10489b', fontSize: 20, fontWeight: 900, color: '#1c2b3a' }}>{title}</h2>
      </div>
      {mods.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 16 }}>{emptyText}</div>
      ) : (
        <div className="mod-grid" style={{ marginTop: 16 }}>
          {mods.map((mod) => <ModCard key={mod.id} mod={mod} />)}
        </div>
      )}
    </section>
  );
}

function ModCard({ mod }: { mod: Mod }) {
  const Icon = getIcon(CATEGORIES.find((c) => c.key === mod.category)?.icon ?? 'Package');
  return (
    <div className="mod-card" onClick={() => navigate({ name: 'mod', id: mod.id })}>
      <div className="mod-card-image">{mod.image_url ? <img src={mod.image_url} alt={mod.title} /> : <Icon size={40} />}</div>
      <div className="mod-card-body">
        <h3 className="mod-card-title">{mod.title}</h3>
        {mod.author && <div className="mod-card-author">by {mod.author}</div>}
        <div className="mod-card-meta">
          <span><Download size={12} /> {mod.download_count}</span>
          <span><Heart size={12} /> {mod.like_count}</span>
        </div>
        {mod.tags && mod.tags.length > 0 && (
          <div className="mod-card-tags">{mod.tags.slice(0, 3).map((t) => <span key={t} className="tag-chip">{t}</span>)}</div>
        )}
      </div>
    </div>
  );
}

// ============ CATEGORY PAGE ============
function CategoryPage({ category, subcategory, session, profile, onUpload }: { category: string; subcategory?: string; session: Session | null; profile: Profile | null; onUpload: () => void }) {
  const [mods, setMods] = useState<Mod[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState(subcategory ?? 'all');

  const isLeakOrFiveM = category === 'leaks' || category === 'fivem';
  const categoryLabel = [...CATEGORIES, ...SPECIAL_CATEGORIES].find((c) => c.key === category)?.label ?? category;

  useEffect(() => {
    setLoading(true);
    let query = supabase.from('mods').select('id,title,author,category,subcategory,description,image_url,video_url,download_url,tags,download_count,like_count,created_at').eq('status', 'approved');
    if (isLeakOrFiveM) {
      query = query.eq('category', category);
      if (activeSub !== 'all') query = query.eq('subcategory', activeSub);
    } else {
      query = query.eq('category', category);
    }
    query.order('created_at', { ascending: false }).then(({ data }) => {
      let results = (data as Mod[]) ?? [];
      if (search.trim()) {
        const q = search.toLowerCase();
        results = results.filter((m) => m.title.toLowerCase().includes(q) || (m.author && m.author.toLowerCase().includes(q)) || (m.tags && m.tags.some((t) => t.toLowerCase().includes(q))));
      }
      setMods(results);
      setLoading(false);
    });
  }, [category, activeSub, search, isLeakOrFiveM]);

  const Icon = getIcon([...CATEGORIES, ...SPECIAL_CATEGORIES].find((c) => c.key === category)?.icon ?? 'Package');

  return (
    <div className="category-page">
      <div className="category-page-header">
        <div>
          <h1 className="category-page-title"><Icon size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} /> {categoryLabel}</h1>
          <p className="category-page-sub">{isLeakOrFiveM ? 'Browse leaked and rare mods by subcategory' : `Browse ${categoryLabel.toLowerCase()} mods`}</p>
        </div>
        <div className="category-page-actions">
          <div className="search-bar">
            <Search size={16} />
            <input placeholder={`Search ${categoryLabel}...`} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {session && !profile?.is_banned && category !== 'communities' && (
            <button className="publish-btn" onClick={onUpload}><Upload size={16} /> Publish</button>
          )}
        </div>
      </div>

      {isLeakOrFiveM && (
        <div className="subcategory-bar">
          <button className={`subcategory-chip ${activeSub === 'all' ? 'active' : ''}`} onClick={() => { setActiveSub('all'); navigate({ name: 'category', category }); }}>All</button>
          {SUBCATEGORIES.map((sub) => (
            <button key={sub.key} className={`subcategory-chip ${activeSub === sub.key ? 'active' : ''}`} onClick={() => { setActiveSub(sub.key); navigate({ name: 'category', category, subcategory: sub.key }); }}>{sub.label}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : mods.length === 0 ? (
        <div className="empty-state">No mods found in this category yet. Be the first to upload!</div>
      ) : (
        <div className="mod-grid">
          {mods.map((mod) => <ModCard key={mod.id} mod={mod} />)}
        </div>
      )}
    </div>
  );
}

// ============ COMMUNITIES PAGE ============
function CommunitiesPage({ session, profile, onUpload }: { session: Session | null; profile: Profile | null; onUpload: () => void }) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    supabase.from('communities').select('id,name,description,invite_url,image_url,banner_url,tags,links,gallery_urls,status,created_at').eq('status', 'approved').order('created_at', { ascending: false })
      .then(({ data }) => {
        let results = (data as Community[]) ?? [];
        if (search.trim()) {
          const q = search.toLowerCase();
          results = results.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || (c.tags && c.tags.some((t) => t.toLowerCase().includes(q))));
        }
        setCommunities(results);
        setLoading(false);
      });
  }, [search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="category-page">
      <div className="category-page-header">
        <div>
          <h1 className="category-page-title"><DiscordIcon size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} /> Communities</h1>
          <p className="category-page-sub">Browse and post Discord servers for FiveM communities</p>
        </div>
        <div className="category-page-actions">
          <div className="search-bar">
            <Search size={16} />
            <input placeholder="Search communities..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {session && !profile?.is_banned && (
            <button className="publish-btn" onClick={onUpload}><Upload size={16} /> Post Server</button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : communities.length === 0 ? (
        <div className="empty-state">No communities posted yet. Be the first to share your Discord server!</div>
      ) : (
        <div className="community-grid">
          {communities.map((c) => (
            <div key={c.id} className="community-card">
              <div className="community-banner">{c.banner_url ? <img src={c.banner_url} alt="" /> : null}</div>
              <div className="community-body">
                <div className="community-head">
                  <div className="community-avatar">{c.image_url ? <img src={c.image_url} alt="" /> : c.name.slice(0, 1).toUpperCase()}</div>
                  <div>
                    <h3 className="community-name">{c.name}</h3>
                  </div>
                </div>
                <p className="community-desc">{c.description}</p>
                {c.tags && c.tags.length > 0 && (
                  <div className="community-tags">{c.tags.map((t) => <span key={t} className="tag-chip">{t}</span>)}</div>
                )}
                <a className="community-join" href={c.invite_url} target="_blank" rel="noreferrer"><DiscordIcon size={15} /> Join Server</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ MOD DETAIL PAGE ============
function ModDetailPage({ modId, session, profile, onUpload }: { modId: string; session: Session | null; profile: Profile | null; onUpload: () => void }) {
  const [mod, setMod] = useState<Mod | null>(null);
  const [tab, setTab] = useState<'description' | 'comments'>('description');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.from('mods').select('id,user_id,title,author,category,subcategory,description,download_url,image_url,video_url,tags,file_name,file_size_bytes,download_count,like_count,status,is_featured,created_at').eq('id', modId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          const modData = data as Mod;
          if (modData.status !== 'approved' && modData.user_id !== session?.user.id && !['moderator', 'admin', 'owner'].includes(profile?.role ?? '')) {
            setMod(null);
          } else {
            setMod(modData);
          }
        }
        setLoading(false);
      });
  }, [modId, session, profile]);

  const loadComments = useCallback(async () => {
    const { data } = await supabase.from('comments').select('id,mod_id,user_id,parent_id,body,created_at').eq('mod_id', modId).order('created_at', { ascending: true });
    if (data) {
      const withAuthors = await Promise.all((data as Comment[]).map(async (c) => {
        const { data: prof } = await supabase.from('profiles').select('display_name,avatar_url').eq('id', c.user_id).maybeSingle();
        return { ...c, author_name: (prof as { display_name: string })?.display_name ?? 'Unknown', author_avatar: (prof as { avatar_url: string | null })?.avatar_url ?? null };
      }));
      setComments(withAuthors);
    }
  }, [modId]);

  useEffect(() => { loadComments(); }, [loadComments]);

  useEffect(() => {
    if (!session || !mod) return;
    supabase.from('mod_likes').select('id').eq('user_id', session.user.id).eq('mod_id', modId).maybeSingle().then(({ data }) => setLiked(!!data));
    supabase.from('mod_bookmarks').select('id').eq('user_id', session.user.id).eq('mod_id', modId).maybeSingle().then(({ data }) => setBookmarked(!!data));
    supabase.from('mod_follows').select('id').eq('user_id', session.user.id).eq('mod_id', modId).maybeSingle().then(({ data }) => setFollowed(!!data));
    supabase.from('cart_items').select('id').eq('user_id', session.user.id).eq('mod_id', modId).maybeSingle().then(({ data }) => setInCart(!!data));
  }, [session, modId, mod]);

  const toggleLike = async () => {
    if (!session || !mod) return;
    if (liked) {
      await supabase.from('mod_likes').delete().eq('user_id', session.user.id).eq('mod_id', modId);
      setLiked(false);
      setMod({ ...mod, like_count: Math.max(0, mod.like_count - 1) });
    } else {
      await supabase.from('mod_likes').insert({ user_id: session.user.id, mod_id: modId });
      setLiked(true);
      setMod({ ...mod, like_count: mod.like_count + 1 });
    }
  };

  const toggleBookmark = async () => {
    if (!session || !mod) return;
    if (bookmarked) {
      await supabase.from('mod_bookmarks').delete().eq('user_id', session.user.id).eq('mod_id', modId);
      setBookmarked(false);
    } else {
      await supabase.from('mod_bookmarks').insert({ user_id: session.user.id, mod_id: modId });
      setBookmarked(true);
    }
  };

  const toggleFollow = async () => {
    if (!session || !mod) return;
    if (followed) {
      await supabase.from('mod_follows').delete().eq('user_id', session.user.id).eq('mod_id', modId);
      setFollowed(false);
    } else {
      await supabase.from('mod_follows').insert({ user_id: session.user.id, mod_id: modId });
      setFollowed(true);
    }
  };

  const toggleCart = async () => {
    if (!session || !mod) return;
    if (inCart) {
      await supabase.from('cart_items').delete().eq('user_id', session.user.id).eq('mod_id', modId);
      setInCart(false);
    } else {
      await supabase.from('cart_items').insert({ user_id: session.user.id, mod_id: modId });
      setInCart(true);
    }
  };

  const doDownload = async () => {
    if (!mod) return;
    await supabase.rpc('increment_mod_download', { p_mod: modId });
    setMod({ ...mod, download_count: mod.download_count + 1 });
    if (mod.download_url) window.open(mod.download_url, '_blank');
  };

  const postComment = async () => {
    if (!session || !newComment.trim()) return;
    await supabase.from('comments').insert({ mod_id: modId, user_id: session.user.id, body: newComment.trim() });
    setNewComment('');
    loadComments();
  };

  const postReply = async (parentId: string) => {
    if (!session || !replyBody.trim()) return;
    await supabase.from('comments').insert({ mod_id: modId, user_id: session.user.id, parent_id: parentId, body: replyBody.trim() });
    setReplyBody('');
    setReplyTo(null);
    loadComments();
  };

  if (loading) return <div className="mod-detail"><div className="empty-state">Loading...</div></div>;
  if (!mod) return <div className="mod-detail"><div className="empty-state">This mod could not be found or is not yet approved.</div></div>;

  const categoryLabel = [...CATEGORIES, ...SPECIAL_CATEGORIES].find((c) => c.key === mod.category)?.label ?? mod.category;
  const fileSizeStr = mod.file_size_bytes > 0 ? `${(mod.file_size_bytes / 1024 / 1024 / 1024).toFixed(2)} GB` : '';
  const topLevelComments = comments.filter((c) => !c.parent_id);
  const getReplies = (id: string) => comments.filter((c) => c.parent_id === id);

  return (
    <div className="mod-detail">
      <button className="mod-detail-back" onClick={() => navigate({ name: 'category', category: mod.category, subcategory: mod.subcategory ?? undefined })}>← Back to {categoryLabel}</button>
      <div className="mod-detail-grid">
        <div className="mod-detail-main">
          <div className="mod-detail-hero">{mod.image_url ? <img src={mod.image_url} alt={mod.title} /> : null}</div>
          <h1 className="mod-detail-title">{mod.title}</h1>
          <div className="mod-detail-author" onClick={() => navigate({ name: 'profile', userId: mod.user_id })}>by {mod.author || 'Anonymous'}</div>
          <div className="mod-stats">
            <span><Download size={14} /> {mod.download_count} downloads</span>
            <span><Heart size={14} /> {mod.like_count} likes</span>
            {mod.tags && mod.tags.length > 0 && <span><Tag size={14} /> {mod.tags.join(', ')}</span>}
          </div>
          <div className="mod-detail-tabs">
            <button className={`mod-detail-tab ${tab === 'description' ? 'active' : ''}`} onClick={() => setTab('description')}>Description</button>
            <button className={`mod-detail-tab ${tab === 'comments' ? 'active' : ''}`} onClick={() => setTab('comments')}>Comments ({topLevelComments.length})</button>
          </div>
          {tab === 'description' ? (
            <>
              <div className="mod-detail-desc">{mod.description}</div>
              {mod.video_url && (
                <video className="mod-detail-video" controls src={mod.video_url} />
              )}
            </>
          ) : (
            <div className="comment-section">
              {session ? (
                <div className="comment-input">
                  <textarea placeholder="Write a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                  <button onClick={postComment}><Send size={16} /> Post</button>
                </div>
              ) : (
                <p style={{ color: '#8492a1', fontSize: 13, marginBottom: 16 }}>Sign in to leave a comment.</p>
              )}
              {topLevelComments.length === 0 ? (
                <div className="empty-state" style={{ padding: 30 }}>No comments yet.</div>
              ) : (
                topLevelComments.map((c) => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-item-head">
                      <div className="comment-avatar">{c.author_avatar ? <img src={c.author_avatar} alt="" /> : (c.author_name?.slice(0, 1).toUpperCase() ?? 'U')}</div>
                      <span className="comment-author">{c.author_name}</span>
                      <span className="comment-time">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="comment-body">{c.body}</div>
                    {session && (
                      <button className="comment-reply-btn" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>Reply</button>
                    )}
                    {replyTo === c.id && (
                      <div className="comment-input" style={{ marginTop: 8, marginLeft: 36 }}>
                        <textarea placeholder="Write a reply..." value={replyBody} onChange={(e) => setReplyBody(e.target.value)} />
                        <button onClick={() => postReply(c.id)}><Send size={14} /></button>
                      </div>
                    )}
                    {getReplies(c.id).map((r) => (
                      <div key={r.id} className="comment-item" style={{ marginLeft: 36 }}>
                        <div className="comment-item-head">
                          <div className="comment-avatar">{r.author_avatar ? <img src={r.author_avatar} alt="" /> : (r.author_name?.slice(0, 1).toUpperCase() ?? 'U')}</div>
                          <span className="comment-author">{r.author_name}</span>
                          <span className="comment-time">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="comment-body">{r.body}</div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div className="mod-detail-sidebar">
          <div className="sidebar-action-card">
            <h3>Actions</h3>
            <button className={`sidebar-action-btn ${liked ? 'active' : ''}`} onClick={session ? toggleLike : () => navigate({ name: 'home' })}><Heart size={16} /> {liked ? 'Liked' : 'Like'}</button>
            <button className={`sidebar-action-btn ${followed ? 'active' : ''}`} onClick={session ? toggleFollow : () => navigate({ name: 'home' })}><Bookmark size={16} /> {followed ? 'Following' : 'Follow'}</button>
            <button className={`sidebar-action-btn ${bookmarked ? 'active' : ''}`} onClick={session ? toggleBookmark : () => navigate({ name: 'home' })}><Bookmark size={16} /> {bookmarked ? 'Bookmarked' : 'Bookmark'}</button>
            <button className={`sidebar-action-btn ${inCart ? 'active' : ''}`} onClick={session ? toggleCart : () => navigate({ name: 'home' })}><ShoppingCart size={16} /> {inCart ? 'In Cart' : 'Add to Cart'}</button>
          </div>
          <div className="sidebar-action-card">
            <h3>Download</h3>
            {mod.file_name && <p style={{ fontSize: 13, color: '#718091', marginBottom: 10 }}>{mod.file_name} {fileSizeStr && `(${fileSizeStr})`}</p>}
            <button className="sidebar-download-btn" onClick={doDownload}><Download size={18} /> Download</button>
            <p style={{ fontSize: 11, color: '#8492a1', marginTop: 8, textAlign: 'center' }}>No account needed to download</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ PROFILE PAGE ============
function ProfilePage({ userId, session }: { userId: string; session: Session | null }) {
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [uploads, setUploads] = useState<Mod[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    supabase.from('profiles').select('id,email,display_name,role,is_banned,avatar_url,location,country,socials,profile_picture_type,show_adult_content,dark_mode,strikes').eq('id', userId).maybeSingle()
      .then(({ data }) => setUserProfile(data as Profile | null));
    supabase.from('mods').select('id,title,author,category,subcategory,image_url,download_count,like_count,tags,created_at').eq('user_id', userId).eq('status', 'approved').order('created_at', { ascending: false })
      .then(({ data }) => setUploads((data as Mod[]) ?? []));
    if (session) {
      supabase.from('creator_follows').select('id').eq('follower_id', session.user.id).eq('creator_id', userId).maybeSingle()
        .then(({ data }) => setIsFollowing(!!data));
    }
    supabase.from('creator_follows').select('id', { count: 'exact', head: true }).eq('creator_id', userId)
      .then(({ count }) => setFollowerCount(count ?? 0));
    supabase.from('mod_likes').select('id', { count: 'exact', head: true }).eq('user_id', userId)
      .then(({ count }) => setLikeCount(count ?? 0));
  }, [userId, session]);

  const toggleFollow = async () => {
    if (!session) return;
    if (isFollowing) {
      await supabase.from('creator_follows').delete().eq('follower_id', session.user.id).eq('creator_id', userId);
      setIsFollowing(false);
      setFollowerCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from('creator_follows').insert({ follower_id: session.user.id, creator_id: userId });
      setIsFollowing(true);
      setFollowerCount((c) => c + 1);
    }
  };

  if (!userProfile) return <div className="profile-page"><div className="empty-state">Loading profile...</div></div>;

  const socials = userProfile.socials ?? {};

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar xl">{userProfile.avatar_url ? <img src={userProfile.avatar_url} alt="" /> : userProfile.display_name.slice(0, 1).toUpperCase()}</div>
        <div className="profile-header-info">
          <h2>{userProfile.display_name}</h2>
          {userProfile.location && <p>{userProfile.location}{userProfile.country ? ', ' + userProfile.country : ''}</p>}
          <p style={{ textTransform: 'capitalize', color: '#10489b', fontWeight: 700 }}>{userProfile.role}</p>
          <div className="profile-stats">
            <div className="profile-stat"><strong>{uploads.length}</strong><span>Uploads</span></div>
            <div className="profile-stat"><strong>{likeCount}</strong><span>Likes</span></div>
            <div className="profile-stat"><strong>{followerCount}</strong><span>Followers</span></div>
          </div>
          {socials && Object.keys(socials).length > 0 && (
            <div className="profile-socials">
              {Object.entries(socials).filter(([, v]) => v).map(([key, val]) => (
                <a key={key} className="profile-social-link" href={val.startsWith('http') ? val : `https://${val}`} target="_blank" rel="noreferrer"><ExternalLink size={12} /> {SOCIAL_FIELDS.find((s) => s.key === key)?.label ?? key}</a>
              ))}
            </div>
          )}
        </div>
        {session && session.user.id !== userId && (
          <button className={`follow-btn ${isFollowing ? 'active' : ''}`} onClick={toggleFollow}>{isFollowing ? 'Following' : 'Follow'}</button>
        )}
      </div>
      <h3 style={{ fontFamily: 'Oswald', fontSize: 20, fontWeight: 700, textTransform: 'uppercase', color: '#17293d', marginBottom: 16 }}>Uploads</h3>
      {uploads.length === 0 ? (
        <div className="empty-state">This creator hasn't uploaded any mods yet.</div>
      ) : (
        <div className="mod-grid">
          {uploads.map((mod) => <ModCard key={mod.id} mod={mod} />)}
        </div>
      )}
    </div>
  );
}

// ============ LEADERBOARD PAGE ============
function LeaderboardPage({ profile }: { profile: Profile | null }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [editing, setEditing] = useState(false);
  const [draftRows, setDraftRows] = useState<LeaderboardEntry[]>([]);

  const load = useCallback(() => {
    supabase.from('leaderboard_entries').select('id,rank_order,display_name,label,value').order('rank_order', { ascending: true })
      .then(({ data }) => setEntries((data as LeaderboardEntry[]) ?? []));
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = () => { setDraftRows([...entries, { id: '', rank_order: entries.length + 1, display_name: '', label: '', value: '' }]); setEditing(true); };

  const saveRow = async (row: LeaderboardEntry) => {
    await supabase.rpc('save_leaderboard_entry', { p_rank: row.rank_order, p_name: row.display_name, p_label: row.label, p_value: row.value, p_id: row.id || null });
    load();
  };

  const deleteRow = async (id: string) => {
    await supabase.rpc('delete_leaderboard_entry', { p_id: id });
    load();
  };

  const isOwner = profile?.role === 'owner';

  return (
    <div className="leaderboard-page">
      <h1 className="category-page-title" style={{ marginBottom: 20 }}>Grand Five Mods Leaderboard</h1>
      {isOwner && !editing && <button className="publish-btn" onClick={startEdit} style={{ marginBottom: 20 }}><Settings size={16} /> Edit Leaderboard</button>}
      {editing ? (
        <div className="sidebar-action-card" style={{ marginBottom: 20 }}>
          <h3>Edit Leaderboard Entries</h3>
          {draftRows.map((row, i) => (
            <div key={i} className="leaderboard-row">
              <input className="rank-input" type="number" value={row.rank_order} onChange={(e) => { const rows = [...draftRows]; rows[i] = { ...row, rank_order: parseInt(e.target.value) || 0 }; setDraftRows(rows); }} placeholder="Rank" />
              <input className="name-input" value={row.display_name} onChange={(e) => { const rows = [...draftRows]; rows[i] = { ...row, display_name: e.target.value }; setDraftRows(rows); }} placeholder="Name" />
              <input className="label-input" value={row.label} onChange={(e) => { const rows = [...draftRows]; rows[i] = { ...row, label: e.target.value }; setDraftRows(rows); }} placeholder="Label" />
              <input className="value-input" value={row.value} onChange={(e) => { const rows = [...draftRows]; rows[i] = { ...row, value: e.target.value }; setDraftRows(rows); }} placeholder="Value" />
              <button onClick={() => saveRow(row)} style={{ background: '#277354', color: 'white', borderRadius: 3, border: 0, padding: '8px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}><Check size={14} /></button>
              {row.id && <button onClick={() => deleteRow(row.id)}><Trash2 size={14} /></button>}
            </div>
          ))}
          <button className="publish-btn" onClick={() => { setEditing(false); load(); }} style={{ marginTop: 16 }}><Check size={16} /> Done</button>
        </div>
      ) : null}
      {entries.length === 0 ? (
        <div className="empty-state">No leaderboard entries yet.</div>
      ) : (
        <table className="leaderboard-table">
          <thead><tr><th className="rank-cell">Rank</th><th>Name</th><th>Label</th><th>Value</th></tr></thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}><td className="rank-cell">#{e.rank_order}</td><td>{e.display_name}</td><td>{e.label}</td><td>{e.value}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ============ PENDING PAGE (user's own pending mods) ============
function PendingPage({ session }: { session: Session }) {
  const [mods, setMods] = useState<Mod[]>([]);
  useEffect(() => {
    supabase.from('mods').select('id,title,author,category,subcategory,description,image_url,download_url,tags,status,created_at').eq('user_id', session.user.id).order('created_at', { ascending: false })
      .then(({ data }) => setMods((data as Mod[]) ?? []));
  }, [session]);
  const pending = mods.filter((m) => m.status === 'pending');
  return (
    <div className="category-page">
      <h1 className="category-page-title">Pending Submissions</h1>
      <p className="category-page-sub" style={{ marginBottom: 20 }}>Your mods awaiting staff review</p>
      {pending.length === 0 ? (
        <div className="empty-state">You have no pending submissions.</div>
      ) : (
        <div className="mod-grid">
          {pending.map((mod) => (
            <div key={mod.id} className="mod-card" onClick={() => navigate({ name: 'mod', id: mod.id })}>
              <div className="mod-card-image">{mod.image_url ? <img src={mod.image_url} alt={mod.title} /> : null}</div>
              <div className="mod-card-body">
                <h3 className="mod-card-title">{mod.title}</h3>
                <div className="mod-card-meta"><span style={{ color: '#e67e22' }}>Pending review</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MyUploadsPage({ session }: { session: Session }) {
  const [mods, setMods] = useState<Mod[]>([]);
  useEffect(() => {
    supabase.from('mods').select('id,title,author,category,subcategory,image_url,download_count,like_count,tags,status,created_at').eq('user_id', session.user.id).order('created_at', { ascending: false })
      .then(({ data }) => setMods((data as Mod[]) ?? []));
  }, [session]);
  return (
    <div className="category-page">
      <h1 className="category-page-title">My Uploads</h1>
      {mods.length === 0 ? <div className="empty-state" style={{ marginTop: 20 }}>You haven't uploaded any mods yet.</div> : (
        <div className="mod-grid" style={{ marginTop: 20 }}>{mods.map((mod) => <ModCard key={mod.id} mod={mod} />)}</div>
      )}
    </div>
  );
}

function MyBookmarksPage({ session }: { session: Session }) {
  const [mods, setMods] = useState<Mod[]>([]);
  useEffect(() => {
    supabase.from('mod_bookmarks').select('mod_id').eq('user_id', session.user.id).then(({ data }) => {
      if (data && data.length > 0) {
        const ids = (data as { mod_id: string }[]).map((d) => d.mod_id);
        supabase.from('mods').select('id,title,author,category,subcategory,image_url,download_count,like_count,tags,created_at').in('id', ids).eq('status', 'approved')
          .then(({ data: modData }) => setMods((modData as Mod[]) ?? []));
      }
    });
  }, [session]);
  return (
    <div className="category-page">
      <h1 className="category-page-title">My Bookmarks</h1>
      {mods.length === 0 ? <div className="empty-state" style={{ marginTop: 20 }}>No bookmarked mods yet.</div> : (
        <div className="mod-grid" style={{ marginTop: 20 }}>{mods.map((mod) => <ModCard key={mod.id} mod={mod} />)}</div>
      )}
    </div>
  );
}

function MyLikesPage({ session }: { session: Session }) {
  const [mods, setMods] = useState<Mod[]>([]);
  useEffect(() => {
    supabase.from('mod_likes').select('mod_id').eq('user_id', session.user.id).then(({ data }) => {
      if (data && data.length > 0) {
        const ids = (data as { mod_id: string }[]).map((d) => d.mod_id);
        supabase.from('mods').select('id,title,author,category,subcategory,image_url,download_count,like_count,tags,created_at').in('id', ids).eq('status', 'approved')
          .then(({ data: modData }) => setMods((modData as Mod[]) ?? []));
      }
    });
  }, [session]);
  return (
    <div className="category-page">
      <h1 className="category-page-title">My Liked Files</h1>
      {mods.length === 0 ? <div className="empty-state" style={{ marginTop: 20 }}>No liked mods yet.</div> : (
        <div className="mod-grid" style={{ marginTop: 20 }}>{mods.map((mod) => <ModCard key={mod.id} mod={mod} />)}</div>
      )}
    </div>
  );
}

function MyFollowsPage({ session }: { session: Session }) {
  const [mods, setMods] = useState<Mod[]>([]);
  useEffect(() => {
    supabase.from('mod_follows').select('mod_id').eq('user_id', session.user.id).then(({ data }) => {
      if (data && data.length > 0) {
        const ids = (data as { mod_id: string }[]).map((d) => d.mod_id);
        supabase.from('mods').select('id,title,author,category,subcategory,image_url,download_count,like_count,tags,created_at').in('id', ids).eq('status', 'approved')
          .then(({ data: modData }) => setMods((modData as Mod[]) ?? []));
      }
    });
  }, [session]);
  return (
    <div className="category-page">
      <h1 className="category-page-title">My Followed Files</h1>
      {mods.length === 0 ? <div className="empty-state" style={{ marginTop: 20 }}>No followed mods yet.</div> : (
        <div className="mod-grid" style={{ marginTop: 20 }}>{mods.map((mod) => <ModCard key={mod.id} mod={mod} />)}</div>
      )}
    </div>
  );
}

// ============ PROFILE DROPDOWN ============
function ProfileDropdown({ profile, session, cartCount, onClose, onUpload, onSettings, onStaff, onSignOut, onCart, onNavigate }: {
  profile: Profile | null; session: Session; cartCount: number; onClose: () => void;
  onUpload: () => void; onSettings: () => void; onStaff: () => void; onSignOut: () => void; onCart: () => void; onNavigate: (r: Route) => void;
}) {
  const isStaff = profile && ['moderator', 'admin', 'owner'].includes(profile.role);
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 39 }} onClick={onClose} />
      <div className="profile-dropdown">
        <div className="profile-dropdown-header">
          <strong>{profile?.display_name ?? 'Member'}</strong>
          <small>{session.user.email}</small>
        </div>
        <button className="profile-dropdown-item" onClick={() => { onNavigate({ name: 'profile', userId: session.user.id }); }}><Home size={16} /> My Profile</button>
        <button className="profile-dropdown-item" onClick={() => { onNavigate({ name: 'my-uploads' }); }}><Upload size={16} /> My Uploads</button>
        <button className="profile-dropdown-item" onClick={() => { onNavigate({ name: 'my-follows' }); }}><Bookmark size={16} /> My Followed Files</button>
        <button className="profile-dropdown-item" onClick={() => { onNavigate({ name: 'my-bookmarks' }); }}><Bookmark size={16} /> My Bookmarks</button>
        <button className="profile-dropdown-item" onClick={() => { onNavigate({ name: 'my-likes' }); }}><Heart size={16} /> My Likes</button>
        <button className="profile-dropdown-item" onClick={() => { onNavigate({ name: 'pending' }); }}><Filter size={16} /> Pending</button>
        <div className="profile-dropdown-divider" />
        <button className="profile-dropdown-item" onClick={onSettings}><Settings size={16} /> Account Settings</button>
        <button className="profile-dropdown-item" onClick={() => { onNavigate({ name: 'home' }); }}><Sun size={16} /> Dark Mode</button>
        <button className="profile-dropdown-item" onClick={() => { onNavigate({ name: 'home' }); }}><Eye size={16} /> Show Adult Content</button>
        <button className="profile-dropdown-item" onClick={onCart}><ShoppingCart size={16} /> Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}</button>
        {isStaff && <><div className="profile-dropdown-divider" /><button className="profile-dropdown-item" onClick={onStaff}><ShieldCheck size={16} /> Staff Dashboard</button></>}
        <div className="profile-dropdown-divider" />
        <button className="profile-dropdown-item" onClick={onSignOut}><LogOut size={16} /> Log Out</button>
        <button className="profile-dropdown-item" onClick={() => { onSignOut(); }}><LogIn size={16} /> Change Account</button>
      </div>
    </>
  );
}

// ============ NOTIFICATIONS PANEL ============
function NotificationsPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    supabase.from('notifications').select('id,type,body,link_url,is_read,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setNotifs((data as Notification[]) ?? []));
    supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false).then(() => {});
  }, [userId]);

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 39 }} onClick={onClose} />
      <div className="notif-panel" style={{ position: 'fixed', top: 50, right: 80, zIndex: 45 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #edf0f4', fontWeight: 900, fontSize: 14, color: '#17293d' }}>Notifications</div>
        {notifs.length === 0 ? (
          <div className="cart-empty">No notifications yet.</div>
        ) : (
          notifs.map((n) => {
            const iconClass = n.type === 'warning' ? 'warning' : n.type === 'strike' ? 'strike' : n.type === 'like' ? 'like' : 'comment';
            const Icon = n.type === 'warning' ? AlertTriangle : n.type === 'strike' ? AlertTriangle : n.type === 'like' ? Heart : MessageSquare;
            return (
              <div key={n.id} className={`notif-item ${n.is_read ? '' : 'unread'}`}>
                <div className={`notif-icon ${iconClass}`}><Icon size={16} /></div>
                <div><div className="notif-body">{n.body}</div><div className="notif-time">{new Date(n.created_at).toLocaleDateString()}</div></div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

// ============ AUTH MODAL ============
function AuthModal({ mode, onClose, onSwitch, onDone }: { mode: AuthMode; onClose: () => void; onSwitch: () => void; onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true); setError('');
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
    setBusy(false);
    if (result.error) { setError('We could not complete that request. Check your details and try again.'); return; }
    if (mode === 'signup' && !result.data.session) { setMessage('Your account is ready. You can now sign in.'); return; }
    onDone();
    onClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <img src="/image copy 2.png" alt="" />
        <span className="modal-kicker">Grand Five Mods</span>
        <h2>{mode === 'login' ? 'Welcome back' : 'Join the community'}</h2>
        <p>{mode === 'login' ? 'Sign in to upload and manage your creations.' : 'Create an account and share what you build.'}</p>
        <form onSubmit={submit}>
          {mode === 'signup' && <label>Display name<input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your creator name" /></label>}
          <label>Email address<input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="you@example.com" /></label>
          <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" minLength={6} placeholder="At least 6 characters" /></label>
          {error && <div className="form-error">{error}</div>}
          {message && <div className="form-message">{message}</div>}
          <button className="modal-submit" disabled={busy}>{busy ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'} <LogIn size={16} /></button>
        </form>
        <button className="modal-switch" onClick={onSwitch}>{mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in'}</button>
      </div>
    </div>
  );
}

// ============ UPLOAD MODAL (2-step) ============
function UploadModal({ profile, session, onClose }: { profile: Profile | null; session: Session | null; onClose: () => void }) {
  const [kind, setKind] = useState<'mod' | 'community'>('mod');
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('tools');
  const [subcategory, setSubcategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [url, setUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [links, setLinks] = useState('');
  const [gallery, setGallery] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [createdModId, setCreatedModId] = useState<string | null>(null);

  const isLeakOrFiveM = category === 'leaks' || category === 'fivem';

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) { setTags([...tags, t]); setTagInput(''); }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const submitDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile || profile.is_banned || !session) return;
    setBusy(true); setError('');

    if (kind === 'mod') {
      const insertData: Record<string, unknown> = {
        title, author, category, description, download_url: url || '', image_url: imageUrl || null,
        video_url: videoUrl || null, tags, status: 'pending',
      };
      if (isLeakOrFiveM && subcategory) insertData.subcategory = subcategory;
      const { data, error: insertError } = await supabase.from('mods').insert(insertData).select('id').single();
      setBusy(false);
      if (insertError) { setError('We could not submit this yet. Please check the details and try again.'); return; }
      setCreatedModId(data.id);
      setStep(2);
    } else {
      const { error: insertError } = await supabase.from('communities').insert({
        name: title, description, invite_url: url, image_url: imageUrl || null, banner_url: bannerUrl || null,
        tags, links: links.split(/[,\n]/).map((s) => s.trim()).filter(Boolean),
        gallery_urls: gallery.split(/[,\n]/).map((s) => s.trim()).filter(Boolean), status: 'pending',
      });
      setBusy(false);
      if (insertError) { setError('We could not submit this yet. Please check the details and try again.'); return; }
      setMessage('Community submitted for review. It will appear publicly after approval.');
      setTimeout(onClose, 2000);
    }
  };

  const submitFile = async () => {
    if (!createdModId) return;
    setBusy(true); setError('');
    const { error: updateError } = await supabase.from('mods').update({
      file_name: fileName, file_size_bytes: fileSize, download_url: url || '',
    }).eq('id', createdModId);
    setBusy(false);
    if (updateError) { setError('Could not save file metadata.'); return; }
    setMessage('File uploaded successfully! Your mod is now pending review.');
    setTimeout(onClose, 2000);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_GB * 1024 * 1024 * 1024) { setError(`File exceeds ${MAX_FILE_GB} GB limit.`); return; }
      setFileName(file.name);
      setFileSize(file.size);
      setError('');
    }
  };

  const close = () => { if (step === 2 && createdModId) { /* keep the pending mod even if they close */ } onClose(); };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="auth-modal upload-modal-large">
        <button className="modal-close" onClick={close}><X size={18} /></button>
        <span className="modal-kicker">{kind === 'mod' ? 'Upload new file' : 'Post Discord server'}</span>
        <h2>{kind === 'mod' ? (step === 1 ? 'Upload New File' : 'Add Your File') : 'Post Your Server'}</h2>
        {kind === 'mod' && (
          <div className="upload-step-indicator">
            <div className={`upload-step-dot ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`} />
            <div className={`upload-step-dot ${step >= 2 ? 'active' : ''}`} />
          </div>
        )}

        {kind === 'mod' && step === 1 && (
          <>
            <div className="upload-tabs">
              <button className={kind === 'mod' ? 'active' : ''} onClick={() => setKind('mod')}><Upload size={14} /> Mod file</button>
              <button className={kind === 'community' ? 'active' : ''} onClick={() => setKind('community')}><DiscordIcon size={14} /> Community</button>
            </div>
            <form onSubmit={submitDetails}>
              <div className="form-grid">
                <label>Full file name<input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="My Awesome Mod v2.0" /></label>
                <label>Author<input value={author} onChange={(e) => setAuthor(e.target.value)} required placeholder="Your creator name" /></label>
                <label>Category
                  <select value={category} onChange={(e) => { setCategory(e.target.value); setSubcategory(''); }}>
                    {[...CATEGORIES, ...SPECIAL_CATEGORIES.filter((c) => c.key !== 'communities')].map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </label>
                {isLeakOrFiveM && (
                  <label>Subcategory
                    <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
                      <option value="">Select subcategory...</option>
                      {SUBCATEGORIES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </label>
                )}
                <label>Tags
                  <div className="tag-input-wrapper">
                    {tags.map((t) => <span key={t} className="tag-pill">{t} <button type="button" onClick={() => removeTag(t)}><X size={11} /></button></span>)}
                    <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Type a tag and press Enter" />
                  </div>
                </label>
                <label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} placeholder="Describe your mod..." /></label>
                <label>Photo (required) - Image URL<input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required type="url" placeholder="https://..." /></label>
                <label>Video (optional) - Video URL<input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} type="url" placeholder="https://..." /></label>
                {profile?.is_banned && <div className="form-error">This account cannot submit new content right now.</div>}
                {error && <div className="form-error">{error}</div>}
                <button className="modal-submit" disabled={busy || profile?.is_banned}>{busy ? 'Submitting...' : 'Submit File'} <ShieldCheck size={16} /></button>
              </div>
            </form>
          </>
        )}

        {kind === 'mod' && step === 2 && (
          <div className="form-grid">
            <p style={{ color: '#718091', fontSize: 13 }}>Your mod details have been saved. Now add the actual file (max {MAX_FILE_GB} GB).</p>
            <label>File
              <div className={`file-drop-zone ${fileName ? 'has-file' : ''}`}>
                {fileName ? (
                  <>
                    <div className="file-name"><Check size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> {fileName}</div>
                    <div className="file-size">{(fileSize / 1024 / 1024).toFixed(2)} MB</div>
                  </>
                ) : (
                  <>
                    <Upload size={32} style={{ margin: '0 auto 8px', display: 'block', color: '#8492a1' }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1c2b3a' }}>Click to choose a file</div>
                    <div className="file-hint">Max {MAX_FILE_GB} GB</div>
                  </>
                )}
                <input type="file" style={{ display: 'none' }} onChange={onFileSelect} />
              </div>
            </label>
            <label>Download link (optional - if hosting externally)<input value={url} onChange={(e) => setUrl(e.target.value)} type="url" placeholder="https://..." /></label>
            {error && <div className="form-error">{error}</div>}
            {message && <div className="form-message">{message}</div>}
            <button className="modal-submit" disabled={busy || !fileName} onClick={submitFile}>{busy ? 'Uploading...' : 'Complete Upload'} <Upload size={16} /></button>
          </div>
        )}

        {kind === 'community' && (
          <>
            <div className="upload-tabs">
              <button className={kind === 'mod' ? 'active' : ''} onClick={() => setKind('mod')}><Upload size={14} /> Mod file</button>
              <button className={kind === 'community' ? 'active' : ''} onClick={() => setKind('community')}><DiscordIcon size={14} /> Community</button>
            </div>
            <form onSubmit={submitDetails}>
              <div className="form-grid">
                <label>Server name<input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="My FiveM Community" /></label>
                <label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} placeholder="Describe your server..." /></label>
                <label>Tags
                  <div className="tag-input-wrapper">
                    {tags.map((t) => <span key={t} className="tag-pill">{t} <button type="button" onClick={() => removeTag(t)}><X size={11} /></button></span>)}
                    <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Type a tag and press Enter" />
                  </div>
                </label>
                <label>Server invite link<input value={url} onChange={(e) => setUrl(e.target.value)} required type="url" placeholder="https://discord.gg/..." /></label>
                <label>Profile picture URL<input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} type="url" placeholder="https://..." /></label>
                <label>Banner URL<input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} type="url" placeholder="https://..." /></label>
                <label>Additional links (optional)<textarea value={links} onChange={(e) => setLinks(e.target.value)} rows={2} placeholder="One link per line" /></label>
                {error && <div className="form-error">{error}</div>}
                {message && <div className="form-message">{message}</div>}
                <button className="modal-submit" disabled={busy || profile?.is_banned}>{busy ? 'Submitting...' : 'Post Server'} <ShieldCheck size={16} /></button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ============ SETTINGS MODAL ============
function SettingsModal({ profile, session, onClose }: { profile: Profile; session: Session; onClose: () => void }) {
  const [tab, setTab] = useState<'account' | 'password'>('account');
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [location, setLocation] = useState(profile.location ?? '');
  const [country, setCountry] = useState(profile.country ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '');
  const [picType, setPicType] = useState(profile.profile_picture_type ?? 'default');
  const [socials, setSocials] = useState<Record<string, string>>(profile.socials ?? {});
  const [showAdult, setShowAdult] = useState(profile.show_adult_content);
  const [darkMode, setDarkMode] = useState(profile.dark_mode);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const saveProfile = async () => {
    setBusy(true); setError(''); setMessage('');
    const { error: updateError } = await supabase.from('profiles').update({
      display_name: displayName, location: location || null, country: country || null,
      avatar_url: avatarUrl || null, profile_picture_type: picType, socials, show_adult_content: showAdult, dark_mode: darkMode,
    }).eq('id', session.user.id);
    setBusy(false);
    if (updateError) { setError('Could not save profile changes.'); return; }
    setMessage('Profile saved successfully.');
  };

  const changePassword = async () => {
    setError(''); setMessage('');
    if (newPw !== confirmPw) { setError('New passwords do not match.'); return; }
    if (newPw.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPw });
    setBusy(false);
    if (updateError) { setError('Could not update password.'); return; }
    setMessage('Password updated successfully.');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  };

  const forgotPassword = async () => {
    setBusy(true); setError('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(profile.email);
    setBusy(false);
    if (resetError) { setError('Could not send reset email.'); return; }
    setMessage('Password reset email sent.');
  };

  const onAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 750 * 1024) { setError('Avatar must be 750 KB or less.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setAvatarUrl(reader.result as string); setPicType('custom'); };
    reader.readAsDataURL(file);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal settings-modal">
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <span className="modal-kicker">Account Settings</span>
        <h2>Settings</h2>
        <div className="settings-tabs">
          <button className={`settings-tab ${tab === 'account' ? 'active' : ''}`} onClick={() => setTab('account')}>Account & Profile</button>
          <button className={`settings-tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>Password</button>
        </div>

        {tab === 'account' && (
          <div className="settings-section active">
            <div className="settings-field">
              <label>Username</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="settings-field">
              <label>Email address</label>
              <input value={profile.email} disabled style={{ background: '#f2f4f6' }} />
            </div>
            <div className="settings-field">
              <label>Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Your city" />
            </div>
            <div className="settings-field">
              <label>Country</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="">Select country...</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 900, color: '#17293d', margin: '20px 0 10px', textTransform: 'uppercase' }}>Online Accounts</h3>
            {SOCIAL_FIELDS.map((s) => (
              <div key={s.key} className="settings-field">
                <label>{s.label}</label>
                <input value={socials[s.key] ?? ''} onChange={(e) => setSocials({ ...socials, [s.key]: e.target.value })} placeholder={`Your ${s.label} URL or username`} />
              </div>
            ))}

            <h3 style={{ fontSize: 14, fontWeight: 900, color: '#17293d', margin: '20px 0 10px', textTransform: 'uppercase' }}>Profile Picture</h3>
            <div className="settings-avatar-row">
              <div className="profile-avatar lg">{avatarUrl ? <img src={avatarUrl} alt="" /> : displayName.slice(0, 1).toUpperCase()}</div>
              <div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #cfd8e3', borderRadius: 3, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#3e5064' }}>
                  <Upload size={14} /> Choose File
                  <input type="file" accept=".jpg,.png" style={{ display: 'none' }} onChange={onAvatarUpload} />
                </label>
                <div className="hint">JPG or PNG, max 750 KB, recommended 256x256 pixels</div>
              </div>
            </div>
            <div className="preset-avatars">
              {Array.from({ length: 12 }).map((_, i) => (
                <button key={i} className={`preset-avatar ${picType === `preset-${i}` ? 'selected' : ''}`} onClick={() => { setPicType(`preset-${i}`); setAvatarUrl(''); }} style={{ background: `hsl(${i * 30}, 60%, 70%)` }}>
                  {displayName.slice(0, 1).toUpperCase()}
                </button>
              ))}
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 900, color: '#17293d', margin: '20px 0 10px', textTransform: 'uppercase' }}>Preferences</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#3e5064', marginBottom: 10 }}>
              <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} /> Dark Mode
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#3e5064', marginBottom: 10 }}>
              <input type="checkbox" checked={showAdult} onChange={(e) => setShowAdult(e.target.checked)} /> Show Adult Content
            </label>

            {error && <div className="form-error">{error}</div>}
            {message && <div className="form-message">{message}</div>}
            <button className="modal-submit" disabled={busy} onClick={saveProfile}>{busy ? 'Saving...' : 'Save Changes'}</button>
          </div>
        )}

        {tab === 'password' && (
          <div className="settings-section active">
            <div className="settings-field"><label>Current password<input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} /></label></div>
            <div className="settings-field"><label>New password<input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></label></div>
            <div className="settings-field"><label>Confirm password<input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} /></label></div>
            {error && <div className="form-error">{error}</div>}
            {message && <div className="form-message">{message}</div>}
            <button className="modal-submit" disabled={busy || !newPw || !confirmPw} onClick={changePassword}>{busy ? 'Saving...' : 'Save Password'}</button>
            <button className="modal-switch" onClick={forgotPassword}>Forget Password - Send Reset Email</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ CART MODAL ============
function CartModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const load = useCallback(() => {
    supabase.from('cart_items').select('id,mod_id').eq('user_id', userId).then(async ({ data }) => {
      if (!data || data.length === 0) { setItems([]); return; }
      const ids = (data as { id: string; mod_id: string }[]).map((d) => d.mod_id);
      const { data: mods } = await supabase.from('mods').select('id,title,image_url,download_url').in('id', ids).eq('status', 'approved');
      const cartItems: CartItem[] = (data as { id: string; mod_id: string }[]).map((d) => {
        const mod = (mods as { id: string; title: string; image_url: string | null; download_url: string }[] | null)?.find((m) => m.id === d.mod_id);
        return { id: d.id, mod_id: d.mod_id, mod_title: mod?.title ?? 'Unknown', mod_image: mod?.image_url ?? null, mod_download_url: mod?.download_url ?? '' };
      }).filter((ci) => ci.mod_title !== 'Unknown');
      setItems(cartItems);
    });
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const removeItem = async (id: string) => {
    await supabase.from('cart_items').delete().eq('id', id);
    load();
  };

  const downloadAll = () => {
    items.forEach((item) => { if (item.mod_download_url) window.open(item.mod_download_url, '_blank'); });
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal cart-panel">
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <span className="modal-kicker">Your Cart</span>
        <h2>Download Cart</h2>
        {items.length === 0 ? (
          <div className="cart-empty">Your cart is empty. Add mods to your cart to download them all at once.</div>
        ) : (
          <>
            {items.map((item) => (
              <div key={item.id} className="cart-item-row">
                <div style={{ width: 48, height: 48, borderRadius: 4, background: '#edf2f8', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                  {item.mod_image ? <img src={item.mod_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={20} color="#8492a1" />}
                </div>
                <div className="cart-item-info">
                  <strong>{item.mod_title}</strong>
                </div>
                <button className="cart-remove" onClick={() => removeItem(item.id)}><Trash2 size={16} /></button>
              </div>
            ))}
            <button className="cart-download-all" onClick={downloadAll}><Download size={18} /> Download All</button>
            <p style={{ fontSize: 11, color: '#8492a1', marginTop: 10, textAlign: 'center' }}>Files will download individually. Bulk WinRAR packaging requires a desktop app.</p>
          </>
        )}
      </div>
    </div>
  );
}

// ============ STAFF PANEL ============
function StaffPanel({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [tab, setTab] = useState<'review' | 'accounts' | 'warnings' | 'leaderboard'>('review');
  const [mods, setMods] = useState<Array<{ id: string; title: string; category: string; status: string; is_featured: boolean }>>([]);
  const [approvedMods, setApprovedMods] = useState<Array<{ id: string; title: string; category: string; is_featured: boolean }>>([]);
  const [communities, setCommunities] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [profiles, setProfiles] = useState<Array<{ id: string; email: string; display_name: string; role: Role; is_banned: boolean; strikes: number }>>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [message, setMessage] = useState('');
  const [warnUserId, setWarnUserId] = useState('');
  const [warnReason, setWarnReason] = useState('');
  const [editingLb, setEditingLb] = useState(false);
  const [lbRows, setLbRows] = useState<LeaderboardEntry[]>([]);

  const load = async () => {
    const [modResult, approvedResult, communityResult, profileResult, lbResult] = await Promise.all([
      supabase.from('mods').select('id,title,category,status,is_featured').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('mods').select('id,title,category,is_featured').eq('status', 'approved').order('created_at', { ascending: false }),
      supabase.from('communities').select('id,name,status').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,email,display_name,role,is_banned,strikes').order('created_at', { ascending: false }),
      supabase.from('leaderboard_entries').select('id,rank_order,display_name,label,value').order('rank_order', { ascending: true }),
    ]);
    if (modResult.data) setMods(modResult.data as typeof mods);
    if (approvedResult.data) setApprovedMods(approvedResult.data as typeof approvedMods);
    if (communityResult.data) setCommunities(communityResult.data as typeof communities);
    if (profileResult.data) setProfiles(profileResult.data as typeof profiles);
    if (lbResult.data) setLeaderboard(lbResult.data as LeaderboardEntry[]);
  };

  useEffect(() => { load(); }, []);

  const moderateMod = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.rpc('moderate_mod', { p_mod: id, p_status: status });
    if (error) { setMessage('That action could not be completed.'); return; }
    setMessage(`Mod ${status}.`); await load();
  };
  const moderateCommunity = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.rpc('moderate_community', { p_community: id, p_status: status });
    if (error) { setMessage('That action could not be completed.'); return; }
    setMessage(`Community ${status}.`); await load();
  };
  const setRole = async (id: string, role: Role) => {
    const { error } = await supabase.rpc('set_member_role', { p_member: id, p_role: role });
    if (error) { setMessage('You do not have permission to make that change.'); return; }
    setMessage('Account role updated.'); await load();
  };
  const setBanned = async (id: string, banned: boolean) => {
    const { error } = await supabase.rpc('set_member_banned', { p_member: id, p_banned: banned });
    if (error) { setMessage('You do not have permission to make that change.'); return; }
    setMessage(banned ? 'Account banned.' : 'Account unbanned.'); await load();
  };
  const setFeatured = async (id: string, featured: boolean) => {
    const { error } = await supabase.rpc('set_mod_featured', { p_mod: id, p_featured: featured });
    if (error) { setMessage('Only the owner can feature files.'); return; }
    setMessage(featured ? 'File featured.' : 'File unfeatured.'); await load();
  };
  const issueWarning = async (isStrike: boolean) => {
    if (!warnUserId || !warnReason.trim()) return;
    const { error } = await supabase.rpc('issue_warning', { p_user: warnUserId, p_reason: warnReason.trim(), p_is_strike: isStrike });
    if (error) { setMessage('Could not issue warning.'); return; }
    setMessage(isStrike ? 'Strike issued.' : 'Warning issued.');
    setWarnUserId(''); setWarnReason(''); await load();
  };

  const startLbEdit = () => { setLbRows([...leaderboard, { id: '', rank_order: leaderboard.length + 1, display_name: '', label: '', value: '' }]); setEditingLb(true); };
  const saveLbRow = async (row: LeaderboardEntry) => {
    await supabase.rpc('save_leaderboard_entry', { p_rank: row.rank_order, p_name: row.display_name, p_label: row.label, p_value: row.value, p_id: row.id || null });
    load();
  };
  const deleteLbRow = async (id: string) => { await supabase.rpc('delete_leaderboard_entry', { p_id: id }); load(); };

  return (
    <div className="modal-backdrop">
      <section className="staff-panel">
        <div className="staff-header">
          <div>
            <span className="modal-kicker">Protected staff area</span>
            <h2>Grand Five Control Room</h2>
            <p>Signed in as {profile.role}. Server permissions still apply to every action.</p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="staff-tabs">
          <button className={tab === 'review' ? 'active' : ''} onClick={() => setTab('review')}><ShieldCheck size={15} /> Review Queue</button>
          <button className={tab === 'accounts' ? 'active' : ''} onClick={() => setTab('accounts')}><Upload size={15} /> Account Database</button>
          <button className={tab === 'warnings' ? 'active' : ''} onClick={() => setTab('warnings')}><AlertTriangle size={15} /> Warnings & Strikes</button>
          {profile.role === 'owner' && <button className={tab === 'leaderboard' ? 'active' : ''} onClick={() => setTab('leaderboard')}><Crown size={15} /> Leaderboard</button>}
        </div>
        {message && <div className="form-message">{message}</div>}

        {tab === 'review' && (
          <>
            <div className="staff-lists">
              <div className="staff-list">
                <h3>Pending Mods</h3>
                {mods.length === 0 ? <div className="staff-empty">No mods waiting for review.</div> :
                  mods.map((mod) => <div className="review-row" key={mod.id}><div><strong>{mod.title}</strong><span>{mod.category}</span></div><div><button className="reject-button" onClick={() => moderateMod(mod.id, 'rejected')}>Reject</button><button className="approve-button" onClick={() => moderateMod(mod.id, 'approved')}>Approve</button></div></div>)}
              </div>
              <div className="staff-list">
                <h3>Pending Communities</h3>
                {communities.length === 0 ? <div className="staff-empty">No communities waiting for review.</div> :
                  communities.map((c) => <div className="review-row" key={c.id}><div><strong>{c.name}</strong><span>Discord community</span></div><div><button className="reject-button" onClick={() => moderateCommunity(c.id, 'rejected')}>Reject</button><button className="approve-button" onClick={() => moderateCommunity(c.id, 'approved')}>Approve</button></div></div>)}
              </div>
            </div>
            {profile.role === 'owner' && (
              <section className="staff-list approved-list" style={{ marginTop: 16 }}>
                <h3>Featured File Controls (Owner Only)</h3>
                {approvedMods.length === 0 ? <div className="staff-empty">No approved files yet.</div> :
                  approvedMods.map((mod) => <div className="review-row" key={mod.id}><div><strong>{mod.title}</strong><span>{mod.category}</span></div><button className={mod.is_featured ? 'reject-button' : 'approve-button'} onClick={() => setFeatured(mod.id, !mod.is_featured)}>{mod.is_featured ? 'Unfeature' : 'Feature'}</button></div>)}
              </section>
            )}
          </>
        )}

        {tab === 'accounts' && (
          <div className="profile-list">
            {profiles.length === 0 ? <div className="staff-empty">No accounts created yet.</div> :
              profiles.map((member) => (
                <div className="profile-row" key={member.id}>
                  <div><strong>{member.display_name}</strong><span>{member.email} · {member.strikes} strikes</span></div>
                  <select value={member.role} disabled={profile.role !== 'owner'} onChange={(e) => setRole(member.id, e.target.value as Role)}>
                    <option value="member">Member</option><option value="moderator">Moderator</option><option value="admin">Admin</option><option value="owner">Owner</option>
                  </select>
                  <button className={member.is_banned ? 'unban-button' : 'ban-button'} disabled={profile.role === 'moderator' && member.role !== 'member'} onClick={() => setBanned(member.id, !member.is_banned)}>{member.is_banned ? 'Unban' : 'Ban'}</button>
                </div>
              ))}
          </div>
        )}

        {tab === 'warnings' && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: '#1c2b3a', marginBottom: 14 }}>Issue Warning or Strike</h3>
            <div className="warning-row">
              <select value={warnUserId} onChange={(e) => setWarnUserId(e.target.value)} style={{ padding: 8, border: '1px solid #cfd8e3', borderRadius: 3, fontSize: 12, width: 180 }}>
                <option value="">Select user...</option>
                {profiles.filter((p) => p.id !== profile.id).map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
              </select>
              <input value={warnReason} onChange={(e) => setWarnReason(e.target.value)} placeholder="Reason..." />
              <button className="warn-btn" onClick={() => issueWarning(false)}>Warning</button>
              <button className="strike-btn" onClick={() => issueWarning(true)}>Strike</button>
            </div>
            <p style={{ fontSize: 12, color: '#8492a1', marginTop: 14 }}>Three strikes automatically bans the account. Warnings and strikes are sent to the user's notifications.</p>
          </div>
        )}

        {tab === 'leaderboard' && profile.role === 'owner' && (
          <div className="leaderboard-editor">
            {!editingLb ? (
              <button className="publish-btn" onClick={startLbEdit}><Settings size={16} /> Edit Leaderboard</button>
            ) : (
              <>
                {lbRows.map((row, i) => (
                  <div key={i} className="leaderboard-row">
                    <input className="rank-input" type="number" value={row.rank_order} onChange={(e) => { const rows = [...lbRows]; rows[i] = { ...row, rank_order: parseInt(e.target.value) || 0 }; setLbRows(rows); }} placeholder="Rank" />
                    <input className="name-input" value={row.display_name} onChange={(e) => { const rows = [...lbRows]; rows[i] = { ...row, display_name: e.target.value }; setLbRows(rows); }} placeholder="Name" />
                    <input className="label-input" value={row.label} onChange={(e) => { const rows = [...lbRows]; rows[i] = { ...row, label: e.target.value }; setLbRows(rows); }} placeholder="Label" />
                    <input className="value-input" value={row.value} onChange={(e) => { const rows = [...lbRows]; rows[i] = { ...row, value: e.target.value }; setLbRows(rows); }} placeholder="Value" />
                    <button onClick={() => saveLbRow(row)} style={{ background: '#277354', color: 'white', borderRadius: 3, border: 0, padding: '8px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}><Check size={14} /></button>
                    {row.id && <button onClick={() => deleteLbRow(row.id)}><Trash2 size={14} /></button>}
                  </div>
                ))}
                <button className="publish-btn" onClick={() => { setEditingLb(false); load(); }} style={{ marginTop: 16 }}><Check size={16} /> Done</button>
              </>
            )}
            <table className="leaderboard-table" style={{ marginTop: 20 }}>
              <thead><tr><th className="rank-cell">Rank</th><th>Name</th><th>Label</th><th>Value</th></tr></thead>
              <tbody>{leaderboard.map((e) => <tr key={e.id}><td className="rank-cell">#{e.rank_order}</td><td>{e.display_name}</td><td>{e.label}</td><td>{e.value}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ============ FOOTER ============
function Footer({ onSelectCategory, onUpload }: { onSelectCategory: (key: string) => void; onUpload: () => void }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-about">
          <img src="/image copy 2.png" alt="Grand Five Mods" />
          <div>
            <h2>Grand Five Mods</h2>
            <p>Share and download GTA 5 PC mods made by the community.</p>
          </div>
        </div>
        <div className="footer-column">
          <h3>CATEGORIES</h3>
          <div className="footer-category-grid">
            {CATEGORIES.map((c) => <button key={c.key} onClick={() => onSelectCategory(c.key)}>{c.label}</button>)}
            {SPECIAL_CATEGORIES.map((c) => <button key={c.key} onClick={() => onSelectCategory(c.key)}>{c.label}</button>)}
          </div>
        </div>
        <div className="footer-column">
          <h3>COMMUNITY</h3>
          <button onClick={() => navigate({ name: 'communities' })}>All Files</button>
          <button onClick={onUpload}>Upload a mod</button>
          <a href={DISCORD_INVITE_URL} target="_blank" rel="noreferrer"><DiscordIcon size={14} /> Join our Discord</a>
        </div>
      </div>
      <div className="footer-bottom-links">
        <button onClick={() => navigate({ name: 'home' })}>Contact</button>
        <button onClick={() => navigate({ name: 'home' })}>Privacy Policy</button>
        <button onClick={() => navigate({ name: 'home' })}>Terms of Service</button>
        <button onClick={() => navigate({ name: 'home' })}>DMCA</button>
        <button onClick={() => navigate({ name: 'leaderboard' })}>Grand Five Mods Leaderboard</button>
      </div>
      <div className="copyright">© 2026 Grand Five Mods. Not affiliated with Rockstar Games.</div>
    </footer>
  );
}

export default App;
