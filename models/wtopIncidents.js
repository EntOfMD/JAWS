import { pool } from '../config/db.js'
import { error as _error } from '../util/logger.js'

export const createWTOPIncidentTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS wtop_incidents (
      incident_id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255),
      description TEXT,
      location VARCHAR(255),
      severity VARCHAR(100),
      lat DOUBLE PRECISION,
      lon DOUBLE PRECISION,
      reported_time TIMESTAMP,
      last_update TIMESTAMP,
      source VARCHAR(100),
      additional_data JSONB
    );
  `
  try {
    await pool.query(query)
  } catch (err) {
    _error('Failed to create WTOP incidents table', {
      error: err.message,
      stack: err.stack,
    })
    throw err
  }
}

export const insertWTOPIncident = async (incident) => {
  const query = `
    INSERT INTO wtop_incidents (
      incident_id, title, description, location, severity,
      lat, lon, reported_time, last_update, source, additional_data
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (incident_id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      location = EXCLUDED.location,
      severity = EXCLUDED.severity,
      lat = EXCLUDED.lat,
      lon = EXCLUDED.lon,
      last_update = EXCLUDED.last_update,
      additional_data = EXCLUDED.additional_data;
  `
  const values = [
    incident.incident_id,
    incident.title,
    incident.description,
    incident.location,
    incident.severity,
    incident.lat,
    incident.lon,
    incident.reported_time,
    incident.last_update,
    incident.source,
    incident.additional_data,
  ]

  try {
    await pool.query(query, values)
  } catch (err) {
    _error('Failed to insert/update WTOP incident', {
      error: err.message,
      incident_id: incident.incident_id,
    })
    throw err
  }
}
