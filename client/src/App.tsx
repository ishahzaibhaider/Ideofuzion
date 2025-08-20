import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { auth } from "./lib/auth";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";

import DashboardPage from "@/pages/dashboard";
import PipelinePage from "@/pages/pipeline";
import LiveInterviewPage from "@/pages/live-interview";
import CandidatesPage from "@/pages/candidates";
import CreateJobsPage from "@/pages/create-jobs";
import PrivacyPolicyPage from "@/pages/privacy-policy";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!auth.isAuthenticated()) {
    return <Redirect to="/login" />;
  }
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        <ProtectedRoute>
          <Redirect to="/dashboard" />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      {/* ✨ Add route for Create Jobs page */}
      <Route path="/create-jobs">
        <ProtectedRoute>
          <CreateJobsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/pipeline">
        <ProtectedRoute>
          <PipelinePage />
        </ProtectedRoute>
      </Route>
      <Route path="/live-interview">
        <ProtectedRoute>
          <LiveInterviewPage />
        </ProtectedRoute>
      </Route>
      <Route path="/candidates">
        <ProtectedRoute>
          <CandidatesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;