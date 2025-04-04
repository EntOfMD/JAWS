import { fetchData } from '../util/fetchData.js'
import { insertChartMDIncident } from '../models/chartmdIncidents.js'
import { error as _error, info, debug } from '../util/logger.js'

const CHARTMD_URL =
  'https://chartexp1.sha.maryland.gov/CHARTExportClientService/getEventMapDataJSON.do'

export const processChartMDData = async () => {
  let processedCount = 0
  try {
    const response = await fetchData(CHARTMD_URL)

    if (!response || !response.success || !response.data) {
      _error('Invalid ChartMD response structure', { response })
      return 0
    }

    const incidents = response.data
      .filter((incident) => incident.county === 'Montgomery')
      .map((incident) => ({
        incident_id: incident.id,
        incident_type: incident.incidentType,
        description: incident.description,
        location: incident.name || incident.other || 'Unknown',
        county: incident.county,
        severity: incident.type,
        lat: incident.lat,
        lon: incident.lon,
        lanes:
          incident.lanes
            ?.map((lane) => `${lane.laneDescription} (${lane.laneStatus})`)
            .join(', ') || '',
        create_time: new Date(incident.createTime),
        start_time: new Date(incident.startDateTime),
        last_update: new Date(incident.lastCachedDataUpdateTime),
        direction: incident.direction || 'Unknown',
        vehicles_involved: incident.vehicles || 'Unknown',
        lanes_status: incident.lanesStatus || 'All lanes open',
        participants: incident.participants?.join(', ') || '',
        traffic_alert: incident.trafficAlert || false,
      }))

    debug(`Found ${incidents.length} Montgomery County incidents`)

    for (const incident of incidents) {
      try {
        await insertChartMDIncident(incident)
        processedCount++
      } catch (err) {
        _error('Failed to insert ChartMD incident', {
          error: err.message,
          incident_id: incident.incident_id,
        })
      }
    }

    info(
      `Successfully processed ${processedCount}/${incidents.length} ChartMD incidents`,
    )
    return processedCount
  } catch (err) {
    _error('ChartMD processing failed', {
      error: err.message,
      stack: err.stack,
    })
    return 0
  }
}
