import { queryGraphAgent } from "../src/ethonline/graph-agent.js";

async function main() {
  const endpoint = process.env.GRAPH_SUBGRAPH_URL;
  if (!endpoint) {
    console.log(JSON.stringify({ status: "DESIGN", reason: "GRAPH_SUBGRAPH_URL is not configured; no network request was made." }, null, 2));
    return;
  }

  const query = process.env.GRAPH_QUERY ?? "query Health { _meta { block { number } } }";
  try {
    const observation = await queryGraphAgent(endpoint, query);
    console.log(JSON.stringify({ status: "LIVE_EXTERNAL_DATA", evidenceHash: observation.evidenceHash, source: observation.source, endpoint: observation.endpoint, fetchedAt: observation.fetchedAt }, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

void main();
