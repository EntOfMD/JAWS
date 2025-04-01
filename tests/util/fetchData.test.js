import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import axios from 'axios'
import { fetchData } from '../util/fetchData.js'

jest.unstable_mockModule('axios', () => ({
  default: {
    get: jest.fn(),
  },
}))

describe('Fetch Data Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch data successfully', async () => {
    const mockData = { data: { success: true } }
    axios.get.mockResolvedValue(mockData)

    const result = await fetchData('http://test.com')
    expect(result).toEqual(mockData.data)
    expect(axios.get).toHaveBeenCalledWith('http://test.com')
  })

  it('should handle network errors', async () => {
    axios.get.mockRejectedValue(new Error('Network error'))
    const result = await fetchData('http://test.com')
    expect(result).toBeNull()
  })
})
