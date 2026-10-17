import type { TFunction } from "i18next";
import {
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  Percent,
  RotateCcw,
  Store,
  Tags,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface DashboardLink {
  to: string;
  label: string;
  icon: LucideIcon;
}

export type DashboardKind = "admin" | "vendor";

export const DASHBOARD_HOME: Record<DashboardKind, string> = {
  admin: "/admin/dashboard",
  vendor: "/vendor/dashboard",
};

export function adminDashboardLinks(t: TFunction): DashboardLink[] {
  return [
    { to: "/admin/products", label: t("nav.adminProducts"), icon: Store },
    { to: "/admin/orders", label: t("nav.adminOrders"), icon: ClipboardList },
    { to: "/admin/refunds", label: t("nav.adminRefunds"), icon: RotateCcw },
    { to: "/admin/tickets", label: t("nav.adminTickets"), icon: LifeBuoy },
    { to: "/admin/vendors", label: t("nav.adminVendors"), icon: Store },
    { to: "/admin/payouts", label: t("nav.adminPayouts"), icon: Wallet },
    { to: "/admin/platform-orders", label: t("nav.adminPlatformOrders"), icon: Truck },
    { to: "/admin/categories", label: t("nav.adminCategories"), icon: Tags },
    { to: "/admin/commission", label: t("nav.adminCommission"), icon: Percent },
  ];
}

export function vendorDashboardLinks(t: TFunction): DashboardLink[] {
  return [
    { to: "/vendor/products", label: t("nav.vendorProducts"), icon: Store },
    { to: "/vendor/orders", label: t("nav.vendorOrders"), icon: Truck },
    { to: "/vendor/earnings", label: t("nav.vendorEarnings"), icon: Wallet },
    { to: "/vendor/returns", label: t("nav.vendorReturns"), icon: RotateCcw },
  ];
}


export function dashboardKindForPath(
  pathname: string,
  isAdmin: boolean,
  isActiveVendor: boolean,
): DashboardKind | null {
  if (isAdmin) return pathname.startsWith("/admin") ? "admin" : null;
  if (isActiveVendor && pathname.startsWith("/vendor") && !pathname.startsWith("/vendor/apply")) {
    return "vendor";
  }
  return null;
}
