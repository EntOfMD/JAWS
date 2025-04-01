import { processChartMDData } from './services/chartmdService.js'
import { processWTOPData } from './services/wtopService.js'
import { createChartMDIncidentTable } from './models/chartmdIncidents.js'
import { createWTOPIncidentTable } from './models/wtopIncidents.js'
import { error as _error, info, debug } from './util/logger.js'

// Initialize tables
Promise.all([createChartMDIncidentTable(), createWTOPIncidentTable()]).catch(
  (err) =>
    _error('Database table creation failed', {
      error: err.message,
      stack: err.stack,
    }),
)

const interval = setInterval(async () => {
  try {
    info('Starting scheduled data processing')

    debug('Initiating ChartMD data processing')
    const chartMDStartTime = Date.now()
    await processChartMDData()
    info('ChartMD processing completed', {
      processingTime: `${Date.now() - chartMDStartTime}ms`,
    })

    debug('Initiating WTOP data processing')
    const wtopStartTime = Date.now()
    await processWTOPData()
    info('WTOP processing completed', {
      processingTime: `${Date.now() - wtopStartTime}ms`,
    })

    info('Scheduled data processing cycle completed')
  } catch (error) {
    _error('Data processing failed', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  }
}, 300000)

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  info('SIGTERM signal received')
  clearInterval(interval)
  info('Polling interval cleared')
  info('Application shutting down gracefully')
  process.exit(0)
})

process.on('uncaughtException', (error) => {
  _error('Uncaught exception detected', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  })
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  _error('Unhandled Promise rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise?.toString(),
    timestamp: new Date().toISOString(),
  })
})
