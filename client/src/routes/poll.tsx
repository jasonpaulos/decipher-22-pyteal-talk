import React from 'react';
import { ActionFunctionArgs, LoaderFunctionArgs, useLoaderData, useFetcher } from "react-router-dom";
import * as algosdk from "algosdk";
import { NUM_OPTIONS, PollClient, PollAccountBalance, PollStatus } from '../pollClient';
import { getAlgod, getAccount } from './settings';

interface PollData {
    client: PollClient,
    balance?: PollAccountBalance
    status: PollStatus,
    submitted: number | undefined
}

export async function loader({ params }: LoaderFunctionArgs): Promise<PollData> {
    if (!params.appID) {
        throw new Response("appID missing", { status: 400 });
    }
    const appID = parseInt(params.appID, 10)
    const account = getAccount();
    const client = new PollClient(getAlgod(), appID, account.addr, algosdk.makeBasicAccountTransactionSigner(account));
    const [status, submitted] = await Promise.all([
        client.pollStatus(),
        client.mySubmittedOption()
    ]);
    let balance: PollAccountBalance | undefined = undefined;
    if (status.isAdmin) {
        balance = await client.pollAccountBalance();
    }
    return { client, balance, status, submitted };
}

export async function action({ request, params }: ActionFunctionArgs) {
    const formData = await request.formData();

    const { appID } = params;
    if (!appID) {
        throw new Response("appID missing from params", { status: 400 });
    }
    const account = getAccount();
    const client = new PollClient(getAlgod(), parseInt(appID, 10), account.addr, algosdk.makeBasicAccountTransactionSigner(account));

    const kind = formData.get("kind");
    if (!kind) {
        throw new Response("Kind missing", { status: 400 });
    }

    switch(kind.valueOf()) {
        case "vote":
            return submitPoll(client, formData);
        case "open":
            return openOrClosePoll(client, true);
        case "close":
            return openOrClosePoll(client, false);
        case "fund":
            return fundPoll(client, formData);
        default:
            throw new Response(`Unexpected kind: ${kind.valueOf()}`, { status: 400 });
    }
}

function submitPoll(client: PollClient, data: FormData) {
    const selected = data.get("option");
    if (!selected) {
        throw new Response("option missing from params", { status: 400 });
    }
    const selectedIndex = parseInt(selected.valueOf() as string, 10);
    if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= NUM_OPTIONS) {
        throw new Response(`Unexpected option: ${selected.valueOf()}`, { status: 400 });
    }
    return client.submitResponse(selectedIndex);
}

function openOrClosePoll(client: PollClient, open: boolean) {
    if (open) {
        return client.openPoll();
    } else {
        return client.closePoll();
    }
}

function fundPoll(client: PollClient, data: FormData) {
    const amount = data.get("amount");
    if (!amount) {
        throw new Response("amount missing from params", { status: 400 });
    }
    const amountStr = amount.valueOf() as string;
    const amountMicroAlgos = algosdk.algosToMicroalgos(parseFloat(amountStr));
    return client.fundPollApp(amountMicroAlgos);
}

export function Poll() {
    const { client, status, submitted, balance } = useLoaderData() as PollData;
    const fetcher = useFetcher();
    const votingEnabled = status.isOpen && (submitted === undefined || status.canResubmit);
    const totalSubmissions = status.results.map(({count}) => count).reduce((a, b) => a + b, 0);

    let submissionPending = false;
    let openPending = false;
    let closePending = false;
    let fundPending = false;
    if (fetcher.state !== "idle" && fetcher.formData) {
        const kind = fetcher.formData.get("kind");
        if (kind) {
            switch(kind.valueOf()) {
                case "vote":
                    submissionPending = true;
                    break;
                case "open":
                    openPending = true;
                    break;
                case "close":
                    closePending = true;
                    break;
                case "fund":
                    fundPending = true;
                    break;
            }
        }
    }

    return (
        <>
            <p>Poll #{client.appID}</p>
            <p>Question: {status.question}</p>
            <p>The poll is {status.isOpen ? "open" : "closed"}.</p>
            <p>{submitted === undefined ? "You have not yet voted in this poll." : `You have already voted in this poll. You may ${ status.canResubmit ? "" : "not "}submit again.`}</p>
            <fetcher.Form method="post">
                <input type="hidden" name="kind" value="vote" />
                <fieldset disabled={!votingEnabled || submissionPending}>
                    <legend>Choose an option:</legend>
                    {
                        status.results.map(({ option }, index) => (
                            <div key={`${option}:${index}`}>
                                <label>
                                    <input type="radio" name="option" value={index} defaultChecked={submitted === index} />
                                    {option}
                                </label>
                            </div>
                        ))
                    }
                </fieldset>
                <button type="submit" disabled={!votingEnabled || submissionPending}>{submissionPending ? "Submitting..." : "Submit"}</button>
            </fetcher.Form>
            <div hidden={submitted === undefined}>
                <p>Results</p>
                {
                    status.results.map(({ option, count }, index) => (
                        <div key={`${option}:${index}:${count}`}>
                            <p>{option}: {count} ({(100*count/totalSubmissions).toFixed(0)}%)</p>
                        </div>
                    ))
                }
                <p>Total submissions: {totalSubmissions}</p>
            </div>
            {status.isAdmin && !!balance && <div>
                <p>Admin Panel</p>
                <fetcher.Form method="post">
                    <input type="hidden" name="kind" value="open" />
                    <button type="submit" disabled={status.isOpen || openPending}>{openPending ? "Opening..." : "Open"}</button>
                </fetcher.Form>
                <fetcher.Form method="post">
                    <input type="hidden" name="kind" value="close" />
                    <button type="submit" disabled={!status.isOpen || closePending}>{closePending ? "Closing..." : "Close"}</button>
                </fetcher.Form>
                <p>
                    Poll account balance: {algosdk.microalgosToAlgos(balance.balance)} Algos
                </p>
                <p>
                    Poll account minimum balance: {algosdk.microalgosToAlgos(balance.minBalance)} Algos
                </p>
                <p>
                    Poll account boxes: {balance.numBoxes} boxes, {balance.boxBytes} total bytes
                </p>
                <fetcher.Form method="post">
                    <input type="hidden" name="kind" value="fund" />
                    <label>
                        Fund poll account: <input type="number" name="amount" min={0} step={0.001} defaultValue={0} disabled={fundPending} />
                    </label>
                    <button type="submit" disabled={fundPending}>{fundPending ? "Sending Algos..." : "Send Algos"}</button>
                </fetcher.Form>
            </div>}
        </>
  );
}
