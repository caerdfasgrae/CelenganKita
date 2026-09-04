-- Migration: 20260904020000_receipt_evaluations.sql
-- Description: Create receipt_evaluations table for academic thesis benchmark (Spatial vs Lightweight LLM)
-- Telemetri riset tersembunyi (Silent Ground Truth Data Collection)

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

-- Row Level Security (RLS)
ALTER TABLE public.receipt_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Space members can select receipt evaluations"
    ON public.receipt_evaluations
    FOR SELECT
    USING (public.is_space_member(space_id));

CREATE POLICY "Space members can insert receipt evaluations"
    ON public.receipt_evaluations
    FOR INSERT
    WITH CHECK (public.is_space_member(space_id));

CREATE INDEX IF NOT EXISTS idx_receipt_evaluations_space_id ON public.receipt_evaluations(space_id);
CREATE INDEX IF NOT EXISTS idx_receipt_evaluations_created_at ON public.receipt_evaluations(created_at DESC);
