import { Provider, Wallet } from 'ethers';

import { loadBlockchainEnvironment } from '../config/environment';
import { getSharedProvider } from './providerFactory';

export interface WalletOptions {
  privateKey?: string;
  useSharedProvider?: boolean;
  provider?: Provider;
}

let cachedWallet: Wallet | null = null;

function resolvePrivateKey(customKey?: string): string {
  if (customKey) {
    return customKey;
  }

  const config = loadBlockchainEnvironment();
  if (!config.privateKey) {
    throw new Error(
      'No se encontró una llave privada. Configura BLOCKCHAIN_PRIVATE_KEY para permitir transacciones.',
    );
  }
  return config.privateKey;
}

export function createWallet(options: WalletOptions = {}): Wallet {
  const { privateKey, useSharedProvider = true, provider } = options;
  if (cachedWallet && !privateKey && useSharedProvider && !provider) {
    return cachedWallet;
  }

  const resolvedProvider = provider ?? (useSharedProvider ? getSharedProvider() : undefined);
  const wallet = new Wallet(resolvePrivateKey(privateKey), resolvedProvider);
  if (!privateKey && useSharedProvider && !provider) {
    cachedWallet = wallet;
  }
  return wallet;
}

export function getSharedWallet(): Wallet {
  if (!cachedWallet) {
    cachedWallet = createWallet();
  }
  return cachedWallet;
}

export function resetWalletFactory(): void {
  cachedWallet = null;
}
