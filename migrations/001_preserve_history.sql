BEGIN;

-- Rename existing table
ALTER TABLE chartmd_incidents RENAME TO chartmd_incidents_old;

-- Create new table
CREATE TABLE chartmd_incidents (
  entry_id BIGSERIAL PRIMARY KEY,
  incident_id VARCHAR(255) NOT NULL,
  -- ...all other columns...
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Copy existing data
INSERT INTO chartmd_incidents (
  incident_id, incident_type, description, location, county,
  severity, lat, lon, lanes, create_time, start_time, last_update,
  direction, vehicles_involved, lanes_status, participants,
  traffic_alert, additional_data, source, op_center
)
SELECT 
  incident_id, incident_type, description, location, county,
  severity, lat, lon, lanes, create_time, start_time, last_update,
  direction, vehicles_involved, lanes_status, participants,
  traffic_alert, additional_data, source, op_center
FROM chartmd_incidents_old;

-- Create indices
CREATE INDEX idx_chartmd_incident_id ON chartmd_incidents(incident_id);
CREATE INDEX idx_chartmd_recorded_at ON chartmd_incidents(recorded_at);

-- Drop old table
DROP TABLE chartmd_incidents_old;

COMMIT;