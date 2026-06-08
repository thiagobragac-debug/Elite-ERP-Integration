-- Create user_drafts table
CREATE TABLE IF NOT EXISTS public.user_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    draft_key TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, draft_key)
);

-- Enable RLS
ALTER TABLE public.user_drafts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own drafts"
    ON public.user_drafts
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drafts"
    ON public.user_drafts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
    ON public.user_drafts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
    ON public.user_drafts
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_drafts_user_id ON public.user_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_drafts_updated_at ON public.user_drafts(updated_at);
