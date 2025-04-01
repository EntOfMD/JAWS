import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import { processWTOPData } from '../../services/wtopService.js'
import { insertWTOPIncident } from '../../models/wtopIncidents.js'
import Parser from 'rss-parser'

jest.unstable_mockModule('rss-parser', () => ({
  default: jest.fn().mockImplementation(() => ({
    parseURL: jest.fn(),
  })),
}))

jest.unstable_mockModule('../../models/wtopIncidents.js', () => ({
  insertWTOPIncident: jest.fn(),
}))

describe('WTOP Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should process valid WTOP feed data', async () => {
    const mockFeed = {
      items: [
        {
          guid: 'wtop-1',
          title: 'Traffic Alert: Accident on I-495',
          contentSnippet: 'Major delays due to accident',
          pubDate: new Date().toISOString(),
          categories: ['Traffic'],
        },
      ],
    }

    Parser.prototype.parseURL.mockResolvedValue(mockFeed)
    insertWTOPIncident.mockResolvedValue()

    await processWTOPData()

    expect(Parser.prototype.parseURL).toHaveBeenCalled()
    expect(insertWTOPIncident).toHaveBeenCalledWith(
      expect.objectContaining({
        incident_id: 'wtop-1',
        source: 'WTOP',
      }),
    )
  })

  it('should handle feed parsing errors', async () => {
    Parser.prototype.parseURL.mockRejectedValue(new Error('Feed error'))
    await processWTOPData()
    expect(insertWTOPIncident).not.toHaveBeenCalled()
  })
})
