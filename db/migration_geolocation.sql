-- Add location tracking enabled field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_tracking_enabled BOOLEAN DEFAULT TRUE;

-- Add recorded_at field to locations table to support timestamps from client
ALTER TABLE locations ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMP WITH TIME ZONE;

-- Make name field optional to support auto-tracked locations
ALTER TABLE locations ALTER COLUMN name DROP NOT NULL;

-- Add additional location data fields
ALTER TABLE locations ADD COLUMN IF NOT EXISTS accuracy DECIMAL(10, 2);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS altitude DECIMAL(10, 2);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS altitude_accuracy DECIMAL(10, 2);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS heading DECIMAL(10, 2);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS speed DECIMAL(10, 2);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);

-- Create index for faster timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_locations_created_at ON locations(created_at);
CREATE INDEX IF NOT EXISTS idx_locations_recorded_at ON locations(recorded_at);

-- Add a comment to document the location source field values
COMMENT ON COLUMN locations.source IS 'Source of location: manual, browser, mobile, etc.'; 