import React from 'react';
import { Form, ActionFunctionArgs, useNavigation, redirect } from "react-router-dom";
import * as algosdk from "algosdk";
import { PollClient, NUM_OPTIONS } from '../pollClient';
import { getAlgod, getAccount } from './settings';
import "./home.css"

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();

    const kind = formData.get("kind");
    if (!kind) {
        throw new Response("Kind missing", { status: 400 });
    }

    switch(kind.valueOf()) {
        case "join":
            return joinPoll(formData);
        case "create":
            return createPoll(formData);
        default:
            throw new Response(`Unexpected kind: ${kind.valueOf()}`, { status: 400 });
    }
}

function joinPoll(data: FormData) {
    const appID = data.get("appID");
    if (!appID) {
        throw new Response("Missing appID", { status: 400 });
    }
    return redirect(`poll/${appID}`);
}

async function createPoll(data: FormData) {
    const question = data.get("question");
    if (!question) {
        throw new Response(`Question is not present`, { status: 400 });
    }
    const options: FormDataEntryValue[] = [];
    for (let i = 0; i < NUM_OPTIONS; i++) {
        const entry = data.get(`option${i}`);
        if (!entry) {
            throw new Response(`Option ${i} is not present`, { status: 400 });
        }
        options.push(entry);
    }
    const resubmit = data.get("resubmit"); // null when unchecked, "on" when checked

    const account = getAccount();
    const appID = await PollClient.createPoll({
        algod: getAlgod(),
        sender: account.addr,
        signer: algosdk.makeBasicAccountTransactionSigner(account),
        question: question.valueOf() as string,
        canResubmit: !!resubmit,
        options: options.map(option => option.valueOf() as string)
    });

    return redirect(`poll/${appID}`);
}

export function Home() {
    const navigation = useNavigation();
    let creationPending = false;
    if (navigation.state !== "idle" && navigation.formData) {
        const kind = navigation.formData.get("kind");
        if (kind && kind.valueOf() === "create") {
            creationPending = true;
        }
    }
  return (
    <>
        <h1>Home</h1>
        <div className="home">
            <div className="poll-join">
                <h2>Join a poll</h2>
                <p>Participate in an existing poll</p>
                <Form method="post">
                    <input type="hidden" name="kind" value="join" />
                    <label htmlFor="appID">ID:</label>
                    <input type="number" id="appID" name="appID" min={0} max={Number.MAX_SAFE_INTEGER} required />
                    <button type="submit">Join</button>
                </Form>
            </div>
            <div>
                <h2>Or</h2>
            </div>
            <div className="poll-create">
                <h2>Create a poll</h2>
                <p>Create a new poll</p>
                <Form method="post">
                    <input type="hidden" name="kind" value="create" />
                    <p>
                        <label>
                        Question: <input type="text" name="question" disabled={creationPending} required />
                        </label>
                    </p>
                    <fieldset disabled={creationPending}>
                        <legend>Options:</legend>
                        {range(NUM_OPTIONS).map((i) => (
                            <p key={i}>
                                <label>
                                    Option {i+1}: <input type="text" name={`option${i}`} required />
                                </label>
                            </p>
                        ))}
                    </fieldset>
                    <p>
                        <label>
                            <input type="checkbox" name="resubmit" disabled={creationPending} />
                            Resubmission allowed
                        </label>
                    </p>
                    <button type="submit" disabled={creationPending}>{creationPending ? "Creating..." : "Create"}</button>
                </Form>
            </div>
        </div>
    </>
  );
}

function range(max: number): number[] {
    let nums: number[] = [];
    for (let i = 0; i < max; i++) {
        nums[i] = i;
    }
    return nums;
}
