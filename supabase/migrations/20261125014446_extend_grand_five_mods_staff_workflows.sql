/*
# Extend Grand Five Mods staff workflows and community listings

1. Modified Tables
- `communities`: adds `links` and `gallery_urls` JSON fields for approved Discord listings.

2. New Security Function
- `moderate_community`: lets moderators, admins, and owners approve or reject community submissions.

3. Security
- The new function checks the signed-in caller's role on the server.
- Existing role, ban, moderation, and owner-only featured controls remain protected by their existing SECURITY DEFINER functions.
- No existing rows, columns, or user data are removed.

4. Important Notes
- Community submissions remain pending until staff approve them.
- Links and gallery URLs are stored as structured JSON values and are still displayed as plain text by the client until a safe media renderer is added.
*/

ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS links jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS gallery_urls jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.moderate_community(p_community uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin', 'owner')) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_status NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE public.communities SET status = p_status, updated_at = now() WHERE id = p_community;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.moderate_community(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moderate_community(uuid, text) TO authenticated;
