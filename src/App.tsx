import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { RenderersPage } from '@/pages/Renderers';
import { ServicesPage } from '@/pages/Services';
import { ServiceTypesPage } from '@/pages/ServiceTypes';
import { ToolsPage } from '@/pages/Tools';
import { ProgramsPage } from '@/pages/Programs';
import { ProgramStagesPage } from '@/pages/ProgramStages';
import { StageVideosPage } from '@/pages/StageVideos';
import { ServiceCommissionsPage } from '@/pages/ServiceCommissions';

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
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/service-types" element={<ServiceTypesPage />} />
            <Route path="/service-commissions" element={<ServiceCommissionsPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/programs/:programId/stages" element={<ProgramStagesPage />} />
            <Route path="/stages/:stageId/videos" element={<StageVideosPage />} />
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
