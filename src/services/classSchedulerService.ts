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

const CLASS_SCHEDULER_ABI_PATH = 'src/contracts/ClassScheduler.json';

let cachedAbi: InterfaceAbi | undefined;

function getClassSchedulerAbi(override?: InterfaceAbi): InterfaceAbi {
  if (override) {
    return override;
  }

  if (!cachedAbi) {
    cachedAbi = loadAbi(CLASS_SCHEDULER_ABI_PATH);
  }

  return cachedAbi;
}

function ensureAddress(address?: string): string {
  if (!address) {
    throw new Error(
      'No se proporcionó la dirección del contrato ClassScheduler. Configura CLASS_SCHEDULER_ADDRESS o entrega una dirección manualmente.',
    );
  }
  return address;
}

export interface ClassSchedulerConnectionOptions
  extends Omit<ContractConnectionOptions, 'address' | 'abi'> {
  address?: string;
  abi?: InterfaceAbi;
}

export interface ScheduleClassParams {
  metadataURI: string;
  startTime: NumericValue;
  endTime: NumericValue;
  capacity: NumericValue;
  rewardAmount: NumericValue;
}

export interface UpdateClassParams {
  classId: NumericValue;
  metadataURI: string;
  capacity: NumericValue;
  rewardAmount: NumericValue;
}

export interface RescheduleClassParams {
  classId: NumericValue;
  startTime: NumericValue;
  endTime: NumericValue;
}

export interface AttendanceParams {
  classId: NumericValue;
  student: string;
  attended: boolean;
}

export type NumericValue = bigint | number | string;

export interface ClassDetails {
  metadataURI: string;
  startTime: bigint;
  endTime: bigint;
  capacity: bigint;
  rewardAmount: bigint;
  instructor: string;
  cancelled: boolean;
  completed: boolean;
}

function getDefaultClassSchedulerAddress(): string | undefined {
  const { classScheduler } = loadContractAddresses();
  return classScheduler;
}

function toBigInt(value: NumericValue, fieldName: string): bigint {
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

function normalizeClassId(classId: NumericValue): bigint {
  return toBigInt(classId, 'classId');
}

function mapClassDetails(raw: unknown): ClassDetails {
  if (!raw || typeof raw !== 'object') {
    throw new Error('El contrato retornó una respuesta inválida para los detalles de la clase.');
  }

  const record = raw as Record<string, unknown>;
  const arrayLike = Array.isArray(raw) ? (raw as unknown[]) : [];

  function pick<T>(key: string, index: number, transform: (value: unknown) => T): T {
    const fromKey = record[key];
    if (fromKey !== undefined) {
      return transform(fromKey);
    }
    if (arrayLike[index] !== undefined) {
      return transform(arrayLike[index]);
    }
    throw new Error(`No se pudo leer el campo ${key} de la clase.`);
  }

  return {
    metadataURI: pick('metadataURI', 0, (value) => String(value)),
    startTime: pick('startTime', 1, (value) => toBigInt(value as NumericValue, 'startTime')),
    endTime: pick('endTime', 2, (value) => toBigInt(value as NumericValue, 'endTime')),
    capacity: pick('capacity', 3, (value) => toBigInt(value as NumericValue, 'capacity')),
    rewardAmount: pick('rewardAmount', 4, (value) => toBigInt(value as NumericValue, 'rewardAmount')),
    instructor: pick('instructor', 5, (value) => String(value)),
    cancelled: pick('cancelled', 6, (value) => Boolean(value)),
    completed: pick('completed', 7, (value) => Boolean(value)),
  };
}

export function getClassSchedulerContract(
  options: ClassSchedulerConnectionOptions = {},
): Contract {
  const { address: providedAddress, abi: providedAbi, ...connectionOptions } = options;
  const address = ensureAddress(providedAddress ?? getDefaultClassSchedulerAddress());
  const abi = getClassSchedulerAbi(providedAbi);

  return connectReadOnlyContract({
    address,
    abi,
    ...connectionOptions,
  });
}

export function getClassSchedulerContractWithSigner(
  options: ClassSchedulerConnectionOptions = {},
): Contract {
  const { address: providedAddress, abi: providedAbi, ...connectionOptions } = options;
  const address = ensureAddress(providedAddress ?? getDefaultClassSchedulerAddress());
  const abi = getClassSchedulerAbi(providedAbi);

  return connectSignerContract({
    address,
    abi,
    ...connectionOptions,
  });
}

export async function scheduleClass(
  params: ScheduleClassParams,
  options: ClassSchedulerConnectionOptions = {},
): Promise<ContractExecutionResult<unknown>> {
  const contract = getClassSchedulerContractWithSigner(options);

  return executeWrite(contract, 'scheduleClass', [
    params.metadataURI,
    toBigInt(params.startTime, 'startTime'),
    toBigInt(params.endTime, 'endTime'),
    toBigInt(params.capacity, 'capacity'),
    toBigInt(params.rewardAmount, 'rewardAmount'),
  ]);
}

export async function updateClass(
  params: UpdateClassParams,
  options: ClassSchedulerConnectionOptions = {},
): Promise<ContractExecutionResult<unknown>> {
  const contract = getClassSchedulerContractWithSigner(options);

  return executeWrite(contract, 'updateClass', [
    normalizeClassId(params.classId),
    params.metadataURI,
    toBigInt(params.capacity, 'capacity'),
    toBigInt(params.rewardAmount, 'rewardAmount'),
  ]);
}

export async function rescheduleClass(
  params: RescheduleClassParams,
  options: ClassSchedulerConnectionOptions = {},
): Promise<ContractExecutionResult<unknown>> {
  const contract = getClassSchedulerContractWithSigner(options);

  return executeWrite(contract, 'rescheduleClass', [
    normalizeClassId(params.classId),
    toBigInt(params.startTime, 'startTime'),
    toBigInt(params.endTime, 'endTime'),
  ]);
}

export async function cancelClass(
  classId: NumericValue,
  options: ClassSchedulerConnectionOptions = {},
): Promise<ContractExecutionResult<unknown>> {
  const contract = getClassSchedulerContractWithSigner(options);
  return executeWrite(contract, 'cancelClass', [normalizeClassId(classId)]);
}

export async function enrollStudent(
  classId: NumericValue,
  student: string,
  options: ClassSchedulerConnectionOptions = {},
): Promise<ContractExecutionResult<unknown>> {
  const contract = getClassSchedulerContractWithSigner(options);
  return executeWrite(contract, 'enrollStudent', [normalizeClassId(classId), student]);
}

export async function unenrollStudent(
  classId: NumericValue,
  student: string,
  options: ClassSchedulerConnectionOptions = {},
): Promise<ContractExecutionResult<unknown>> {
  const contract = getClassSchedulerContractWithSigner(options);
  return executeWrite(contract, 'unenrollStudent', [normalizeClassId(classId), student]);
}

export async function setAttendance(
  params: AttendanceParams,
  options: ClassSchedulerConnectionOptions = {},
): Promise<ContractExecutionResult<unknown>> {
  const contract = getClassSchedulerContractWithSigner(options);

  return executeWrite(contract, 'setAttendance', [
    normalizeClassId(params.classId),
    params.student,
    params.attended,
  ]);
}

export async function completeClass(
  classId: NumericValue,
  options: ClassSchedulerConnectionOptions = {},
): Promise<ContractExecutionResult<unknown>> {
  const contract = getClassSchedulerContractWithSigner(options);
  return executeWrite(contract, 'completeClass', [normalizeClassId(classId)]);
}

export async function distributeRewards(
  classId: NumericValue,
  options: ClassSchedulerConnectionOptions = {},
): Promise<ContractExecutionResult<unknown>> {
  const contract = getClassSchedulerContractWithSigner(options);
  return executeWrite(contract, 'distributeRewards', [normalizeClassId(classId)]);
}

export async function getClassDetails(
  classId: NumericValue,
  options: ClassSchedulerConnectionOptions = {},
): Promise<ClassDetails> {
  const contract = getClassSchedulerContract(options);
  const { result } = await executeRead<unknown>(contract, 'getClass', [normalizeClassId(classId)]);
  return mapClassDetails(result);
}

export async function getClassCount(
  options: ClassSchedulerConnectionOptions = {},
): Promise<bigint> {
  const contract = getClassSchedulerContract(options);
  const { result } = await executeRead<bigint>(contract, 'getClassCount');
  return typeof result === 'bigint' ? result : toBigInt(result as NumericValue, 'count');
}

export async function getEnrolledStudents(
  classId: NumericValue,
  options: ClassSchedulerConnectionOptions = {},
): Promise<string[]> {
  const contract = getClassSchedulerContract(options);
  const { result } = await executeRead<unknown>(contract, 'getEnrolledStudents', [
    normalizeClassId(classId),
  ]);

  if (!Array.isArray(result)) {
    throw new Error('El contrato retornó un formato inesperado para la lista de estudiantes.');
  }

  return result.map((item) => String(item));
}

export async function hasStudentAttended(
  classId: NumericValue,
  student: string,
  options: ClassSchedulerConnectionOptions = {},
): Promise<boolean> {
  const contract = getClassSchedulerContract(options);
  const { result } = await executeRead<boolean>(contract, 'hasAttended', [
    normalizeClassId(classId),
    student,
  ]);
  return Boolean(result);
}

export async function isStudentEnrolled(
  classId: NumericValue,
  student: string,
  options: ClassSchedulerConnectionOptions = {},
): Promise<boolean> {
  const contract = getClassSchedulerContract(options);
  const { result } = await executeRead<boolean>(contract, 'isEnrolled', [
    normalizeClassId(classId),
    student,
  ]);
  return Boolean(result);
}

export async function getLinkedLearningToken(
  options: ClassSchedulerConnectionOptions = {},
): Promise<string> {
  const contract = getClassSchedulerContract(options);
  const { result } = await executeRead<string>(contract, 'learningToken');
  return String(result);
}
