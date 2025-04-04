import { processChartMDData } from './services/chartmdService.js'
import { processWTOPData, cleanup as cleanupWTOP } from './services/wtopService.js'
import { createChartMDIncidentTable } from './models/chartmdIncidents.js'
import { createWTOPIncidentTable } from './models/wtopIncidents.js'
import { error as _error, info } from './util/logger.js'
import { config } from './config/config.js'
import { healthCheck } from './config/db.js'

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
    
    // ChartMD processing
    const chartStartTime = Date.now()
    const chartProcessedCount = await processChartMDData()
    info('ChartMD processing completed', {
      processingTime: `${Date.now() - chartStartTime}ms`,
      incidentsProcessed: chartProcessedCount
    })

    // WTOP processing
    const wtopStartTime = Date.now()
    const wtopProcessedCount = await processWTOPData()
    info('WTOP processing completed', {
      processingTime: `${Date.now() - wtopStartTime}ms`,
      incidentsProcessed: wtopProcessedCount
    })

    info('Scheduled data processing cycle completed')
  } catch (error) {
    _error('Data processing failed', {
      error: error.message,
      stack: error.stack
    })
  }
}, config.pollingInterval)

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  info('SIGTERM signal received')
  await cleanupWTOP()
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

setInterval(async () => {
  try {
    info('Performing database health check')
    await healthCheck()
    info('Database health check passed')
  } catch (error) {
    error('Database health check failed', {
      error: error.message,
      stack: error.stack,
    })
    clearInterval(interval)
    info(
      'Stopping scheduled data processing due to database health check failure',
    )
    process.exit(1)
  }
}, 60000) // Check every minute
