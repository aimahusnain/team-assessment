"use client"

import {
  Activity,
  AudioWaveform,
  BadgeCheck,
  Bolt,
  Handshake,
  HelpCircle,
  Home,
  LayoutDashboard,
  PhoneIncoming,
  PhoneOutgoing,
  PieChart,
  Settings,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "./theme_toggler"
import { Separator } from "./ui/separator"

interface SidebarPageTemplateProps {
  children: React.ReactNode
}

export default function SidebarPageTemplate({ children }: SidebarPageTemplateProps) {
  const pathname = usePathname()

  const navigation = {
    dashboards: [
      {
        name: "Individuals",
        href: "/dashboard/individuals",
        icon: LayoutDashboard,
      },
      { name: "Teams", href: "/dashboard/teams", icon: Handshake },
      { name: "Departments", href: "/dashboard/departments", icon: Users },
      { name: "Company", href: "/dashboard/company", icon: Home },
    ],
    dataentry: [
      {
        name: "Activity Log",
        href: "/data-entry/activity-log",
        icon: Activity,
      },
      {
        name: "Incoming Calls",
        href: "/data-entry/incoming-calls",
        icon: PhoneIncoming,
      },
      {
        name: "Outgoing Calls",
        href: "/data-entry/outgoing-calls",
        icon: PhoneOutgoing,
      },
      { name: "Configuration", href: "/data-entry/inputs", icon: Bolt },
    ],
    visualization: [
      { name: "Anayytics Dashboard", href: "/visualization", icon: PieChart },
    ],
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="p-4 mt-2">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <AudioWaveform className="h-6 w-6 text-lime-400" />
            <span className="group-data-[collapsible=icon]:hidden">Team Assessment</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="uppercase font-bold group-data-[collapsible=icon]:hidden">
              DASHBOARDS
            </SidebarGroupLabel>
            <SidebarMenu>
              {navigation.dashboards.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton className="py-5" asChild isActive={pathname === item.href} tooltip={item.name}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <Separator />

          <SidebarGroup>
            <SidebarGroupLabel className="uppercase font-bold group-data-[collapsible=icon]:hidden">
              DATA ENTRY
            </SidebarGroupLabel>
            <SidebarMenu>
              {navigation.dataentry.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton className="py-5" asChild isActive={pathname === item.href} tooltip={item.name}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <Separator />

          <SidebarGroup>
            <SidebarGroupLabel className="uppercase font-bold group-data-[collapsible=icon]:hidden">
              Visualization
            </SidebarGroupLabel>
            <SidebarMenu>
              {navigation.visualization.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton className="py-5" asChild isActive={pathname === item.href} tooltip={item.name}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <Separator />

        <SidebarFooter className="mt-auto mb-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex flex-col gap-2">
                <SidebarMenuButton className="py-5" asChild tooltip="Settings">
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                  </Link>
                </SidebarMenuButton>

                <div className="flex items-center justify-between group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
                  <SidebarMenuButton className="py-5" asChild tooltip="Help">
                    <Link href="/help">
                      <HelpCircle className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">Help</span>
                    </Link>
                  </SidebarMenuButton>

                  <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
                    <SidebarTrigger className="h-8 w-8" />
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}

