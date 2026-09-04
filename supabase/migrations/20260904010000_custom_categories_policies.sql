-- ==============================================================================
-- CELENGANKITA - RLS POLICIES FOR CUSTOM CATEGORIES (PER-SPACE)
-- ==============================================================================

-- Pastikan policy UPDATE & DELETE untuk kategori kustom milik space sendiri aktif
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' AND policyname = 'Mengubah kategori kustom pada space sendiri'
  ) THEN
    CREATE POLICY "Mengubah kategori kustom pada space sendiri"
    ON public.categories FOR UPDATE
    USING (is_system = false AND public.is_space_member(space_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' AND policyname = 'Menghapus kategori kustom pada space sendiri'
  ) THEN
    CREATE POLICY "Menghapus kategori kustom pada space sendiri"
    ON public.categories FOR DELETE
    USING (is_system = false AND public.is_space_member(space_id));
  END IF;
END $$;
