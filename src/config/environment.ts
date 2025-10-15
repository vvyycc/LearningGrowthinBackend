import dotenv from 'dotenv';

dotenv.config();

export interface BlockchainEnvironmentConfig {
  rpcUrl: string;
  privateKey?: string;
  chainId?: number;
}

export interface ContractAddressesConfig {
  classScheduler?: string;
  learningPointsToken?: string;
}

function readNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function loadBlockchainEnvironment(): BlockchainEnvironmentConfig {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || process.env.RPC_URL;
  if (!rpcUrl) {
    throw new Error(
      'Se requiere la variable de entorno BLOCKCHAIN_RPC_URL para crear la conexión con la blockchain.',
    );
  }

  return {
    rpcUrl,
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || process.env.PRIVATE_KEY,
    chainId: readNumber(process.env.BLOCKCHAIN_CHAIN_ID || process.env.CHAIN_ID),
  };
}

export function loadContractAddresses(): ContractAddressesConfig {
  return {
    classScheduler: process.env.CLASS_SCHEDULER_ADDRESS,
    learningPointsToken: process.env.LEARNING_POINTS_TOKEN_ADDRESS,
  };
}
