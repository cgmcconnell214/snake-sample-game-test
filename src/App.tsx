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
import Dashboard from "./pages/Dashboard";
import Tokenize from "./pages/Tokenize";
import Trading from "./pages/Trading";
import Portfolio from "./pages/Portfolio";
import KycCenter from "./pages/KycCenter";
import Compliance from "./pages/Compliance";
import AuditTrail from "./pages/AuditTrail";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import UserProfile from "./pages/UserProfile";
import MessageCenter from "./components/MessageCenter";
import IPTokenization from "./components/IPTokenization";
import Admin from "./pages/Admin";
import Blockchain from "./pages/Blockchain";
import AIAgents from "./pages/AIAgents";
import AITradingBots from "./pages/AITradingBots";
import SmartContracts from "./pages/SmartContracts";
import WorkflowAutomation from "./pages/WorkflowAutomation";
import LearningPortal from "./pages/LearningPortal";
import Certification from "./pages/Certification";
import LiveClasses from "./pages/LiveClasses";
import DivineTrust from "./pages/DivineTrust";
import KingdomEntry from "./pages/KingdomEntry";
import SacredLaw from "./pages/SacredLaw";
import Marketplace from "./pages/Marketplace";
import LiquidityPools from "./pages/LiquidityPools";
import EscrowVaults from "./pages/EscrowVaults";
import NodeManagement from "./pages/NodeManagement";
import DataSync from "./pages/DataSync";
import SystemDiagnostics from "./pages/SystemDiagnostics";
import LegalSafehouse from "./pages/LegalSafehouse";
import AssetProvenance from "./pages/AssetProvenance";
import TokenomicsPage from "./pages/TokenomicsPage";
import TokenSupply from "./pages/TokenSupply";
import DevPlayground from "./pages/DevPlayground";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SocialFeed from "./components/social/SocialFeed";
import EnhancedUserProfile from "./components/social/EnhancedUserProfile";
import FollowersPage from "./components/social/FollowersPage";
import NotificationCenter from "./components/NotificationCenter";
import MarketplaceNew from "./pages/MarketplaceNew";
import LearningPortalNew from "./pages/LearningPortalNew";
import LiveClassesNew from "./pages/LiveClassesNew";
import LiquidityPoolsNew from "./pages/LiquidityPoolsNew";
import CourseDetail from "./pages/CourseDetail";
import CourseCreator from "./pages/CourseCreator";
import CourseBuilder from "@/components/learning/CourseBuilder";
import RedeemEnrollment from "./pages/RedeemEnrollment";
import Onboarding from "./pages/Onboarding";
import BadgeProgression from "./pages/BadgeProgression";

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
                          <header className="h-12 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur px-4">
                            <SidebarTrigger />
                            <NotificationCenter />
                          </header>
                          <main className="flex-1">
                            <ErrorBoundary>
                              <Routes>
                                <Route index element={<Dashboard />} />
                                <Route path="tokenize" element={
                                  <ProtectedRoute requiredTier="standard">
                                    <Tokenize />
                                  </ProtectedRoute>
                                } />
                                <Route path="trading" element={
                                  <ProtectedRoute requiredTier="standard">
                                    <Trading />
                                  </ProtectedRoute>
                                } />
                                <Route path="portfolio" element={<Portfolio />} />
                                <Route path="kyc" element={<KycCenter />} />
                                <Route path="compliance" element={<Compliance />} />
                                <Route path="audit" element={<AuditTrail />} />
                                <Route path="reports" element={<Reports />} />
                                <Route path="profile" element={<UserProfile />} />
                                <Route path="messages" element={<MessageCenter />} />
                                <Route path="ip-tokenization" element={<IPTokenization />} />
                                <Route path="settings" element={<Settings />} />
                                <Route path="admin" element={
                                  <ProtectedRoute requiredRole="admin">
                                    <Admin />
                                  </ProtectedRoute>
                                } />
                                <Route path="blockchain" element={
                                  <ProtectedRoute requiredRole="admin">
                                    <Blockchain />
                                  </ProtectedRoute>
                                } />
                                
                                {/* New 5-Layer Navigation */}
                                <Route path="ai-agents" element={<AIAgents />} />
                                <Route path="ai-trading-bots" element={<AITradingBots />} />
                                <Route path="smart-contracts" element={<SmartContracts />} />
                                <Route path="workflow-automation" element={<WorkflowAutomation />} />
                                <Route path="learning" element={<LearningPortal />} />
                                <Route path="learning/courses" element={<LearningPortalNew />} />
                                <Route path="learning/courses/:slug" element={<CourseDetail />} />
                                <Route path="learning/creator" element={<CourseCreator />} />
                                <Route path="learning/creator/:id" element={<CourseBuilder />} />
                                <Route path="certification" element={<Certification />} />
                                <Route path="onboarding" element={<Onboarding />} />
                                <Route path="badges" element={<BadgeProgression />} />
                                <Route path="live-classes" element={<LiveClasses />} />
                                <Route path="live-classes/new" element={<LiveClassesNew />} />
                                <Route path="divine-trust" element={<DivineTrust />} />
                                <Route path="kingdom-entry" element={<KingdomEntry />} />
                                <Route path="sacred-law" element={<SacredLaw />} />
                                <Route path="marketplace" element={<Marketplace />} />
                                <Route path="marketplace/browse" element={<MarketplaceNew />} />
                                <Route path="liquidity" element={<LiquidityPools />} />
                                <Route path="liquidity/pools" element={<LiquidityPoolsNew />} />
                                <Route path="escrow" element={<EscrowVaults />} />
                                <Route path="node-management" element={<NodeManagement />} />
                                <Route path="data-sync" element={<DataSync />} />
                                <Route path="diagnostics" element={<SystemDiagnostics />} />
                                <Route path="legal-safehouse" element={<LegalSafehouse />} />
                                <Route path="asset-provenance" element={<AssetProvenance />} />
                                <Route path="tokenomics" element={<TokenomicsPage />} />
                                <Route path="token-supply" element={<TokenSupply />} />
                                <Route path="dev-playground" element={<DevPlayground />} />
                                
                                {/* Social Media Routes */}
                                <Route path="social" element={<SocialFeed />} />
                                <Route path="social/profile" element={<EnhancedUserProfile />} />
                                <Route path="social/followers" element={<FollowersPage />} />
                                
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
              <Routes>
                <Route path="/redeem/:code" element={<RedeemEnrollment />} />
              </Routes>
            </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
