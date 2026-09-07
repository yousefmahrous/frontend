import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/context/auth-context";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { getServerLang } from "@/i18n/lang.server";
import { LangProvider } from "@/i18n/LangProvider";
import { DEFAULT_LANG, DIR_BY_LANG, type Lang } from "@/i18n/i18n";
import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";

const META_BY_LANG: Record<Lang, { title: string; description: string }> = {
  ar: ar.meta,
  en: en.meta,
};

function NotFoundComponent() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("pages.notFound")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("pages.notFoundDesc")}
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("pages.goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { t } = useTranslation();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("pages.errorTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("pages.errorDesc")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("pages.tryAgain")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("pages.goHome")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async () => {
    const lang = await getServerLang();
    return { lang };
  },
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = META_BY_LANG[lang];
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: meta.title },
        { name: "description", content: meta.description },
        { property: "og:title", content: meta.title },
        { property: "og:description", content: meta.description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap",
        },
        {
          rel: "stylesheet",
          href: appCss,
        },
        { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const { lang } = Route.useRouteContext();
  const resolvedLang: Lang = lang ?? DEFAULT_LANG;

  return (
    <html lang={resolvedLang} dir={DIR_BY_LANG[resolvedLang]}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient, lang } = Route.useRouteContext();

  return (
    <LangProvider initialLang={lang ?? DEFAULT_LANG}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
              <Outlet />
            </main>
            <RootFooter />
          </div>
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </QueryClientProvider>
    </LangProvider>
  );
}

function RootFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border/70 bg-secondary/40 py-6 text-center text-sm text-muted-foreground">
      {t("footer.rights")}
    </footer>
  );
}
