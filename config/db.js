import pg from 'pg'
import dotenv from 'dotenv'
import { error as _error } from '../util/logger.js'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
})

// Test the pool connection
pool
  .connect()
  .then((client) => {
    client.release()
    console.log('Database pool initialized successfully')
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

export { pool }
