import { Contract, InterfaceAbi } from 'ethers';

import {
  ContractConnectionOptions,
  ContractExecutionResult,
  connectReadOnlyContract,
  connectSignerContract,
  executeRead,
  executeWrite,
} from './contractConnector';
import { loadContractAddresses } from '../config/environment';
import { loadAbi } from '../utils/abiLoader';

const LEARNING_POINTS_TOKEN_ABI_PATH = 'src/contracts/LearningPointsToken.json';

let cachedAbi: InterfaceAbi | undefined;

function getLearningPointsAbi(override?: InterfaceAbi): InterfaceAbi {
  if (override) {
    return override;
  }

  if (!cachedAbi) {
    cachedAbi = loadAbi(LEARNING_POINTS_TOKEN_ABI_PATH);
  }

  return cachedAbi;
}

function ensureAddress(address?: string): string {
  if (!address) {
    throw new Error(
      'No se proporcionó la dirección del contrato LearningPointsToken. Configura LEARNING_POINTS_TOKEN_ADDRESS o entrega una dirección manualmente.',
    );
  }
  return address;
}

export type TokenAmountLike = bigint | number | string;

export interface LearningPointsTokenConnectionOptions
  extends Omit<ContractConnectionOptions, 'address' | 'abi'> {
  address?: string;
  abi?: InterfaceAbi;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
}

function getDefaultLearningPointsAddress(): string | undefined {
  const { learningPointsToken } = loadContractAddresses();
  return learningPointsToken;
}

function toBigInt(value: TokenAmountLike, fieldName: string): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) {
      throw new Error(`El campo ${fieldName} no puede ser una cadena vacía.`);
    }
    return BigInt(normalized);
  }
  throw new Error(`El campo ${fieldName} no puede convertirse a bigint.`);
}

export function getLearningPointsTokenContract(
  options: LearningPointsTokenConnectionOptions = {},
): Contract {
  const { address: providedAddress, abi: providedAbi, ...connectionOptions } = options;
  const address = ensureAddress(providedAddress ?? getDefaultLearningPointsAddress());
  const abi = getLearningPointsAbi(providedAbi);

  return connectReadOnlyContract({
    address,
    abi,
    ...connectionOptions,
  });
}

export function getLearningPointsTokenContractWithSigner(
  options: LearningPointsTokenConnectionOptions = {},
): Contract {
  const { address: providedAddress, abi: providedAbi, ...connectionOptions } = options;
  const address = ensureAddress(providedAddress ?? getDefaultLearningPointsAddress());
  const abi = getLearningPointsAbi(providedAbi);

  return connectSignerContract({
    address,
    abi,
    ...connectionOptions,
  });
}

export async function getTokenMetadata(
  options: LearningPointsTokenConnectionOptions = {},
): Promise<TokenMetadata> {
  const contract = getLearningPointsTokenContract(options);
  const [{ result: nameResult }, { result: symbolResult }, { result: decimalsResult }] = await Promise.all([
    executeRead<string>(contract, 'name'),
    executeRead<string>(contract, 'symbol'),
    executeRead<number | bigint>(contract, 'decimals'),
  ]);

  const decimalsValue =
    typeof decimalsResult === 'number'
      ? decimalsResult
      : Number(toBigInt(decimalsResult as TokenAmountLike, 'decimals'));

  return {
    name: String(nameResult),
    symbol: String(symbolResult),
    decimals: decimalsValue,
  };
}

export async function getTotalSupply(
  options: LearningPointsTokenConnectionOptions = {},
): Promise<bigint> {
  const contract = getLearningPointsTokenContract(options);
  const { result } = await executeRead<bigint>(contract, 'totalSupply');
  return typeof result === 'bigint' ? result : toBigInt(result as TokenAmountLike, 'totalSupply');
}

export async function getTokenBalance(
  account: string,
  options: LearningPointsTokenConnectionOptions = {},
): Promise<bigint> {
  const contract = getLearningPointsTokenContract(options);
  const { result } = await executeRead<bigint>(contract, 'balanceOf', [account]);
  return typeof result === 'bigint' ? result : toBigInt(result as TokenAmountLike, 'balance');
}

export async function getTokenAllowance(
  owner: string,
  spender: string,
  options: LearningPointsTokenConnectionOptions = {},
): Promise<bigint> {
  const contract = getLearningPointsTokenContract(options);
  const { result } = await executeRead<bigint>(contract, 'allowance', [owner, spender]);
  return typeof result === 'bigint' ? result : toBigInt(result as TokenAmountLike, 'allowance');
}

export async function approveLearningPointsSpender(
  spender: string,
  amount: TokenAmountLike,
  options: LearningPointsTokenConnectionOptions = {},
): Promise<ContractExecutionResult<unknown>> {
  const contract = getLearningPointsTokenContractWithSigner(options);
  return executeWrite(contract, 'approve', [spender, toBigInt(amount, 'amount')]);
}

export async function transferLearningPoints(
  to: string,
  amount: TokenAmountLike,
  options: LearningPointsTokenConnectionOptions = {},
): Promise<ContractExecutionResult<unknown>> {
  const contract = getLearningPointsTokenContractWithSigner(options);
  return executeWrite(contract, 'transfer', [to, toBigInt(amount, 'amount')]);
}

export async function transferLearningPointsFrom(
  from: string,
  to: string,
  amount: TokenAmountLike,
  options: LearningPointsTokenConnectionOptions = {},
): Promise<ContractExecutionResult<unknown>> {
  const contract = getLearningPointsTokenContractWithSigner(options);
  return executeWrite(contract, 'transferFrom', [from, to, toBigInt(amount, 'amount')]);
}

export async function mintLearningPoints(
  account: string,
  amount: TokenAmountLike,
  options: LearningPointsTokenConnectionOptions = {},
): Promise<ContractExecutionResult<unknown>> {
  const contract = getLearningPointsTokenContractWithSigner(options);
  return executeWrite(contract, 'mint', [account, toBigInt(amount, 'amount')]);
}

export async function burnLearningPoints(
  account: string,
  amount: TokenAmountLike,
  options: LearningPointsTokenConnectionOptions = {},
): Promise<ContractExecutionResult<unknown>> {
  const contract = getLearningPointsTokenContractWithSigner(options);
  return executeWrite(contract, 'burn', [account, toBigInt(amount, 'amount')]);
}

export async function awardLearningPoints(
  student: string,
  amount: TokenAmountLike,
  options: LearningPointsTokenConnectionOptions = {},
): Promise<ContractExecutionResult<unknown>> {
  const contract = getLearningPointsTokenContractWithSigner(options);
  return executeWrite(contract, 'awardPoints', [student, toBigInt(amount, 'amount')]);
}

export async function revokeLearningPoints(
  student: string,
  amount: TokenAmountLike,
  options: LearningPointsTokenConnectionOptions = {},
): Promise<ContractExecutionResult<unknown>> {
  const contract = getLearningPointsTokenContractWithSigner(options);
  return executeWrite(contract, 'revokePoints', [student, toBigInt(amount, 'amount')]);
}
