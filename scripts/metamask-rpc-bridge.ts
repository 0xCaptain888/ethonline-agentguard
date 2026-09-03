import { createServer } from "node:http";

const upstream = process.env.MONAD_TESTNET_RPC_URL ?? "https://testnet-rpc.monad.xyz";
const host = "127.0.0.1";
const requestedPort = Number(process.env.METAMASK_RPC_BRIDGE_PORT ?? "0");

if (!Number.isInteger(requestedPort) || requestedPort < 0 || requestedPort > 65535) {
  throw new Error("METAMASK_RPC_BRIDGE_PORT must be an integer between 0 and 65535");
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST") {
    response.writeHead(405, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "JSON-RPC POST required" }));
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));

  try {
    const upstreamResponse = await fetch(upstream, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: Buffer.concat(chunks),
    });
    const body = Buffer.from(await upstreamResponse.arrayBuffer());
    response.writeHead(upstreamResponse.status, {
      "content-type": upstreamResponse.headers.get("content-type") ?? "application/json",
    });
    response.end(body);
  } catch (error) {
    response.writeHead(502, { "content-type": "application/json" });
    response.end(JSON.stringify({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : "Monad RPC forwarding failed",
      },
    }));
  }
});

server.listen(requestedPort, host, () => {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("RPC bridge failed to bind");
  console.log(JSON.stringify({
    status: "ready",
    baseUrl: `http://${host}:${address.port}`,
    upstream,
    note: "Set MM_INFURA_RPC_BASE_URL to baseUrl. The MetaMask CLI appends /<chainId>/<projectId>.",
  }));
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
