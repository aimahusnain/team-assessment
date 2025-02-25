"use client"

import {
  Activity,
  AudioWaveform,
  BadgeCheck,
  Handshake,
  HelpCircle,
  Home,
  LayoutDashboard,
  MessageCircle,
  PhoneIncoming,
  PhoneOutgoing,
  PieChart,
  Settings,
  Users,
  VideoIcon
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

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
} from "@/components/ui/sidebar"

interface SidebarPageTemplateProps {
  children: React.ReactNode
}

export default function SidebarPageTemplate({ children }: SidebarPageTemplateProps) {
  const pathname = usePathname()

  const navigation = {
    dashboards: [
      { name: "Individuals", href: "/dashboard/individuals", icon: LayoutDashboard },
      { name: "Teams", href: "/dashboard/teams", icon: Handshake },
      { name: "Departments", href: "/dashboard/departments", icon: Users },
      { name: "Company", href: "/dashboard/company", icon: Home },
    ],
    dataentry: [
      { name: "Activity Log", href: "/data-entry/activity-log", icon: Activity },
      { name: "Incoming Calls", href: "/data-entry/incoming-calls", icon: PhoneIncoming },
      { name: "Outgoing Calls", href: "/data-entry/outgoing-calls", icon: PhoneOutgoing },
    ],
    visualization: [
      { name: "Members", href: "/members", icon: PieChart },
      { name: "Permissions", href: "/permissions", icon: BadgeCheck },
      { name: "Chat", href: "/chat", icon: MessageCircle },
      { name: "Meetings", href: "/meetings", icon: VideoIcon },
    ],
  }

  return (
    <SidebarProvider>
      <Sidebar className="border-r-0">
        <SidebarHeader className="p-4 mt-2">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <AudioWaveform className="h-6 w-6 text-lime-400" />
            <span>Team Assessment</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="uppercase font-bold">DASHBOARDS</SidebarGroupLabel>
            <SidebarMenu>
              {navigation.dashboards.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton className="py-5" asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="uppercase font-bold">DATA ENTRY</SidebarGroupLabel>
            <SidebarMenu>
              {navigation.dataentry.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton className="py-5" asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="uppercase font-bold">Visualization</SidebarGroupLabel>
            <SidebarMenu>
              {navigation.visualization.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton className="py-5" asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="mt-auto mb-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="py-5" asChild>
                <Link href="/settings">
                  <Settings className="h-10 w-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
              <SidebarMenuButton className="py-5" asChild>
                <Link href="/settings">
                  <HelpCircle className="h-10 w-4" />
                  <span>Help</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {/* <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.picture} alt={user.username} />
                      <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user.username}</span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                    <ChevronDown className="ml-auto h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                  align="start"
                  side="right"
                  sideOffset={8}
                >
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <BadgeCheck className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={toggleTheme}>
                      {theme === "light" ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                      Toggle Theme
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem> */}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}

