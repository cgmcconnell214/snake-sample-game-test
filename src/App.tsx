import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Suspense, type ReactNode } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AppSidebar } from "@/components/AppSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

// Pages
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
import Admin from "./pages/Admin";
import Blockchain from "./pages/Blockchain";
import AIAgents from "./pages/AIAgents";
import AITradingBots from "./pages/AITradingBots";
import SmartContracts from "./pages/SmartContracts";
import WorkflowAutomation from "./pages/WorkflowAutomation";
import LearningPortal from "./pages/LearningPortal";
import LearningPortalNew from "./pages/LearningPortalNew"; // <-- added to satisfy route
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
import DevPlayground from "./pages/DevPlayground";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MarketplaceNew from "./pages/MarketplaceNew";
import LiveClassesNew from "./pages/LiveClassesNew";
import LiquidityPoolsNew from "./pages/LiquidityPoolsNew";
import CourseDetail from "./pages/CourseDetail";
import CourseCreator from "./pages/CourseCreator";
import RedeemEnrollment from "./pages/RedeemEnrollment";
import Onboarding from "./pages/Onboarding";
import BadgeProgression from "./pages/BadgeProgression";

// Components
import MessageCenter from "./components/MessageCenter";
import IPTokenization from "./components/IPTokenization";
import CourseBuilder from "@/components/learning/CourseBuilder";
import SocialFeed from "./components/social/SocialFeed";
import EnhancedUserProfile from "./components/social/EnhancedUserProfile";
import FollowersPage from "./components/social/FollowersPage";
import NotificationCenter from "./components/NotificationCenter";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000,
    },
  },
});

const withSuspense = (node: ReactNode) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>{node}</Suspense>
  </ErrorBoundary>
);

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
              <Route path="/" element={withSuspense(<Index />)} />
              <Route path="/auth" element={withSuspense(<Auth />)} />

              {/* Protected app routes */}
              <Route
                path="/app/*"
                element={withSuspense(
                  <ProtectedRoute>
                    <SidebarProvider>
                      <div className="flex min-h-screen w-full bg-background">
                        {withSuspense(<AppSidebar />)}
                        <div className="flex-1">
                          <header className="h-12 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur px-4">
                            <SidebarTrigger />
                            {withSuspense(<NotificationCenter />)}
                          </header>
                          <main className="flex-1">
                            <Routes>
                              <Route index element={withSuspense(<Dashboard />)} />
                              <Route
                                path="tokenize"
                                element={withSuspense(
                                  <ProtectedRoute requiredTier="standard">
                                    <Tokenize />
                                  </ProtectedRoute>
                                )}
                              />
                              <Route
                                path="trading"
                                element={withSuspense(
                                  <ProtectedRoute requiredTier="standard">
                                    <Trading />
                                  </ProtectedRoute>
                                )}
                              />
                              <Route path="portfolio" element={withSuspense(<Portfolio />)} />
                              <Route path="kyc" element={withSuspense(<KycCenter />)} />
                              <Route path="compliance" element={withSuspense(<Compliance />)} />
                              <Route path="audit" element={withSuspense(<AuditTrail />)} />
                              <Route path="reports" element={withSuspense(<Reports />)} />
                              <Route path="profile" element={withSuspense(<UserProfile />)} />
                              <Route path="messages" element={withSuspense(<MessageCenter />)} />
                              <Route path="ip-tokenization" element={withSuspense(<IPTokenization />)} />
                              <Route path="settings" element={withSuspense(<Settings />)} />
                              <Route
                                path="admin"
                                element={withSuspense(
                                  <ProtectedRoute requiredRole="admin">
                                    <Admin />
                                  </ProtectedRoute>
                                )}
                              />
                              <Route
                                path="blockchain"
                                element={withSuspense(
                                  <ProtectedRoute requiredRole="admin">
                                    <Blockchain />
                                  </ProtectedRoute>
                                )}
                              />

                              {/* New 5-Layer Navigation */}
                              <Route path="ai-agents" element={withSuspense(<AIAgents />)} />
                              <Route path="ai-trading-bots" element={withSuspense(<AITradingBots />)} />
                              <Route path="smart-contracts" element={withSuspense(<SmartContracts />)} />
                              <Route path="workflow-automation" element={withSuspense(<WorkflowAutomation />)} />

                              {/* Learning */}
                              <Route path="learning" element={withSuspense(<LearningPortal />)} />
                              <Route path="learning/courses" element={withSuspense(<LearningPortalNew />)} />
                              <Route path="learning/courses/:slug" element={withSuspense(<CourseDetail />)} />
                              <Route path="learning/creator" element={withSuspense(<CourseCreator />)} />
                              <Route path="learning/creator/:id" element={withSuspense(<CourseBuilder />)} />
                              <Route path="certification" element={withSuspense(<Certification />)} />
                              <Route path="onboarding" element={withSuspense(<Onboarding />)} />
                              <Route path="badges" element={withSuspense(<BadgeProgression />)} />

                              {/* Live / Trust / Law */}
                              <Route path="live-classes" element={withSuspense(<LiveClasses />)} />
                              <Route path="live-classes/new" element={withSuspense(<LiveClassesNew />)} />
                              <Route path="divine-trust" element={withSuspense(<DivineTrust />)} />
                              <Route path="kingdom-entry" element={withSuspense(<KingdomEntry />)} />
                              <Route path="sacred-law" element={withSuspense(<SacredLaw />)} />

                              {/* Market / Liquidity / DeFi */}
                              <Route path="marketplace" element={withSuspense(<Marketplace />)} />
                              <Route path="marketplace/browse" element={withSuspense(<MarketplaceNew />)} />
                              <Route path="liquidity" element={withSuspense(<LiquidityPools />)} />
                              <Route path="liquidity/pools" element={withSuspense(<LiquityPoolsNew />)} />
                              <Route path="escrow" element={withSuspense(<EscrowVaults />)} />
                              <Route path="tokenomics" element={withSuspense(<TokenomicsPage />)} />

                              {/* Infra / Ops */}
                              <Route path="node-management" element={withSuspense(<NodeManagement />)} />
                              <Route path="data-sync" element={withSuspense(<DataSync />)} />
                              <Route path="diagnostics" element={withSuspense(<SystemDiagnostics />)} />
                              <Route path="legal-safehouse" element={withSuspense(<LegalSafehouse />)} />
                              <Route path="asset-provenance" element={withSuspense(<AssetProvenance />)} />
                              <Route path="dev-playground" element={withSuspense(<DevPlayground />)} />

                              {/* Social */}
                              <Route path="social" element={withSuspense(<SocialFeed />)} />
                              <Route path="social/profile" element={withSuspense(<EnhancedUserProfile />)} />
                              <Route path="social/followers" element={withSuspense(<FollowersPage />)} />

                              <Route path="*" element={withSuspense(<NotFound />)} />
                            </Routes>
                          </main>
                        </div>
                      </div>
                    </SidebarProvider>
                  </ProtectedRoute>
                )}
              />
            </Routes>

            {/* Non-nested route that must live outside /app */}
            <Routes>
              <Route path="/redeem/:code" element={withSuspense(<RedeemEnrollment />)} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
