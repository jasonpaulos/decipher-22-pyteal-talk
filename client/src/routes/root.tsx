import React from 'react';
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

export function Root() {
  const { account, balance } = useLoaderData() as RootData;
  return (
    <div className="App">
      <nav>
        <h1><Link to="/">Algorand Polling Demo</Link></h1>
        <h2><Link to="/settings">Settings: {account.addr}</Link></h2>
      </nav>
      {!balance && <div>
            <p>
                Your account balance is zero. Use the BetaNet dispenser below to fund your account, then refresh this page.
            </p>
            <iframe id="dispenser" title="Algorand BetaNet dispenser" src={`https://bank.betanet.algodev.network?account=${account.addr}`} width={1000} height={400}></iframe>
        </div>}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
