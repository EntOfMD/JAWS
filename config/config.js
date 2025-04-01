require('dotenv').config()

module.exports = {
  pollingInterval: process.env.POLLING_INTERVAL || 300000,
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
}
