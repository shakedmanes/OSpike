import * as winston from 'winston';
const winstonRotateFile = require('winston-daily-rotate-file');

const serviceName = 'OSpike';
const hostname = 'HOSTNAME';

// log levels
export enum LOG_LEVEL {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

const logger = winston.createLogger({
  defaultMeta: { hostname, service: serviceName },
});

const format = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.json());

logger.add(new winstonRotateFile({
  format,
  level: LOG_LEVEL.INFO,
  datePattern: 'YYYY-MM-DD',
  filename: process.env.LOG_FILE_NAME,
  dirname: process.env.LOG_DIR || '.',
}));

export const log = (severity: string, meta: any) => {
  const { message, ...other } = meta;
  logger.log(severity, message, other);
};

export const parseLogData = (name?: string | null,
                             message?: string | null,
                             code?: string | number | null,
                             stack?: string | null) => {
  return {
    hostname,
    name: name || 'No name provided',
    message: message || 'No message provided',
    code: String(code || 'No code provided'),
    stack: stack || 'No stack trace provided',
    service: serviceName,
  };
};
