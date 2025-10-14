# LearningGrowthin Backend

Este paquete expone utilidades para conectar los *smart contracts* utilizados por LearningGrowthin con los servicios del backend. Las funciones permiten configurar el proveedor de blockchain, crear *signers* seguros basados en variables de entorno y ejecutar llamadas de lectura o escritura contra los contratos.

## Instalación

```bash
npm install
```

Instala las dependencias necesarias (por ejemplo `ethers` y `dotenv`).

## Configuración de entorno

Crea un archivo `.env` basado en el siguiente ejemplo o utiliza el archivo `.env.example` incluido en el repositorio:

```dotenv
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/<tu-api-key>
BLOCKCHAIN_PRIVATE_KEY=0x...
BLOCKCHAIN_CHAIN_ID=11155111
```

- `BLOCKCHAIN_RPC_URL`: URL del nodo RPC que utilizará el backend.
- `BLOCKCHAIN_PRIVATE_KEY`: llave privada del *signer* que ejecutará transacciones.
- `BLOCKCHAIN_CHAIN_ID` *(opcional)*: identificador de la red.

## Funciones principales

- `createProvider` y `getSharedProvider`: crean proveedores JSON-RPC reutilizables.
- `createWallet` y `getSharedWallet`: generan *signers* utilizando la llave privada configurada.
- `connectReadOnlyContract` y `connectSignerContract`: instancian contratos en modo lectura o con permisos de escritura.
- `executeRead` y `executeWrite`: abstraen la ejecución de funciones de contrato y el manejo de recibos.
- `registerContract`: mantiene un registro en memoria de contratos y sus parámetros de conexión.

La mayoría de las funciones aceptan parámetros opcionales como `rpcUrl`, `chainId`, `provider`, `signer` o `privateKey` para sobrescribir la configuración global cuando sea necesario.

## Uso

```ts
import {
  loadAbi,
  connectReadOnlyContract,
  connectSignerContract,
  executeRead,
  executeWrite,
  registerContract,
  connectRegisteredContract,
  connectRegisteredContractWithSigner,
} from './src';

const exampleAbi = loadAbi('src/contracts/Example.json');

registerContract({
  name: 'LearningToken',
  address: '0x0000000000000000000000000000000000000000',
  abi: exampleAbi,
});

async function run() {
  const readOnlyContract = connectRegisteredContract('LearningToken');
  const signerContract = connectRegisteredContractWithSigner('LearningToken');

  const balance = await executeRead<string>(readOnlyContract, 'balanceOf', ['0x...']);
  const tx = await executeWrite(signerContract, 'mint', ['0x...', 1n]);

  console.log(balance.result);
  console.log(tx.txHash);
}

run();
```

Las funciones de `contractConnector` y `contractRegistry` permiten centralizar la lógica de conexión desde cualquier módulo del backend, evitando repetir configuración y facilitando pruebas.

> También puedes publicar el paquete y consumirlo como dependencia desde otros repositorios importando directamente desde `learninggrowthin-backend`.

## Scripts disponibles

- `npm test`: actualmente imprime un mensaje informativo. Agrega tus pruebas unitarias y actualiza este script según tus necesidades.
- `npm run build`: compila los archivos TypeScript a la carpeta `dist/`.
