-- ==============================================================================
-- CELENGANKITA - MIGRATION 20260904000000: SECURITY & RPC HARDENING
-- ==============================================================================

-- 0. SCHEMA SAFETY: Pastikan kolom pendukung tersedia
ALTER TABLE public.spaces 
ADD COLUMN IF NOT EXISTS webhook_token_hash text;

ALTER TABLE public.pending_validations 
ADD COLUMN IF NOT EXISTS idempotency_hash text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pending_validations_idempotency_hash_key'
  ) THEN
    ALTER TABLE public.pending_validations 
    ADD CONSTRAINT pending_validations_idempotency_hash_key UNIQUE (idempotency_hash);
  END IF;
END $$;

-- 1. RPC: join_space_by_code
-- Memungkinkan calon anggota bergabung ke space menggunakan invite_code secara aman
-- Kebal terhadap RLS tanpa membocorkan row tabel spaces ke publik.
CREATE OR REPLACE FUNCTION public.join_space_by_code(
  _invite_code text,
  _nickname text DEFAULT 'Pasangan'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_space_id uuid;
  v_clean_code text;
  v_clean_nickname text;
BEGIN
  -- 1. Verifikasi pengguna terautentikasi
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan' USING ERRCODE = '42501';
  END IF;

  -- 2. Validasi input kode undangan
  v_clean_code := UPPER(TRIM(COALESCE(_invite_code, '')));
  IF LENGTH(v_clean_code) <> 8 THEN
    RAISE EXCEPTION 'Kode undangan tidak valid atau kedaluwarsa' USING ERRCODE = 'P0001';
  END IF;

  v_clean_nickname := COALESCE(NULLIF(TRIM(_nickname), ''), 'Pasangan');

  -- 3. Cari space berdasarkan kode undangan
  SELECT id INTO v_space_id
  FROM public.spaces
  WHERE invite_code = v_clean_code;

  IF v_space_id IS NULL THEN
    -- Pesan generik untuk mencegah serangan enumerasi invite code
    RAISE EXCEPTION 'Kode undangan tidak valid atau kedaluwarsa' USING ERRCODE = 'P0001';
  END IF;

  -- 4. Periksa apakah sudah menjadi anggota
  IF EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_id = v_space_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object(
      'status', 'already_member',
      'space_id', v_space_id
    );
  END IF;

  -- 5. Masukkan ke space_members secara atomic
  INSERT INTO public.space_members (space_id, user_id, role, nickname)
  VALUES (v_space_id, v_user_id, 'partner', v_clean_nickname)
  ON CONFLICT (space_id, user_id) DO NOTHING;

  RETURN jsonb_build_object(
    'status', 'success',
    'space_id', v_space_id
  );
END;
$$;

-- Berikan izin eksekusi hanya untuk pengguna yang login (authenticated)
REVOKE ALL ON FUNCTION public.join_space_by_code(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_space_by_code(text, text) TO authenticated;


-- 2. RPC: rotate_space_webhook_token
-- Memungkinkan anggota space merotasi Webhook Key secara instant invalidation
CREATE OR REPLACE FUNCTION public.rotate_space_webhook_token(
  _space_id uuid,
  _new_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_clean_hash text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan' USING ERRCODE = '42501';
  END IF;

  -- Verifikasi otorisasi keanggotaan space
  IF NOT public.is_space_member(_space_id) THEN
    RAISE EXCEPTION 'Akses tidak diizinkan' USING ERRCODE = '42501';
  END IF;

  v_clean_hash := LOWER(TRIM(COALESCE(_new_hash, '')));
  IF LENGTH(v_clean_hash) <> 64 THEN
    RAISE EXCEPTION 'Format token hash tidak valid' USING ERRCODE = '22023';
  END IF;

  -- Update token hash (instant invalidation untuk token lama)
  UPDATE public.spaces
  SET webhook_token_hash = v_clean_hash,
      updated_at = now()
  WHERE id = _space_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'space_id', _space_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rotate_space_webhook_token(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rotate_space_webhook_token(uuid, text) TO authenticated;


-- 3. RPC: approve_pending_validation_atomic
-- Menjamin transisi status pending -> approved dan pencatatan transaksi bersifat atomic
-- Melindungi dari concurrent approval atau duplicate replay
CREATE OR REPLACE FUNCTION public.approve_pending_validation_atomic(
  _validation_id uuid,
  _category_id uuid,
  _custom_amount numeric DEFAULT NULL,
  _custom_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_rec record;
  v_final_amount numeric;
  v_final_desc text;
  v_new_tx_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan' USING ERRCODE = '42501';
  END IF;

  -- Atomic update: Hanya row dengan status 'pending' yang diupdate
  UPDATE public.pending_validations
  SET status = 'approved',
      resolved_at = now(),
      resolved_by = v_user_id
  WHERE id = _validation_id
    AND status = 'pending'
  RETURNING space_id, parsed_type, parsed_amount, parsed_merchant, source_app, created_at
  INTO v_rec;

  -- Bila tidak ada baris yang di-update (sudah disetujui/ditolak oleh request konkuren lain)
  IF v_rec IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'already_resolved',
      'message', 'Notifikasi transaksi ini sudah divalidasi sebelumnya.'
    );
  END IF;

  -- Verifikasi hak akses pengguna di space
  IF NOT public.is_space_member(v_rec.space_id) THEN
    RAISE EXCEPTION 'Akses tidak diizinkan' USING ERRCODE = '42501';
  END IF;

  -- Hitung nominal akhir
  v_final_amount := COALESCE(_custom_amount, v_rec.parsed_amount, 0);
  IF v_final_amount <= 0 THEN
    RAISE EXCEPTION 'Nominal transaksi harus lebih besar dari 0' USING ERRCODE = '22003';
  END IF;

  -- Hitung deskripsi akhir
  v_final_desc := COALESCE(
    NULLIF(TRIM(_custom_description), ''),
    v_rec.parsed_merchant,
    v_rec.source_app || ' - Notifikasi Otomatis'
  );

  -- Insert ke tabel transactions
  INSERT INTO public.transactions (
    space_id,
    user_id,
    category_id,
    type,
    amount,
    description,
    source,
    transaction_date
  ) VALUES (
    v_rec.space_id,
    v_user_id,
    _category_id,
    v_rec.parsed_type,
    v_final_amount,
    v_final_desc,
    'webhook',
    v_rec.created_at
  )
  RETURNING id INTO v_new_tx_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'transaction_id', v_new_tx_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.approve_pending_validation_atomic(uuid, uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_pending_validation_atomic(uuid, uuid, numeric, text) TO authenticated;


-- 4. RPC: reject_pending_validation_atomic
-- Menjamin penolakan notifikasi bersifat atomic dan kebal dari race condition
CREATE OR REPLACE FUNCTION public.reject_pending_validation_atomic(
  _validation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_space_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan' USING ERRCODE = '42501';
  END IF;

  -- Ambil space_id untuk pengecekan membership
  SELECT space_id INTO v_space_id
  FROM public.pending_validations
  WHERE id = _validation_id;

  IF v_space_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'message', 'Notifikasi tidak ditemukan.'
    );
  END IF;

  IF NOT public.is_space_member(v_space_id) THEN
    RAISE EXCEPTION 'Akses tidak diizinkan' USING ERRCODE = '42501';
  END IF;

  -- Atomic update
  UPDATE public.pending_validations
  SET status = 'rejected',
      resolved_at = now(),
      resolved_by = v_user_id
  WHERE id = _validation_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'already_resolved',
      'message', 'Notifikasi transaksi ini sudah divalidasi sebelumnya.'
    );
  END IF;

  RETURN jsonb_build_object(
    'status', 'success'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reject_pending_validation_atomic(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_pending_validation_atomic(uuid) TO authenticated;
