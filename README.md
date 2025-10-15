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
CLASS_SCHEDULER_ADDRESS=0x...
LEARNING_POINTS_TOKEN_ADDRESS=0x...
```

- `BLOCKCHAIN_RPC_URL`: URL del nodo RPC que utilizará el backend.
- `BLOCKCHAIN_PRIVATE_KEY`: llave privada del *signer* que ejecutará transacciones.
- `BLOCKCHAIN_CHAIN_ID` *(opcional)*: identificador de la red.
- `CLASS_SCHEDULER_ADDRESS`: dirección del contrato `ClassScheduler.sol` desplegado.
- `LEARNING_POINTS_TOKEN_ADDRESS`: dirección del contrato `LearningPointsToken.sol` desplegado.

## Funciones principales

- `createProvider` y `getSharedProvider`: crean proveedores JSON-RPC reutilizables.
- `createWallet` y `getSharedWallet`: generan *signers* utilizando la llave privada configurada.
- `connectReadOnlyContract` y `connectSignerContract`: instancian contratos en modo lectura o con permisos de escritura.
- `executeRead` y `executeWrite`: abstraen la ejecución de funciones de contrato y el manejo de recibos.
- `registerContract`: mantiene un registro en memoria de contratos y sus parámetros de conexión.
- `classSchedulerService`: funciones listas para programar clases, gestionar inscripciones y distribuir recompensas desde `ClassScheduler.sol`.
- `learningPointsTokenService`: funciones de lectura y escritura sobre `LearningPointsToken.sol` incluyendo transferencias y emisión de puntos.

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

## Integración con ClassScheduler.sol

El servicio `classSchedulerService` utiliza automáticamente el ABI incluido en `src/contracts/ClassScheduler.json` y la dirección configurada en `CLASS_SCHEDULER_ADDRESS`. Desde cualquier módulo del backend puedes interactuar con el contrato utilizando funciones listas para las operaciones más comunes:

```ts
import {
  scheduleClass,
  rescheduleClass,
  updateClass,
  cancelClass,
  enrollStudent,
  setAttendance,
  distributeRewards,
  getClassDetails,
  getEnrolledStudents,
} from './src';

await scheduleClass({
  metadataURI: 'ipfs://class-metadata',
  startTime: 1717804800n,
  endTime: 1717808400n,
  capacity: 25,
  rewardAmount: 50,
});

const classInfo = await getClassDetails(1n);
const students = await getEnrolledStudents(1n);
await distributeRewards(1n);
```

Todas las funciones aceptan un objeto opcional de configuración para sobreescribir proveedor, signer o incluso un ABI y dirección alternativos cuando necesites trabajar con *forks* o entornos de prueba.

## Integración con LearningPointsToken.sol

El servicio `learningPointsTokenService` abstrae la interacción con el token de puntos de aprendizaje y utiliza el ABI disponible en `src/contracts/LearningPointsToken.json`. Permite consultar balances, configurar *allowances* y ejecutar transferencias o emisiones con funciones de alto nivel:

```ts
import {
  getTokenMetadata,
  getTokenBalance,
  transferLearningPoints,
  awardLearningPoints,
} from './src';

const metadata = await getTokenMetadata();
const balance = await getTokenBalance('0xEstudiante');
await transferLearningPoints('0xDocente', 10n);
await awardLearningPoints('0xEstudiante', 15n);
```

Puedes combinar estas funciones con `ClassScheduler` para automatizar la entrega de recompensas al completar clases o registrar asistencias.

## Scripts disponibles

- `npm test`: actualmente imprime un mensaje informativo. Agrega tus pruebas unitarias y actualiza este script según tus necesidades.
- `npm run build`: compila los archivos TypeScript a la carpeta `dist/`.
- `npm start`: ejecuta el servidor HTTP compilado desde `dist/server.js`.

## Servidor HTTP y rutas disponibles

El paquete incluye un servidor Express que expone rutas REST para consumir los servicios desde un frontend. Primero compila el proyecto y luego inicia el servidor:

```bash
npm run build
npm start
```

El servidor escucha por defecto en el puerto `3000` (puede configurarse con la variable `PORT`) y expone las rutas bajo el prefijo `/api`:

- `GET /api/health`: verificación rápida del estado del servicio.
- `POST /api/classes`: programa una nueva clase (`scheduleClass`).
- `PUT /api/classes/:classId`: actualiza una clase (`updateClass`).
- `PATCH /api/classes/:classId/schedule`: reprograma una clase (`rescheduleClass`).
- `POST /api/classes/:classId/enrollments`: inscribe a un estudiante (`enrollStudent`).
- `GET /api/classes/:classId`: obtiene los detalles de una clase (`getClassDetails`).
- `GET /api/classes/:classId/students`: lista estudiantes inscritos.
- `POST /api/classes/:classId/distribute-rewards`: distribuye recompensas (`distributeRewards`).
- `GET /api/learning-points/metadata`: recupera la metadata del token (`getTokenMetadata`).
- `POST /api/learning-points/transfer`: transfiere puntos de aprendizaje (`transferLearningPoints`).
- `POST /api/learning-points/mint`: emite nuevos puntos (`mintLearningPoints`).
- `POST /api/learning-points/award`: asigna puntos a un estudiante (`awardLearningPoints`).

Cada endpoint retorna respuestas JSON con la forma `{ success: boolean, data?: unknown, error?: { message: string } }`. Para operaciones de escritura se incluye el `txHash` asociado a la transacción.
