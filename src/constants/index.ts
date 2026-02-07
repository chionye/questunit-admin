/** @format */

import {
  LayoutDashboard,
  Users,
  Box,
  Grid3X3,
  Wrench,
  TrendingUp,
  Clock,
} from "lucide-react";

export const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/renderers", label: "Pending Renderers", icon: Users },
  { path: "/services", label: "Services", icon: Box },
  { path: "/service-types", label: "Service Types", icon: Grid3X3 },
  { path: "/tools", label: "Tools", icon: Wrench },
] as const;

export const statCards = [
  {
    key: "totalUsers",
    label: "Total Users",
    icon: Users,
    color: "bg-blue-500",
  },
  {
    key: "totalRequesters",
    label: "Total Requesters",
    icon: TrendingUp,
    color: "bg-primary",
  },
  {
    key: "totalRenderers",
    label: "Total Renderers",
    icon: Users,
    color: "bg-cyan-500",
  },
  {
    key: "pendingRenderers",
    label: "Pending Renderers",
    icon: Clock,
    color: "bg-amber-500",
  },
  {
    key: "activeServices",
    label: "Active Services",
    icon: Box,
    color: "bg-purple-500",
  },
  {
    key: "activeTools",
    label: "Active Tools",
    icon: Wrench,
    color: "bg-emerald-500",
  },
] as const;
