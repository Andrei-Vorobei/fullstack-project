import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class ServerExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ServerExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status: number;
    let message: string;
    let errorCode: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else {
        const responseBody = body as {
          message?: string | string[];
        };

        message = Array.isArray(responseBody.message)
          ? responseBody.message.join(', ')
          : responseBody.message ?? 'Request failed';
      }

      if (status === HttpStatus.CONFLICT) {
        errorCode = 'CONFLICT_DUPLICATE';
      } else if (status === HttpStatus.UNAUTHORIZED) {
        errorCode = 'AUTH_FAILED';
      } else {
        errorCode = `HTTP_${status}`;
      }

      this.logger.warn(
        `HTTP error in ${request.method} ${request.url}: ${status} ${message}`,
        exception,
      );
    } else if (
      exception instanceof QueryFailedError &&
      exception.driverError?.code === '23505'
    ) {
      status = HttpStatus.CONFLICT;
      message = 'Resource already exists';
      errorCode = 'CONFLICT_DUPLICATE';

      this.logger.error(
        `Database error in ${request.method} ${request.url}: ${exception.message}`,
        exception,
      );
    } else if (exception instanceof Error) {
      const ex = exception;

      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = ex.message || 'Internal server error';
      errorCode = 'INTERNAL_ERROR';

      this.logger.error(
        `System error in ${request.method} ${request.url}: ${ex.message}`,
        ex,
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      errorCode = 'INTERNAL_ERROR';
    }

    response.status(status).json({
      errorCode,
      message,
      status,
      path: request.url,
      method: request.method,
    });
  }
}
