-- Add expires_at column to polls table
ALTER TABLE public.polls ADD COLUMN expires_at timestamptz null;

-- Add index for efficient querying of expired polls
CREATE INDEX IF NOT EXISTS idx_polls_expires_at ON public.polls(expires_at);

-- Add a check constraint to ensure expires_at is in the future when set
ALTER TABLE public.polls ADD CONSTRAINT check_expires_at_future 
  CHECK (expires_at IS NULL OR expires_at > created_at);
