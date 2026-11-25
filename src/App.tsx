import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  CarFront, ChevronDown, CircleUserRound, FileCode2, Flag, Globe2,
  Leaf, LogIn, LogOut, MapPin, Menu, MessageCircle, MoreHorizontal, Paintbrush, Search,
  Shield, ShieldCheck, Upload, UsersRound, Wrench, X, Bomb, Zap
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type Role = 'member' | 'moderator' | 'admin' | 'owner';
type AuthMode = 'login' | 'signup';
type Category = { label: string; key: string; icon: typeof Wrench };
type Profile = { id: string; email: string; display_name: string; role: Role; is_banned: boolean };

const categories: Category[] = [
  { label: 'Tools', key: 'tools', icon: Wrench },
  { label: 'Vehicles', key: 'vehicles', icon: CarFront },
  { label: 'Paint Jobs', key: 'paint-jobs', icon: Paintbrush },
  { label: 'Weapons', key: 'weapons', icon: Bomb },
  { label: 'Scripts', key: 'scripts', icon: FileCode2 },
  { label: 'Player', key: 'player', icon: CircleUserRound },
  { label: 'Maps', key: 'maps', icon: MapPin },
  { label: 'Misc', key: 'misc', icon: Leaf },
  { label: 'Other', key: 'other', icon: MoreHorizontal },
];

const languages = ['English', 'Español', 'Deutsch', 'Français', 'Italiano', 'Português', '日本語', '中文', 'العربية'];
const specialCategories: Category[] = [{ label: 'Leaks', key: 'leaks', icon: Flag }, { label: 'FiveM', key: 'fivem', icon: Zap }, { label: 'Communities', key: 'communities', icon: UsersRound }];
const translations: Record<string, { discord: string; upload: string; login: string; welcome: string; prompt: string; featured: string; downloaded: string; liked: string; noFeatured: string; noDownloaded: string; noLiked: string; join: string; joinText: string; madeMod: string; madeModText: string; uploadFile: string; allFiles: string; uploadMod: string }> = {
  English: { discord: 'Grand Five Mods on Discord', upload: 'Upload', login: 'LOG IN / REGISTER', welcome: 'Welcome to Grand Five Mods', prompt: 'Pick a category below to start browsing GTA 5 PC mods:', featured: 'FEATURED FILES', downloaded: 'MOST DOWNLOADED FILES', liked: 'MOST LIKED FILES', noFeatured: 'No featured files yet.', noDownloaded: 'Nothing has been downloaded yet.', noLiked: 'Nothing has been liked yet.', join: 'Join the community', joinText: 'Get help installing mods, share screenshots and meet other modders.', madeMod: 'Made a mod?', madeModText: 'Upload it and let thousands of players download it.', uploadFile: 'Upload a file', allFiles: 'All Files', uploadMod: 'Upload a mod' },
  Español: { discord: 'Grand Five Mods en Discord', upload: 'Subir', login: 'INICIAR SESIÓN / REGISTRARSE', welcome: 'Bienvenido a Grand Five Mods', prompt: 'Elige una categoría para explorar mods de GTA 5:', featured: 'ARCHIVOS DESTACADOS', downloaded: 'MÁS DESCARGADOS', liked: 'MÁS POPULARES', noFeatured: 'Aún no hay archivos destacados.', noDownloaded: 'Aún no se ha descargado nada.', noLiked: 'Aún no hay favoritos.', join: 'Únete a la comunidad', joinText: 'Obtén ayuda, comparte capturas y conoce a otros modders.', madeMod: '¿Creaste un mod?', madeModText: 'Súbelo y deja que miles de jugadores lo descarguen.', uploadFile: 'Subir un archivo', allFiles: 'Todos los archivos', uploadMod: 'Subir un mod' },
  Deutsch: { discord: 'Grand Five Mods auf Discord', upload: 'Hochladen', login: 'ANMELDEN / REGISTRIEREN', welcome: 'Willkommen bei Grand Five Mods', prompt: 'Wähle eine Kategorie für GTA 5 PC-Mods:', featured: 'EMPFOHLENE DATEIEN', downloaded: 'MEISTHERUNTERGELADEN', liked: 'MEISTGEKLICKT', noFeatured: 'Noch keine empfohlenen Dateien.', noDownloaded: 'Noch nichts heruntergeladen.', noLiked: 'Noch nichts geliked.', join: 'Community beitreten', joinText: 'Hilfe erhalten, Screenshots teilen und Modder treffen.', madeMod: 'Mod erstellt?', madeModText: 'Lade ihn hoch und erreiche tausende Spieler.', uploadFile: 'Datei hochladen', allFiles: 'Alle Dateien', uploadMod: 'Mod hochladen' },
  Français: { discord: 'Grand Five Mods sur Discord', upload: 'Importer', login: 'CONNEXION / INSCRIPTION', welcome: 'Bienvenue sur Grand Five Mods', prompt: 'Choisissez une catégorie pour parcourir les mods GTA 5:', featured: 'FICHIERS À LA UNE', downloaded: 'PLUS TÉLÉCHARGÉS', liked: 'PLUS AIMÉS', noFeatured: 'Aucun fichier à la une.', noDownloaded: 'Aucun téléchargement pour le moment.', noLiked: 'Aucun favori pour le moment.', join: 'Rejoindre la communauté', joinText: 'Obtenez de l’aide, partagez vos captures et rencontrez des moddeurs.', madeMod: 'Vous avez créé un mod ?', madeModText: 'Importez-le pour le partager avec des milliers de joueurs.', uploadFile: 'Importer un fichier', allFiles: 'Tous les fichiers', uploadMod: 'Importer un mod' },
  日本語: { discord: 'DiscordでGrand Five Mods', upload: 'アップロード', login: 'ログイン / 登録', welcome: 'Grand Five Modsへようこそ', prompt: 'カテゴリーを選んでGTA 5 PCのModを探しましょう:', featured: '注目のファイル', downloaded: 'ダウンロード数が多いファイル', liked: '人気のファイル', noFeatured: '注目のファイルはまだありません。', noDownloaded: 'ダウンロードされたファイルはまだありません。', noLiked: 'お気に入りはまだありません。', join: 'コミュニティに参加', joinText: 'Modの導入方法を聞いたり、スクリーンショットを共有できます。', madeMod: 'Modを作りましたか？', madeModText: 'アップロードしてプレイヤーに共有しましょう。', uploadFile: 'ファイルをアップロード', allFiles: 'すべてのファイル', uploadMod: 'Modをアップロード' },
  中文: { discord: 'Grand Five Mods Discord', upload: '上传', login: '登录 / 注册', welcome: '欢迎来到 Grand Five Mods', prompt: '选择分类，开始浏览 GTA 5 PC 模组:', featured: '精选文件', downloaded: '下载最多的文件', liked: '最受欢迎的文件', noFeatured: '暂无精选文件。', noDownloaded: '暂无下载记录。', noLiked: '暂无喜欢的文件。', join: '加入社区', joinText: '获取安装帮助，分享截图并认识其他模组作者。', madeMod: '制作了模组？', madeModText: '上传它，让更多玩家下载。', uploadFile: '上传文件', allFiles: '全部文件', uploadMod: '上传模组' },
  العربية: { discord: 'جراند فايف مودز على ديسكورد', upload: 'رفع', login: 'تسجيل الدخول / التسجيل', welcome: 'مرحباً بك في جراند فايف مودز', prompt: 'اختر تصنيفاً لتصفح تعديلات GTA 5:', featured: 'الملفات المميزة', downloaded: 'الأكثر تحميلاً', liked: 'الأكثر إعجاباً', noFeatured: 'لا توجد ملفات مميزة بعد.', noDownloaded: 'لم يتم تنزيل أي ملف بعد.', noLiked: 'لا توجد ملفات أعجبت بها بعد.', join: 'انضم إلى المجتمع', joinText: 'احصل على المساعدة وشارك لقطات الشاشة وتعرف على المطورين.', madeMod: 'هل صنعت تعديلاً؟', madeModText: 'ارفعه ودعه يصل إلى آلاف اللاعبين.', uploadFile: 'رفع ملف', allFiles: 'كل الملفات', uploadMod: 'رفع تعديل' },
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [language, setLanguage] = useState('English');
  const [languageOpen, setLanguageOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const copy = translations[language] ?? translations.English;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setProfile(null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    supabase.from('profiles').select('id,email,display_name,role,is_banned').eq('id', session.user.id).maybeSingle().then(({ data }) => setProfile(data as Profile | null));
  }, [session]);

  const openUpload = () => session ? setSubmitOpen(true) : setAuthMode('login');
  const signOut = async () => { await supabase.auth.signOut(); setAccountOpen(false); };
  const selectCategory = (key: string) => { setActiveCategory(key); document.getElementById('latest-files')?.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <button className="mobile-menu" onClick={() => setMenuOpen((open) => !open)} aria-label="Open navigation"><Menu size={20} /></button>
          <a className="site-logo" href="#top" aria-label="Grand Five Mods"><img src="/image copy.png" alt="Grand Five Mods" /></a>
          <nav className={menuOpen ? 'site-nav is-open' : 'site-nav'}>
            <a className="discord-link" href="#community"><MessageCircle size={15} fill="currentColor" /> {copy.discord}</a>
            <div className="language-control">
              <button className="language-link" onClick={() => setLanguageOpen((open) => !open)}><Globe2 size={16} /> {language} <ChevronDown size={14} /></button>
              {languageOpen && <div className="language-list">{languages.map((item) => <button key={item} onClick={() => { setLanguage(item); setLanguageOpen(false); }}>{item}</button>)}</div>}
            </div>
          </nav>
          <div className="header-actions">
            <button className="header-upload" onClick={openUpload}><Upload size={16} /> {copy.upload}</button>
            {session ? <button className="header-login" onClick={() => setAccountOpen(true)}>{profile?.display_name ?? 'Account'} <ChevronDown size={14} /></button> : <button className="header-login" onClick={() => setAuthMode('login')}>{copy.login}</button>}
            <button className="header-search" aria-label="Search"><Search size={21} /></button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="welcome-band">
          <div className="welcome-heading"><img src="/image copy 2.png" alt="Grand Five Mods crest" /><h1>{copy.welcome}</h1></div>
          <p>{copy.prompt}</p>
          <div className="category-row">{categories.map(({ label, key, icon: Icon }) => <button key={key} className={activeCategory === key ? 'category-tile active' : 'category-tile'} onClick={() => selectCategory(key)}><Icon size={42} strokeWidth={2.2} /><span>{label}</span></button>)}</div>
          <div className="special-category-row">{specialCategories.map(({ label, key, icon: Icon }) => <button key={key} className={activeCategory === key ? 'special-category active' : 'special-category'} onClick={() => selectCategory(key)}><Icon size={17} /><span>{label}</span>{key === 'leaks' && <small>Vehicles · MLOs · Scripts · EUP · Weapons · Liveries</small>}{key === 'fivem' && <small>MLOs · Scripts · Weapons · Paint Jobs · Vehicles · Tools · Misc · Other</small>}{key === 'communities' && <small>Discord servers, profiles, links and galleries</small>}</button>)}</div>
        </section>

        <section className="page-content">
          <div className="content-column">
            <FileSection title={copy.featured} emptyText={copy.noFeatured} />
            <FileSection title={copy.downloaded} emptyText={copy.noDownloaded} />
            <FileSection title={copy.liked} emptyText={copy.noLiked} />
            <div id="latest-files" className="latest-anchor">{activeCategory !== 'all' && <span>Browsing {categories.find((category) => category.key === activeCategory)?.label}</span>}</div>
          </div>
          <aside className="sidebar">
            <div className="sidebar-card community-card" id="community"><img src="/image copy 2.png" alt="Grand Five Mods" /><h2>{copy.join}</h2><p>{copy.joinText}</p><a className="discord-cta" href="#community"><MessageCircle size={16} fill="currentColor" /> {copy.discord}</a></div>
            <div className="sidebar-card upload-card"><h2>{copy.madeMod}</h2><p>{copy.madeModText}</p><button className="sidebar-upload" onClick={openUpload}><Upload size={16} /> {copy.uploadFile}</button></div>
          </aside>
        </section>
      </main>

      <footer className="site-footer"><div className="footer-inner"><div className="footer-about"><img src="/image copy 2.png" alt="Grand Five Mods" /><div><h2>Grand Five Mods</h2><p>Share and download GTA 5 PC mods made by the community.</p></div></div><div className="footer-column"><h3>CATEGORIES</h3><div className="footer-category-grid">{categories.slice(0, 8).map((category) => <a key={category.key} href="#top" onClick={() => selectCategory(category.key)}>{category.label}</a>)}</div></div><div className="footer-column"><h3>COMMUNITY</h3><a href="#latest-files">All Files</a><button onClick={openUpload}>Upload a mod</button><a href="#community"><MessageCircle size={14} fill="currentColor" /> Join our Discord</a></div></div><div className="copyright">© 2026 Grand Five Mods. Not affiliated with Rockstar Games.</div></footer>

      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSwitch={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} />}
      {submitOpen && <SubmissionModal profile={profile} onClose={() => setSubmitOpen(false)} />}
      {accountOpen && <AccountPanel profile={profile} session={session} onClose={() => setAccountOpen(false)} onSignOut={signOut} onSubmit={openUpload} onStaff={() => { setAccountOpen(false); setStaffOpen(true); }} />}
      {staffOpen && profile && <StaffPanel profile={profile} onClose={() => setStaffOpen(false)} />}
    </div>
  );
}

function FileSection({ title, emptyText }: { title: string; emptyText: string }) {
  return <section className="file-section"><div className="file-section-heading"><h2>{title}</h2><button>See All</button></div><div className="empty-file-panel">{emptyText}</div></section>;
}

function AuthModal({ mode, onClose, onSwitch }: { mode: AuthMode; onClose: () => void; onSwitch: () => void }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(''); const result = mode === 'login' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } }); setBusy(false); if (result.error) { setError('We could not complete that request. Check your details and try again.'); return; } if (mode === 'signup' && !result.data.session) setMessage('Your account is ready. You can now sign in.'); else onClose(); };
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="auth-modal"><button className="modal-close" onClick={onClose}><X size={18} /></button><img src="/image copy 2.png" alt="" /><span className="modal-kicker">Grand Five Mods</span><h2>{mode === 'login' ? 'Welcome back' : 'Join the community'}</h2><p>{mode === 'login' ? 'Sign in to upload and manage your creations.' : 'Create an account and share what you build.'}</p><form onSubmit={submit}>{mode === 'signup' && <label>Display name<input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Your creator name" /></label>}<label>Email address<input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" placeholder="you@example.com" /></label><label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} required type="password" minLength={6} placeholder="At least 6 characters" /></label>{error && <div className="form-error">{error}</div>}{message && <div className="form-message">{message}</div>}<button className="modal-submit" disabled={busy}>{busy ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'} <LogIn size={16} /></button></form><button className="modal-switch" onClick={onSwitch}>{mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in'}</button></div></div>;
}

function SubmissionModal({ profile, onClose }: { profile: Profile | null; onClose: () => void }) {
  const [kind, setKind] = useState<'mod' | 'community'>('mod'); const [title, setTitle] = useState(''); const [category, setCategory] = useState('tools'); const [description, setDescription] = useState(''); const [url, setUrl] = useState(''); const [imageUrl, setImageUrl] = useState(''); const [links, setLinks] = useState(''); const [gallery, setGallery] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!profile || profile.is_banned) return; setBusy(true); const result = kind === 'mod' ? await supabase.from('mods').insert({ title, category, description, download_url: url, image_url: imageUrl || null }) : await supabase.from('communities').insert({ name: title, description, invite_url: url, image_url: imageUrl || null, links: links.split(/[,\\n]/).map((item) => item.trim()).filter(Boolean), gallery_urls: gallery.split(/[,\\n]/).map((item) => item.trim()).filter(Boolean) }); setBusy(false); if (result.error) { setError('We could not submit this yet. Please check the details and try again.'); return; } setMessage('Submitted for review. It will appear publicly after approval.'); setTitle(''); setDescription(''); setUrl(''); setImageUrl(''); setLinks(''); setGallery(''); };
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="auth-modal upload-modal"><button className="modal-close" onClick={onClose}><X size={18} /></button><span className="modal-kicker">Creator upload</span><h2>Share something new</h2><p>Every submission is checked before it goes live.</p><div className="upload-tabs"><button className={kind === 'mod' ? 'active' : ''} onClick={() => setKind('mod')}><Wrench size={14} /> Mod file</button><button className={kind === 'community' ? 'active' : ''} onClick={() => setKind('community')}><UsersRound size={14} /> Community</button></div><form onSubmit={submit}><label>{kind === 'mod' ? 'File title' : 'Server name'}<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>{kind === 'mod' && <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>}<label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} required rows={4} /></label><label>{kind === 'mod' ? 'Download link' : 'Discord invite link'}<input value={url} onChange={(event) => setUrl(event.target.value)} required type="url" placeholder="https://" /></label>{kind === 'community' && <><label>Profile picture URL<input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} type="url" placeholder="https://" /></label><label>Additional links<textarea value={links} onChange={(event) => setLinks(event.target.value)} rows={2} placeholder="One link per line" /></label><label>Gallery image URLs<textarea value={gallery} onChange={(event) => setGallery(event.target.value)} rows={2} placeholder="One image URL per line" /></label></>}{kind === 'mod' && <label>Preview image URL<input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} type="url" placeholder="https://" /></label>}{profile?.is_banned && <div className="form-error">This account cannot submit new content right now.</div>}{error && <div className="form-error">{error}</div>}{message && <div className="form-message">{message}</div>}<button className="modal-submit" disabled={busy || profile?.is_banned}>{busy ? 'Submitting...' : 'Send for review'} <ShieldCheck size={16} /></button></form></div></div>;
}

function AccountPanel({ profile, session, onClose, onSignOut, onSubmit, onStaff }: { profile: Profile | null; session: Session | null; onClose: () => void; onSignOut: () => void; onSubmit: () => void; onStaff: () => void }) {
  const isStaff = profile && ['moderator', 'admin', 'owner'].includes(profile.role);
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="account-panel"><div className="account-heading"><div><span className="modal-kicker">Your account</span><h2>{profile?.display_name ?? 'Grand Five member'}</h2></div><button className="modal-close" onClick={onClose}><X size={18} /></button></div><div className="account-user"><div>{profile?.display_name?.slice(0, 1).toUpperCase() ?? 'G'}</div><span>{session?.user.email}<small><Shield size={12} /> {profile?.role ?? 'member'}</small></span></div>{profile?.is_banned && <div className="form-error">This account is restricted from publishing new content.</div>}<button className="account-action" onClick={onSubmit}><Upload size={16} /> Submit new content</button>{isStaff && <button className="account-action" onClick={onStaff}><ShieldCheck size={16} /> Staff dashboard</button>}<button className="sign-out" onClick={onSignOut}><LogOut size={16} /> Sign out</button></aside></div>;
}

function StaffPanel({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [tab, setTab] = useState<'review' | 'accounts'>('review');
  const [mods, setMods] = useState<Array<{ id: string; title: string; category: string; status: string; is_featured: boolean }>>([]);
  const [approvedMods, setApprovedMods] = useState<Array<{ id: string; title: string; category: string; is_featured: boolean }>>([]);
  const [communities, setCommunities] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [profiles, setProfiles] = useState<Array<{ id: string; email: string; display_name: string; role: Role; is_banned: boolean }>>([]);
  const [message, setMessage] = useState('');
  const load = async () => { const [modResult, approvedResult, communityResult, profileResult] = await Promise.all([supabase.from('mods').select('id,title,category,status,is_featured').eq('status', 'pending').order('created_at', { ascending: false }), supabase.from('mods').select('id,title,category,is_featured').eq('status', 'approved').order('created_at', { ascending: false }), supabase.from('communities').select('id,name,status').eq('status', 'pending').order('created_at', { ascending: false }), supabase.from('profiles').select('id,email,display_name,role,is_banned').order('created_at', { ascending: false })]); if (modResult.data) setMods(modResult.data); if (approvedResult.data) setApprovedMods(approvedResult.data); if (communityResult.data) setCommunities(communityResult.data); if (profileResult.data) setProfiles(profileResult.data); };
  useEffect(() => { load(); }, []);
  const moderateMod = async (id: string, status: 'approved' | 'rejected') => { const { error } = await supabase.rpc('moderate_mod', { p_mod: id, p_status: status }); if (error) { setMessage('That action could not be completed.'); return; } setMessage(`Mod ${status}.`); await load(); };
  const moderateCommunity = async (id: string, status: 'approved' | 'rejected') => { const { error } = await supabase.rpc('moderate_community', { p_community: id, p_status: status }); if (error) { setMessage('That action could not be completed.'); return; } setMessage(`Community ${status}.`); await load(); };
  const setRole = async (id: string, role: Role) => { const { error } = await supabase.rpc('set_member_role', { p_member: id, p_role: role }); if (error) { setMessage('You do not have permission to make that change.'); return; } setMessage('Account role updated.'); await load(); };
  const setBanned = async (id: string, banned: boolean) => { const { error } = await supabase.rpc('set_member_banned', { p_member: id, p_banned: banned }); if (error) { setMessage('You do not have permission to make that change.'); return; } setMessage(banned ? 'Account banned from creating accounts.' : 'Account unbanned.'); await load(); };
  const setFeatured = async (id: string, featured: boolean) => { const { error } = await supabase.rpc('set_mod_featured', { p_mod: id, p_featured: featured }); if (error) { setMessage('Only the owner can feature files.'); return; } setMessage(featured ? 'File featured.' : 'File removed from featured files.'); await load(); };
  return <div className="modal-backdrop"><section className="staff-panel"><div className="staff-header"><div><span className="modal-kicker">Protected staff area</span><h2>Grand Five control room</h2><p>Signed in as {profile.role}. Server permissions still apply to every action.</p></div><button className="modal-close" onClick={onClose}><X size={18} /></button></div><div className="staff-tabs"><button className={tab === 'review' ? 'active' : ''} onClick={() => setTab('review')}><ShieldCheck size={15} /> Review queue</button><button className={tab === 'accounts' ? 'active' : ''} onClick={() => setTab('accounts')}><UsersRound size={15} /> Account database</button></div>{message && <div className="form-message">{message}</div>}{tab === 'review' ? <><div className="staff-lists"><StaffList title="Pending mods" empty="No mods are waiting for review." items={mods.map((mod) => ({ id: mod.id, label: mod.title, detail: mod.category }))} onAction={moderateMod} /><StaffList title="Pending communities" empty="No communities are waiting for review." items={communities.map((community) => ({ id: community.id, label: community.name, detail: 'Discord community' }))} onAction={moderateCommunity} /></div>{profile.role === 'owner' && <section className="staff-list approved-list"><h3>Featured file controls · owner only</h3>{approvedMods.length === 0 ? <div className="staff-empty">No approved files are available yet.</div> : approvedMods.map((mod) => <div className="review-row" key={mod.id}><div><strong>{mod.title}</strong><span>{mod.category}</span></div><button className={mod.is_featured ? 'reject-button' : 'approve-button'} onClick={() => setFeatured(mod.id, !mod.is_featured)}>{mod.is_featured ? 'Remove featured' : 'Feature file'}</button></div>)}</section>}</> : <div className="profile-list">{profiles.length === 0 ? <div className="staff-empty">No accounts have been created yet.</div> : profiles.map((member) => <div className="profile-row" key={member.id}><div><strong>{member.display_name}</strong><span>{member.email}</span></div><select value={member.role} disabled={profile.role !== 'owner'} onChange={(event) => setRole(member.id, event.target.value as Role)}><option value="member">Member</option><option value="moderator">Moderator</option><option value="admin">Admin</option><option value="owner">Owner</option></select><button className={member.is_banned ? 'unban-button' : 'ban-button'} disabled={profile.role === 'moderator' || (profile.role === 'admin' && member.role === 'owner')} onClick={() => setBanned(member.id, !member.is_banned)}>{member.is_banned ? 'Unban' : 'Ban'}</button></div>)}</div>}</section></div>;
}

function StaffList({ title, empty, items, onAction }: { title: string; empty: string; items: Array<{ id: string; label: string; detail: string }>; onAction: (id: string, status: 'approved' | 'rejected') => void }) {
  return <section className="staff-list"><h3>{title}</h3>{items.length === 0 ? <div className="staff-empty">{empty}</div> : items.map((item) => <div className="review-row" key={item.id}><div><strong>{item.label}</strong><span>{item.detail}</span></div><div><button className="reject-button" onClick={() => onAction(item.id, 'rejected')}>Reject</button><button className="approve-button" onClick={() => onAction(item.id, 'approved')}>Approve</button></div></div>)}</section>;
}

export default App;
