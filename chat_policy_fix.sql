-- ============================================================
-- CODEVAULT — CHAT & GROUPS RLS POLICY FIX
-- Paste this script into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- STEP 1: DROP OLD CHAT-RELATED POLICIES
-- ────────────────────────────────────────────────────────────

-- Drop policies on groups
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'groups' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.groups';
  END LOOP;
END $$;

-- Drop policies on group_members
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'group_members' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.group_members';
  END LOOP;
END $$;

-- Drop policies on group_messages
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'group_messages' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.group_messages';
  END LOOP;
END $$;


-- ────────────────────────────────────────────────────────────
-- STEP 2: RECREATE CORRECT POLICIES — groups
-- ────────────────────────────────────────────────────────────

-- Select: Users can view groups they are in, or any global groups, or admin views all
CREATE POLICY "select_groups" ON public.groups
  FOR SELECT
  USING (
    is_global = true
    OR auth.jwt() ->> 'email' = 'admin@admin.com'
    OR id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

-- Insert: Any authenticated user can create a group (only admin can make it global)
CREATE POLICY "insert_groups" ON public.groups
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      is_global = false 
      OR auth.jwt() ->> 'email' = 'admin@admin.com'
    )
  );

-- Update: Creator of group or admin can update it
CREATE POLICY "update_groups" ON public.groups
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR auth.jwt() ->> 'email' = 'admin@admin.com'
  );

-- Delete: Creator of group or admin can delete it
CREATE POLICY "delete_groups" ON public.groups
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR auth.jwt() ->> 'email' = 'admin@admin.com'
  );


-- ────────────────────────────────────────────────────────────
-- STEP 3: RECREATE CORRECT POLICIES — group_members
-- ────────────────────────────────────────────────────────────

-- Select: Users view their own membership, or members of global/owned groups, or admin views all
CREATE POLICY "select_group_members" ON public.group_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR auth.jwt() ->> 'email' = 'admin@admin.com'
    OR EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_members.group_id
      AND (
        is_global = true
        OR created_by = auth.uid()
      )
    )
  );

-- Insert: Authenticated users can join groups, invite members, or admin manages all
CREATE POLICY "insert_group_members" ON public.group_members
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      user_id = auth.uid()
      OR auth.jwt() ->> 'email' = 'admin@admin.com'
      OR EXISTS (
        SELECT 1 FROM public.groups
        WHERE id = group_members.group_id
        AND created_by = auth.uid()
      )
    )
  );

-- Update: Group creator or admin can update membership roles
CREATE POLICY "update_group_members" ON public.group_members
  FOR UPDATE
  USING (
    auth.jwt() ->> 'email' = 'admin@admin.com'
    OR EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_members.group_id
      AND created_by = auth.uid()
    )
  );

-- Delete: Users can leave groups, or creator/admin can remove members
CREATE POLICY "delete_group_members" ON public.group_members
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR auth.jwt() ->> 'email' = 'admin@admin.com'
    OR EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_members.group_id
      AND created_by = auth.uid()
    )
  );


-- ────────────────────────────────────────────────────────────
-- STEP 4: RECREATE CORRECT POLICIES — group_messages
-- ────────────────────────────────────────────────────────────

-- Select: View messages if admin, if group is global, or if user is a member
CREATE POLICY "select_group_messages" ON public.group_messages
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'admin@admin.com'
    OR EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_messages.group_id
      AND is_global = true
    )
    OR EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_messages.group_id
      AND user_id = auth.uid()
    )
  );

-- Insert: Send messages if admin, if group is global, or if user is a member
CREATE POLICY "insert_group_messages" ON public.group_messages
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      auth.jwt() ->> 'email' = 'admin@admin.com'
      OR EXISTS (
        SELECT 1 FROM public.groups
        WHERE id = group_messages.group_id
        AND is_global = true
      )
      OR EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = group_messages.group_id
        AND user_id = auth.uid()
      )
    )
  );

-- Delete: Message owner or admin can delete messages
CREATE POLICY "delete_group_messages" ON public.group_messages
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR auth.jwt() ->> 'email' = 'admin@admin.com'
  );


-- ────────────────────────────────────────────────────────────
-- VERIFY ACTIVE POLICIES
-- ────────────────────────────────────────────────────────────
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'group_members', 'group_messages')
ORDER BY tablename, policyname;
