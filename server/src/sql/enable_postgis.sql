-- Enable PostGIS extension on the current database
CREATE EXTENSION IF NOT EXISTS postgis;

-- Optional: enable topology if needed
-- CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verify extension
SELECT extname, extversion FROM pg_extension WHERE extname LIKE 'postgis%';

-- Verify functions exist
SELECT PostGIS_Version() AS postgis_version;
