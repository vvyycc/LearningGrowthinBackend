import { Router } from 'express';

import {
  AttendanceParams,
  ClassSchedulerConnectionOptions,
  NumericValue,
  RescheduleClassParams,
  ScheduleClassParams,
  UpdateClassParams,
  cancelClass,
  completeClass,
  distributeRewards,
  enrollStudent,
  getClassCount,
  getClassDetails,
  getEnrolledStudents,
  hasStudentAttended,
  isStudentEnrolled,
  rescheduleClass,
  scheduleClass,
  setAttendance,
  unenrollStudent,
  updateClass,
} from '../services/classSchedulerService';
import { asyncHandler } from './asyncHandler';
import { sendContractResult, sendSuccess } from './responseHelpers';
import { ensureBoolean, ensureNonEmptyString, ensureProvided } from './validation';

const router = Router();

type OptionsCarrier = { options?: ClassSchedulerConnectionOptions };

type ScheduleClassRequest = ScheduleClassParams & OptionsCarrier;

type UpdateClassRequest = Omit<UpdateClassParams, 'classId'> & OptionsCarrier;

type RescheduleClassRequest = Omit<RescheduleClassParams, 'classId'> & OptionsCarrier;

type SetAttendanceRequest = Omit<AttendanceParams, 'classId'> & OptionsCarrier;

type EnrollRequest = { student?: string } & OptionsCarrier;

type EnrollWithStudentParam = OptionsCarrier;

type NoPayloadRequest = OptionsCarrier;

type ClassIdParams = { classId?: string };

type ClassAndStudentParams = ClassIdParams & { student?: string };

function extractClassId(params: ClassIdParams): NumericValue {
  const { classId } = params;
  return ensureNonEmptyString(classId, 'classId');
}

function extractStudent(params: ClassAndStudentParams): string {
  const { student } = params;
  return ensureNonEmptyString(student, 'student');
}

router.post<unknown, unknown, ScheduleClassRequest>(
  '/',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as Partial<ScheduleClassRequest>;
    const metadataURI = ensureNonEmptyString(body.metadataURI, 'metadataURI');
    const startTime = ensureProvided(body.startTime, 'startTime');
    const endTime = ensureProvided(body.endTime, 'endTime');
    const capacity = ensureProvided(body.capacity, 'capacity');
    const rewardAmount = ensureProvided(body.rewardAmount, 'rewardAmount');

    const result = await scheduleClass(
      {
        metadataURI,
        startTime,
        endTime,
        capacity,
        rewardAmount,
      },
      body.options,
    );

    sendContractResult(res, result, 201);
  }),
);

router.put<ClassIdParams, unknown, UpdateClassRequest>(
  '/:classId',
  asyncHandler(async (req, res) => {
    const classId = extractClassId(req.params);
    const body = (req.body ?? {}) as Partial<UpdateClassRequest>;
    const metadataURI = ensureNonEmptyString(body.metadataURI, 'metadataURI');
    const capacity = ensureProvided(body.capacity, 'capacity');
    const rewardAmount = ensureProvided(body.rewardAmount, 'rewardAmount');

    const result = await updateClass(
      {
        classId,
        metadataURI,
        capacity,
        rewardAmount,
      },
      body.options,
    );

    sendContractResult(res, result);
  }),
);

router.patch<ClassIdParams, unknown, RescheduleClassRequest>(
  '/:classId/schedule',
  asyncHandler(async (req, res) => {
    const classId = extractClassId(req.params);
    const body = (req.body ?? {}) as Partial<RescheduleClassRequest>;
    const startTime = ensureProvided(body.startTime, 'startTime');
    const endTime = ensureProvided(body.endTime, 'endTime');

    const result = await rescheduleClass(
      {
        classId,
        startTime,
        endTime,
      },
      body.options,
    );

    sendContractResult(res, result);
  }),
);

router.delete<ClassIdParams, unknown, NoPayloadRequest>(
  '/:classId',
  asyncHandler(async (req, res) => {
    const classId = extractClassId(req.params);
    const body = (req.body ?? {}) as Partial<NoPayloadRequest>;

    const result = await cancelClass(classId, body.options);
    sendContractResult(res, result);
  }),
);

router.post<ClassIdParams, unknown, EnrollRequest>(
  '/:classId/enrollments',
  asyncHandler(async (req, res) => {
    const classId = extractClassId(req.params);
    const body = (req.body ?? {}) as Partial<EnrollRequest>;
    const student = ensureNonEmptyString(body.student, 'student');

    const result = await enrollStudent(classId, student, body.options);
    sendContractResult(res, result, 201);
  }),
);

router.delete<ClassAndStudentParams, unknown, EnrollWithStudentParam>(
  '/:classId/enrollments/:student',
  asyncHandler(async (req, res) => {
    const classId = extractClassId(req.params);
    const student = extractStudent(req.params);
    const body = (req.body ?? {}) as Partial<EnrollWithStudentParam>;

    const result = await unenrollStudent(classId, student, body.options);
    sendContractResult(res, result);
  }),
);

router.post<ClassIdParams, unknown, SetAttendanceRequest>(
  '/:classId/attendance',
  asyncHandler(async (req, res) => {
    const classId = extractClassId(req.params);
    const body = (req.body ?? {}) as Partial<SetAttendanceRequest>;
    const student = ensureNonEmptyString(body.student, 'student');
    const attended = ensureBoolean(body.attended, 'attended');

    const result = await setAttendance(
      {
        classId,
        student,
        attended,
      },
      body.options,
    );

    sendContractResult(res, result);
  }),
);

router.post<ClassIdParams, unknown, NoPayloadRequest>(
  '/:classId/complete',
  asyncHandler(async (req, res) => {
    const classId = extractClassId(req.params);
    const body = (req.body ?? {}) as Partial<NoPayloadRequest>;

    const result = await completeClass(classId, body.options);
    sendContractResult(res, result);
  }),
);

router.post<ClassIdParams, unknown, NoPayloadRequest>(
  '/:classId/distribute-rewards',
  asyncHandler(async (req, res) => {
    const classId = extractClassId(req.params);
    const body = (req.body ?? {}) as Partial<NoPayloadRequest>;

    const result = await distributeRewards(classId, body.options);
    sendContractResult(res, result);
  }),
);

router.get<ClassIdParams>(
  '/:classId',
  asyncHandler(async (req, res) => {
    const classId = extractClassId(req.params);
    const details = await getClassDetails(classId);
    sendSuccess(res, details);
  }),
);

router.get('/count', asyncHandler(async (_req, res) => {
  const count = await getClassCount();
  sendSuccess(res, { count });
}));

router.get<ClassIdParams>(
  '/:classId/students',
  asyncHandler(async (req, res) => {
    const classId = extractClassId(req.params);
    const students = await getEnrolledStudents(classId);
    sendSuccess(res, students);
  }),
);

router.get<ClassAndStudentParams>(
  '/:classId/students/:student/attendance',
  asyncHandler(async (req, res) => {
    const classId = extractClassId(req.params);
    const student = extractStudent(req.params);
    const attended = await hasStudentAttended(classId, student);
    sendSuccess(res, { attended });
  }),
);

router.get<ClassAndStudentParams>(
  '/:classId/students/:student',
  asyncHandler(async (req, res) => {
    const classId = extractClassId(req.params);
    const student = extractStudent(req.params);
    const enrolled = await isStudentEnrolled(classId, student);
    sendSuccess(res, { enrolled });
  }),
);

export default router;
