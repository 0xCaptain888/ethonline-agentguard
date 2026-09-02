# Metropolis build plan

## Product thesis

Monad AgentGuard gives autonomous agents bounded authority to act onchain. The planner may propose, but separate policy and verification boundaries decide whether authority is granted and whether the result is safe.

## Milestones

1. **Protocol skeleton:** Monad-native identity, policy, task and native-MON escrow contract.
2. **Real testnet loop:** buyer identity → seller identity → task creation → result submission → independent verification → release.
3. **Failure evidence:** one pre-execution `BLOCKED` task and one post-execution `FROZEN` task.
4. **Public product:** Marketplace, task details, identity pages, receipt viewer and Explorer links.
5. **Sponsor integrations:** choose only integrations that are real, visible in code, and verifiable in the demo.
6. **Submission:** public profile, short write-up, demo video, GitHub and Monad contract/evidence links before the 13 October deadline.

## Judge path

```text
Open demo → inspect Agent identity → create task → lock MON escrow
→ submit result → independent verifier → VERIFIED / BLOCKED / FROZEN
→ inspect Monad transaction and Receipt evidence hash
```

## Evidence rule

Every claim in the submission must be labelled as one of `LIVE_TESTNET`, `SIMULATION`, or `DESIGN`. Testnet transactions and contract addresses must be linked directly; simulation must never be presented as a live Monad execution.
