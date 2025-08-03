'use client';

import { EditGoalClient } from './EditGoalClient';
import { withAuth } from '@/components/auth/withAuth';

interface EditGoalPageProps {
  params: {
    goalId: string;
  };
}

function EditGoalPage({ params }: EditGoalPageProps) {
  const goalId = parseInt(params.goalId, 10);
  
  if (isNaN(goalId)) {
    return <div>Invalid goal ID</div>;
  }

  return <EditGoalClient goalId={goalId} />;
}

export default withAuth(EditGoalPage);