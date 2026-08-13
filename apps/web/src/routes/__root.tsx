import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "shopstart" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
});

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
