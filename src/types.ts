export type Role = 'member' | 'moderator' | 'admin' | 'owner';
export type AuthMode = 'login' | 'signup';
export type ModStatus = 'pending' | 'approved' | 'rejected';

export interface CategoryDef {
  label: string;
  key: string;
  icon: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  is_banned: boolean;
  avatar_url: string | null;
  location: string | null;
  country: string | null;
  socials: Record<string, string> | null;
  profile_picture_type: string;
  show_adult_content: boolean;
  dark_mode: boolean;
  strikes: number;
}

export interface Mod {
  id: string;
  user_id: string;
  title: string;
  author: string;
  category: string;
  subcategory: string | null;
  description: string;
  download_url: string;
  image_url: string | null;
  video_url: string | null;
  tags: string[];
  file_name: string;
  file_size_bytes: number;
  file_storage_path: string | null;
  download_count: number;
  like_count: number;
  status: ModStatus;
  is_featured: boolean;
  created_at: string;
}

export interface Community {
  id: string;
  user_id: string;
  name: string;
  description: string;
  invite_url: string;
  image_url: string | null;
  banner_url: string | null;
  tags: string[];
  links: string[];
  gallery_urls: string[];
  status: ModStatus;
  created_at: string;
}

export interface Comment {
  id: string;
  mod_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string | null;
}

export interface Notification {
  id: string;
  type: string;
  body: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  rank_order: number;
  display_name: string;
  label: string;
  value: string;
}

export interface CartItem {
  id: string;
  mod_id: string;
  mod_title: string;
  mod_image: string | null;
  mod_download_url: string;
}

export type Route =
  | { name: 'home' }
  | { name: 'category'; category: string; subcategory?: string }
  | { name: 'communities' }
  | { name: 'mod'; id: string }
  | { name: 'profile'; userId: string }
  | { name: 'leaderboard' }
  | { name: 'pending' }
  | { name: 'my-uploads' }
  | { name: 'my-bookmarks' }
  | { name: 'my-likes' }
  | { name: 'my-follows' }
  | { name: 'account-settings' };
