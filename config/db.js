import pg from 'pg'
import { config } from './config.js'
import { error as _error, info } from '../util/logger.js'

const { Pool } = pg

const pool = new Pool({
  ...config.db,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
})

// Test the pool connection
pool
  .connect()
  .then((client) => {
    client.release()
    info('Database tables initialized successfully')
  })
  .catch((err) => {
    _error('Failed to initialize database pool', {
      error: err.message,
      stack: err.stack,
    })
    process.exit(1)
  })

// Handle pool errors
pool.on('error', (err) => {
  _error('Unexpected database pool error', {
    error: err.message,
    stack: err.stack,
  })
})

/**
 * Checks database connectivity by attempting a simple query
 * @param {number} timeout - Timeout in milliseconds for the health check
 * @returns {Promise<boolean>} true if database is accessible, throws error otherwise
 */
export const healthCheck = async (timeout = 5000) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error('Database health check timeout')),
      timeout,
    ),
  )

  const checkPromise = (async () => {
    const client = await pool.connect()
    try {
      await client.query('SELECT 1')
      return true
    } finally {
      client.release()
    }
  })()

  return Promise.race([checkPromise, timeoutPromise])
}

process.on('SIGTERM', async () => {
  await pool.end()
  process.exit(0)
})

export { pool }
