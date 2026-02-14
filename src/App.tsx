import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import AgencyJobs from "./pages/AgencyJobs";
import Upload from "./pages/Upload";
import ProjectWorkflowPhase from "./pages/ProjectWorkflowPhase";
import AcceptInvitation from "./pages/AcceptInvitation";
import Billing from "./pages/Billing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/jobs/:id" element={
              <ProtectedRoute>
                <JobDetail />
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
            {/* Billing */}
            <Route path="/billing" element={
              <ProtectedRoute>
                <Billing />
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
                <AgencyJobs />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
