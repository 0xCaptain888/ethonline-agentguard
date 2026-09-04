import { keccak256, toUtf8Bytes } from "ethers";

export type GraphAgentObservation = {
  source: "The Graph";
  endpoint: string;
  fetchedAt: string;
  query: string;
  variables: Record<string, unknown>;
  data: unknown;
  evidenceHash: string;
};

/**
 * Read-only adapter. It never signs or broadcasts a transaction. The API key
 * is supplied through the endpoint configured by the user and is never
 * persisted in a receipt.
 */
export async function queryGraphAgent(
  endpoint: string,
  query: string,
  variables: Record<string, unknown> = {},
  fetcher: typeof fetch = fetch,
): Promise<GraphAgentObservation> {
  if (!endpoint) throw new Error("GRAPH_SUBGRAPH_URL is required");
  const response = await fetcher(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`The Graph request failed: ${response.status}`);
  const body = (await response.json()) as { errors?: unknown; data?: unknown };
  if (body.errors) throw new Error(`The Graph returned errors: ${JSON.stringify(body.errors)}`);
  const payload = {
    source: "The Graph" as const,
    endpoint,
    fetchedAt: new Date().toISOString(),
    query,
    variables,
    data: body.data ?? null,
  };
  return { ...payload, evidenceHash: keccak256(toUtf8Bytes(JSON.stringify(payload))) };
}
