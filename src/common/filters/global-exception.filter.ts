import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();
    let status  = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error   = 'Internal Server Error';
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse();
      if (typeof r === 'object' && r !== null) {
        const ro = r as Record<string, unknown>;
        message = (ro.message as string | string[]) ?? exception.message;
        error   = (ro.error   as string)            ?? exception.name;
      } else { message = r as string; error = exception.name; }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }
    response.status(status).json({ statusCode: status, error, message, timestamp: new Date().toISOString(), path: request.url });
  }
}
