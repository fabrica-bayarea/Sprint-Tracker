import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const elapsed = Date.now() - start;
      const { statusCode } = res;
      const baseMessage = `${method} ${originalUrl} ${statusCode} +${elapsed}ms`;

      this.logByStatus(statusCode, baseMessage);

      if (process.env.DEBUG === 'true') {
        this.logDebugInfo(req);
      }
    });

    next();
  }

  private logByStatus(statusCode: number, message: string): void {
    if (statusCode >= 500) {
      this.logger.error(message);
    } else if (statusCode >= 400) {
      this.logger.warn(message);
    } else {
      this.logger.log(message);
    }
  }

  private logDebugInfo(req: Request): void {
    const ipLog = `IP: ${req.ip}`;
    const headersLog = `Headers:\n${JSON.stringify(
      req.headers,
      (key, value) => this.filterSensitiveHeaders(key, value),
      2,
    )}`;
    const bodyObj = req.body as Record<string, unknown>;
    const hasBody = bodyObj && Object.keys(bodyObj).length > 0;
    const bodyLog = hasBody ? `Body:\n${JSON.stringify(bodyObj, null, 2)}` : '';
    const debugMessage = [ipLog, headersLog, bodyLog]
      .filter(Boolean)
      .join('\n');
    this.logger.debug(debugMessage);
  }

  private filterSensitiveHeaders(key: string, value: unknown): unknown {
    const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie'];
    return sensitiveHeaders.includes(key.toLowerCase()) ? '***' : value;
  }
}
