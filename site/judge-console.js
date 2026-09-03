(() => {
  const CHAIN_ID = '0x279f';
  const CHAIN_ID_NUMBER = 10143;
  const CONTRACT = '0xee84007f8618c2c38Be8C45E8050144EbF00CE4a';
  const SELLER = '0x637a61f2644E43aDa1eEeEb6Ff827B2aD60e669b';
  const EXPLORER = 'https://testnet.monadexplorer.com';
  const SELECTORS = {
    registerAgent: 'b19b03a1',
    setPolicy: '5405c1e6',
    createTask: 'b137d616',
    identities: 'f653b81e',
    policies: '20e98698',
  };
  const HASHES = {
    buyerMetadata: '02f3f9f6040221cb5831162bc0a95d0d7df8cedffc215db571bdc7a523e8ae1c',
    yieldscout: '599b4d1956e2b758ca5709e9eb46b1af718dc3777802c18e676dc9914e393587',
    chainsentinel: '8ed06cc73c3012deceb4662740d47f806f4d8402857bfe4e6fa419f630acf43e',
    policy: '8789c744df52159dabb267519826a92dade1542828b031baaa1d14c551278dc8',
    taskCreatedTopic: '0xa2a6f97cb55b7cfb0c84cb5f9cf9b1ac9a236885ac3764e60d0c9033650b459b',
  };

  let account = '';
  const connectButton = document.getElementById('wallet-connect');
  const createButton = document.getElementById('wallet-create-task');
  const status = document.getElementById('wallet-status');
  const progress = document.getElementById('wallet-progress');

  const padWord = (hex) => hex.replace(/^0x/, '').padStart(64, '0');
  const addressWord = (address) => padWord(address.toLowerCase());
  const uintWord = (value) => BigInt(value).toString(16).padStart(64, '0');
  const boolWord = (value) => uintWord(value ? 1n : 0n);
  const short = (value) => `${value.slice(0, 6)}…${value.slice(-4)}`;

  function parseMon(value) {
    if (!/^\d+(\.\d{0,18})?$/.test(value)) throw new Error('Enter a valid MON amount');
    const [whole, fraction = ''] = value.split('.');
    return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, '0') || '0');
  }

  function addProgress(label, detail, state = 'pending') {
    const item = document.createElement('li');
    item.className = state;
    item.innerHTML = `<b>${label}</b><span>${detail}</span>`;
    progress.appendChild(item);
    return item;
  }

  function finishProgress(item, detail) {
    item.className = 'verified';
    item.querySelector('span').innerHTML = detail;
  }

  async function ensureMonad() {
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID }] });
    } catch (error) {
      if (error && error.code !== 4902) throw error;
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: CHAIN_ID,
          chainName: 'Monad Testnet',
          nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
          rpcUrls: ['https://testnet-rpc.monad.xyz'],
          blockExplorerUrls: [EXPLORER],
        }],
      });
    }
    const current = await window.ethereum.request({ method: 'eth_chainId' });
    if (Number.parseInt(current, 16) !== CHAIN_ID_NUMBER) throw new Error('Wallet is not on Monad Testnet');
  }

  async function call(data) {
    return window.ethereum.request({ method: 'eth_call', params: [{ to: CONTRACT, data }, 'latest'] });
  }

  async function waitReceipt(hash) {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const receipt = await window.ethereum.request({ method: 'eth_getTransactionReceipt', params: [hash] });
      if (receipt) {
        if (receipt.status !== '0x1') throw new Error(`Transaction reverted: ${hash}`);
        return receipt;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error(`Receipt timeout: ${hash}`);
  }

  async function send(data, value = '0x0') {
    const hash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from: account, to: CONTRACT, data, value }],
    });
    return { hash, receipt: await waitReceipt(hash) };
  }

  function policyAllowed() {
    const value = Number(document.getElementById('task-value').value);
    const max = Number(document.getElementById('max-value').value);
    const risk = Number(document.getElementById('risk-score').value);
    const maxRisk = Number(document.getElementById('max-risk').value);
    return value > 0 && value <= max && risk <= maxRisk
      && document.getElementById('seller-ok').checked
      && document.getElementById('confirm-ok').checked;
  }

  connectButton.addEventListener('click', async () => {
    try {
      if (!window.ethereum) throw new Error('No injected wallet found. Open this page in MetaMask.');
      [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      await ensureMonad();
      connectButton.textContent = short(account);
      createButton.disabled = false;
      status.innerHTML = `<span class="verified">CONNECTED</span> · Monad Testnet · ${short(account)}`;
    } catch (error) {
      status.textContent = error && error.message ? error.message : 'Wallet connection failed';
      status.className = 'decision deny';
    }
  });

  createButton.addEventListener('click', async () => {
    progress.innerHTML = '';
    try {
      if (!account) throw new Error('Connect a wallet first');
      if (!policyAllowed()) {
        addProgress('BLOCKED', 'Local policy failed. No wallet write was requested.', 'blocked');
        return;
      }
      await ensureMonad();
      createButton.disabled = true;
      const taskValue = parseMon(document.getElementById('task-value').value);
      const maxValue = parseMon(document.getElementById('max-value').value);
      if (taskValue <= 0n || taskValue > maxValue) throw new Error('Task value is outside the policy budget');

      const identityStep = addProgress('1 · IDENTITY', 'Reading buyer identity…');
      const identityResult = await call(`0x${SELECTORS.identities}${addressWord(account)}`);
      const identityWords = identityResult.slice(2).match(/.{64}/g) || [];
      if (BigInt(`0x${identityWords[2] || '0'}`) === 0n) {
        const { hash } = await send(`0x${SELECTORS.registerAgent}${HASHES.buyerMetadata}`);
        finishProgress(identityStep, `Registered · <a href="${EXPLORER}/tx/${hash}" target="_blank" rel="noreferrer">${short(hash)} ↗</a>`);
      } else {
        finishProgress(identityStep, 'Already registered · no transaction needed');
      }

      const policyStep = addProgress('2 · POLICY', 'Reading on-chain policy…');
      const policyResult = await call(`0x${SELECTORS.policies}${addressWord(account)}`);
      const policyWords = policyResult.slice(2).match(/.{64}/g) || [];
      const currentMax = BigInt(`0x${policyWords[0] || '0'}`);
      const currentConfirmation = BigInt(`0x${policyWords[1] || '0'}`) !== 0n;
      const policyActive = BigInt(`0x${policyWords[2] || '0'}`) !== 0n;
      const requireConfirmation = document.getElementById('confirm-ok').checked;
      if (!policyActive || currentMax < maxValue || currentConfirmation !== requireConfirmation) {
        const data = `0x${SELECTORS.setPolicy}${uintWord(maxValue)}${boolWord(requireConfirmation)}`;
        const { hash } = await send(data);
        finishProgress(policyStep, `Boundaries committed · <a href="${EXPLORER}/tx/${hash}" target="_blank" rel="noreferrer">${short(hash)} ↗</a>`);
      } else {
        finishProgress(policyStep, 'Existing policy covers this task · no transaction needed');
      }

      const workload = document.getElementById('live-agent').value;
      const intentHash = workload === 'ChainSentinel' ? HASHES.chainsentinel : HASHES.yieldscout;
      const taskStep = addProgress('3 · ESCROW', `Creating ${workload} task…`);
      const data = `0x${SELECTORS.createTask}${addressWord(SELLER)}${intentHash}${HASHES.policy}`;
      const { hash, receipt } = await send(data, `0x${taskValue.toString(16)}`);
      const event = (receipt.logs || []).find((log) => log.topics && log.topics[0] === HASHES.taskCreatedTopic);
      const taskId = event && event.topics[1] ? BigInt(event.topics[1]).toString() : 'unknown';
      finishProgress(taskStep, `Task ${taskId} is OPEN · <a href="${EXPLORER}/tx/${hash}" target="_blank" rel="noreferrer">view transaction ↗</a>`);
      const proofStep = addProgress('4 · PROOF', 'The public receipts below show seller submission and independent verification for completed tasks.');
      finishProgress(proofStep, 'Judge wallet created a real task without receiving any repository credential.');
      status.innerHTML = `<span class="verified">LIVE TASK CREATED</span> · task ${taskId} · ${short(hash)}`;
    } catch (error) {
      addProgress('ERROR', error && error.message ? error.message : 'Live task failed', 'frozen');
    } finally {
      createButton.disabled = !account;
    }
  });
})();
