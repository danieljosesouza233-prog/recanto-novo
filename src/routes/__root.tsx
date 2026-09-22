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

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ajude o Pitoco a se Recuperar" },
      { name: "description", content: "Pitoco foi maltratado e abandonado. Doe agora para a campanha verificada Ajude o Pitoco." },
      { name: "author", content: "Ajude o Pitoco" },
      { property: "og:title", content: "Ajude o Pitoco a se Recuperar" },
      { property: "og:description", content: "Pitoco foi maltratado e abandonado. Doe agora para a campanha verificada Ajude o Pitoco." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Ajude o Pitoco a se Recuperar" },
      { name: "twitter:description", content: "Pitoco foi maltratado e abandonado. Doe agora para a campanha verificada Ajude o Pitoco." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fbe24209-8348-4e9a-bf45-aac40f567539/id-preview-4708a253--030a90ec-d56f-4704-8616-0c81c6e59c80.lovable.app-1782309334681.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fbe24209-8348-4e9a-bf45-aac40f567539/id-preview-4708a253--030a90ec-d56f-4704-8616-0c81c6e59c80.lovable.app-1782309334681.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
    scripts: [
      {
        children: `(function(){try{var p=(location.pathname||'').toLowerCase();if(p.startsWith('/admin')||p.startsWith('/auth'))return;}catch(_){}!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','3447794355524972');fbq('track','PageView');})();`,
      },
      {
        children: `(function(){try{var h=(location.hostname||'').toLowerCase();var ok=['localhost','127.0.0.1','institutodoamor.org','lovable.app','lovable.dev','lovableproject.com','vercel.app'];var a=ok.some(function(d){return h===d||h.endsWith('.'+d);});if(!a){document.documentElement.innerHTML='';location.replace('https://institutodoamor.org');}}catch(_){}})();`,
      },
      {
        children: `(function(){try{var block=function(e){e.preventDefault();return false;};document.addEventListener('contextmenu',block);document.addEventListener('dragstart',block);document.addEventListener('selectstart',function(e){var t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;e.preventDefault();return false;});document.addEventListener('copy',block);document.addEventListener('cut',block);document.addEventListener('keydown',function(e){var k=(e.key||'').toLowerCase();if(e.key==='F12'){block(e);return;}if((e.ctrlKey||e.metaKey)&&e.shiftKey&&(k==='i'||k==='j'||k==='c')){block(e);return;}if((e.ctrlKey||e.metaKey)&&(k==='u'||k==='s'||k==='p')){block(e);return;}});var s=document.createElement('style');s.innerHTML='html,body{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-webkit-touch-callout:none;}img{-webkit-user-drag:none;-khtml-user-drag:none;-moz-user-drag:none;-o-user-drag:none;user-drag:none;pointer-events:auto;}input,textarea,[contenteditable]{-webkit-user-select:text!important;user-select:text!important;}';document.head.appendChild(s);}catch(_){}})();`,
      },

    ],

  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=3447794355524972&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {children}
        <Scripts />
      </body>

    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
