import { ReactNode } from 'react';
import Header from '@/components/Header';
import Main from '@/components/Main';
import Sidenav from '@/components/Sidenav';
import { DashboardProvider } from '@/components/contexts/DashboardContext';

interface DashboardProps {
  sidenavWidth?: number;
  children: ReactNode;
}

// TODO: Wrap this component even more to make it more reusable
// TODO: Implement mobile responsiveness, all to be included in a clean wrapper
// TODO: Move this thing's dependencies to their own folder
// TODO: Allow me to inject my own components into the dashboard -- this is where card filters and search criteria will go
const Dashboard = ({ children, sidenavWidth = 320 }: DashboardProps) => {
  return (
    <DashboardProvider>
      <Header sidenavWidth={sidenavWidth} />
      <Sidenav sidenavWidth={sidenavWidth} />
      <Main sidenavWidth={sidenavWidth}>{children}</Main>
    </DashboardProvider>
  );
};

export default Dashboard;
