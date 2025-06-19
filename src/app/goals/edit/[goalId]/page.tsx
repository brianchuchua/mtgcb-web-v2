import { EditGoalClient } from './EditGoalClient';

interface EditGoalPageProps {
  params: Promise<{
    goalId: string;
  }>;
}

export default async function EditGoalPage({ params }: EditGoalPageProps) {
  const { goalId: goalIdParam } = await params;
  const goalId = parseInt(goalIdParam, 10);
  
  if (isNaN(goalId)) {
    return <div>Invalid goal ID</div>;
  }

  return <EditGoalClient goalId={goalId} />;
}