require('dotenv').config();           // Load environment variables
const { ethers } = require('ethers');
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const fetch = require('node-fetch'); // Make sure to install node-fetch for HTTP requests

// Set up Express server
const app = express();

// Enable CORS for all routes
app.use(cors());

// Add Content Security Policy (CSP) headers
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com"
  );
  next();
});

// Load Infura Project ID from .env file
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
if (!INFURA_PROJECT_ID) {
  throw new Error('Infura Project ID is missing! Please add it to the .env file');
}

const BEACON_DEPOSIT_CONTRACT = '0x00000000219ab540356cBB839Cbe05303d7705Fa'; // Beacon Deposit Contract address
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const PORT = process.env.PORT || 3001; // Use port 3001 for backend

// Set up the Infura provider (Ethereum node connection)
const provider = new ethers.providers.InfuraProvider('homestead', INFURA_PROJECT_ID);


// Function to send Telegram alert
async function sendTelegramAlert(message) {
  const telegramURL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const params = {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
  };

  try {
    await fetch(telegramURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    console.log('Telegram alert sent!');
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

// Function to track deposits to the Beacon Deposit Contract
async function trackDeposits() {
  console.log('Tracking deposits...');

  provider.on('block', async (blockNumber) => {
    console.log(`Checking block ${blockNumber} for deposits...`);

    const block = await provider.getBlockWithTransactions(blockNumber);
    for (const tx of block.transactions) {
      if (tx.to && tx.to.toLowerCase() === BEACON_DEPOSIT_CONTRACT.toLowerCase()) {
        console.log(`Deposit transaction found in block ${blockNumber}`);

        const depositData = {
          blockNumber: blockNumber,
          blockTimestamp: block.timestamp,
          fee: ethers.utils.formatEther(tx.gasPrice.mul(tx.gasLimit)),
          hash: tx.hash,
          pubkey: tx.data,
        };

        // Log the deposit to a file
        logDeposit(depositData);

        // Send Telegram alert
        const message = `New ETH deposit detected!\nBlock Number: ${depositData.blockNumber}\nHash: ${depositData.hash}\nFee: ${depositData.fee} ETH`;
        sendTelegramAlert(message);
      }
    }
  });
}

// Log deposit to a file
function logDeposit(deposit) {
  const logData = `Block Number: ${deposit.blockNumber}, Timestamp: ${deposit.blockTimestamp}, Fee: ${deposit.fee}, Hash: ${deposit.hash}, Pubkey: ${deposit.pubkey}\n`;
  fs.appendFileSync('deposits.log', logData);
  console.log(`New deposit logged: ${deposit.hash}`);
}

// REST API to get all deposits
app.get('/deposits', (req, res) => {
  fs.readFile('deposits.log', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading deposit log');
    }
    res.send(data);
  });
});

// Start tracking deposits
trackDeposits();

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
