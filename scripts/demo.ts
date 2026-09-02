const scenarios = [
  { state: "VERIFIED", detail: "Seller result matches intent; escrow releases after independent verification." },
  { state: "BLOCKED", detail: "Policy denies the task before a Monad execution; escrow is refunded." },
  { state: "FROZEN", detail: "Task executes but result mismatches; escrow remains isolated for review." }
];
console.log(JSON.stringify({ network: "Monad Testnet", chainId: 10143, project: "Monad AgentGuard", scenarios }, null, 2));
