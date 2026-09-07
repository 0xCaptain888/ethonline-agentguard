# The Graph feedback

Status: live Studio Subgraph integration completed.

Record after testing:

- Provider / product used: Subgraph Studio version `v0.1.0`, deployment
  `QmWk5NVbZsQcZnaZsQhczJXm6HcoZNpGvzGKGdyRhJL8Sy`.
- Query and schema: custom Arc task, agent, policy and aggregate settlement
  entities; YieldScout queries seller task history and protocol totals.
- How the result changed the Agent decision: one prior VERIFIED task produced
  a 100% verified rate and risk score `0`, satisfying the policy's 80% seller
  threshold before the second Arc write.
- What was confusing or missing: current Graph CLI Studio deployment syntax
  differs from older `--studio` examples; explicit version-labelled examples
  would help.
- Query evidence hash:
  `0x4f02ed60151fea39edb4d3b45aeef14b24f23fc17dcd5c99ad2deb99eec57b68`.
