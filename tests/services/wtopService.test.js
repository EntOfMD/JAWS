import { jest, describe, it, expect, beforeEach, afterAll } from '@jest/globals'

// Mock puppeteer
const mockPage = {
  setRequestInterception: jest.fn(),
  setViewport: jest.fn(),
  goto: jest.fn(),
  waitForSelector: jest.fn(),
  evaluate: jest.fn(),
  on: jest.fn(),
  close: jest.fn()
}

const mockBrowser = {
  newPage: jest.fn(() => mockPage),
  close: jest.fn()
}

jest.unstable_mockModule('puppeteer', () => ({
  default: {
    launch: jest.fn(() => mockBrowser)
  }
}))

// Mock database operations
const mockInsertIncident = jest.fn()
jest.unstable_mockModule('../../models/wtopIncidents.js', () => ({
  insertWTOPIncident: mockInsertIncident
}))

// Import after mocking
const { processWTOPData, cleanup } = await import('../../services/wtopService.js')

describe('WTOP Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock response
    mockPage.evaluate.mockResolvedValue([{
      incident_id: 'traffic-stream-item-543478',
      severity: 'traffic-stream-severity-3',
      title: 'Crash',
      description: 'I-270 Local Lanes northbound near Shady Grove Rd (#8), proceed with caution',
      location: 'I-270 Local Lanes',
      reported_time: '04/01/2025 at 07:53pm',
      last_update: '04/01/2025 at 07:53pm',
      source: 'WTOP',
      additional_data: {
        direction: 'northbound',
        blockage: 'proceed with caution',
        type: 'crash'
      }
    }])

    // Mock successful page load
    mockPage.goto.mockResolvedValue()
    mockPage.waitForSelector.mockResolvedValue()
  })

  afterAll(async () => {
    await cleanup()
  })

  it('should process valid WTOP traffic data', async () => {
    await processWTOPData()

    // Verify page setup
    expect(mockPage.setRequestInterception).toHaveBeenCalledWith(true)
    expect(mockPage.setViewport).toHaveBeenCalledWith(expect.any(Object))
    expect(mockPage.waitForSelector).toHaveBeenCalledWith('#incidents_container', { timeout: 5000 })

    // Verify data processing
    expect(mockInsertIncident).toHaveBeenCalledWith(expect.objectContaining({
      incident_id: 'traffic-stream-item-543478',
      severity: 'Major',
      title: 'Crash',
      source: 'WTOP'
    }))
  })

  it('should handle network timeouts', async () => {
    mockPage.goto.mockRejectedValue(new Error('Navigation timeout'))
    await processWTOPData()
    expect(mockInsertIncident).not.toHaveBeenCalled()
  })

  it('should handle missing incident container', async () => {
    mockPage.waitForSelector.mockRejectedValue(new Error('Timeout'))
    await processWTOPData()
    expect(mockInsertIncident).not.toHaveBeenCalled()
  })

  it('should handle empty incident list', async () => {
    mockPage.evaluate.mockResolvedValue([])
    await processWTOPData()
    expect(mockInsertIncident).not.toHaveBeenCalled()
  })

  it('should handle invalid date formats', async () => {
    mockPage.evaluate.mockResolvedValue([{
      incident_id: 'test-1',
      severity: 'traffic-stream-severity-3',
      title: 'Test Incident',
      description: 'Test Description',
      location: 'Test Location',
      reported_time: 'invalid date',
      last_update: 'invalid date',
      source: 'WTOP',
      additional_data: {}
    }])
    
    await processWTOPData()
    
    // Verify the incident was processed with fallback dates
    expect(mockInsertIncident).toHaveBeenCalledWith(
      expect.objectContaining({
        incident_id: 'test-1',
        severity: 'Major',
        reported_time: expect.any(Date),
        last_update: expect.any(Date)
      })
    )
  })

  it('should process incidents in batches', async () => {
    // Create mock incidents with all required fields
    const mockIncidents = Array.from({ length: 7 }, (_, i) => ({
      incident_id: `test-${i}`,
      severity: 'traffic-stream-severity-3',
      title: `Test Incident ${i}`,
      description: `Test Description ${i}`,
      location: `Test Location ${i}`,
      reported_time: '04/01/2025 at 07:53pm',
      last_update: '04/01/2025 at 07:53pm',
      source: 'WTOP',
      additional_data: {}
    }))
    
    mockPage.evaluate.mockResolvedValue(mockIncidents)
    await processWTOPData()
    
    // Verify all incidents were processed
    expect(mockInsertIncident).toHaveBeenCalledTimes(7)
    
    // Verify first and last incidents
    expect(mockInsertIncident).toHaveBeenCalledWith(
      expect.objectContaining({
        incident_id: 'test-0',
        severity: 'Major'
      })
    )
    expect(mockInsertIncident).toHaveBeenCalledWith(
      expect.objectContaining({
        incident_id: 'test-6',
        severity: 'Major'
      })
    )
  })

  it('should handle database insertion errors', async () => {
    mockInsertIncident.mockRejectedValue(new Error('DB Error'))
    await processWTOPData()
    expect(mockPage.close).toHaveBeenCalled()
  })

  it('should handle failed inserts gracefully', async () => {
    mockPage.evaluate.mockResolvedValue([{
      incident_id: 'test-1',
      reported_time: '04/01/2025 at 07:53pm'
    }])
    mockInsertIncident.mockRejectedValueOnce(new Error('Insert failed'))
    
    await expect(processWTOPData()).resolves.not.toThrow()
  })

  it('should handle concurrent processing correctly', async () => {
    const mockIncidents = Array.from({ length: 100 }, (_, i) => ({
      incident_id: `test-${i}`,
      severity: 'traffic-stream-severity-3',
      title: `Test Incident ${i}`,
      description: `Test Description ${i}`,
      location: `Test Location ${i}`,
      reported_time: '04/01/2025 at 07:53pm',
      last_update: '04/01/2025 at 07:53pm',
      source: 'WTOP',
      additional_data: {}
    }))
    
    mockPage.evaluate.mockResolvedValue(mockIncidents)
    await processWTOPData()
    
    expect(mockInsertIncident).toHaveBeenCalledTimes(100)
  })
})
