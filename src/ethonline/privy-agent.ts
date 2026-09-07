import { keccak256, toUtf8Bytes } from "ethers";

type PrivyWalletResponse = {
  id: string;
  address: string;
  chain_type: string;
  policy_ids?: string[];
  owner_id?: string | null;
  additional_signers?: unknown[];
};

export type PrivyWalletEvidence = {
  source: "Privy";
  walletId: string;
  address: string;
  chainType: string;
  policyCount: number;
  ownerConfigured: boolean;
  additionalSignerCount: number;
  authorizationReady: boolean;
  fetchedAt: string;
  evidenceHash: string;
};

/**
 * Reads public wallet metadata through Privy's authenticated server API.
 * The app secret is used only to construct the request header and is never
 * returned, persisted, or included in the evidence payload.
 */
export async function queryPrivyWallet(
  config: { appId: string; appSecret: string; walletId: string; expectedAddress?: string },
  fetcher: typeof fetch = fetch,
): Promise<PrivyWalletEvidence> {
  if (!config.appId || !config.appSecret || !config.walletId) throw new Error("Privy app ID, app secret and wallet ID are required");
  const authorization = Buffer.from(`${config.appId}:${config.appSecret}`).toString("base64");
  const response = await fetcher(`https://api.privy.io/v1/wallets/${encodeURIComponent(config.walletId)}`, {
    headers: { authorization: `Basic ${authorization}`, "privy-app-id": config.appId },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Privy wallet request failed: ${response.status}`);
  const wallet = await response.json() as PrivyWalletResponse;
  if (wallet.id !== config.walletId) throw new Error("Privy wallet ID mismatch");
  if (config.expectedAddress && wallet.address.toLowerCase() !== config.expectedAddress.toLowerCase()) {
    throw new Error("Privy wallet address mismatch");
  }
  const payload = {
    source: "Privy" as const,
    walletId: wallet.id,
    address: wallet.address,
    chainType: wallet.chain_type,
    policyCount: wallet.policy_ids?.length ?? 0,
    ownerConfigured: Boolean(wallet.owner_id),
    additionalSignerCount: wallet.additional_signers?.length ?? 0,
    authorizationReady: Boolean(wallet.owner_id) && (wallet.policy_ids?.length ?? 0) > 0,
    fetchedAt: new Date().toISOString(),
  };
  return { ...payload, evidenceHash: keccak256(toUtf8Bytes(JSON.stringify(payload))) };
}
