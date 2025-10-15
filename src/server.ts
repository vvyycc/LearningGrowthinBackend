import express, { NextFunction, Request, Response } from 'express';

import apiRouter from './routes';
import { HttpError } from './routes/httpError';
import { ApiErrorResponse, sendSuccess } from './routes/responseHelpers';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    sendSuccess(res, { status: 'ok' });
  });

  app.use('/api', apiRouter);

  app.use((_req: Request, res: Response) => {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        message: 'Recurso no encontrado.',
      },
    };
    res.status(404).json(response);
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError) {
      const response: ApiErrorResponse = {
        success: false,
        error: {
          message: error.message,
        },
      };
      if (error.details !== undefined) {
        response.error.details = error.details;
      }
      res.status(error.statusCode).json(response);
      return;
    }

    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        error: {
          message: error.message,
        },
      } satisfies ApiErrorResponse);
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Error desconocido.',
      },
    } satisfies ApiErrorResponse);
  });

  return app;
}

function isDirectExecution(): boolean {
  if (!process.argv[1]) {
    return false;
  }

  const modulePath = decodeURIComponent(new URL(import.meta.url).pathname);
  const executedPath = decodeURIComponent(new URL(`file://${process.argv[1]}`).pathname);
  return modulePath === executedPath;
}

if (isDirectExecution()) {
  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  const app = createApp();
  app.listen(port, () => {
    console.log(`LearningGrowthin backend API escuchando en el puerto ${port}`);
  });
}
