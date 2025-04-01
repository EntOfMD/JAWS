// tests/models/chartmdIncidents.test.js
import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
} from '@jest/globals'

// Create mock query function
const mockQuery = jest.fn()

// Mock before importing the modules that use it
jest.unstable_mockModule('../../config/db.js', () => ({
  pool: { query: mockQuery },
}))

let createChartMDIncidentTable
let insertChartMDIncident

// Setup before tests
beforeAll(async () => {
  const module = await import('../../models/chartmdIncidents.js')
  createChartMDIncidentTable = module.createChartMDIncidentTable
  insertChartMDIncident = module.insertChartMDIncident
})

describe('ChartMD Incidents', () => {
  beforeEach(() => {
    mockQuery.mockReset()
  })

  it('should create incidents table with history tracking columns', async () => {
    mockQuery.mockResolvedValue({ rows: [] })
    await createChartMDIncidentTable()

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS chartmd_incidents'),
    )
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('entry_id BIGSERIAL PRIMARY KEY'),
    )
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('recorded_at TIMESTAMP WITH TIME ZONE'),
    )
  })

  it('should insert incident data with preserved history', async () => {
    const mockIncident = {
      incident_id: 'test-1',
      incident_type: 'CRASH',
      description: 'Test incident',
      county: 'Montgomery',
      severity: 1,
      lat: 39.1234,
      lon: -77.1234,
      lanes: 'All lanes blocked',
      create_time: new Date(),
      start_time: new Date(),
      last_update: new Date(),
      direction: 'North',
      vehicles_involved: '2 vehicles',
      lanes_status: 'Closed',
      participants: 'Police, Fire',
      traffic_alert: true,
      additionalData: { key: 'value' },
      source: 'ChartMD',
      opCenter: 'TOC3',
    }

    mockQuery.mockResolvedValue({ rows: [] })
    await insertChartMDIncident(mockIncident)

    // Verify query contains all fields
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO chartmd_incidents'),
      expect.arrayContaining([
        mockIncident.incident_id,
        mockIncident.incident_type,
        mockIncident.description,
        mockIncident.county,
        mockIncident.severity,
        mockIncident.lat,
        mockIncident.lon,
        mockIncident.lanes,
        mockIncident.create_time,
        mockIncident.start_time,
        mockIncident.last_update,
        mockIncident.direction,
        mockIncident.vehicles_involved,
        mockIncident.lanes_status,
        mockIncident.participants,
        mockIncident.traffic_alert,
        mockIncident.additionalData,
        mockIncident.source,
        mockIncident.opCenter,
      ]),
    )
  })

  it('should handle database errors gracefully', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'))
    await expect(createChartMDIncidentTable()).rejects.toThrow('DB error')
  })

  it('should create required indices', async () => {
    mockQuery.mockResolvedValue({ rows: [] })
    await createChartMDIncidentTable()

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining(
        'CREATE INDEX IF NOT EXISTS idx_chartmd_incident_id',
      ),
    )
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining(
        'CREATE INDEX IF NOT EXISTS idx_chartmd_recorded_at',
      ),
    )
  })
})
