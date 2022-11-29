import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLoaderData } from "react-router-dom";
import algosdk from 'algosdk';
import { getAccount, getAlgod } from './settings';
import './root.css';

export interface RootData {
  account: algosdk.Account,
  balance: number,
}

export async function loader(): Promise<RootData> {
  const algod = getAlgod();
  const account = getAccount();

  const info = await algod.accountInformation(account.addr).exclude("all").do();

  return {
    account,
    balance: info["amount"] as number
  };
}

function addressPreview(addr: string): string {
  return `${addr.substring(0,5)}...${addr.substring(addr.length-5, addr.length)}`
}

export function Root() {
  const { account, balance: initialBalance } = useLoaderData() as RootData;
  const [balance, setBalance] = useState(initialBalance);

  useEffect(() => {
    const delay = 5000;

    async function refreshBalance() {
      try {
        if (balance) {
          return;
        }

        const algod = getAlgod();
        const account = getAccount();

        const info = await algod.accountInformation(account.addr).exclude("all").do();
        const newBalance = info["amount"] as number;

        if (newBalance) {
          setBalance(newBalance);
        } else {
          setTimeout(refreshBalance, delay);
        }
      } catch (err) {
        console.error("Cannot refresh account balance:", err);
      }
    }

    setTimeout(refreshBalance, delay);
  });

  return (
    <div className="root">
      <nav className="root-header">
        <span>Algorand Polling Demo</span>
        <Link to="/">Home</Link>
        <Link to="/settings">Settings</Link>
        <a href="https://github.com/jasonpaulos/decipher-22-pyteal-talk">GitHub</a>
        <div></div>
        <span>Account: {addressPreview(account.addr)}</span>
      </nav>
      {!balance && <div className="dispenser-request">
            <p>
                Your account balance is zero. Use the BetaNet dispenser below to fund your account, then refresh this page.
            </p>
            <iframe id="dispenser" title="Algorand BetaNet dispenser" src={`https://bank.betanet.algodev.network?account=${account.addr}`}></iframe>
        </div>}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
