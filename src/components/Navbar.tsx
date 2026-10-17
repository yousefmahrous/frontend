import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  PackageOpen,
  PackageSearch,
  ShoppingCart,
  Store,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { logout } from "@/api/auth.api";
import { errorMessage } from "@/api/client";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useMyVendor } from "@/hooks/useVendor";
import {
  adminDashboardLinks,
  dashboardKindForPath,
  DASHBOARD_HOME,
  vendorDashboardLinks,
} from "@/lib/dashboard-links";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

const linkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";

export function Navbar() {
  const { t } = useTranslation();
  const { user, isLoading, isAdmin, setUser } = useAuth();
  const { data: cart } = useCart();
  const { data: favorites } = useFavorites();
  const { data: vendor } = useMyVendor(Boolean(user) && !isAdmin);
  const isActiveVendor = vendor?.status === "active";
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);


  const dashboardKind = user ? dashboardKindForPath(pathname, isAdmin, isActiveVendor) : null;
  const ownDashboardKind = isAdmin ? "admin" : isActiveVendor ? "vendor" : null;
  const inDashboard = dashboardKind !== null;

  const marketLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/products", label: t("nav.products") },
    { to: "/contact", label: t("nav.contact") },
  ];
  const dashboardLinks =
    dashboardKind === "admin"
      ? adminDashboardLinks(t)
      : dashboardKind === "vendor"
        ? vendorDashboardLinks(t)
        : [];
  const dashboardNav = dashboardKind
    ? [
        {
          to: DASHBOARD_HOME[dashboardKind],
          label: t("nav.dashboard"),
          icon: LayoutDashboard,
        },
        ...dashboardLinks,
      ]
    : [];

  async function handleLogout() {
    try {
      const res = await logout();
      setUser(null);
      toast.success(res?.message ?? t("toast.logoutSuccess"));
      void navigate({ to: "/login" });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          to={dashboardKind ? DASHBOARD_HOME[dashboardKind] : "/"}
          className="flex items-center gap-2 font-bold text-lg text-primary"
        >
          <PackageOpen className="size-6 text-accent" />
          {t("common.brand")}
        </Link>

        {!inDashboard && (
          <nav className="hidden items-center gap-1 md:flex">
            {marketLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={linkClass}
                activeProps={{ className: "bg-secondary text-foreground" }}
                activeOptions={{ exact: link.to === "/" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          {user && ownDashboardKind && (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to={inDashboard ? "/products" : DASHBOARD_HOME[ownDashboardKind]}>
                {inDashboard ? (
                  <Store className="size-4" />
                ) : (
                  <LayoutDashboard className="size-4" />
                )}
                <span className="hidden sm:inline">
                  {inDashboard ? t("nav.marketView") : t("nav.dashboard")}
                </span>
              </Link>
            </Button>
          )}

          {user && !isAdmin && !inDashboard && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={t("common.favoritesAria")}
            >
              <Link to="/favorites">
                <Heart className="size-5" />
                {Boolean(favorites?.itemsCount) && (
                  <span className="absolute -top-1 -left-1 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                    {favorites!.itemsCount}
                  </span>
                )}
              </Link>
            </Button>
          )}

          {user && !isAdmin && !inDashboard && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={t("common.cartAria")}
            >
              <Link to="/cart">
                <ShoppingCart className="size-5" />
                {Boolean(cart?.itemsCount) && (
                  <span className="absolute -top-1 -left-1 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                    {cart!.itemsCount}
                  </span>
                )}
              </Link>
            </Button>
          )}

          {isLoading ? (
            <Skeleton className="h-9 w-28" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="gap-2">
                  <User className="size-4" />
                  <span className="max-w-24 truncate">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account">{t("nav.account")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account/change-password">{t("nav.changePassword")}</Link>
                </DropdownMenuItem>
                {!isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="gap-2">
                      <PackageSearch className="size-4" />
                      {t("nav.orders")}
                    </Link>
                  </DropdownMenuItem>
                )}
                {!isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/tickets" className="gap-2">
                      <MessagesSquare className="size-4" />
                      {t("nav.tickets")}
                    </Link>
                  </DropdownMenuItem>
                )}
                {!isAdmin && vendor && !isActiveVendor && (
                  <DropdownMenuItem asChild>
                    <Link to="/vendor/apply" className="gap-2">
                      <Store className="size-4" />
                      {t("nav.vendorStatus")}
                    </Link>
                  </DropdownMenuItem>
                )}
                {!isAdmin && !vendor && (
                  <DropdownMenuItem asChild>
                    <Link to="/vendor/apply" className="gap-2">
                      <Store className="size-4" />
                      {t("nav.becomeVendor")}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void handleLogout()} className="gap-2">
                  <LogOut className="size-4" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost">
                <Link to="/login">{t("nav.login")}</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">{t("nav.signup")}</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={t("common.menuAria")}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      {inDashboard && (
        <nav className="hidden border-t border-border/70 md:block">
          <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-1.5">
            {dashboardNav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`${linkClass} flex shrink-0 items-center gap-2`}
                activeProps={{ className: "bg-secondary text-foreground" }}
                activeOptions={{ exact: to === DASHBOARD_HOME[dashboardKind] }}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {open && (
        <div className="border-t border-border/70 bg-background px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {(inDashboard ? dashboardNav : marketLinks).map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium"
                >
                  {t("nav.signup")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
