import winston from 'winston';
import path from 'path';

// Custom format that includes timestamp and metadata
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  winston.format.json()
);

class Logger {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: customFormat,
      transports: [
        // Write to console
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        // Write to file
        new winston.transports.File({
          filename: path.join(__dirname, '../../logs/error.log'),
          level: 'error'
        }),
        new winston.transports.File({
          filename: path.join(__dirname, '../../logs/combined.log')
        })
      ]
    });
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, error = null, meta = {}) {
    const errorMeta = error ? {
      ...meta,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      }
    } : meta;

    this.logger.error(message, errorMeta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  // Track timing of operations
  async timeOperation(name, operation) {
    const start = process.hrtime();
    try {
      const result = await operation();
      const [seconds, nanoseconds] = process.hrtime(start);
      const duration = seconds * 1000 + nanoseconds / 1000000;
      
      this.info(`Operation completed`, {
        operation: name,
        durationMs: duration
      });
      
      return result;
    } catch (error) {
      const [seconds, nanoseconds] = process.hrtime(start);
      const duration = seconds * 1000 + nanoseconds / 1000000;
      
      this.error(`Operation failed`, error, {
        operation: name,
        durationMs: duration
      });
      
      throw error;
    }
  }
}

export default new Logger();
