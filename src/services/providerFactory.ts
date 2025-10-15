import { JsonRpcProvider, Provider } from 'ethers';
import type { Signer } from 'ethers';

import type { BlockchainEnvironmentConfig } from '../config/environment';
import { loadBlockchainEnvironment } from '../config/environment';

export type ProviderFactoryOptions = {
  rpcUrl?: string;
  chainId?: number;
};

let sharedProvider: Provider | null = null;
let cachedConfig: BlockchainEnvironmentConfig | null = null;

function getEnvironmentConfig(): BlockchainEnvironmentConfig {
  if (!cachedConfig) {
    cachedConfig = loadBlockchainEnvironment();
  }
  return cachedConfig;
}

export function createProvider(options: ProviderFactoryOptions = {}): Provider {
  const { rpcUrl, chainId } = options;
  let config: BlockchainEnvironmentConfig | null = null;

  if (!rpcUrl || chainId === undefined) {
    try {
      config = getEnvironmentConfig();
    } catch (error) {
      if (!rpcUrl) {
        throw error;
      }
    }
  }

  const effectiveRpcUrl = rpcUrl ?? config?.rpcUrl;
  if (!effectiveRpcUrl) {
    throw new Error('No se pudo determinar la URL del proveedor RPC.');
  }

  const provider = new JsonRpcProvider(effectiveRpcUrl, chainId ?? config?.chainId);

  if (!rpcUrl && !chainId) {
    sharedProvider = provider;
  }

  return provider;
}

export function getSharedProvider(): Provider {
  if (!sharedProvider) {
    sharedProvider = createProvider();
  }
  return sharedProvider;
}

export function resetProviderFactory(): void {
  sharedProvider = null;
  cachedConfig = null;
}

export function attachSigner<TSigner extends Signer>(signer: TSigner): TSigner {
  const provider = getSharedProvider();
  return signer.connect(provider) as TSigner;
}
