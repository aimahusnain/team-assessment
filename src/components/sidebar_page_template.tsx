"use client";

import {
  Activity,
  AudioWaveform,
  BadgeCheck,
  Bolt,
  ExternalLink,
  Handshake,
  HelpCircle,
  Home,
  LayoutDashboard,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PieChart,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail } from "lucide-react";

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
} from "@/components/ui/sidebar";
import { ThemeToggle } from "./theme_toggler";
import { Separator } from "./ui/separator";

interface SidebarPageTemplateProps {
  children: React.ReactNode;
}

export default function SidebarPageTemplate({
  children,
}: SidebarPageTemplateProps) {
  const pathname = usePathname();

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
      { name: "Top 10", href: "/top-10", icon: PieChart },
    ],
  };
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="p-4 mt-2">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <AudioWaveform className="h-6 w-6 text-lime-400" />
            <span className="group-data-[collapsible=icon]:hidden">
              Team Assessment
            </span>
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
                  <SidebarMenuButton
                    className="py-5"
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.name}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.name}
                      </span>
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
                  <SidebarMenuButton
                    className="py-5"
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.name}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.name}
                      </span>
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
                  <SidebarMenuButton
                    className="py-5"
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.name}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.name}
                      </span>
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
                    <span className="group-data-[collapsible=icon]:hidden">
                      Settings
                    </span>
                  </Link>
                </SidebarMenuButton>

                <div className="flex items-center justify-between group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
                  <SidebarMenuButton className="py-5" asChild tooltip="Help">
                    <button
                      onClick={() => setIsOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <HelpCircle className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        Help
                      </span>
                    </button>
                  </SidebarMenuButton>

                  {/* Help Dialog */}
                  <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="max-w-2xl p-6 gap-6">
                      <DialogHeader className="border-b pb-4">
                        <DialogTitle className="text-2xl font-bold text-primary">
                          How Can We Help You?
                        </DialogTitle>
                     {/* Help Center Section */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">

              <div className="bg-transparent p-4 rounded-lg border  transition-colors">
                <div className="flex items-start space-x-3">
                  <ExternalLink className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Help Center</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Browse through our comprehensive guides, tutorials, and FAQs.
                    </p>
                    <a 
                      href="https://devkins.dev/contact" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary hover:underline font-medium"
                    >
                      Visit Help Center
                      <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
                        {/* Email Support Section */}
                        <div className="bg-transparent p-4 rounded-lg border  transition-colors">
                          <div className="flex items-start space-x-3">
                            <Mail className="h-5 w-5 text-primary mt-1" />
                            <div>
                              <h3 className="font-semibold text-lg mb-2">
                                Email Support
                              </h3>
                              <p className="text-sm text-muted-foreground mb-3">
                                Get personalized help from our support team.
                              </p>
                              <a
                                href="mailto:devkins.dev@gmail.com"
                                className="inline-flex items-center text-sm text-primary hover:underline font-medium"
                              >
                                devkins.dev@gmail.com
                                <ExternalLink className="h-4 w-4 ml-1" />
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Contact Hours Section */}
                        <div className="md:col-span-2 p-4 bg-transparent rounded-lg border border-primary/20">
                          <div className="flex items-center space-x-3">
                            <PhoneCall className="h-5 w-5 text-primary" />
                            <div>
                              <h3 className="font-semibold text-lg">
                                Support Hours
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Monday to Friday: 9:00 AM - 12:00 PM EST
                              </p>
                            </div>
                          </div>
                        </div>
                        </div>
                      </DialogHeader>

                      {/* Add Your Help Sections Here */}
                    
                    </DialogContent>
                  </Dialog>

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
  );
}
