# Business case

## Product

**AgentGuard is the authorization and settlement firewall for autonomous agent
commerce.** It sits between an Agent's intent and any irreversible transfer of
value.

## Initial customers

| Customer | Problem | AgentGuard value |
| --- | --- | --- |
| Agent marketplaces | A seller can return bad output after payment | Escrow releases only after task-specific verification |
| Autonomous treasury Agents | A planner may exceed budget or use an unapproved counterparty | Deterministic budget, permission, risk and confirmation gates |
| DeFi and trading Agents | A successful tool call may still produce an unacceptable economic result | Post-execution verification and FROZEN containment |
| Enterprise Agent platforms | Operators need audit trails and recoverable controls | Hash-bound receipts, explicit states and recovery approvals |
| API/x402 payment platforms | Payment authorization and work verification are separate concerns | Policy/verifier layer before settlement finality |

## Business model

- Per-settlement fee on successfully verified Agent commerce.
- SaaS policy and verifier API priced by protected task volume.
- Enterprise deployment, custom policy modules and operational support.

The hackathon build does not claim customers, revenue or audited production
security. The external pilot exists to turn technical evidence into real user
feedback without fabricating adoption.

## Defensibility

The moat is the evidence and policy layer, not the escrow alone: reusable task
schemas, independent verifier modules, deterministic receipts, failure
recovery, wallet integrations and workload data across Agent marketplaces.
