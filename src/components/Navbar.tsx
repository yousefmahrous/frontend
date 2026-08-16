import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Heart, LayoutDashboard, LogOut, Menu, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { logout } from "@/api/auth.api";
import { errorMessage } from "@/api/client";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

const navLinks = [
  { to: "/", label: "الرئيسية" },
  { to: "/books", label: "تصفح الكتب" },
] as const;

export function Navbar() {
  const { user, isLoading, isAdmin, setUser } = useAuth();
  const { data: cart } = useCart();
  const { data: favorites } = useFavorites();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    try {
      const res = await logout();
      setUser(null);
      toast.success(res?.message ?? "تم تسجيل الخروج");
      void navigate({ to: "/login" });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <BookOpen className="size-6 text-accent" />
          مكتبة القراء
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
              activeOptions={{ exact: link.to === "/" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user && !isAdmin && (
            <Button asChild variant="ghost" size="icon" className="relative" aria-label="المفضلة">
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

          {user && !isAdmin && (
            <Button asChild variant="ghost" size="icon" className="relative" aria-label="العربية">
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
                  <Link to="/account">حسابي</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account/change-password">تغيير كلمة المرور</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin/books" className="gap-2">
                      <LayoutDashboard className="size-4" />
                      لوحة التحكم
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void handleLogout()} className="gap-2">
                  <LogOut className="size-4" />
                  تسجيل خروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost">
                <Link to="/login">دخول</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">إنشاء حساب</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="القائمة"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/70 bg-background px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
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
                  دخول
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium"
                >
                  إنشاء حساب
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}