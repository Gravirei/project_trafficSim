import { RequireAuth } from '@/components/auth/RequireAuth';
import { DashboardView } from '@/views/dashboard/DashboardView';

export default function Page() {
  return (
    <RequireAuth>
      <DashboardView />
    </RequireAuth>
  );
}
