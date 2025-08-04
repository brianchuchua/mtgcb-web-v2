'use client';

import { EditGoalClient } from './EditGoalClient';
import { withAuth } from '@/components/auth/withAuth';
import { use } from 'react';

interface EditGoalPageProps {
  params: Promise<{
    goalId: string;
  }>;
}

function EditGoalPage({ params }: EditGoalPageProps) {
  const resolvedParams = use(params);
  const goalId = parseInt(resolvedParams.goalId, 10);
  
  if (isNaN(goalId)) {
    return <div>Invalid goal ID</div>;
  }

  return <EditGoalClient goalId={goalId} />;
}

export default withAuth(EditGoalPage);