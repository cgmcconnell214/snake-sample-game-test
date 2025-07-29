import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/AppSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import MessageCenter from "./components/MessageCenter";
import IPTokenization from "./components/IPTokenization";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tokenize = lazy(() => import("./pages/Tokenize"));
const Trading = lazy(() => import("./pages/Trading"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const KycCenter = lazy(() => import("./pages/KycCenter"));
const Compliance = lazy(() => import("./pages/Compliance"));
const AuditTrail = lazy(() => import("./pages/AuditTrail"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Admin = lazy(() => import("./pages/Admin"));
const Blockchain = lazy(() => import("./pages/Blockchain"));
const AIAgents = lazy(() => import("./pages/AIAgents"));
const SmartContracts = lazy(() => import("./pages/SmartContracts"));
const WorkflowAutomation = lazy(() => import("./pages/WorkflowAutomation"));
const LearningPortal = lazy(() => import("./pages/LearningPortal"));
const Certification = lazy(() => import("./pages/Certification"));
const LiveClasses = lazy(() => import("./pages/LiveClasses"));
const DivineTrust = lazy(() => import("./pages/DivineTrust"));
const KingdomEntry = lazy(() => import("./pages/KingdomEntry"));
const SacredLaw = lazy(() => import("./pages/SacredLaw"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const LiquidityPools = lazy(() => import("./pages/LiquidityPools"));
const EscrowVaults = lazy(() => import("./pages/EscrowVaults"));
const NodeManagement = lazy(() => import("./pages/NodeManagement"));
const DataSync = lazy(() => import("./pages/DataSync"));
const SystemDiagnostics = lazy(() => import("./pages/SystemDiagnostics"));
const LegalSafehouse = lazy(() => import("./pages/LegalSafehouse"));
const AssetProvenance = lazy(() => import("./pages/AssetProvenance"));
const TokenomicsPage = lazy(() => import("./pages/TokenomicsPage"));
const DevPlayground = lazy(() => import("./pages/DevPlayground"));
const Auth = lazy(() => import("./pages/Auth"));
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
 khfq01-codex/replace-instances-of-any-with-correct-types
      retry: (failureCount, error: unknown) => {
        // TODO: Verify correct error type
        const status = (error as { status?: number }).status;
        if (status && status >= 400 && status < 500) return false;

 xgqza0-codex/replace-instances-of-any-with-correct-types
      retry: (failureCount, error: { status?: number }) => {

      retry: (failureCount, error: unknown) => {
 codex/replace-all-instances-of-any-in-codebase

 codex/replace-any-with-correct-typescript-types
        // TODO: Verify correct error type

 codex/replace-instances-of-any-with-correct-types
        // TODO: Verify correct type for error

 main
 main
 main
 main
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) return false;
 main
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<div className="p-4">Loading...</div>}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected app routes */}
              <Route path="/app/*" element={
                <ErrorBoundary>
                  <ProtectedRoute>
                    <SidebarProvider>
                      <div className="flex min-h-screen w-full bg-background">
                        <AppSidebar />
                        <div className="flex-1">
                          <header className="h-12 flex items-center border-b border-border bg-card/50 backdrop-blur px-4">
                            <SidebarTrigger />
                          </header>
                          <main className="flex-1">
                            <ErrorBoundary>
                              <Routes>
                                <Route path="/app" element={<Dashboard />} />
                                <Route path="/app/tokenize" element={
                                  <ProtectedRoute requiredTier="standard">
                                    <Tokenize />
                                  </ProtectedRoute>
                                } />
                                <Route path="/app/trading" element={
                                  <ProtectedRoute requiredTier="standard">
                                    <Trading />
                                  </ProtectedRoute>
                                } />
                                <Route path="/app/portfolio" element={<Portfolio />} />
                                <Route path="/app/kyc" element={<KycCenter />} />
                                <Route path="/app/compliance" element={<Compliance />} />
                                <Route path="/app/audit" element={<AuditTrail />} />
                                <Route path="/app/reports" element={<Reports />} />
                                <Route path="/app/profile" element={<UserProfile />} />
                                <Route path="/app/messages" element={<MessageCenter />} />
                                <Route path="/app/ip-tokenization" element={<IPTokenization />} />
                                <Route path="/app/settings" element={<Settings />} />
                                <Route path="/app/admin" element={
                                  <ProtectedRoute requiredRole="admin">
                                    <Admin />
                                  </ProtectedRoute>
                                } />
                                <Route path="/app/blockchain" element={
                                  <ProtectedRoute requiredRole="admin">
                                    <Blockchain />
                                  </ProtectedRoute>
                                } />
                                
                                {/* New 5-Layer Navigation */}
                                <Route path="/app/ai-agents" element={<AIAgents />} />
                                <Route path="/app/smart-contracts" element={<SmartContracts />} />
                                <Route path="/app/workflow-automation" element={<WorkflowAutomation />} />
                                <Route path="/app/learning" element={<LearningPortal />} />
                                <Route path="/app/certification" element={<Certification />} />
                                <Route path="/app/live-classes" element={<LiveClasses />} />
                                <Route path="/app/divine-trust" element={<DivineTrust />} />
                                <Route path="/app/kingdom-entry" element={<KingdomEntry />} />
                                <Route path="/app/sacred-law" element={<SacredLaw />} />
                                <Route path="/app/marketplace" element={<Marketplace />} />
                                <Route path="/app/liquidity" element={<LiquidityPools />} />
                                <Route path="/app/escrow" element={<EscrowVaults />} />
                                <Route path="/app/node-management" element={<NodeManagement />} />
                                <Route path="/app/data-sync" element={<DataSync />} />
                                <Route path="/app/diagnostics" element={<SystemDiagnostics />} />
                                <Route path="/app/legal-safehouse" element={<LegalSafehouse />} />
                                <Route path="/app/asset-provenance" element={<AssetProvenance />} />
                                <Route path="/app/tokenomics" element={<TokenomicsPage />} />
                                <Route path="/app/dev-playground" element={<DevPlayground />} />
                                
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </ErrorBoundary>
                          </main>
                        </div>
                      </div>
                    </SidebarProvider>
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
