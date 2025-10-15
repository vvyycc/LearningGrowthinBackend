declare const process: {
  env: Record<string, string | undefined>;
  cwd(): string;
};

declare module 'dotenv' {
  export interface DotenvConfigOptions {
    path?: string;
    encoding?: string;
    debug?: boolean;
    override?: boolean;
  }

  export interface DotenvConfigOutput {
    parsed?: Record<string, string>;
    error?: Error;
  }

  export function config(options?: DotenvConfigOptions): DotenvConfigOutput;

  const dotenv: {
    config: typeof config;
  };

  export default dotenv;
}

declare module 'node:fs' {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, options: { encoding: string } | string): string;
}

declare module 'node:path' {
  export function join(...parts: string[]): string;
  export function isAbsolute(path: string): boolean;
}

declare module 'ethers' {
  export type InterfaceAbi = unknown;
  export type BigNumberish = string | number | bigint;
  export type Provider = unknown;

  export interface Signer {
    connect(provider: Provider): Signer;
  }

  export class Contract {
    constructor(address: string, abi: InterfaceAbi, signerOrProvider?: unknown);
  }

  export class Wallet implements Signer {
    address: string;
    constructor(privateKey: string, provider?: unknown);
    connect(provider: unknown): Wallet;
  }

  export class JsonRpcProvider {
    constructor(url: string, network?: unknown);
  }

  export const ethers: {
    isAddress(value: string): boolean;
  };
}
