'use client';

import EditCardsClient from './EditCardsClient';
import { withAuth } from '@/components/auth/withAuth';

function EditCardsPage() {
  return <EditCardsClient />;
}

export default withAuth(EditCardsPage);
