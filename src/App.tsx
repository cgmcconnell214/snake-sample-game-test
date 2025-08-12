import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Suspense, lazy, type ReactNode } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import PageViewTracker from "@/components/PageViewTracker";

// Lazy-loaded Pages
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
const AITradingBots = lazy(() => import("./pages/AITradingBots"));
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
const TokenSupply = lazy(() => import("./pages/TokenSupply"));
const DevPlayground = lazy(() => import("./pages/DevPlayground"));
const Auth = lazy(() => import("./pages/Auth"));
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MarketplaceNew = lazy(() => import("./pages/MarketplaceNew"));
const LiveClassesNew = lazy(() => import("./pages/LiveClassesNew"));
const LiquidityPoolsNew = lazy(() => import("./pages/LiquidityPoolsNew"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const CourseCreator = lazy(() => import("./pages/CourseCreator"));
const RedeemEnrollment = lazy(() => import("./pages/RedeemEnrollment"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const BadgeProgression = lazy(() => import("./pages/BadgeProgression"));

// Lazy-loaded Components
const AppSidebar = lazy(() =>
  import("./components/AppSidebar").then((m) => ({ default: m.AppSidebar })),
);
const MessageCenter = lazy(() => import("./components/MessageCenter"));
const IPTokenization = lazy(() => import("./components/IPTokenization"));
const CourseBuilder = lazy(() => import("@/components/learning/CourseBuilder"));
const SocialFeed = lazy(() => import("./components/social/SocialFeed"));
const EnhancedUserProfile = lazy(
  () => import("./components/social/EnhancedUserProfile"),
);
const FollowersPage = lazy(
  () => import("./components/social/FollowersPage"),
);
const NotificationCenter = lazy(
  () => import("./components/NotificationCenter"),
);

import SkipLink from "@/components/SkipLink";

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
            <PageViewTracker />
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
                          <SkipLink />
                          <header className="h-12 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur px-4">
                            <SidebarTrigger />
                            {withSuspense(<NotificationCenter />)}
                          </header>
                          <main id="main-content" role="main" className="flex-1">
                            <Routes>
                              <Route
                                index
                                element={withSuspense(<Dashboard />)}
                              />
                              <Route
                                path="tokenize"
                                element={withSuspense(
                                  <ProtectedRoute requiredTier="standard">
                                    <Tokenize />
                                  </ProtectedRoute>,
                                )}
                              />
                              <Route
                                path="trading"
                                element={withSuspense(
                                  <ProtectedRoute requiredTier="standard">
                                    <Trading />
                                  </ProtectedRoute>,
                                )}
                              />
                              <Route
                                path="portfolio"
                                element={withSuspense(<Portfolio />)}
                              />
                              <Route
                                path="kyc"
                                element={withSuspense(<KycCenter />)}
                              />
                              <Route
                                path="compliance"
                                element={withSuspense(<Compliance />)}
                              />
                              <Route
                                path="audit"
                                element={withSuspense(<AuditTrail />)}
                              />
                              <Route
                                path="reports"
                                element={withSuspense(<Reports />)}
                              />
                              <Route
                                path="profile"
                                element={withSuspense(<UserProfile />)}
                              />
                              <Route
                                path="messages"
                                element={withSuspense(<MessageCenter />)}
                              />
                              <Route
                                path="ip-tokenization"
                                element={withSuspense(<IPTokenization />)}
                              />
                              <Route
                                path="settings"
                                element={withSuspense(<Settings />)}
                              />
                              <Route
                                path="admin"
                                element={withSuspense(
                                  <ProtectedRoute requiredRole="admin">
                                    <Admin />
                                  </ProtectedRoute>,
                                )}
                              />
                              <Route
                                path="blockchain"
                                element={withSuspense(
                                  <ProtectedRoute requiredRole="admin">
                                    <Blockchain />
                                  </ProtectedRoute>,
                                )}
                              />

                              {/* New 5-Layer Navigation */}
                              <Route
                                path="ai-agents"
                                element={withSuspense(<AIAgents />)}
                              />
                              <Route
                                path="ai-trading-bots"
                                element={withSuspense(<AITradingBots />)}
                              />
                              <Route
                                path="smart-contracts"
                                element={withSuspense(<SmartContracts />)}
                              />
                              <Route
                                path="workflow-automation"
                                element={withSuspense(<WorkflowAutomation />)}
                              />

                              {/* Learning */}
                              <Route
                                path="learning"
                                element={withSuspense(<LearningPortal />)}
                              />
                              <Route
                                path="learning/courses"
                                element={withSuspense(<LearningPortal />)}
                              />
                              <Route
                                path="learning/courses/:slug"
                                element={withSuspense(<CourseDetail />)}
                              />
                              <Route
                                path="learning/creator"
                                element={withSuspense(<CourseCreator />)}
                              />
                              <Route
                                path="learning/creator/:id"
                                element={withSuspense(<CourseBuilder />)}
                              />
                              <Route
                                path="certification"
                                element={withSuspense(<Certification />)}
                              />
                              <Route
                                path="onboarding"
                                element={withSuspense(<Onboarding />)}
                              />
                              <Route
                                path="badges"
                                element={withSuspense(<BadgeProgression />)}
                              />

                              {/* Live / Trust / Law */}
                              <Route
                                path="live-classes"
                                element={withSuspense(<LiveClasses />)}
                              />
                              <Route
                                path="live-classes/new"
                                element={withSuspense(<LiveClassesNew />)}
                              />
                              <Route
                                path="divine-trust"
                                element={withSuspense(<DivineTrust />)}
                              />
                              <Route
                                path="kingdom-entry"
                                element={withSuspense(
                                  <ProtectedRoute requiredRole="premium">
                                    <KingdomEntry />
                                  </ProtectedRoute>,
                                )}
                              />
                              <Route
                                path="sacred-law"
                                element={withSuspense(<SacredLaw />)}
                              />

                              {/* Market / Liquidity / DeFi */}
                              <Route
                                path="marketplace"
                                element={withSuspense(<Marketplace />)}
                              />
                              <Route
                                path="marketplace/browse"
                                element={withSuspense(<MarketplaceNew />)}
                              />
                              <Route
                                path="liquidity"
                                element={withSuspense(<LiquidityPools />)}
                              />
                              <Route
                                path="liquidity/pools"
                                element={withSuspense(<LiquidityPoolsNew />)}
                              />
                              <Route
                                path="escrow"
                                element={withSuspense(<EscrowVaults />)}
                              />
                              <Route
                                path="tokenomics"
                                element={withSuspense(<TokenomicsPage />)}
                              />
                              <Route
                                path="token-supply"
                                element={withSuspense(<TokenSupply />)}
                              />

                              {/* Infra / Ops */}
                              <Route
                                path="node-management"
                                element={withSuspense(<NodeManagement />)}
                              />
                              <Route
                                path="data-sync"
                                element={withSuspense(<DataSync />)}
                              />
                              <Route
                                path="diagnostics"
                                element={withSuspense(<SystemDiagnostics />)}
                              />
                              <Route
                                path="legal-safehouse"
                                element={withSuspense(<LegalSafehouse />)}
                              />
                              <Route
                                path="asset-provenance"
                                element={withSuspense(<AssetProvenance />)}
                              />
                              <Route
                                path="dev-playground"
                                element={withSuspense(<DevPlayground />)}
                              />

                              {/* Social */}
                              <Route
                                path="social"
                                element={withSuspense(<SocialFeed />)}
                              />
                              <Route
                                path="social/profile"
                                element={withSuspense(<EnhancedUserProfile />)}
                              />
                              <Route
                                path="social/followers"
                                element={withSuspense(<FollowersPage />)}
                              />

                              <Route
                                path="*"
                                element={withSuspense(<NotFound />)}
                              />
                            </Routes>
                          </main>
                        </div>
                      </div>
                    </SidebarProvider>
                  </ProtectedRoute>,
                )}
              />
            </Routes>

            {/* Non-nested route outside /app */}
            <Routes>
              <Route
                path="/redeem/:code"
                element={withSuspense(<RedeemEnrollment />)}
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
