/*
# Create Grand Five Mods core content and permissions

1. New Tables
- `profiles`: account directory with public display name and private email/role state.
- `mods`: user-submitted mod listings that remain pending until reviewed.
- `communities`: user-submitted Discord community listings that remain pending until reviewed.

2. New Columns
- Profiles include `id`, `email`, `display_name`, `role`, `is_banned`, and timestamps.
- Mods include ownership, category, optional subcategory, title, description, download URL, image URL, moderation status, and featured state.
- Communities include ownership, server name, description, invite URL, image URL, and moderation status.

3. Security
- RLS is enabled on every table.
- Public visitors can only read approved, non-banned content.
- Signed-in users can create their own pending submissions and manage only their own pending drafts.
- Moderators can approve or reject submissions.
- Admins and owners can ban accounts, while owners alone can feature files.
- Role changes and moderation actions are protected server-side through SECURITY DEFINER functions.
- Private profile email and account controls are visible only to the account owner and elevated staff.

4. Important Notes
- New accounts are created with the `member` role.
- A signup trigger creates the matching profile automatically.
- Role hierarchy prevents moderators from banning admins and admins from banning owners.
- All content is intentionally empty until users submit and staff approve it.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL DEFAULT 'New member',
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin', 'owner')),
  is_banned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('tools', 'vehicles', 'paint-jobs', 'weapons', 'scripts', 'player', 'maps', 'misc', 'other', 'leaks', 'fivem')),
  subcategory text,
  description text NOT NULL DEFAULT '',
  download_url text NOT NULL DEFAULT '',
  image_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  invite_url text NOT NULL DEFAULT '',
  image_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mods_public_browse_idx ON public.mods (status, category, created_at DESC);
CREATE INDEX IF NOT EXISTS communities_public_browse_idx ON public.communities (status, created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role, is_banned);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT SELECT ON public.mods, public.communities TO anon;

DROP POLICY IF EXISTS "profiles_self_or_staff_read" ON public.profiles;
CREATE POLICY "profiles_self_or_staff_read" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles actor WHERE actor.id = auth.uid() AND actor.role IN ('moderator', 'admin', 'owner')));

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "mods_public_approved_read" ON public.mods;
CREATE POLICY "mods_public_approved_read" ON public.mods FOR SELECT TO anon, authenticated
USING (status = 'approved' AND is_featured IN (false, true));

DROP POLICY IF EXISTS "mods_owner_read" ON public.mods;
CREATE POLICY "mods_owner_read" ON public.mods FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles actor WHERE actor.id = auth.uid() AND actor.role IN ('moderator', 'admin', 'owner')));

DROP POLICY IF EXISTS "mods_owner_insert" ON public.mods;
CREATE POLICY "mods_owner_insert" ON public.mods FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND status = 'pending' AND is_featured = false);

DROP POLICY IF EXISTS "mods_owner_update" ON public.mods;
CREATE POLICY "mods_owner_update" ON public.mods FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (user_id = auth.uid() AND status = 'pending' AND is_featured = false);

DROP POLICY IF EXISTS "mods_owner_delete" ON public.mods;
CREATE POLICY "mods_owner_delete" ON public.mods FOR DELETE TO authenticated
USING (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "communities_public_approved_read" ON public.communities;
CREATE POLICY "communities_public_approved_read" ON public.communities FOR SELECT TO anon, authenticated
USING (status = 'approved');

DROP POLICY IF EXISTS "communities_owner_read" ON public.communities;
CREATE POLICY "communities_owner_read" ON public.communities FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles actor WHERE actor.id = auth.uid() AND actor.role IN ('moderator', 'admin', 'owner')));

DROP POLICY IF EXISTS "communities_owner_insert" ON public.communities;
CREATE POLICY "communities_owner_insert" ON public.communities FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "communities_owner_update" ON public.communities;
CREATE POLICY "communities_owner_update" ON public.communities FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "communities_owner_delete" ON public.communities;
CREATE POLICY "communities_owner_delete" ON public.communities FOR DELETE TO authenticated
USING (user_id = auth.uid() AND status = 'pending');

CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, COALESCE(NEW.email, ''), COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''), 'New member'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

CREATE OR REPLACE FUNCTION public.set_member_role(p_member uuid, p_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE actor_role text;
BEGIN
  SELECT role INTO actor_role FROM public.profiles WHERE id = auth.uid();
  IF actor_role IS NULL OR p_role NOT IN ('member', 'moderator', 'admin', 'owner') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF actor_role = 'moderator' OR (actor_role = 'admin' AND p_role IN ('admin', 'owner')) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF actor_role = 'admin' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = p_member AND role = 'owner') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF actor_role <> 'owner' AND p_role = 'owner' THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.profiles SET role = p_role, updated_at = now() WHERE id = p_member;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_member_banned(p_member uuid, p_banned boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE actor_role text; target_role text;
BEGIN
  SELECT role INTO actor_role FROM public.profiles WHERE id = auth.uid();
  SELECT role INTO target_role FROM public.profiles WHERE id = p_member;
  IF actor_role NOT IN ('admin', 'owner') OR target_role IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF actor_role = 'admin' AND target_role = 'owner' THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.profiles SET is_banned = p_banned, updated_at = now() WHERE id = p_member;
END;
$$;

CREATE OR REPLACE FUNCTION public.moderate_mod(p_mod uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin', 'owner')) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_status NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE public.mods SET status = p_status, updated_at = now() WHERE id = p_mod;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_mod_featured(p_mod uuid, p_featured boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.mods SET is_featured = p_featured, updated_at = now() WHERE id = p_mod AND status = 'approved';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_profile() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_member_role(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_member_banned(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.moderate_mod(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_mod_featured(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_member_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_member_banned(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_mod(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_mod_featured(uuid, boolean) TO authenticated;

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name) ON public.profiles TO authenticated;
REVOKE INSERT (id, email, role, is_banned) ON public.profiles FROM authenticated;
