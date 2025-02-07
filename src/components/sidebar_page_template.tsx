"use client";

import {
  AudioWaveform,
  BadgeCheck,
  Bell,
  Bot,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  Folder,
  Forward,
  Moon,
  MoreHorizontal,
  PieChart,
  Plus,
  SquareTerminal,
  Sun,
  Trash2,
  LogOut,
} from "lucide-react";
import React, { useState, type ReactNode, useEffect, useCallback } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarPageTemplateProps {
  children: ReactNode;
}

export default function SidebarPageTemplate({
  children,
}: SidebarPageTemplateProps) {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  interface NavItem {
    url: string;
  }

  const isPathInItems = (items: NavItem[]) => {
    return items?.some((item) => item.url === pathname);
  };

  const data = {
    teams: [
      {
        name: "Main Model",
        logo: AudioWaveform,
        plan: "by Devkins",
      },
    ],
    navMain: [
      {
        title: "Dashboard",
        url: "#",
        icon: Bot,
        isActive: isPathInItems([
          { url: "/dashboard/individuals" },
          { url: "/dashboard/teams" },
          { url: "/dashboard/departments" },
          { url: "/dashboard/company" },
        ]),
        items: [
          {
            title: "Individuals",
            url: "/dashboard/individuals",
            isActive: pathname === "/dashboard/individuals",
          },
          {
            title: "Teams",
            url: "/dashboard/teams",
            isActive: pathname === "/dashboard/teams",
          },
          {
            title: "Departments",
            url: "/dashboard/departments",
            isActive: pathname === "/dashboard/departments",
          },
          {
            title: "Company",
            url: "/dashboard/company",
            isActive: pathname === "/dashboard/company",
          },
        ],
      },
      {
        title: "Data Entry",
        url: "#",
        icon: SquareTerminal,
        isActive: isPathInItems([
          { url: "/data-entry/activity-log" },
          { url: "/data-entry/incoming-calls" },
          { url: "/data-entry/outgoing-calls" },
          { url: "/data-entry/inputs" },
        ]),
        items: [
          {
            title: "Activity Log (Table1)",
            url: "/data-entry/activity-log",
            isActive: pathname === "/data-entry/activity-log",
          },
          {
            title: "Incoming Calls",
            url: "/data-entry/incoming-calls",
            isActive: pathname === "/data-entry/incoming-calls",
          },
          {
            title: "Outgoing Calls",
            url: "/data-entry/outgoing-calls",
            isActive: pathname === "/data-entry/outgoing-calls",
          },
          {
            title: "System Configuration",
            url: "/data-entry/inputs",
            isActive: pathname === "/data-entry/inputs",
          },
        ],
      },
    ],
    visualization: [
      {
        name: "Top 10",
        url: "/top-10",
        icon: PieChart,
        isActive: pathname === "/top-10",
      },
    ],
  };

  const [activeTeam, setActiveTeam] = React.useState(data.teams[0]);
  const { theme, setTheme } = useTheme();
  const [user, setUser] = React.useState({
    id: 1,
    username: "Perdyrkorn",
    email: "perdyrkorn@gmail.com",
    picture: "https://github.com/shadcn.png",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  //   const logoutWithGoogle = async () => {
  //     try {
  //       await signOut();
  //     } catch (err) {
  //       console.error("There was an error logging out:", err);
  //     }
  //   };
  useEffect(() => {
    fetchUser();
    const intervalId = setInterval(fetchUser, 10000); // Fetch every 10 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  const fetchUser = useCallback(async () => {
    async () => {
      const response = await fetch("/api/get-user");
      const data = await response.json();
      if (data.success) {
        setUser(data.data[0]);
        return data.data[0];
      } else {
        throw new Error("Failed to fetch user data");
      }
    };
  }, []);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <activeTeam.logo className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {activeTeam.name}
                      </span>
                      <span className="truncate text-xs">
                        {activeTeam.plan}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Teams
                  </DropdownMenuLabel>
                  {data.teams.map((team, index) => (
                    <DropdownMenuItem
                      key={team.name}
                      onClick={() => setActiveTeam(team)}
                      className="gap-2 p-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <team.logo className="size-4 shrink-0" />
                      </div>
                      {team.name}
                      <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 p-2">
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                      <Plus className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">
                      Add team
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              className={
                                subItem.isActive ? "bg-sidebar-accent" : ""
                              }
                            >
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Visualization</SidebarGroupLabel>
            <SidebarMenu>
              {data.visualization.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-48 rounded-lg"
                      side="bottom"
                      align="end"
                    >
                      <DropdownMenuItem>
                        <Folder className="text-muted-foreground" />
                        <span>View Project</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Forward className="text-muted-foreground" />
                        <span>Share Project</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Trash2 className="text-muted-foreground" />
                        <span>Delete Project</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton className="text-sidebar-foreground/70">
                  <MoreHorizontal className="text-sidebar-foreground/70" />
                  <span>More</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user.picture} alt={user.username} />
                      <AvatarFallback className="rounded-lg">
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user.username}
                      </span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={user.picture} alt={user.username} />
                        <AvatarFallback className="rounded-lg">
                          {user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {user.username}
                        </span>
                        <span className="truncate text-xs">{user.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <Link href="/account">
                      <DropdownMenuItem>
                        <BadgeCheck className="h-4 w-4" />
                        <span>Account</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem>
                      <CreditCard />
                      Billing
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bell />
                      Notifications
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={toggleTheme}
                      aria-label="Toggle theme"
                    >
                      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span>Toggle Theme</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
      {/* <Toaster /> */}
    </SidebarProvider>
  );
}
