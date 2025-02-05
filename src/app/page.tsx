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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 px-4 backdrop-blur-sm transition-[width,height] ease-linear">
        <SidebarTrigger className="-ml-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors" />
        <Separator orientation="vertical" className="mr-2 h-4 bg-zinc-200 dark:bg-zinc-800" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <main className="flex-grow p-4 sm:p-6 md:p-8 lg:p-10 bg-gradient-to-b from-white to-zinc-50 dark:from-black dark:to-zinc-900">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-emerald-400 dark:to-cyan-400 mb-2"
        >
          Welcome back
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg text-zinc-500 dark:text-zinc-400 mb-8"
        >
          Select a category to manage your application
        </motion.p>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-4"
        >
          {dashboardLinks.links.map((link) => {
            const Icon = iconMap[link.icon as keyof typeof iconMap];
            return (
              <motion.div
                key={link.href}
                variants={item}
                className="group"
              >
                <Link href={link.href}>
                  <div className="relative rounded-xl bg-gradient-to-br from-zinc-100 to-white dark:from-zinc-900 dark:to-zinc-800 p-[1px] transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md dark:shadow-none">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400/0 to-cyan-400/0 dark:from-emerald-400/20 dark:to-cyan-400/20 opacity-0 blur transition-opacity duration-300 group-hover:opacity-100" />
                    
                    <div className="relative rounded-xl bg-white dark:bg-zinc-900 p-6 transition-all duration-300">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 transition-colors duration-300 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800`}>
                          <Icon className={`h-6 w-6 text-zinc-500 group-hover:text-emerald-500 dark:text-emerald-400 dark:group-hover:text-cyan-400 transition-colors duration-300`} />
                        </div>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                          {link.title}
                        </h2>
                      </div>

                      <p className="text-zinc-500 dark:text-zinc-400 mb-4">{link.description}</p>

                      <div className="flex items-center text-sm font-medium text-emerald-500 group-hover:text-emerald-600 dark:text-emerald-400 dark:group-hover:text-cyan-400 transition-all duration-300">
                        Learn more
                        <svg
                          className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
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
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </main>
    </div>
  );
}