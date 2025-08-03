'use client';

import { CreateGoalClient } from './CreateGoalClient';
import { withAuth } from '@/components/auth/withAuth';

function CreateGoalPage() {
  return <CreateGoalClient />;
}

export default withAuth(CreateGoalPage);