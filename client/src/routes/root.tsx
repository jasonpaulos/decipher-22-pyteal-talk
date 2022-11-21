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
    <div className="root">
      <nav className="root-header">
        <span>Algorand Polling Demo</span>
        <Link to="/">Home</Link>
        <Link to="/settings">Settings</Link>
        <div></div>
        <span className="account">Account: {account.addr}</span>
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
