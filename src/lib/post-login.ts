import type { QueryClient } from "@tanstack/react-query";

import type { AppUser } from "@/api/auth.api";
import { fetchMyVendor } from "@/api/vendor.api";
import { vendorKeys } from "@/hooks/useVendor";

export type PostLoginPath = "/admin/dashboard" | "/vendor/dashboard" | "/products";

/**
 * Decides where to send a user right after a successful login:
 * admin -> admin dashboard, approved (active) vendor -> vendor dashboard,
 * everyone else (customers, pending/rejected vendors) -> the market.
 */
export async function getPostLoginPath(
  user: AppUser,
  queryClient: QueryClient,
): Promise<PostLoginPath> {
  if (user.role === "admin") return "/admin/dashboard";

  try {
    // staleTime 0: never trust a vendor record cached from a previous session.
    const vendor = await queryClient.fetchQuery({
      queryKey: vendorKeys.me,
      queryFn: fetchMyVendor,
      staleTime: 0,
      retry: false,
    });
    if (vendor?.status === "active") return "/vendor/dashboard";
  } catch {
    // If the vendor lookup fails, fall back to the market rather than blocking login.
  }
  return "/products";
}
