/*
# Extend Grand Five Mods with full community, social, notification, and moderation features

1. Modified Tables
- `profiles`: adds avatar_url, location, country, socials (jsonb), profile_picture_type, show_adult_content, dark_mode, strikes counters.
- `mods`: adds author text, tags jsonb, video_url, file_name, file_size_bytes, file_storage_path, download_count, like_count.
- `communities`: adds tags jsonb, banner_url.

2. New Tables
- `mod_likes`, `mod_bookmarks`, `mod_follows`, `creator_follows`: social engagement tracking.
- `comments`: comments on mods with optional parent for replies.
- `notifications`: per-user notifications for replies, likes, comments, warnings.
- `warnings`: staff-issued warnings and strikes against accounts.
- `cart_items`: per-user cart entries for bulk download.
- `leaderboard_entries`: owner-editable leaderboard rows.

3. Security
- RLS enabled on every new table. Public can read approved content, likes, bookmarks, follows, comments, leaderboard.
- Authenticated users manage their own likes, bookmarks, follows, comments, cart, notifications.
- Warnings readable by warned user and staff; creatable by staff via SECURITY DEFINER function.
- Leaderboard publicly readable; editable by owners only via SECURITY DEFINER function.
- New SECURITY DEFINER functions: create_notification, issue_warning, save_leaderboard_entry, delete_leaderboard_entry, increment_mod_download.
- Owner email (grandfivemodsghost@gmail.com) auto-assigned owner role on signup.

4. Important Notes
- One email per account enforced by Supabase auth.
- Three strikes => auto-ban enforced in issue_warning function.
- Download counts incremented server-side.
*/

-- Profiles: extend with social and preference columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS socials jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_picture_type text NOT NULL DEFAULT 'default';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_adult_content boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dark_mode boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS strikes integer NOT NULL DEFAULT 0;

-- Mods: extend with author, tags, media, file metadata, counters
ALTER TABLE public.mods ADD COLUMN IF NOT EXISTS author text NOT NULL DEFAULT '';
ALTER TABLE public.mods ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.mods ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.mods ADD COLUMN IF NOT EXISTS file_name text NOT NULL DEFAULT '';
ALTER TABLE public.mods ADD COLUMN IF NOT EXISTS file_size_bytes bigint NOT NULL DEFAULT 0;
ALTER TABLE public.mods ADD COLUMN IF NOT EXISTS file_storage_path text;
ALTER TABLE public.mods ADD COLUMN IF NOT EXISTS download_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.mods ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0;

-- Communities: extend with tags and banner
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS banner_url text;

-- Allow subcategories to be any of the standard category keys
ALTER TABLE public.mods DROP CONSTRAINT IF EXISTS mods_subcategory_check;
ALTER TABLE public.mods ADD CONSTRAINT mods_subcategory_check
  CHECK (subcategory IS NULL OR subcategory IN ('tools', 'vehicles', 'paint-jobs', 'weapons', 'scripts', 'player', 'maps', 'misc', 'other'));

-- Extend profiles self-update to new columns
REVOKE UPDATE ON public.profiles FROM anon;
GRANT UPDATE (display_name, avatar_url, location, country, socials, profile_picture_type, show_adult_content, dark_mode) ON public.profiles TO authenticated;

-- Anon should NOT have INSERT/UPDATE/DELETE on profiles, mods, communities
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.mods FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.communities FROM anon;

-- ============ mod_likes ============
CREATE TABLE IF NOT EXISTS public.mod_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  mod_id uuid NOT NULL REFERENCES public.mods(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mod_id)
);
ALTER TABLE public.mod_likes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.mod_likes TO authenticated;
DROP POLICY IF EXISTS "mod_likes_read" ON public.mod_likes;
CREATE POLICY "mod_likes_read" ON public.mod_likes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "mod_likes_self_insert" ON public.mod_likes;
CREATE POLICY "mod_likes_self_insert" ON public.mod_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "mod_likes_self_delete" ON public.mod_likes;
CREATE POLICY "mod_likes_self_delete" ON public.mod_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ mod_bookmarks ============
CREATE TABLE IF NOT EXISTS public.mod_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  mod_id uuid NOT NULL REFERENCES public.mods(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mod_id)
);
ALTER TABLE public.mod_bookmarks ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.mod_bookmarks TO authenticated;
DROP POLICY IF EXISTS "mod_bookmarks_read" ON public.mod_bookmarks;
CREATE POLICY "mod_bookmarks_read" ON public.mod_bookmarks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "mod_bookmarks_self_insert" ON public.mod_bookmarks;
CREATE POLICY "mod_bookmarks_self_insert" ON public.mod_bookmarks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "mod_bookmarks_self_delete" ON public.mod_bookmarks;
CREATE POLICY "mod_bookmarks_self_delete" ON public.mod_bookmarks FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ mod_follows ============
CREATE TABLE IF NOT EXISTS public.mod_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  mod_id uuid NOT NULL REFERENCES public.mods(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mod_id)
);
ALTER TABLE public.mod_follows ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.mod_follows TO authenticated;
DROP POLICY IF EXISTS "mod_follows_read" ON public.mod_follows;
CREATE POLICY "mod_follows_read" ON public.mod_follows FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "mod_follows_self_insert" ON public.mod_follows;
CREATE POLICY "mod_follows_self_insert" ON public.mod_follows FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "mod_follows_self_delete" ON public.mod_follows;
CREATE POLICY "mod_follows_self_delete" ON public.mod_follows FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ creator_follows ============
CREATE TABLE IF NOT EXISTS public.creator_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, creator_id),
  CHECK (follower_id <> creator_id)
);
ALTER TABLE public.creator_follows ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.creator_follows TO authenticated;
DROP POLICY IF EXISTS "creator_follows_read" ON public.creator_follows;
CREATE POLICY "creator_follows_read" ON public.creator_follows FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "creator_follows_self_insert" ON public.creator_follows;
CREATE POLICY "creator_follows_self_insert" ON public.creator_follows FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
DROP POLICY IF EXISTS "creator_follows_self_delete" ON public.creator_follows;
CREATE POLICY "creator_follows_self_delete" ON public.creator_follows FOR DELETE TO authenticated USING (follower_id = auth.uid());

-- ============ comments ============
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mod_id uuid NOT NULL REFERENCES public.mods(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comments_mod_idx ON public.comments (mod_id, created_at);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.comments TO authenticated;
DROP POLICY IF EXISTS "comments_public_read" ON public.comments;
CREATE POLICY "comments_public_read" ON public.comments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "comments_self_insert" ON public.comments;
CREATE POLICY "comments_self_insert" ON public.comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "comments_self_delete" ON public.comments;
CREATE POLICY "comments_self_delete" ON public.comments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ notifications ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'comment',
  body text NOT NULL DEFAULT '',
  link_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
DROP POLICY IF EXISTS "notifications_self_read" ON public.notifications;
CREATE POLICY "notifications_self_read" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notifications_self_update" ON public.notifications;
CREATE POLICY "notifications_self_update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "notifications_self_delete" ON public.notifications;
CREATE POLICY "notifications_self_delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ warnings ============
CREATE TABLE IF NOT EXISTS public.warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  issued_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT '',
  is_strike boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS warnings_user_idx ON public.warnings (user_id, created_at DESC);
ALTER TABLE public.warnings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.warnings TO authenticated;
DROP POLICY IF EXISTS "warnings_self_or_staff_read" ON public.warnings;
CREATE POLICY "warnings_self_or_staff_read" ON public.warnings FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles actor WHERE actor.id = auth.uid() AND actor.role IN ('moderator', 'admin', 'owner')));

-- ============ cart_items ============
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  mod_id uuid NOT NULL REFERENCES public.mods(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mod_id)
);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.cart_items TO authenticated;
DROP POLICY IF EXISTS "cart_self_read" ON public.cart_items;
CREATE POLICY "cart_self_read" ON public.cart_items FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "cart_self_insert" ON public.cart_items;
CREATE POLICY "cart_self_insert" ON public.cart_items FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "cart_self_delete" ON public.cart_items;
CREATE POLICY "cart_self_delete" ON public.cart_items FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ leaderboard_entries ============
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_order integer NOT NULL DEFAULT 0,
  display_name text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.leaderboard_entries TO anon, authenticated;
DROP POLICY IF EXISTS "leaderboard_public_read" ON public.leaderboard_entries;
CREATE POLICY "leaderboard_public_read" ON public.leaderboard_entries FOR SELECT TO anon, authenticated USING (true);

-- ============ Functions ============

-- Create notification (internal, not exposed to clients)
CREATE OR REPLACE FUNCTION public.create_notification(p_user uuid, p_type text, p_body text, p_link text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, body, link_url) VALUES (p_user, p_type, p_body, p_link);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text) FROM PUBLIC, anon, authenticated;

-- Issue warning/strike; auto-ban at 3 strikes
CREATE OR REPLACE FUNCTION public.issue_warning(p_user uuid, p_reason text, p_is_strike boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE actor_role text; new_strikes int;
BEGIN
  SELECT role INTO actor_role FROM public.profiles WHERE id = auth.uid();
  IF actor_role NOT IN ('moderator', 'admin', 'owner') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  INSERT INTO public.warnings (user_id, issued_by, reason, is_strike) VALUES (p_user, auth.uid(), p_reason, p_is_strike);
  IF p_is_strike THEN
    UPDATE public.profiles SET strikes = strikes + 1 WHERE id = p_user RETURNING strikes INTO new_strikes;
    IF new_strikes >= 3 THEN
      UPDATE public.profiles SET is_banned = true, updated_at = now() WHERE id = p_user;
    END IF;
    PERFORM public.create_notification(p_user, 'strike', 'You received a strike: ' || p_reason || ' (' || new_strikes || '/3. Three strikes results in a ban.');
  ELSE
    PERFORM public.create_notification(p_user, 'warning', 'You received a warning: ' || p_reason);
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.issue_warning(uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_warning(uuid, text, boolean) TO authenticated;

-- Save leaderboard entry (owner only) - p_id last so defaults work
CREATE OR REPLACE FUNCTION public.save_leaderboard_entry(p_rank integer, p_name text, p_label text, p_value text, p_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE actor_role text; out_id uuid;
BEGIN
  SELECT role INTO actor_role FROM public.profiles WHERE id = auth.uid();
  IF actor_role <> 'owner' THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_id IS NOT NULL THEN
    UPDATE public.leaderboard_entries SET rank_order = p_rank, display_name = p_name, label = p_label, value = p_value WHERE id = p_id;
    out_id := p_id;
  ELSE
    INSERT INTO public.leaderboard_entries (rank_order, display_name, label, value) VALUES (p_rank, p_name, p_label, p_value) RETURNING id INTO out_id;
  END IF;
  RETURN out_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.save_leaderboard_entry(integer, text, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_leaderboard_entry(integer, text, text, text, uuid) TO authenticated;

-- Delete leaderboard entry (owner only)
CREATE OR REPLACE FUNCTION public.delete_leaderboard_entry(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE actor_role text;
BEGIN
  SELECT role INTO actor_role FROM public.profiles WHERE id = auth.uid();
  IF actor_role <> 'owner' THEN RAISE EXCEPTION 'Not authorized'; END IF;
  DELETE FROM public.leaderboard_entries WHERE id = p_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.delete_leaderboard_entry(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_leaderboard_entry(uuid) TO authenticated;

-- Increment mod download count
CREATE OR REPLACE FUNCTION public.increment_mod_download(p_mod uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.mods SET download_count = download_count + 1 WHERE id = p_mod;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.increment_mod_download(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_mod_download(uuid) TO anon, authenticated;

-- Update set_member_banned to allow moderators to ban members
CREATE OR REPLACE FUNCTION public.set_member_banned(p_member uuid, p_banned boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE actor_role text; target_role text;
BEGIN
  SELECT role INTO actor_role FROM public.profiles WHERE id = auth.uid();
  SELECT role INTO target_role FROM public.profiles WHERE id = p_member;
  IF actor_role NOT IN ('moderator', 'admin', 'owner') OR target_role IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF actor_role = 'moderator' AND target_role NOT IN ('member') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF actor_role = 'admin' AND target_role = 'owner' THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.profiles SET is_banned = p_banned, updated_at = now() WHERE id = p_member;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_member_banned(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_member_banned(uuid, boolean) TO authenticated;

-- Ensure owner email gets owner role on signup
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE new_role text := 'member';
BEGIN
  IF NEW.email = 'grandfivemodsghost@gmail.com' THEN new_role := 'owner'; END IF;
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (NEW.id, COALESCE(NEW.email, ''), COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''), 'New member'), new_role)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_profile() FROM PUBLIC, anon, authenticated;

-- Indexes
CREATE INDEX IF NOT EXISTS mod_likes_mod_idx ON public.mod_likes (mod_id);
CREATE INDEX IF NOT EXISTS mod_bookmarks_mod_idx ON public.mod_bookmarks (mod_id);
CREATE INDEX IF NOT EXISTS mod_follows_mod_idx ON public.mod_follows (mod_id);
CREATE INDEX IF NOT EXISTS mods_category_browse_idx ON public.mods (category, subcategory, status, created_at DESC);
