import { pool } from '../config/db.js'
import { error as _error, info } from '../util/logger.js'

export const createChartMDIncidentTable = async () => {
  // Create table if it doesn't exist
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS chartmd_incidents (
      entry_id BIGSERIAL PRIMARY KEY,
      incident_id VARCHAR(255) NOT NULL,
      incident_type VARCHAR(255),
      description TEXT,
      location VARCHAR(255),
      county VARCHAR(100),
      severity INTEGER,
      lat DOUBLE PRECISION,
      lon DOUBLE PRECISION,
      lanes TEXT,
      create_time TIMESTAMP,
      start_time TIMESTAMP,
      last_update TIMESTAMP,
      direction VARCHAR(50),
      vehicles_involved TEXT,
      lanes_status TEXT,
      participants TEXT,
      traffic_alert BOOLEAN,
      additional_data JSONB,
      source VARCHAR(100),
      op_center VARCHAR(100),
      recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indices if they don't exist
    CREATE INDEX IF NOT EXISTS idx_chartmd_incident_id ON chartmd_incidents(incident_id);
    CREATE INDEX IF NOT EXISTS idx_chartmd_recorded_at ON chartmd_incidents(recorded_at);
  `

  try {
    const result = await pool.query(createTableQuery)
    result.rowCount
      ? info(`Table created with ${result.rowCount} rows affected)`)
      : info('Skipping create table, already exists')
  } catch (err) {
    _error('Failed to create ChartMD incidents table', {
      error: err.message,
      stack: err.stack,
    })
    throw err
  }
}

export const insertChartMDIncident = async (incident) => {
  const query = `
    INSERT INTO chartmd_incidents (
      incident_id, incident_type, description, location, county,
      severity, lat, lon, lanes, create_time, start_time, last_update,
      direction, vehicles_involved, lanes_status, participants,
      traffic_alert, additional_data, source, op_center
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
  `

  try {
    await pool.query(query, [
      incident.incident_id,
      incident.incident_type,
      incident.description,
      incident.location,
      incident.county,
      incident.severity,
      incident.lat,
      incident.lon,
      incident.lanes,
      incident.create_time,
      incident.start_time,
      incident.last_update,
      incident.direction,
      incident.vehicles_involved,
      incident.lanes_status,
      incident.participants,
      incident.traffic_alert,
      incident.additionalData || {},
      incident.source,
      incident.opCenter,
    ])
    info(`Inserted ChartMD incident: ${incident.incident_id}`)

    return true
  } catch (err) {
    _error('Failed to insert ChartMD incident', {
      error: err.message,
      incident_id: incident.incident_id,
    })
    throw err
  }
}
