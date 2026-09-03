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


-- ==============================================================================
-- INDEXING UNTUK PERFORMA QUERY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_space_members_user ON public.space_members(user_id);
CREATE INDEX IF NOT EXISTS idx_space_members_space ON public.space_members(space_id);
CREATE INDEX IF NOT EXISTS idx_transactions_space_date ON public.transactions(space_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_pending_space_status ON public.pending_validations(space_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_categories_space ON public.categories(space_id);


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
