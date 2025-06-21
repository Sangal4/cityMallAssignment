-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create disasters table
CREATE TABLE IF NOT EXISTS disasters (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    location_name TEXT,
    location GEOGRAPHY(POINT, 4326),
    description TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    owner_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    audit_trail JSONB DEFAULT '[]'::jsonb
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    verification_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location_name TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cache table
CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create geospatial indexes for fast location-based queries
CREATE INDEX IF NOT EXISTS disasters_location_idx ON disasters USING GIST (location);
CREATE INDEX IF NOT EXISTS resources_location_idx ON resources USING GIST (location);

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS disasters_tags_idx ON disasters USING GIN (tags);
CREATE INDEX IF NOT EXISTS disasters_owner_idx ON disasters (owner_id);
CREATE INDEX IF NOT EXISTS disasters_created_idx ON disasters (created_at DESC);
CREATE INDEX IF NOT EXISTS reports_disaster_idx ON reports (disaster_id);
CREATE INDEX IF NOT EXISTS reports_user_idx ON reports (user_id);
CREATE INDEX IF NOT EXISTS resources_disaster_idx ON resources (disaster_id);
CREATE INDEX IF NOT EXISTS resources_type_idx ON resources (type);
CREATE INDEX IF NOT EXISTS cache_expires_idx ON cache (expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for disasters table
CREATE TRIGGER update_disasters_updated_at 
    BEFORE UPDATE ON disasters 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO disasters (id, title, location_name, location, description, tags, owner_id) VALUES
(
    '123e4567-e89b-12d3-a456-426614174000',
    'NYC Flood',
    'Manhattan, NYC',
    ST_SetSRID(ST_Point(-74.0060, 40.7128), 4326),
    'Heavy flooding in Manhattan affecting Lower East Side and surrounding areas',
    ARRAY['flood', 'urgent'],
    'netrunnerX'
),
(
    '123e4567-e89b-12d3-a456-426614174001',
    'California Wildfire',
    'Los Angeles, CA',
    ST_SetSRID(ST_Point(-118.2437, 34.0522), 4326),
    'Major wildfire spreading rapidly in Los Angeles County',
    ARRAY['fire', 'wildfire', 'emergency'],
    'reliefAdmin'
);

INSERT INTO resources (disaster_id, name, location_name, location, type) VALUES
(
    '123e4567-e89b-12d3-a456-426614174000',
    'Red Cross Shelter',
    'Lower East Side, NYC',
    ST_SetSRID(ST_Point(-73.9897, 40.7142), 4326),
    'shelter'
),
(
    '123e4567-e89b-12d3-a456-426614174000',
    'Emergency Food Distribution',
    'Chinatown, NYC',
    ST_SetSRID(ST_Point(-73.9974, 40.7158), 4326),
    'food'
),
(
    '123e4567-e89b-12d3-a456-426614174001',
    'Evacuation Center',
    'Downtown LA',
    ST_SetSRID(ST_Point(-118.2437, 34.0522), 4326),
    'shelter'
);

-- Create RLS (Row Level Security) policies
ALTER TABLE disasters ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (in production, implement proper RLS policies)
CREATE POLICY "Allow all operations on disasters" ON disasters FOR ALL USING (true);
CREATE POLICY "Allow all operations on reports" ON reports FOR ALL USING (true);
CREATE POLICY "Allow all operations on resources" ON resources FOR ALL USING (true); 