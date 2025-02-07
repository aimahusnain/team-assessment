import React from 'react';
import { Card } from '@/components/ui/card';
import {
  Bot,
  SquareTerminal,
  PieChart,
  Users,
  Building2,
  Building,
  Activity,
  TableProperties,
  PhoneIncoming,
  PhoneOutgoing,
  Settings,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

const GlowingBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob" />
    <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000" />
    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000" />
  </div>
);

import { LucideIcon } from "lucide-react";

interface NavigationCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  gradient: string;
}

const NavigationCard: React.FC<NavigationCardProps> = ({ icon: Icon, title, description, href, gradient }) => (
  <Link href={href}>
    <Card className={`group relative overflow-hidden backdrop-blur-sm bg-background/50 border-0 hover:shadow-2xl transition-all duration-300 h-full`}>
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${gradient}`} />
      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
        </div>
        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors duration-300">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  </Link>
);

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-background/50 p-8">
      <GlowingBackground />
      
      {/* Header */}
      <div className="relative">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
              Team Assessment
            </h1>
            <p className="text-muted-foreground mt-2">Welcome to your dashboard overview</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-12">
        {/* Dashboard Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold">Analytics Dashboard</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <NavigationCard
              icon={Users}
              title="Individuals"
              description="Track individual performance metrics"
              href="/dashboard/individuals"
              gradient="bg-gradient-to-br from-blue-500 to-purple-500"
            />
            <NavigationCard
              icon={Users}
              title="Teams"
              description="Monitor team collaboration"
              href="/dashboard/teams"
              gradient="bg-gradient-to-br from-purple-500 to-pink-500"
            />
            <NavigationCard
              icon={Building2}
              title="Departments"
              description="Department-wide insights"
              href="/dashboard/departments"
              gradient="bg-gradient-to-br from-pink-500 to-orange-500"
            />
            <NavigationCard
              icon={Building}
              title="Company"
              description="Overall company metrics"
              href="/dashboard/company"
              gradient="bg-gradient-to-br from-orange-500 to-yellow-500"
            />
          </div>
        </section>

        {/* Data Entry Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <SquareTerminal className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold">Data Entry</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <NavigationCard
              icon={TableProperties}
              title="Activity Log"
              description="Track all activities"
              href="/data-entry/activity-log"
              gradient="bg-gradient-to-br from-green-500 to-emerald-500"
            />
            <NavigationCard
              icon={PhoneIncoming}
              title="Incoming Calls"
              description="Monitor incoming communications"
              href="/data-entry/incoming-calls"
              gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
            />
            <NavigationCard
              icon={PhoneOutgoing}
              title="Outgoing Calls"
              description="Track outbound communications"
              href="/data-entry/outgoing-calls"
              gradient="bg-gradient-to-br from-teal-500 to-cyan-500"
            />
            <NavigationCard
              icon={Settings}
              title="System Configuration"
              description="Manage system settings"
              href="/data-entry/inputs"
              gradient="bg-gradient-to-br from-cyan-500 to-blue-500"
            />
          </div>
        </section>

        {/* Visualization Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <PieChart className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold">Visualization</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <NavigationCard
              icon={Activity}
              title="Top 10"
              description="View top performers"
              href="/top-10"
              gradient="bg-gradient-to-br from-violet-500 to-purple-500"
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;