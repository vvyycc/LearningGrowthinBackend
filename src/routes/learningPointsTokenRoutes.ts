import { Router } from 'express';

import {
  LearningPointsTokenConnectionOptions,
  TokenAmountLike,
  approveLearningPointsSpender,
  awardLearningPoints,
  burnLearningPoints,
  getTokenAllowance,
  getTokenBalance,
  getTokenMetadata,
  getTotalSupply,
  mintLearningPoints,
  revokeLearningPoints,
  transferLearningPoints,
  transferLearningPointsFrom,
} from '../services/learningPointsTokenService';
import { asyncHandler } from './asyncHandler';
import { sendContractResult, sendSuccess } from './responseHelpers';
import { ensureNonEmptyString, ensureProvided } from './validation';

const router = Router();

type OptionsCarrier = { options?: LearningPointsTokenConnectionOptions };

type AmountRequest = { amount?: TokenAmountLike } & OptionsCarrier;

type ApproveRequest = { spender?: string } & AmountRequest;

type TransferRequest = { to?: string } & AmountRequest;

type TransferFromRequest = { from?: string; to?: string } & AmountRequest;

type AccountAmountRequest = { account?: string } & AmountRequest;

type StudentAmountRequest = { student?: string } & AmountRequest;

type AccountParams = { account?: string };

type AllowanceParams = { owner?: string; spender?: string };

function extractAccount(value: unknown, field = 'account'): string {
  return ensureNonEmptyString(value, field);
}

router.get(
  '/metadata',
  asyncHandler(async (_req, res) => {
    const metadata = await getTokenMetadata();
    sendSuccess(res, metadata);
  }),
);

router.get(
  '/supply',
  asyncHandler(async (_req, res) => {
    const totalSupply = await getTotalSupply();
    sendSuccess(res, { totalSupply });
  }),
);

router.get<AccountParams>(
  '/balances/:account',
  asyncHandler(async (req, res) => {
    const account = extractAccount(req.params.account);
    const balance = await getTokenBalance(account);
    sendSuccess(res, { balance, account });
  }),
);

router.get<AllowanceParams>(
  '/allowances/:owner/:spender',
  asyncHandler(async (req, res) => {
    const owner = extractAccount(req.params.owner, 'owner');
    const spender = extractAccount(req.params.spender, 'spender');
    const allowance = await getTokenAllowance(owner, spender);
    sendSuccess(res, { owner, spender, allowance });
  }),
);

router.post<unknown, unknown, ApproveRequest>(
  '/approve',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as Partial<ApproveRequest>;
    const spender = ensureNonEmptyString(body.spender, 'spender');
    const amount = ensureProvided(body.amount, 'amount');

    const result = await approveLearningPointsSpender(spender, amount, body.options);
    sendContractResult(res, result);
  }),
);

router.post<unknown, unknown, TransferRequest>(
  '/transfer',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as Partial<TransferRequest>;
    const to = ensureNonEmptyString(body.to, 'to');
    const amount = ensureProvided(body.amount, 'amount');

    const result = await transferLearningPoints(to, amount, body.options);
    sendContractResult(res, result);
  }),
);

router.post<unknown, unknown, TransferFromRequest>(
  '/transfer-from',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as Partial<TransferFromRequest>;
    const from = ensureNonEmptyString(body.from, 'from');
    const to = ensureNonEmptyString(body.to, 'to');
    const amount = ensureProvided(body.amount, 'amount');

    const result = await transferLearningPointsFrom(from, to, amount, body.options);
    sendContractResult(res, result);
  }),
);

router.post<unknown, unknown, AccountAmountRequest>(
  '/mint',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as Partial<AccountAmountRequest>;
    const account = extractAccount(body.account);
    const amount = ensureProvided(body.amount, 'amount');

    const result = await mintLearningPoints(account, amount, body.options);
    sendContractResult(res, result);
  }),
);

router.post<unknown, unknown, AccountAmountRequest>(
  '/burn',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as Partial<AccountAmountRequest>;
    const account = extractAccount(body.account);
    const amount = ensureProvided(body.amount, 'amount');

    const result = await burnLearningPoints(account, amount, body.options);
    sendContractResult(res, result);
  }),
);

router.post<unknown, unknown, StudentAmountRequest>(
  '/award',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as Partial<StudentAmountRequest>;
    const student = extractAccount(body.student, 'student');
    const amount = ensureProvided(body.amount, 'amount');

    const result = await awardLearningPoints(student, amount, body.options);
    sendContractResult(res, result);
  }),
);

router.post<unknown, unknown, StudentAmountRequest>(
  '/revoke',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as Partial<StudentAmountRequest>;
    const student = extractAccount(body.student, 'student');
    const amount = ensureProvided(body.amount, 'amount');

    const result = await revokeLearningPoints(student, amount, body.options);
    sendContractResult(res, result);
  }),
);

export default router;
