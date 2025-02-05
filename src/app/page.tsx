"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { motion } from "framer-motion";
import { Building2, Network, User, Users } from "lucide-react";
import Link from "next/link";

import dashboardLinks from "@/lib/dashboard-links.json";

const iconMap = {
  User,
  Users,
  Building2,
  Network,
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-white/80 px-4 backdrop-blur-sm transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#" className="text-sm font-medium">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <main className="flex-grow p-4 sm:p-6 md:p-8 lg:p-10">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-2"
        >
          Welcome back
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg text-gray-500 mb-8"
        >
          Select a category to manage your application
        </motion.p>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">
          {dashboardLinks.links.map((link, index) => {
            const Icon = iconMap[link.icon as keyof typeof iconMap];
            return (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={link.href} className="group">
                  <div className="bg-white rounded-2xl shadow-sm p-6 transition-all duration-300 ease-in-out hover:shadow-md hover:-translate-y-1 hover:bg-gradient-to-br hover:from-white hover:to-gray-50 relative overflow-hidden">
                    <div
                      className="absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-10"
                      style={{
                        backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
                      }}
                    />
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className={`rounded-full p-3 ${link.color} bg-opacity-10 transition-colors duration-300 ease-in-out group-hover:bg-opacity-20`}
                      >
                        <Icon className={`h-6 w-6 ${link.color}`} />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {link.title}
                      </h2>
                    </div>
                    <p className="text-gray-500 mb-4">{link.description}</p>
                    <div
                      className={`flex items-center text-sm font-medium ${link.color} transition-all duration-300 ease-in-out opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0`}
                    >
                      Learn more
                      <svg
                        className="ml-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
