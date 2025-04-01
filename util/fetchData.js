import axios from 'axios'
import { error as _error, debug } from './logger.js'

export const fetchData = async (url) => {
  try {
    debug(`Fetching data from ${url}`)
    const response = await axios.get(url)

    if (!response || !response.data) {
      throw new Error('No data received from API')
    }

    return response.data
  } catch (err) {
    _error(`Failed to fetch data from ${url}`, {
      error: err.message,
      stack: err.stack,
      url: url,
    })
    return null
  }
}
