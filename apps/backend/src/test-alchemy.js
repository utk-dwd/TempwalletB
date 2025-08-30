// test-alchemy.js
const { Alchemy, Network } = require('alchemy-sdk');

const config = {
  apiKey: "-htpBXri77IPTSz43Fsdy",
  authToken: "qCOcCzw4EoM5KejbBt_ZGk6zlSNTSmk5",
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(config);

async function test() {
  try {
    const webhooks = await alchemy.notify.getAllWebhooks();
    console.log('Webhooks:', webhooks);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();