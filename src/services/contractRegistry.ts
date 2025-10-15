import { InterfaceAbi } from 'ethers';

import { ContractConnectionOptions, connectReadOnlyContract, connectSignerContract } from './contractConnector';

export interface RegisteredContractConfig {
  name: string;
  address: string;
  abi: InterfaceAbi;
  chainId?: number;
  rpcUrl?: string;
}

const registry = new Map<string, RegisteredContractConfig>();

export function registerContract(config: RegisteredContractConfig): void {
  if (registry.has(config.name)) {
    throw new Error(`Ya existe un contrato registrado con el nombre ${config.name}.`);
  }

  registry.set(config.name, config);
}

export function updateContract(config: RegisteredContractConfig): void {
  registry.set(config.name, config);
}

export function getContractConfig(name: string): RegisteredContractConfig {
  const config = registry.get(name);
  if (!config) {
    throw new Error(`No se encontró un contrato registrado con el nombre ${name}.`);
  }
  return config;
}

export function connectRegisteredContract(
  name: string,
  options: Partial<Omit<ContractConnectionOptions, 'address' | 'abi'>> = {},
) {
  const config = getContractConfig(name);
  return connectReadOnlyContract({
    address: config.address,
    abi: config.abi,
    rpcUrl: options.rpcUrl ?? config.rpcUrl,
    chainId: options.chainId ?? config.chainId,
    provider: options.provider,
  });
}

export function connectRegisteredContractWithSigner(
  name: string,
  options: Partial<Omit<ContractConnectionOptions, 'address' | 'abi'>> = {},
) {
  const config = getContractConfig(name);
  return connectSignerContract({
    address: config.address,
    abi: config.abi,
    rpcUrl: options.rpcUrl ?? config.rpcUrl,
    chainId: options.chainId ?? config.chainId,
    provider: options.provider,
    signer: options.signer,
  });
}

export function clearRegistry(): void {
  registry.clear();
}
