import fs from 'node:fs';
import path from 'node:path';

import { InterfaceAbi } from 'ethers';

export interface AbiLoadOptions {
  baseDir?: string;
}

export function loadAbi(filePath: string, options: AbiLoadOptions = {}): InterfaceAbi {
  const { baseDir = process.cwd() } = options;
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(baseDir, filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`No se encontró el archivo de ABI en la ruta ${absolutePath}.`);
  }

  const rawContent = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(rawContent) as InterfaceAbi;
}
