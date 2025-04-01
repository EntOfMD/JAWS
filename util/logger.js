import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => {
        return new Date().toLocaleString('en-US', {
          timeZone: 'America/New_York',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      },
    }),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
      let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`
      if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`
      }
      return msg
    }),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
})

export const error = logger.error.bind(logger)
export const info = logger.info.bind(logger)
export const debug = logger.debug.bind(logger)
