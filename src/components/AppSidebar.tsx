import { useState } from "react"
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
  AlertTriangle
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

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
} from "@/components/ui/sidebar"

// Core Platform
const coreItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Tokenize Assets", url: "/tokenize", icon: Coins },
  { title: "Trading", url: "/trading", icon: TrendingUp },
  { title: "Portfolio", url: "/portfolio", icon: Briefcase },
]

// 1. AI & Automation Layer
const aiAutomationItems = [
  { title: "AI Agents", url: "/ai-agents", icon: Bot },
  { title: "Smart Contracts", url: "/smart-contracts", icon: FileCheck },
  { title: "Workflow Automation", url: "/workflow-automation", icon: Workflow },
]

// 2. Education & Onboarding Layer
const educationItems = [
  { title: "Learning Portal", url: "/learning", icon: GraduationCap },
  { title: "Certification", url: "/certification", icon: Award },
  { title: "Live Classes", url: "/live-classes", icon: Calendar },
]

// 3. Spiritual / Sovereign Layer
const spiritualItems = [
  { title: "Divine Trust Vault", url: "/divine-trust", icon: Archive },
  { title: "Kingdom Entry", url: "/kingdom-entry", icon: Users },
  { title: "Sacred Law", url: "/sacred-law", icon: Feather },
]

// 4. Marketplace & Exchange Layer
const marketplaceItems = [
  { title: "P2P Marketplace", url: "/marketplace", icon: Store },
  { title: "Liquidity Pools", url: "/liquidity", icon: Layers },
  { title: "Escrow Vaults", url: "/escrow", icon: Building },
]

// Compliance & Security (Existing)
const complianceItems = [
  { title: "KYC Center", url: "/kyc", icon: UserCheck },
  { title: "Compliance", url: "/compliance", icon: Shield },
  { title: "Audit Trail", url: "/audit", icon: Activity },
  { title: "Reports", url: "/reports", icon: FileText },
]

// 5. Admin & Infrastructure Layer
const adminItems = [
  { title: "Node Management", url: "/node-management", icon: GitBranch },
  { title: "Data Sync", url: "/data-sync", icon: Webhook },
  { title: "System Diagnostics", url: "/diagnostics", icon: Monitor },
]

// Bonus Features
const bonusItems = [
  { title: "Legal Safehouse", url: "/legal-safehouse", icon: Lock },
  { title: "Asset Provenance", url: "/asset-provenance", icon: History },
  { title: "Tokenomics", url: "/tokenomics", icon: BarChart3 },
  { title: "Dev Playground", url: "/dev-playground", icon: Code },
]

// System & User
const systemItems = [
  { title: "Profile", url: "/profile", icon: User },
  { title: "Messages", url: "/messages", icon: Mail },
  { title: "IP Assets", url: "/ip-tokenization", icon: Coins },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { open } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-primary font-medium" : "hover:bg-sidebar-accent/50"

  return (
    <Sidebar className={open ? "w-64" : "w-16"} collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Coins className="h-5 w-5 text-primary-foreground" />
          </div>
          {open && (
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">God's Realm</h2>
              <p className="text-xs text-sidebar-foreground/60">Divine Tokenization Platform</p>
            </div>
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
  )
}