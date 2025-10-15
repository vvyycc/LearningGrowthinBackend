import { Response } from 'express';

import { ContractExecutionResult } from '../services/contractConnector';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data } satisfies ApiSuccessResponse<T>);
}

export function sendContractResult<TResult>(
  res: Response,
  execution: ContractExecutionResult<TResult>,
  statusCode = 200,
): void {
  sendSuccess(
    res,
    {
      result: execution.result,
      txHash: execution.txHash,
    },
    statusCode,
  );
}
