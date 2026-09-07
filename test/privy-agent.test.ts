import { strict as assert } from "node:assert";
import { test } from "node:test";
import { queryPrivyWallet } from "../src/ethonline/privy-agent";

test("Privy wallet check produces sanitized authorization evidence", async () => {
  let authorizationHeader = "";
  const fetcher = (async (_url: string | URL | Request, init?: RequestInit) => {
    authorizationHeader = String((init?.headers as Record<string, string>).authorization);
    return new Response(JSON.stringify({
      id: "wallet-1",
      address: "0x1111111111111111111111111111111111111111",
      chain_type: "ethereum",
      policy_ids: ["policy-1"],
      owner_id: "owner-1",
      additional_signers: [],
    }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  const evidence = await queryPrivyWallet({
    appId: "app-1",
    appSecret: "secret-value",
    walletId: "wallet-1",
    expectedAddress: "0x1111111111111111111111111111111111111111",
  }, fetcher);
  assert.match(authorizationHeader, /^Basic /);
  assert.equal(evidence.authorizationReady, true);
  assert.equal(JSON.stringify(evidence).includes("secret-value"), false);
  assert.match(evidence.evidenceHash, /^0x[0-9a-f]{64}$/);
});

test("Privy wallet check rejects an unexpected address", async () => {
  const fetcher = (async () => new Response(JSON.stringify({
    id: "wallet-1",
    address: "0x2222222222222222222222222222222222222222",
    chain_type: "ethereum",
    policy_ids: [],
    owner_id: null,
    additional_signers: [],
  }), { status: 200, headers: { "content-type": "application/json" } })) as typeof fetch;
  await assert.rejects(() => queryPrivyWallet({
    appId: "app-1",
    appSecret: "secret-value",
    walletId: "wallet-1",
    expectedAddress: "0x1111111111111111111111111111111111111111",
  }, fetcher), /address mismatch/);
});
