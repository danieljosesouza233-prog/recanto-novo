import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

const BLOCKED_UA = /(httrack|wget|curl|libwww|harvest|scrapy|sitesucker|webcopier|webzip|teleport|offline\s*explorer|saveweb2zip|getleft|cyotek|grab-site|websucker|httpx|nikto|httrack)/i;

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const ua = request.headers.get("user-agent") ?? "";
      if (BLOCKED_UA.test(ua)) {
        return new Response("Forbidden", { status: 403 });
      }

      const url = new URL(request.url);
      if (url.pathname === "/robots.txt") {
        return new Response(
          "User-agent: HTTrack\nDisallow: /\nUser-agent: wget\nDisallow: /\nUser-agent: SaveWeb2Zip\nDisallow: /\nUser-agent: WebCopier\nDisallow: /\nUser-agent: Teleport\nDisallow: /\nUser-agent: Offline Explorer\nDisallow: /\n\nUser-agent: *\nAllow: /\n",
          { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } },
        );
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

