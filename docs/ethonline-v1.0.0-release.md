# ETHOnline AgentGuard v1.0.0

Submission release for ETHOnline 2026 Continuity.

## One composed sponsor workflow

`The Graph seller history → policy decision → Privy authorization → Arc USDC escrow → seller result → independent verifier → receipt`

## Public live evidence

- VERIFIED release: `0x94b172ee29faadbf4a48d0d752685358fff082df9d65bf3753ac779a146d1fc8`
- BLOCKED refund: `0x6de48ef03a65fd0ca8c993d1179a235cbe23392d7a7a872b43f3eff92712fe6f`
- FROZEN containment: `0xb94f9e76a88aedfbd71cf8bac77b04a135674e38468db9ee5474a7d05539ced1`
- Privy-created task: `0x7ec5e29f0ad2cfc210a72fd4e5220c580b2e6407eb21080ee0947990b9cd06f6`
- Arc contract: `0x85b6df0684529fFAB07C6B62eDB6F04a3eC4E67d`
- Privy buyer: `0x8b9cD36D829fC658feD8938a057c27CE072bd554`

## Evidence integrity

- Primary task evidence: `0x8e285743668e16c24a5de71b9408261d549a20bf81e675fc089ac4e6def787d7`
- Failure outcomes evidence: `0x8b7f6d7cb245ab2cfc778e5a92298e9f9ae752e8a1d9aede01605b90e24997c1`
- Failure Privy authorization: `0x02a2edc11820b0d5e780bb1003ff3c0f75ca5ced69a3c6f58996c2f8397af6a2`

## Judge path

```bash
npm ci
npm run ethonline:check
```

The browser demo provides a safe interactive replay. Public explorer receipts
are the source of truth for live sponsor and outcome claims.
