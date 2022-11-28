import React from 'react';
import { ActionFunctionArgs, useFetcher, useLoaderData, useRouteLoaderData } from "react-router-dom";
import * as algosdk from "algosdk";
import { RootData } from './root';

interface AlgodParams {
    address: string,
    port: number | string,
    token: string,
}

let algodParams: AlgodParams | undefined = undefined;
let algod: algosdk.Algodv2 | undefined = undefined;
let account: algosdk.Account | undefined = undefined;


function getAlgodParams(): AlgodParams {
    if (!algodParams) {
        const stored = localStorage.getItem("algodParams");
        if (stored) {
            algodParams = JSON.parse(stored) as AlgodParams;
        } else {
            // use default value
            algodParams = {
                address: "https://betanet-api.algonode.cloud",
                port: "",
                token: "",
            };
        }
    }
    return algodParams;
}

export function getAlgod(): algosdk.Algodv2 {
    if (!algod) {
        const params = getAlgodParams();
        algod = new algosdk.Algodv2(params.token, params.address, params.port);
    }
    return algod;
}

export function getAccount(): algosdk.Account {
    if (!account) {
        const stored = localStorage.getItem("account");
        if (stored) {
            account = algosdk.mnemonicToSecretKey(stored);
        } else {
            // generate new account
            account = algosdk.generateAccount();
            // WARNING: DO NOT STORE ACCOUNT MNEMONIC IN LOCAL STORAGE IN PRODUCTION.
            // This is an insecure practice only used for the purpose of this demo, only for
            // TestNet/BetaNet. NEVER do this for MainNet where actual funds are at risk.
            // For produce apps, use WalletConnect or similar protocols to enable users to sign
            // transactions. NEVER ask for their secret keys.
            localStorage.setItem("account", algosdk.secretKeyToMnemonic(account.sk));
        }
    }
    return account;
}

interface SettingsData {
    algodParams: AlgodParams,
    account: algosdk.Account,
    algodLastRound: number,
    algodGenesisID: string,
}

export async function loader(): Promise<SettingsData> {
    const account = getAccount();
    const algodParams = getAlgodParams();
    const algod = getAlgod();

    const params = await algod.getTransactionParams().do();

    return {
        algodParams,
        account,
        algodLastRound: params.lastRound as number,
        algodGenesisID: params.genesisID as string,
    };
}

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();

    const kind = formData.get("kind");
    if (!kind) {
        throw new Response("Kind missing", { status: 400 });
    }

    switch(kind.valueOf()) {
        case "algod":
            return updateAlgod(formData);
        case "generateAccount":
            return generateAccount();
        case "setAccount":
            return setAccount(formData);
        default:
            throw new Response(`Unexpected kind: ${kind.valueOf()}`, { status: 400 });
    }
}

function updateAlgod(data: FormData) {
    const address = data.get("address");
    if (!address) {
        throw new Response("address missing from params", { status: 400 });
    }
    const port = data.get("port");
    const token = data.get("token");

    const newParams: AlgodParams = {
        address: address.valueOf() as string,
        port: port ? port.valueOf() as string : "",
        token: token ? token.valueOf() as string : "",
    };
    
    algod = new algosdk.Algodv2(token ? token.valueOf() as string : '', address.valueOf() as string, port ? port.valueOf() as string : '');
    algodParams = newParams;
    localStorage.setItem("algodParams", JSON.stringify(newParams));
}

function generateAccount() {
    account = algosdk.generateAccount();
    // WARNING: DO NOT STORE ACCOUNT MNEMONIC IN LOCAL STORAGE IN PRODUCTION.
    // This is an insecure practice only used for the purpose of this demo, only for
    // TestNet/BetaNet. NEVER do this for MainNet where actual funds are at risk.
    // For produce apps, use WalletConnect or similar protocols to enable users to sign
    // transactions. NEVER ask for their secret keys.
    localStorage.setItem("account", algosdk.secretKeyToMnemonic(account.sk));
}

function setAccount(data: FormData) {
    const mnemonic = data.get("mnemonic");
    if (!mnemonic) {
        throw new Response("mnemonic missing from params", { status: 400 });
    }
    const str = mnemonic.valueOf() as string;
    account = algosdk.mnemonicToSecretKey(str);
    // WARNING: DO NOT STORE ACCOUNT MNEMONIC IN LOCAL STORAGE IN PRODUCTION.
    // This is an insecure practice only used for the purpose of this demo, only for
    // TestNet/BetaNet. NEVER do this for MainNet where actual funds are at risk.
    // For produce apps, use WalletConnect or similar protocols to enable users to sign
    // transactions. NEVER ask for their secret keys.
    localStorage.setItem("account", algosdk.secretKeyToMnemonic(account.sk));
}

export function Settings() {
    const { algodParams, account, algodLastRound, algodGenesisID } = useLoaderData() as SettingsData;
    const { balance } = useRouteLoaderData('root') as RootData;
    const fetcher = useFetcher();
    return (
        <>
            <h2>Settings</h2>
            <div>
                <h3>Node (Algod)</h3>
                <p>
                    Network: {algodGenesisID}
                </p>
                <p>
                    Last round: {algodLastRound}
                </p>
                <fetcher.Form method="post">
                    <input type="hidden" name="kind" value="algod" />
                    <p>
                        <label>
                            Address: <input type="text" name="address" defaultValue={algodParams.address} required />
                        </label>
                    </p>
                    <p>
                        <label>
                            Port: <input type="number" name="port" defaultValue={algodParams.port} min={0} max={65535} />
                        </label>
                    </p>
                    <p>
                        <label>
                            Token: <input type="text" name="token" defaultValue={algodParams.token} />
                        </label>
                    </p>
                    <button type="submit">Update</button>
                </fetcher.Form>
            </div>
            <div>
                <h3>Account</h3>
                <p>
                    {account.addr}
                </p>
                <p>
                    Balance: {algosdk.microalgosToAlgos(balance)} Algos
                </p>
            </div>
            <div>
                <p>Change account</p>
                <fetcher.Form method="post">
                    <input type="hidden" name="kind" value="generateAccount" />
                    <button type="submit">Generate new account</button>
                </fetcher.Form>
                <fetcher.Form method="post">
                    <input type="hidden" name="kind" value="setAccount" />
                    <label>
                        Set mnemonic: <input type="text" name="mnemonic" required />
                    </label>
                    <button type="submit">Set mnemonic</button>
                </fetcher.Form>
            </div>
        </>
    );
}
