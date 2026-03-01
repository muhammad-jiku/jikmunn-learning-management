import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Custom log format for console output
 */
const consoleFormat = printf(
  ({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const msgStr = stack || message;
    return `${timestamp} [${level}]: ${msgStr}${metaStr}`;
  }
);

/**
 * Custom log format for file output (JSON for structured logging)
 */
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json()
);

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Winston logger instance
 *
 * - Development: colorized console output at 'debug' level
 * - Production: JSON file output at 'info' level + console at 'warn'
 */
const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  defaultMeta: { service: 'lms-api' },
  transports: [
    // Console transport — always active
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat
      ),
      level: isProduction ? 'warn' : 'debug',
    }),
  ],
});

// In production, also log to files
if (isProduction) {
  // All logs (info and above)
  logger.add(
    new winston.transports.File({
      filename: 'logs/app.log',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    })
  );

  // Error logs only
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    })
  );
}

export default logger;
