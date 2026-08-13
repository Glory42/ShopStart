import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";
import { Button } from "../components/button";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "shopstart" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => <StatusPage title="Page not found" />,
  errorComponent: ({ error }) => (
    <StatusPage
      title="Something went wrong"
      detail={error instanceof Error ? error.message : String(error)}
    />
  ),
});

function StatusPage({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="px-5 py-28 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
      {detail && (
        <p className="mx-auto mt-3 max-w-md text-[14px] text-graphite">{detail}</p>
      )}
      <Link to="/" className="mt-7 inline-block">
        <Button variant="dark">Back to shopstart</Button>
      </Link>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans">
        <QueryClientProvider client={queryClient}>
          <div className="flex min-h-screen flex-col">
            <Nav />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </div>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
