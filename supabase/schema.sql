-- ==============================================================================
-- CELENGANKITA - SUPABASE POSTGRESQL DATABASE SCHEMA (TARGET RP0 & HIGH SECURITY)
-- ==============================================================================

-- 1. TABEL PROFILES (Tersinkronisasi dengan auth.users Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Trigger untuk membuat baris profile otomatis saat user mendaftar di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. TABEL SPACES (Ruang Anggaran Bersama untuk Pasangan)
CREATE TABLE IF NOT EXISTS public.spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    currency VARCHAR(5) DEFAULT 'IDR' NOT NULL,
    invite_code VARCHAR(8) UNIQUE NOT NULL,
    webhook_token_hash TEXT UNIQUE NOT NULL, -- SHA-256 hash dari API token MacroDroid/Tasker
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- 3. TABEL SPACE_MEMBERS (Relasi Pengguna dengan Space)
CREATE TABLE IF NOT EXISTS public.space_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' NOT NULL CHECK (role IN ('owner', 'partner', 'member')),
    nickname TEXT, -- Contoh: "Ayah", "Bunda", "Mas Abyan", "Adek"
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(space_id, user_id)
);


-- 4. TABEL CATEGORIES (Kategori Pemasukan & Pengeluaran)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE, -- NULL jika kategori bawaan sistem
    name TEXT NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT DEFAULT 'tag',
    color TEXT DEFAULT '#10B981',
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- 5. TABEL TRANSACTIONS (Pencatatan Keuangan Resmi)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    transaction_date TIMESTAMPTZ DEFAULT now() NOT NULL,
    description TEXT,
    source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'webhook', 'ocr')),
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- 6. TABEL PENDING_VALIDATIONS (Antrean Notifikasi Makro HP Android & OCR)
CREATE TABLE IF NOT EXISTS public.pending_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    source_app VARCHAR(50) NOT NULL, -- e.g. 'BCA', 'GoPay', 'ShopeePay', 'BRI', 'BNI', 'SeaBank', 'OCR'
    parsed_amount NUMERIC(15, 2),
    parsed_type VARCHAR(10) DEFAULT 'expense' CHECK (parsed_type IN ('income', 'expense')),
    parsed_merchant TEXT,
    suggested_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    idempotency_hash TEXT UNIQUE NOT NULL, -- SHA-256(space_id + source_app + raw_text + date_hour)
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 7. TABEL RECEIPT_EVALUATIONS (Telemetri Riset KIE & Komparasi Skripsi: Spatial vs LLM)
CREATE TABLE IF NOT EXISTS public.receipt_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    raw_text TEXT NOT NULL,
    spatial_merchant TEXT,
    spatial_amount NUMERIC(15, 2),
    spatial_latency_ms INTEGER DEFAULT 0,
    llm_merchant TEXT,
    llm_amount NUMERIC(15, 2),
    llm_latency_ms INTEGER DEFAULT 0,
    llm_status TEXT DEFAULT 'pending',
    actual_merchant TEXT NOT NULL,
    actual_amount NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==============================================================================
-- INDEXING UNTUK PERFORMA QUERY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_space_members_user ON public.space_members(user_id);
CREATE INDEX IF NOT EXISTS idx_space_members_space ON public.space_members(space_id);
CREATE INDEX IF NOT EXISTS idx_transactions_space_date ON public.transactions(space_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_pending_space_status ON public.pending_validations(space_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_categories_space ON public.categories(space_id);
CREATE INDEX IF NOT EXISTS idx_receipt_evaluations_space ON public.receipt_evaluations(space_id);


-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_validations ENABLE ROW LEVEL SECURITY;

-- Helper Security Definer Function untuk verifikasi keanggotaan space secara instan tanpa infinite recursion
CREATE OR REPLACE FUNCTION public.is_space_member(_space_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_id = _space_id AND user_id = auth.uid()
  );
$$;

-- RLS PROFILES
CREATE POLICY "Pengguna bisa membaca profil mereka sendiri atau partner di space yang sama"
ON public.profiles FOR SELECT
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.space_members m1
    JOIN public.space_members m2 ON m1.space_id = m2.space_id
    WHERE m1.user_id = auth.uid() AND m2.user_id = public.profiles.id
  )
);

CREATE POLICY "Pengguna bisa memperbarui profilnya sendiri"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

-- RLS SPACES
CREATE POLICY "Anggota bisa melihat space mereka"
ON public.spaces FOR SELECT
USING (public.is_space_member(id));

CREATE POLICY "Pengguna terautentikasi bisa membuat space baru"
ON public.spaces FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anggota bisa memperbarui informasi space"
ON public.spaces FOR UPDATE
USING (public.is_space_member(id));

-- RLS SPACE_MEMBERS
CREATE POLICY "Anggota bisa melihat anggota di space yang sama"
ON public.space_members FOR SELECT
USING (public.is_space_member(space_id));

CREATE POLICY "Pengguna bisa bergabung ke space"
ON public.space_members FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.is_space_member(space_id));

CREATE POLICY "Anggota bisa mengupdate profil perannya di space"
ON public.space_members FOR UPDATE
USING (public.is_space_member(space_id));

-- RLS CATEGORIES
CREATE POLICY "Melihat kategori bawaan atau kategori space sendiri"
ON public.categories FOR SELECT
USING (is_system = true OR public.is_space_member(space_id));

CREATE POLICY "Menambah kategori baru pada space"
ON public.categories FOR INSERT
WITH CHECK (public.is_space_member(space_id));

CREATE POLICY "Mengubah kategori kustom pada space sendiri"
ON public.categories FOR UPDATE
USING (is_system = false AND public.is_space_member(space_id));

CREATE POLICY "Menghapus kategori kustom pada space sendiri"
ON public.categories FOR DELETE
USING (is_system = false AND public.is_space_member(space_id));

-- RLS TRANSACTIONS
CREATE POLICY "Melihat transaksi pada space sendiri"
ON public.transactions FOR SELECT
USING (public.is_space_member(space_id));

CREATE POLICY "Membuat transaksi pada space sendiri"
ON public.transactions FOR INSERT
WITH CHECK (public.is_space_member(space_id));

CREATE POLICY "Mengubah transaksi pada space sendiri"
ON public.transactions FOR UPDATE
USING (public.is_space_member(space_id));

CREATE POLICY "Menghapus transaksi pada space sendiri"
ON public.transactions FOR DELETE
USING (public.is_space_member(space_id));

-- RLS PENDING_VALIDATIONS
CREATE POLICY "Melihat antrean validasi pada space sendiri"
ON public.pending_validations FOR SELECT
USING (public.is_space_member(space_id));

CREATE POLICY "Mengupdate status antrean validasi"
ON public.pending_validations FOR UPDATE
USING (public.is_space_member(space_id));

CREATE POLICY "Menghapus entri validasi"
ON public.pending_validations FOR DELETE
USING (public.is_space_member(space_id));

-- RLS RECEIPT_EVALUATIONS (Telemetri Riset Skripsi)
ALTER TABLE public.receipt_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Melihat evaluasi struk pada space sendiri"
ON public.receipt_evaluations FOR SELECT
USING (public.is_space_member(space_id));

CREATE POLICY "Menambah evaluasi struk pada space sendiri"
ON public.receipt_evaluations FOR INSERT
WITH CHECK (public.is_space_member(space_id));


-- ==============================================================================
-- DEFAULT CATEGORIES DATA (SEEDS)
-- ==============================================================================
INSERT INTO public.categories (name, type, icon, color, is_system) VALUES
('Makanan & Minuman', 'expense', 'utensils', '#EF4444', true),
('Belanja Bulanan & Dapur', 'expense', 'shopping-cart', '#F59E0B', true),
('Tagihan & Utilitas', 'expense', 'zap', '#3B82F6', true),
('Transportasi', 'expense', 'car', '#8B5CF6', true),
('Hiburan & Kencan', 'expense', 'heart', '#EC4899', true),
('Kesehatan & Obat', 'expense', 'activity', '#10B981', true),
('Pendidikan & Buku', 'expense', 'book-open', '#6366F1', true),
('Lain-lain', 'expense', 'more-horizontal', '#6B7280', true),
('Gaji Suami / Istri', 'income', 'briefcase', '#10B981', true),
('Bonus & THR', 'income', 'gift', '#059669', true),
('Investasi & Dividen', 'income', 'trending-up', '#047857', true),
('Pendapatan Sampingan', 'income', 'dollar-sign', '#34D399', true)
ON CONFLICT DO NOTHING;


-- ==============================================================================
-- SECURITY DEFINER RPC FUNCTIONS (ATOMIC & STRICT SEARCH_PATH)
-- ==============================================================================

-- 1. join_space_by_code
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
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan' USING ERRCODE = '42501';
  END IF;

  v_clean_code := UPPER(TRIM(COALESCE(_invite_code, '')));
  IF LENGTH(v_clean_code) <> 8 THEN
    RAISE EXCEPTION 'Kode undangan tidak valid atau kedaluwarsa' USING ERRCODE = 'P0001';
  END IF;

  v_clean_nickname := COALESCE(NULLIF(TRIM(_nickname), ''), 'Pasangan');

  SELECT id INTO v_space_id
  FROM public.spaces
  WHERE invite_code = v_clean_code;

  IF v_space_id IS NULL THEN
    RAISE EXCEPTION 'Kode undangan tidak valid atau kedaluwarsa' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_id = v_space_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object(
      'status', 'already_member',
      'space_id', v_space_id
    );
  END IF;

  INSERT INTO public.space_members (space_id, user_id, role, nickname)
  VALUES (v_space_id, v_user_id, 'partner', v_clean_nickname)
  ON CONFLICT (space_id, user_id) DO NOTHING;

  RETURN jsonb_build_object(
    'status', 'success',
    'space_id', v_space_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.join_space_by_code(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_space_by_code(text, text) TO authenticated;

-- 2. rotate_space_webhook_token
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

  IF NOT public.is_space_member(_space_id) THEN
    RAISE EXCEPTION 'Akses tidak diizinkan' USING ERRCODE = '42501';
  END IF;

  v_clean_hash := LOWER(TRIM(COALESCE(_new_hash, '')));
  IF LENGTH(v_clean_hash) <> 64 THEN
    RAISE EXCEPTION 'Format token hash tidak valid' USING ERRCODE = '22023';
  END IF;

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

-- 3. approve_pending_validation_atomic
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

  UPDATE public.pending_validations
  SET status = 'approved',
      resolved_at = now(),
      resolved_by = v_user_id
  WHERE id = _validation_id
    AND status = 'pending'
  RETURNING space_id, parsed_type, parsed_amount, parsed_merchant, source_app, created_at
  INTO v_rec;

  IF v_rec IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'already_resolved',
      'message', 'Notifikasi transaksi ini sudah divalidasi sebelumnya.'
    );
  END IF;

  IF NOT public.is_space_member(v_rec.space_id) THEN
    RAISE EXCEPTION 'Akses tidak diizinkan' USING ERRCODE = '42501';
  END IF;

  v_final_amount := COALESCE(_custom_amount, v_rec.parsed_amount, 0);
  IF v_final_amount <= 0 THEN
    RAISE EXCEPTION 'Nominal transaksi harus lebih besar dari 0' USING ERRCODE = '22003';
  END IF;

  v_final_desc := COALESCE(
    NULLIF(TRIM(_custom_description), ''),
    v_rec.parsed_merchant,
    v_rec.source_app || ' - Notifikasi Otomatis'
  );

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

-- 4. reject_pending_validation_atomic
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

