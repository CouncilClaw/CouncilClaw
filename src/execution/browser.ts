/**
 * Simple web browsing utility for CouncilClaw.
 * Fetches a URL and extracts readable text content.
 */

export async function browseUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "CouncilClaw/0.1.0 (Personal AI Assistant)",
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      return `Error: Failed to fetch ${url} (Status: ${response.status})`;
    }

    const html = await response.text();
    
    // Simple text extraction: strip scripts, styles, and then tags
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return text.length > 2000 ? text.slice(0, 2000) + "..." : text;
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : String(err)}`;
  }
}
