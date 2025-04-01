import Parser from 'rss-parser'
import { insertWTOPIncident } from '../models/wtopIncidents.js'
import { error as _error, info, debug } from '../util/logger.js'

const parser = new Parser()
const WTOP_TRAFFIC_RSS_URL = 'https://wtop.com/traffic/feed/'

const extractLocation = (title) => {
  if (!title) return 'Unknown Location'
  const locationMatch = title.match(/^(.*?)(?=\s+\d)/)
  return locationMatch ? locationMatch[0].trim() : 'Unknown Location'
}

const determineSeverity = (title, description) => {
  if (!title && !description) return 'Unknown'
  if (title?.includes('Long Term') || description?.includes('Fatal'))
    return 'Major'
  if (description?.includes('Delay') || description?.includes('Backed up'))
    return 'Moderate'
  return 'Minor'
}

export const processWTOPData = async () => {
  try {
    debug('Fetching WTOP traffic data')
    const feed = await parser.parseURL(WTOP_TRAFFIC_RSS_URL)

    const incidents = feed.items
      .filter(
        (item) =>
          item.title?.includes('Traffic') ||
          item.categories?.includes('Traffic'),
      )
      .map((item) => ({
        incident_id: item.guid,
        title: item.title,
        description: item.contentSnippet,
        location: extractLocation(item.title),
        severity: determineSeverity(item.title, item.contentSnippet),
        reported_time: new Date(item.pubDate),
        last_update: new Date(),
        source: 'WTOP',
        additional_data: {
          link: item.link,
          category: item.categories?.join(', '),
        },
      }))

    debug(`Found ${incidents.length} traffic incidents`)

    let successCount = 0
    for (const incident of incidents) {
      try {
        await insertWTOPIncident(incident)
        debug(`Inserted WTOP incident: ${incident.incident_id}`)
        successCount++
      } catch (err) {
        _error('Failed to insert WTOP incident into DB', {
          error: err.message,
          incident_id: incident.incident_id,
          incident_data: incident,
        })
      }
    }

    info(
      `Processed ${successCount}/${incidents.length} WTOP incidents successfully`,
    )
  } catch (err) {
    _error('WTOP processing failed', { error: err.message })
  }
}
