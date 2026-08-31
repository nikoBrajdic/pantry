/**
 * Optional rendering / scrape proxies used when a direct fetch cannot get a recipe.
 * Each provider is skipped unless its env key is set (Jina can run without a key).
 */

export type ScrapeProviderId =
  | "jina"
  | "scrapingbee"
  | "zenrows"
  | "scrapfly"
  | "browserless";

export const SCRAPE_PROVIDER_LABELS: Record<ScrapeProviderId, string> = {
  jina: "Jina Reader",
  scrapingbee: "ScrapingBee",
  zenrows: "ZenRows",
  scrapfly: "Scrapfly",
  browserless: "Browserless",
};

type Provider = {
  id: ScrapeProviderId;
  label: string;
  enabled: () => boolean;
  fetchHtml: (url: string) => Promise<string>;
};

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function env(name: string) {
  return process.env[name]?.trim() || "";
}

async function readText(response: Response, label: string) {
  if (!response.ok) {
    throw new Error(`${label} responded with ${response.status}.`);
  }
  const text = await response.text();
  if (!text.trim()) throw new Error(`${label} returned an empty page.`);
  return text;
}

const providers: Provider[] = [
  {
    id: "jina",
    label: SCRAPE_PROVIDER_LABELS.jina,
    enabled: () => true,
    async fetchHtml(url) {
      const key = env("JINA_API_KEY");
      const headers: Record<string, string> = {
        Accept: "text/html",
        "X-Return-Format": "html",
        "User-Agent": BROWSER_UA,
      };
      if (key) headers.Authorization = `Bearer ${key}`;
      const response = await fetch(`https://r.jina.ai/${url}`, {
        headers,
        signal: AbortSignal.timeout(45000),
      });
      return readText(response, "Jina Reader");
    },
  },
  {
    id: "scrapingbee",
    label: SCRAPE_PROVIDER_LABELS.scrapingbee,
    enabled: () => Boolean(env("SCRAPINGBEE_API_KEY")),
    async fetchHtml(url) {
      const key = env("SCRAPINGBEE_API_KEY");
      const endpoint = new URL("https://app.scrapingbee.com/api/v1/");
      endpoint.searchParams.set("api_key", key);
      endpoint.searchParams.set("url", url);
      endpoint.searchParams.set("render_js", "true");
      endpoint.searchParams.set("premium_proxy", "false");
      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(60000),
      });
      return readText(response, "ScrapingBee");
    },
  },
  {
    id: "zenrows",
    label: SCRAPE_PROVIDER_LABELS.zenrows,
    enabled: () => Boolean(env("ZENROWS_API_KEY")),
    async fetchHtml(url) {
      const key = env("ZENROWS_API_KEY");
      const endpoint = new URL("https://api.zenrows.com/v1/");
      endpoint.searchParams.set("apikey", key);
      endpoint.searchParams.set("url", url);
      endpoint.searchParams.set("js_render", "true");
      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(60000),
      });
      return readText(response, "ZenRows");
    },
  },
  {
    id: "scrapfly",
    label: SCRAPE_PROVIDER_LABELS.scrapfly,
    enabled: () => Boolean(env("SCRAPFLY_API_KEY")),
    async fetchHtml(url) {
      const key = env("SCRAPFLY_API_KEY");
      const endpoint = new URL("https://api.scrapfly.io/scrape");
      endpoint.searchParams.set("key", key);
      endpoint.searchParams.set("url", url);
      endpoint.searchParams.set("render_js", "true");
      endpoint.searchParams.set("asp", "true");
      endpoint.searchParams.set("format", "raw");
      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok) {
        throw new Error(`Scrapfly responded with ${response.status}.`);
      }
      const data = (await response.json()) as {
        result?: { content?: string };
      };
      const html = data.result?.content ?? "";
      if (!html.trim()) throw new Error("Scrapfly returned an empty page.");
      return html;
    },
  },
  {
    id: "browserless",
    label: SCRAPE_PROVIDER_LABELS.browserless,
    enabled: () => Boolean(env("BROWSERLESS_API_TOKEN")),
    async fetchHtml(url) {
      const token = env("BROWSERLESS_API_TOKEN");
      const response = await fetch(
        `https://production-sfo.browserless.io/content?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            gotoOptions: { waitUntil: "networkidle2", timeout: 45000 },
          }),
          signal: AbortSignal.timeout(60000),
        },
      );
      return readText(response, "Browserless");
    },
  },
];

export function listConfiguredScrapeProviders(): {
  id: ScrapeProviderId;
  label: string;
}[] {
  return providers
    .filter((item) => item.enabled())
    .map((item) => ({ id: item.id, label: item.label }));
}

export async function fetchHtmlViaProvider(
  id: ScrapeProviderId,
  url: string,
): Promise<string> {
  const provider = providers.find((item) => item.id === id);
  if (!provider) throw new Error("Unknown scrape provider.");
  if (!provider.enabled()) throw new Error(`${provider.label} is not configured.`);
  const html = await provider.fetchHtml(url);
  if (html.trim().length < 200) {
    throw new Error(`${provider.label} returned too little HTML.`);
  }
  return html;
}
