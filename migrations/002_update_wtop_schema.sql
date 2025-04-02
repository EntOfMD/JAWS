-- Remove unused columns
ALTER TABLE wtop_incidents 
  DROP COLUMN IF EXISTS lat,
  DROP COLUMN IF EXISTS lon;

-- Add created_at column if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'wtop_incidents' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE wtop_incidents
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_wtop_last_update ON wtop_incidents(last_update);