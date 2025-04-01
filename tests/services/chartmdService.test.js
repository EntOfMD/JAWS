import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import { processChartMDData } from '../../services/chartmdService.js'
import { fetchData } from '../../util/fetchData.js'
import { insertChartMDIncident } from '../../models/chartmdIncidents.js'

jest.unstable_mockModule('../../util/fetchData.js', () => ({
  fetchData: jest.fn(),
}))

jest.unstable_mockModule('../../models/chartmdIncidents.js', () => ({
  insertChartMDIncident: jest.fn(),
}))

describe('ChartMD Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should process valid ChartMD data', async () => {
    const mockData = {
      success: true,
      data: [
        {
          id: 'test-1',
          incidentType: 'CRASH',
          county: 'Montgomery',
          description: 'Test incident',
          name: 'Test location',
          type: 1,
          lat: 39.1234,
          lon: -77.1234,
          createTime: Date.now(),
          startDateTime: Date.now(),
          lastCachedDataUpdateTime: Date.now(),
        },
      ],
    }

    fetchData.mockResolvedValue(mockData)
    insertChartMDIncident.mockResolvedValue()

    await processChartMDData()

    expect(fetchData).toHaveBeenCalled()
    expect(insertChartMDIncident).toHaveBeenCalledWith(
      expect.objectContaining({
        incident_id: 'test-1',
        county: 'Montgomery',
      }),
    )
  })

  it('should handle invalid response data', async () => {
    fetchData.mockResolvedValue({ success: false })
    await processChartMDData()
    expect(insertChartMDIncident).not.toHaveBeenCalled()
  })
})
