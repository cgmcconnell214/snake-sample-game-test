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
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) return false;
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
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/tokenize" element={
                                  <ProtectedRoute requiredTier="standard">
                                    <Tokenize />
                                  </ProtectedRoute>
                                } />
                                <Route path="/trading" element={
                                  <ProtectedRoute requiredTier="standard">
                                    <Trading />
                                  </ProtectedRoute>
                                } />
                                <Route path="/portfolio" element={<Portfolio />} />
                                <Route path="/kyc" element={<KycCenter />} />
                                <Route path="/compliance" element={<Compliance />} />
                                <Route path="/audit" element={<AuditTrail />} />
                                <Route path="/reports" element={<Reports />} />
                                <Route path="/profile" element={<UserProfile />} />
                                <Route path="/messages" element={<MessageCenter />} />
                                <Route path="/ip-tokenization" element={<IPTokenization />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/admin" element={
                                  <ProtectedRoute requiredRole="admin">
                                    <Admin />
                                  </ProtectedRoute>
                                } />
                                <Route path="/blockchain" element={
                                  <ProtectedRoute requiredRole="admin">
                                    <Blockchain />
                                  </ProtectedRoute>
                                } />
                                
                                {/* New 5-Layer Navigation */}
                                <Route path="/ai-agents" element={<AIAgents />} />
                                <Route path="/smart-contracts" element={<SmartContracts />} />
                                <Route path="/workflow-automation" element={<WorkflowAutomation />} />
                                <Route path="/learning" element={<LearningPortal />} />
                                <Route path="/certification" element={<Certification />} />
                                <Route path="/live-classes" element={<LiveClasses />} />
                                <Route path="/divine-trust" element={<DivineTrust />} />
                                <Route path="/kingdom-entry" element={<KingdomEntry />} />
                                <Route path="/sacred-law" element={<SacredLaw />} />
                                <Route path="/marketplace" element={<Marketplace />} />
                                <Route path="/liquidity" element={<LiquidityPools />} />
                                <Route path="/escrow" element={<EscrowVaults />} />
                                <Route path="/node-management" element={<NodeManagement />} />
                                <Route path="/data-sync" element={<DataSync />} />
                                <Route path="/diagnostics" element={<SystemDiagnostics />} />
                                <Route path="/legal-safehouse" element={<LegalSafehouse />} />
                                <Route path="/asset-provenance" element={<AssetProvenance />} />
                                <Route path="/tokenomics" element={<TokenomicsPage />} />
                                <Route path="/dev-playground" element={<DevPlayground />} />
                                
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
