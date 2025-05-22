import { FastifyLoggerOptions } from 'fastify';

// Use a compatible type that matches what we need
export const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label: string) => ({ level: label })
  }
};

export const requestIdConfig = {
  disableRequestLogging: false,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId',
  genReqId: () => Date.now().toString(36) + Math.random().toString(36).substring(2)
};
