import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';  // Import the CSS file for styling

function App() {
  const [deposits, setDeposits] = useState([]);

  // Fetch deposits from the backend
  const fetchDeposits = async () => {
    try {
      const response = await axios.get('http://localhost:3001/deposits');
      const depositLogs = response.data.split('\n').filter(Boolean);
      const parsedDeposits = depositLogs.map(log => {
        const parts = log.match(/Block Number: (\d+), Timestamp: (\d+), Fee: ([\d\.]+), Hash: (0x[a-fA-F0-9]+), Pubkey: (0x[a-fA-F0-9]+)/);
        return parts ? {
          blockNumber: parts[1],
          timestamp: new Date(parts[2] * 1000).toLocaleString(),
          fee: parts[3],
          hash: parts[4],
          pubkey: parts[5]
        } : null;
      }).filter(Boolean);
      setDeposits(parsedDeposits);
    } catch (error) {
      console.error('Error fetching deposits:', error);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  return (
    <div className="app-container">
      <h1>Luganodes Ethereum Beacon Deposit Tracker</h1>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Block Number</th>
              <th>Timestamp</th>
              <th>Fee (ETH)</th>
              <th>Transaction Hash</th>
              <th>Public Key</th>
            </tr>
          </thead>
          <tbody>
            {deposits.length > 0 ? (
              deposits.map((deposit, index) => (
                <tr key={index}>
                  <td>{deposit.blockNumber}</td>
                  <td>{deposit.timestamp}</td>
                  <td>{deposit.fee}</td>
                  <td className="truncate-hash">{deposit.hash}</td>
                  <td className="truncate-pubkey">{deposit.pubkey}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No deposits found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;