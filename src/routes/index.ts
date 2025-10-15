import { Router } from 'express';

import classSchedulerRoutes from './classSchedulerRoutes';
import learningPointsTokenRoutes from './learningPointsTokenRoutes';

const router = Router();

router.use('/classes', classSchedulerRoutes);
router.use('/learning-points', learningPointsTokenRoutes);

export default router;
