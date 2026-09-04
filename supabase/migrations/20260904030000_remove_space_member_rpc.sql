-- Migration: 20260904030000_remove_space_member_rpc.sql
-- Description: Fitur Hapus Pasangan (Kick Partner) dan Keluar Celengan (Leave Space) secara aman & atomic

-- 1. Tambahkan policy DELETE pada space_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'space_members' 
      AND policyname = 'Owner can remove partner or partner can leave'
  ) THEN
    CREATE POLICY "Owner can remove partner or partner can leave"
    ON public.space_members FOR DELETE
    USING (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.space_members m
        WHERE m.space_id = space_members.space_id
          AND m.user_id = auth.uid()
          AND m.role = 'owner'
      )
    );
  END IF;
END $$;

-- 2. Fungsi Atomic RPC untuk mengeluarkan pasangan atau keluar sendiri
CREATE OR REPLACE FUNCTION public.remove_space_member(
  _space_id UUID,
  _target_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_target_role TEXT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan' USING ERRCODE = '42501';
  END IF;

  -- 1. Ambil peran pemanggil di space ini
  SELECT role INTO v_caller_role
  FROM public.space_members
  WHERE space_id = _space_id AND user_id = v_caller_id;

  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'Anda bukan anggota dari celengan ini' USING ERRCODE = '42501';
  END IF;

  -- 2. Ambil peran target yang akan dihapus
  SELECT role INTO v_target_role
  FROM public.space_members
  WHERE space_id = _space_id AND user_id = _target_user_id;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'Anggota tidak ditemukan di celengan ini' USING ERRCODE = 'P0002';
  END IF;

  -- 3. Validasi aturan otorisasi:
  -- Kasus A: Owner mengeluarkan partner
  IF v_caller_role = 'owner' AND _target_user_id <> v_caller_id THEN
    -- Owner berhak mengeluarkan partner
    DELETE FROM public.space_members
    WHERE space_id = _space_id AND user_id = _target_user_id;

    RETURN jsonb_build_object(
      'status', 'success',
      'action', 'kicked',
      'target_user_id', _target_user_id
    );

  -- Kasus B: Partner keluar sendiri secara sukarela
  ELSIF v_caller_id = _target_user_id AND v_caller_role = 'partner' THEN
    DELETE FROM public.space_members
    WHERE space_id = _space_id AND user_id = _target_user_id;

    RETURN jsonb_build_object(
      'status', 'success',
      'action', 'left',
      'target_user_id', _target_user_id
    );

  -- Kasus C: Owner mencoba mengeluarkan dirinya sendiri (Dilarang, harus bubarkan celengan)
  ELSIF v_caller_id = _target_user_id AND v_caller_role = 'owner' THEN
    RAISE EXCEPTION 'Pembuat celengan (owner) tidak dapat keluar. Anda harus membubarkan celengan jika ingin menghapus.' USING ERRCODE = 'P0001';

  ELSE
    RAISE EXCEPTION 'Anda tidak memiliki hak untuk mengeluarkan anggota ini' USING ERRCODE = '42501';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.remove_space_member(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_space_member(UUID, UUID) TO authenticated;
