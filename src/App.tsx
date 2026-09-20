import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { RenderersPage } from '@/pages/Renderers';
import { RequestersPage } from '@/pages/Requesters';
import { UsersPage } from '@/pages/Users';
import { ServicesPage } from '@/pages/Services';
import { ServiceTypesPage } from '@/pages/ServiceTypes';
import { ToolsPage } from '@/pages/Tools';
import { ProgramsPage } from '@/pages/Programs';
import { ProgramStagesPage } from '@/pages/ProgramStages';
import { StageVideosPage } from '@/pages/StageVideos';
import { ServiceCommissionsPage } from '@/pages/ServiceCommissions';
import { PendingPaymentsPage } from '@/pages/PendingPayments';
import { PendingRequestersPage } from '@/pages/PendingRequesters';
import { ServiceTypeVideosPage } from '@/pages/ServiceTypeVideos';
import { UserReportsPage } from '@/pages/UserReports';
import { TasksPage } from '@/pages/Tasks';
import { VerificationCallsPage } from '@/pages/VerificationCalls';
import { RecycleBinPage } from '@/pages/RecycleBin';
import { MediaLibraryPage } from '@/pages/MediaLibrary';
import { EmailsPage } from '@/pages/Emails';
import { AppVersionsPage } from '@/pages/AppVersions';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/renderers" element={<RenderersPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/requesters" element={<RequestersPage />} />
            <Route path="/pending-requesters" element={<PendingRequestersPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/service-types" element={<ServiceTypesPage />} />
            <Route path="/service-commissions" element={<ServiceCommissionsPage />} />
            <Route path="/pending-payments" element={<PendingPaymentsPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/programs/:programId/stages" element={<ProgramStagesPage />} />
            <Route path="/stages/:stageId/videos" element={<StageVideosPage />} />
            <Route path="/service-type-videos" element={<ServiceTypeVideosPage />} />
            <Route path="/user-reports" element={<UserReportsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/verification-calls" element={<VerificationCallsPage />} />
            <Route path="/recycle-bin" element={<RecycleBinPage />} />
            <Route path="/media-library" element={<MediaLibraryPage />} />
            <Route path="/emails" element={<EmailsPage />} />
            <Route path="/app-versions" element={<AppVersionsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
            fontSize: '14px',
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
