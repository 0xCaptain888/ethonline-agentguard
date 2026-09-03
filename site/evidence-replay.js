(() => {
  const button = document.getElementById('replay-task56');
  const summary = document.getElementById('replay-summary');
  const steps = [...document.querySelectorAll('[data-replay-hash]')];
  if (!button || !summary || steps.length === 0) return;

  const rpc = 'https://testnet-rpc.monad.xyz';
  const contract = '0xee84007f8618c2c38Be8C45E8050144EbF00CE4a';
  const expectedResultHash = '0xb931f46edae22aaf7ebbff433507002764c7bfc538bab76b190c0f83cde2c16c';
  const taskSelector = '8d977672';

  async function rpcCall(method, params) {
    const response = await fetch(rpc, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: `${method}-${Date.now()}`, method, params }),
    });
    const body = await response.json();
    if (body.error) throw new Error(body.error.message || 'Monad RPC error');
    return body.result;
  }

  function setStep(step, state, detail) {
    step.classList.remove('replay-pending', 'replay-checking', 'replay-pass', 'replay-fail');
    step.classList.add(`replay-${state}`);
    step.querySelector('[data-replay-status]').textContent = detail;
  }

  button.addEventListener('click', async () => {
    button.disabled = true;
    summary.className = 'decision';
    summary.textContent = 'Reading six public Monad Testnet receipts…';
    steps.forEach((step) => setStep(step, 'pending', 'WAITING'));
    try {
      for (const step of steps) {
        setStep(step, 'checking', 'READING');
        const receipt = await rpcCall('eth_getTransactionReceipt', [step.dataset.replayHash]);
        if (!receipt || receipt.status !== '0x1') throw new Error(`${step.dataset.replayLabel} receipt is not successful`);
        setStep(step, 'pass', `PASS · block ${Number.parseInt(receipt.blockNumber, 16).toLocaleString()}`);
      }
      const taskWord = Number(56).toString(16).padStart(64, '0');
      const encoded = await rpcCall('eth_call', [{ to: contract, data: `0x${taskSelector}${taskWord}` }, 'latest']);
      const words = encoded.slice(2).match(/.{64}/g) || [];
      const resultHash = `0x${words[5] || ''}`.toLowerCase();
      const state = Number.parseInt(words[6] || '0', 16);
      if (state !== 2 || resultHash !== expectedResultHash) throw new Error('Task 56 state or result hash mismatch');
      summary.className = 'decision allow';
      summary.innerHTML = '<b>VERIFIED · TASK 56</b><br><small>6/6 receipts mined · result hash matches DeFiLlama report · independent settlement released 0.001 MON</small>';
    } catch (error) {
      summary.className = 'decision deny';
      summary.textContent = `Replay unavailable: ${error && error.message ? error.message : 'unknown error'} — use the Explorer links.`;
    } finally {
      button.disabled = false;
    }
  });
})();
