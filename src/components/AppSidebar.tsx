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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"

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

  const [openSections, setOpenSections] = useState({
    core: true,
    ai: true,
    education: true,
    spiritual: true,
    market: true,
    compliance: true,
    admin: true,
    bonus: true,
    system: true,
  })

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))

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
        <Collapsible
          open={openSections.core}
          onOpenChange={() => toggleSection('core')}
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer px-2">
                <span>Core Platform</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${openSections.core ? 'rotate-0' : '-rotate-90'}`}
                />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* 1. AI & Automation */}
        <Collapsible
          open={openSections.ai}
          onOpenChange={() => toggleSection('ai')}
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer px-2">
                <span>🧬 AI & Automation</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${openSections.ai ? 'rotate-0' : '-rotate-90'}`}
                />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* 2. Education & Onboarding */}
        <Collapsible
          open={openSections.education}
          onOpenChange={() => toggleSection('education')}
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer px-2">
                <span>📚 Education & Onboarding</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${openSections.education ? 'rotate-0' : '-rotate-90'}`}
                />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* 3. Spiritual / Sovereign */}
        <Collapsible
          open={openSections.spiritual}
          onOpenChange={() => toggleSection('spiritual')}
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer px-2">
                <span>👁️ Spiritual / Sovereign</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${openSections.spiritual ? 'rotate-0' : '-rotate-90'}`}
                />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* 4. Marketplace & Exchange */}
        <Collapsible
          open={openSections.market}
          onOpenChange={() => toggleSection('market')}
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer px-2">
                <span>🏦 Marketplace & Exchange</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${openSections.market ? 'rotate-0' : '-rotate-90'}`}
                />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Compliance & Security */}
        <Collapsible
          open={openSections.compliance}
          onOpenChange={() => toggleSection('compliance')}
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer px-2">
                <span>🛡️ Compliance & Security</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${openSections.compliance ? 'rotate-0' : '-rotate-90'}`}
                />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* 5. Admin & Infrastructure */}
        <Collapsible
          open={openSections.admin}
          onOpenChange={() => toggleSection('admin')}
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer px-2">
                <span>🧩 Admin & Infrastructure</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${openSections.admin ? 'rotate-0' : '-rotate-90'}`}
                />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Bonus Features */}
        <Collapsible
          open={openSections.bonus}
          onOpenChange={() => toggleSection('bonus')}
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer px-2">
                <span>✨ Advanced Features</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${openSections.bonus ? 'rotate-0' : '-rotate-90'}`}
                />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* System & User */}
        <Collapsible
          open={openSections.system}
          onOpenChange={() => toggleSection('system')}
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer px-2">
                <span>⚙️ System</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${openSections.system ? 'rotate-0' : '-rotate-90'}`}
                />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
    </Sidebar>
  )
}