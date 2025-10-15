import { Contract, InterfaceAbi, Provider, Signer, ethers } from 'ethers';

import { createProvider, getSharedProvider } from './providerFactory';
import { createWallet, getSharedWallet } from './walletFactory';

export interface ContractConnectionOptions {
  address: string;
  abi: InterfaceAbi;
  provider?: Provider;
  signer?: Signer;
  rpcUrl?: string;
  chainId?: number;
  privateKey?: string;
}

export function validateContractAddress(address: string): void {
  if (!ethers.isAddress(address)) {
    throw new Error(`La dirección ${address} no es válida.`);
  }
}

export function connectReadOnlyContract(options: ContractConnectionOptions): Contract {
  validateContractOptions(options);

  const provider =
    options.provider ??
    (options.rpcUrl
      ? createProvider({ rpcUrl: options.rpcUrl, chainId: options.chainId })
      : getSharedProvider());

  return new Contract(options.address, options.abi, provider);
}

export function connectSignerContract(options: ContractConnectionOptions): Contract {
  validateContractOptions(options, true);

  if (options.signer) {
    return new Contract(options.address, options.abi, options.signer);
  }

  const provider =
    options.provider ??
    (options.rpcUrl
      ? createProvider({ rpcUrl: options.rpcUrl, chainId: options.chainId })
      : getSharedProvider());

  const signer = options.rpcUrl || options.provider
    ? createWallet({ provider, useSharedProvider: false, privateKey: options.privateKey })
    : createWallet({ privateKey: options.privateKey });

  return new Contract(options.address, options.abi, signer);
}

function validateContractOptions(options: ContractConnectionOptions, requireSigner = false): void {
  if (!options.address) {
    throw new Error('La dirección del contrato es obligatoria.');
  }
  validateContractAddress(options.address);

  if (!options.abi || (Array.isArray(options.abi) && options.abi.length === 0)) {
    throw new Error('El ABI del contrato es obligatorio para crear la instancia.');
  }

  if (requireSigner) {
    const hasSigner = Boolean(options.signer || options.privateKey || getSafeWalletAddress());
    if (!hasSigner) {
      throw new Error(
        'No hay signer disponible. Configura BLOCKCHAIN_PRIVATE_KEY, entrega un signer personalizado o un privateKey.',
      );
    }
  }
}

function getSafeWalletAddress(): string | undefined {
  try {
    const wallet = getSharedWallet();
    return wallet.address;
  } catch (error) {
    return undefined;
  }
}

export type ContractExecutionResult<TResult> = {
  result: TResult;
  txHash?: string;
};

export async function executeRead<TResult>(
  contract: Contract,
  method: string,
  params: unknown[] = [],
): Promise<ContractExecutionResult<TResult>> {
  if (typeof (contract as Record<string, unknown>)[method] !== 'function') {
    throw new Error(`La función ${method} no existe en el contrato.`);
  }

  const result = await (contract as Record<string, (...args: unknown[]) => Promise<TResult>>)[method](
    ...params,
  );
  return { result };
}

export async function executeWrite<TResult>(
  contract: Contract,
  method: string,
  params: unknown[] = [],
): Promise<ContractExecutionResult<TResult>> {
  if (typeof (contract as Record<string, unknown>)[method] !== 'function') {
    throw new Error(`La función ${method} no existe en el contrato.`);
  }

  const txResponse = await (contract as Record<string, (...args: unknown[]) => Promise<unknown>>)[method](
    ...params,
  );
  if (!txResponse || typeof (txResponse as { wait?: () => Promise<unknown> }).wait !== 'function') {
    throw new Error('La función no retornó una transacción válida.');
  }

  const receipt = (await (txResponse as { wait: () => Promise<unknown> }).wait()) as TResult & {
    hash?: string;
  };

  return {
    result: receipt,
    txHash: receipt?.hash,
  };
}
