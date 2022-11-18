import React from 'react';
import { ActionFunctionArgs, LoaderFunctionArgs, useLoaderData, useFetcher } from "react-router-dom";
import * as algosdk from "algosdk";
import { PollClient, PollStatus } from '../pollClient';
import { algod, account } from './home';

interface PollData {
    client: PollClient,
    status: PollStatus,
    submitted: number | undefined
}

export async function loader({ params }: LoaderFunctionArgs): Promise<PollData> {
    if (!params.appID) {
        throw new Response("appID missing", { status: 400 });
    }
    const appID = parseInt(params.appID, 10)
    const client = new PollClient(algod, appID, account.addr, algosdk.makeBasicAccountTransactionSigner(account));
    const [status, submitted] = await Promise.all([
        client.pollStatus(),
        client.mySubmittedOption()
    ]);
    return { client, status, submitted };
}

export async function action({ request, params }: ActionFunctionArgs) {
    const formData = await request.formData();

    const kind = formData.get("kind");
    if (!kind) {
        throw new Response("Kind missing", { status: 400 });
    }

    switch(kind.valueOf()) {
        case "vote":
            return submitPoll(formData);
        default:
            throw new Response(`Unexpected kind: ${kind.valueOf()}`, { status: 400 });
    }
}

async function submitPoll(data: FormData) {
    // TODO: submit vote
}

export function Poll() {
    const { client, status, submitted } = useLoaderData() as PollData;
    const fetcher = useFetcher();
    const votingEnabled = status.isOpen && (submitted === undefined || status.canResubmit);
    return (
        <>
            <p>Poll #{client.appID}</p>
            <p>Question: {status.question}</p>
            <p>The poll is {status.isOpen ? "open" : "closed"}.</p>
            <p>{submitted === undefined ? "You have not yet voted in this poll." : `You have already voted in this poll. You may ${ status.canResubmit ? "" : "not"} submit again.`}</p>
            <fetcher.Form method="post">
                <input type="hidden" name="kind" value="vote" />
                <fieldset disabled={!votingEnabled}>
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
                <button type="submit" disabled={!votingEnabled}>Submit</button>
            </fetcher.Form>
            <div hidden={!status.isAdmin}>
                <p>Admin Panel</p>
                <fetcher.Form method="post">
                    <input type="hidden" name="kind" value="open" />
                    <button type="submit" disabled={status.isOpen}>Open</button>
                </fetcher.Form>
                <fetcher.Form method="post">
                    <input type="hidden" name="kind" value="close" />
                    <button type="submit" disabled={!status.isOpen}>Close</button>
                </fetcher.Form>
            </div>
        </>
  );
}
