import { useState } from "react";
import {
  LayoutDashboard,
  Coins,
  TrendingUp,
  Briefcase,
  Shield,
  Settings,
  UserCheck,
  Activity,
  FileText,
  Zap,
  User,
  Mail,
  Bot,
  Scroll,
  Eye,
  Store,
  Server,
  Lock,
  History,
  BarChart3,
  Code,
  FileCheck,
  Workflow,
  GraduationCap,
  Award,
  Calendar,
  Archive,
  Users,
  Feather,
  Building,
  Layers,
  GitBranch,
  Monitor,
  Webhook,
  AlertTriangle,
  MessageSquare,
  Heart,
  Users2,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
} from "@/components/ui/sidebar";

// Core Platform
const coreItems = [
  { title: "Dashboard", url: "/app/", icon: LayoutDashboard },
  { title: "Tokenize Assets", url: "/app/tokenize", icon: Coins },
  { title: "Trading", url: "/app/trading", icon: TrendingUp },
  { title: "Portfolio", url: "/app/portfolio", icon: Briefcase },
];

// 1. AI & Automation Layer
const aiAutomationItems = [
  { title: "AI Agents", url: "/app/ai-agents", icon: Bot },
  { title: "AI Trading Bots", url: "/app/ai-trading-bots", icon: Zap },
  { title: "Smart Contracts", url: "/app/smart-contracts", icon: FileCheck },
  {
    title: "Workflow Automation",
    url: "/app/workflow-automation",
    icon: Workflow,
  },
];

// 2. Education & Onboarding Layer
const educationItems = [
  { title: "Learning Portal", url: "/app/learning", icon: GraduationCap },
  { title: "Certification", url: "/app/certification", icon: Award },
  { title: "Live Classes", url: "/app/live-classes", icon: Calendar },
];

// 3. Spiritual / Sovereign Layer
const spiritualItems = [
  { title: "Divine Trust Vault", url: "/app/divine-trust", icon: Archive },
  { title: "Kingdom Entry", url: "/app/kingdom-entry", icon: Users },
  { title: "Sacred Law", url: "/app/sacred-law", icon: Feather },
];

// 4. Marketplace & Exchange Layer
const marketplaceItems = [
  { title: "P2P Marketplace", url: "/app/marketplace", icon: Store },
  { title: "Liquidity Pools", url: "/app/liquidity", icon: Layers },
  { title: "Escrow Vaults", url: "/app/escrow", icon: Building },
];

// Social Media Layer
const socialItems = [
  { title: "Social Feed", url: "/app/social", icon: MessageSquare },
  { title: "My Profile", url: "/app/social/profile", icon: User },
  { title: "Followers", url: "/app/social/followers", icon: Users2 },
  { title: "Messages", url: "/app/messages", icon: Mail },
];

// Compliance & Security (Existing)
const complianceItems = [
  { title: "KYC Center", url: "/app/kyc", icon: UserCheck },
  { title: "Compliance", url: "/app/compliance", icon: Shield },
  { title: "Audit Trail", url: "/app/audit", icon: Activity },
  { title: "Reports", url: "/app/reports", icon: FileText },
];

// 5. Admin & Infrastructure Layer
const adminItems = [
  { title: "Node Management", url: "/app/node-management", icon: GitBranch },
  { title: "Data Sync", url: "/app/data-sync", icon: Webhook },
  { title: "System Diagnostics", url: "/app/diagnostics", icon: Monitor },
];

// Bonus Features
const bonusItems = [
  { title: "Legal Safehouse", url: "/app/legal-safehouse", icon: Lock },
  { title: "Asset Provenance", url: "/app/asset-provenance", icon: History },
  { title: "Tokenomics", url: "/app/tokenomics", icon: BarChart3 },
  { title: "Dev Playground", url: "/app/dev-playground", icon: Code },
];

// System & User
const systemItems = [
  { title: "IP Assets", url: "/app/ip-tokenization", icon: Coins },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

export function AppSidebar(): JSX.Element {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-sidebar-accent text-sidebar-primary font-medium"
      : "hover:bg-sidebar-accent/50";

  return (
    <Sidebar className={open ? "w-64" : "w-16"} collapsible="icon">
      <SidebarHeader className="p-0 border-b border-sidebar-border">
        <div className="relative h-20 bg-gradient-to-r from-divine-gold/20 via-primary/10 to-divine-gold/20 flex items-center justify-center overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--divine-gold))_0%,transparent_70%)] opacity-5"></div>
          
          {/* Logo and text container */}
          <div className="relative z-10 flex items-center gap-3 px-4">
            <div className="flex-shrink-0">
              <img 
                src="/lovable-uploads/93355fa4-02d2-44c8-a9a1-36ffb47138c1.png" 
                alt="God's Realm Logo" 
                className="h-10 w-10 drop-shadow-lg" 
              />
            </div>
            {open && (
              <div className="text-center">
                <h2 className="text-lg font-bold text-divine-gold drop-shadow-sm">
                  God's Realm
                </h2>
                <p className="text-xs text-divine-gold/80 font-medium">
                  Divine Sanctuary
                </p>
              </div>
            )}
          </div>
          
          {/* Decorative elements for when expanded */}
          {open && (
            <>
              <div className="absolute top-2 left-4 w-2 h-2 bg-divine-gold/30 rounded-full animate-pulse"></div>
              <div className="absolute bottom-2 right-4 w-1 h-1 bg-divine-gold/40 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 space-y-1">
        {/* Core Platform */}
        <SidebarGroup>
          <SidebarGroupLabel>Core Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {coreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 1. AI & Automation */}
        <SidebarGroup>
          <SidebarGroupLabel>🧬 AI & Automation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiAutomationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 2. Education & Onboarding */}
        <SidebarGroup>
          <SidebarGroupLabel>📚 Education & Onboarding</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {educationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 3. Spiritual / Sovereign */}
        <SidebarGroup>
          <SidebarGroupLabel>👁️ Spiritual / Sovereign</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {spiritualItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 4. Marketplace & Exchange */}
        <SidebarGroup>
          <SidebarGroupLabel>🏦 Marketplace & Exchange</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {marketplaceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Social Media */}
        <SidebarGroup>
          <SidebarGroupLabel>📱 Social Media</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {socialItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Compliance & Security */}
        <SidebarGroup>
          <SidebarGroupLabel>🛡️ Compliance & Security</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {complianceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 5. Admin & Infrastructure */}
        <SidebarGroup>
          <SidebarGroupLabel>🧩 Admin & Infrastructure</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bonus Features */}
        <SidebarGroup>
          <SidebarGroupLabel>✨ Advanced Features</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {bonusItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System & User */}
        <SidebarGroup>
          <SidebarGroupLabel>⚙️ System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
