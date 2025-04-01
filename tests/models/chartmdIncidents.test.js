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

  it('should create incidents table', async () => {
    mockQuery.mockResolvedValue({ rows: [] })
    await createChartMDIncidentTable()
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS chartmd_incidents'),
    )
  })

  it('should insert incident data', async () => {
    const mockIncident = {
      incident_id: 'test-1',
      incident_type: 'CRASH',
      county: 'Montgomery',
    }

    mockQuery.mockResolvedValue({ rows: [] })
    await insertChartMDIncident(mockIncident)
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO chartmd_incidents'),
      expect.arrayContaining([mockIncident.incident_id]),
    )
  })

  it('should handle database errors', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'))
    await expect(createChartMDIncidentTable()).rejects.toThrow('DB error')
  })
})
