import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleOverrideBanner } from "@/components/layout/RoleOverrideBanner";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Pipeline from "./pages/Pipeline";
import Candidates from "./pages/Candidates";
import Jobs from "./pages/Jobs";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import OrganizationStructure from "./pages/OrganizationStructure";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import CandidateDetail from "./pages/CandidateDetail";
import JobDetail from "./pages/JobDetail";
import NotFound from "./pages/NotFound";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import AgencyDashboard from "./pages/AgencyDashboard";
import AgencyWorkerDetail from "./pages/AgencyWorkerDetail";
import AgencyWorkers from "./pages/AgencyWorkers";
import AgencyAuth from "./pages/AgencyAuth";
// AgencyJobs removed - unified into Jobs page
import Upload from "./pages/Upload";
import ProjectWorkflowPhase from "./pages/ProjectWorkflowPhase";
import AcceptInvitation from "./pages/AcceptInvitation";
import Billing from "./pages/Billing";
import EmployerCandidateDetail from "./pages/EmployerCandidateDetail";
import EmployerProjectDetail from "./pages/EmployerProjectDetail";
import EmployerJobDetail from "./pages/EmployerJobDetail";
import EmployerDashboard from "./pages/EmployerDashboard";
import Analytics from "./pages/Analytics";
import AgencyAnalytics from "./pages/AgencyAnalytics";
import Tasks from "./pages/Tasks";
import Contracts from "./pages/Contracts";
import CreateContract from "./pages/CreateContract";
import CreateProject from "./pages/CreateProject";
import CreateCandidate from "./pages/CreateCandidate";
import CreateJob from "./pages/CreateJob";
import AdminAgencyContracts from "./pages/AdminAgencyContracts";
import SalesAnalytics from "./pages/SalesAnalytics";
import Reports from "./pages/Reports";
import Clients from "./pages/Clients";
import CreateClient from "./pages/CreateClient";
import ClientDetail from "./pages/ClientDetail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s before refetch
      gcTime: 5 * 60_000,       // 5min garbage collection
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RoleOverrideBanner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/agency-auth" element={<AgencyAuth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/invitation/accept" element={<AcceptInvitation />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/pipeline" element={
              <ProtectedRoute>
                <Pipeline />
              </ProtectedRoute>
            } />
            <Route path="/candidates" element={
              <ProtectedRoute>
                <Candidates />
              </ProtectedRoute>
            } />
            <Route path="/jobs" element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/organization" element={
              <ProtectedRoute>
                <OrganizationStructure />
              </ProtectedRoute>
            } />
            <Route path="/jobs/new" element={
              <ProtectedRoute>
                <CreateJob />
              </ProtectedRoute>
            } />
            <Route path="/jobs/:id" element={
              <ProtectedRoute>
                <JobDetail />
              </ProtectedRoute>
            } />
            <Route path="/candidates/new" element={
              <ProtectedRoute>
                <CreateCandidate />
              </ProtectedRoute>
            } />
            <Route path="/candidates/:id" element={
              <ProtectedRoute>
                <CandidateDetail />
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            } />
            <Route path="/projects/new" element={
              <ProtectedRoute>
                <CreateProject />
              </ProtectedRoute>
            } />
            <Route path="/projects/:id" element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            } />
            <Route path="/projects/:id/workflow/:phase" element={
              <ProtectedRoute>
                <ProjectWorkflowPhase />
              </ProtectedRoute>
            } />
            {/* Analytics */}
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } />
            {/* Billing */}
            <Route path="/billing" element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            } />
            {/* Employer Routes */}
            <Route path="/employer" element={
              <ProtectedRoute requireEmployer>
                <EmployerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/employer/candidates/:id" element={
              <ProtectedRoute requireEmployer>
                <EmployerCandidateDetail />
              </ProtectedRoute>
            } />
            <Route path="/employer/projects/:id" element={
              <ProtectedRoute requireEmployer>
                <EmployerProjectDetail />
              </ProtectedRoute>
            } />
            <Route path="/employer/jobs/:id" element={
              <ProtectedRoute requireEmployer>
                <EmployerJobDetail />
              </ProtectedRoute>
            } />
            {/* Agency Routes */}
            <Route path="/agency" element={
              <ProtectedRoute requireAgency>
                <AgencyDashboard />
              </ProtectedRoute>
            } />
            <Route path="/agency/workers/:id" element={
              <ProtectedRoute requireAgency>
                <AgencyWorkerDetail />
              </ProtectedRoute>
            } />
            <Route path="/agency/billing" element={
              <ProtectedRoute requireAgency>
                <Billing />
              </ProtectedRoute>
            } />
            <Route path="/agency/jobs" element={
              <ProtectedRoute requireAgency>
                <Jobs />
              </ProtectedRoute>
            } />
            <Route path="/my-analytics" element={
              <ProtectedRoute requireAgency>
                <AgencyAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/candidates/:id/upload" element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            } />
            {/* Staff view of agency workers */}
            <Route path="/agency-workers" element={
              <ProtectedRoute>
                <AgencyWorkers />
              </ProtectedRoute>
            } />
            <Route path="/agency-workers/:id" element={
              <ProtectedRoute>
                <AgencyWorkerDetail />
              </ProtectedRoute>
            } />
            {/* Tasks & Contracts */}
            <Route path="/tasks" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Tasks />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/contracts" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Contracts />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/contracts/new" element={
              <ProtectedRoute>
                <CreateContract />
              </ProtectedRoute>
            } />
            <Route path="/sales-analytics" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <SalesAnalytics />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Reports />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            {/* Admin Routes */}
            <Route path="/admin/agency-contracts" element={
              <ProtectedRoute>
                <AdminAgencyContracts />
              </ProtectedRoute>
            } />
            {/* Clients */}
            <Route path="/clients" element={
              <ProtectedRoute>
                <Clients />
              </ProtectedRoute>
            } />
            <Route path="/clients/new" element={
              <ProtectedRoute>
                <CreateClient />
              </ProtectedRoute>
            } />
            <Route path="/clients/:id" element={
              <ProtectedRoute>
                <ClientDetail />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
