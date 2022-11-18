import React from 'react';
import { Form, ActionFunctionArgs, redirect } from "react-router-dom";
import * as algosdk from "algosdk";
import { PollClient, NUM_OPTIONS } from '../pollClient';

export const algod = new algosdk.Algodv2("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "http://localhost", 4001);

// NJTWFPVLRCFXP5LHPDCANCF66PHZ5VBKDXNCMMIJ4GJJXBUXXABCGPWLDQ
export const account = algosdk.mnemonicToSecretKey("decide afford bread drastic waste pottery lawn amused hip clown tiger silly cheap visit mutual vital spider goose music bean left obscure truly absent nuclear");


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
    const funding = data.get("funding");

    const appID = await PollClient.createPoll({
        algod,
        sender: account.addr,
        signer: algosdk.makeBasicAccountTransactionSigner(account),
        question: question.valueOf() as string,
        canResubmit: !!resubmit,
        options: options.map(option => option.valueOf() as string)
    });

    return redirect(`poll/${appID}`);
}

export function Home() {
  return (
    <>
        <h2>Home</h2>
        {/* <p><Link to="/poll">Take me to a poll</Link></p> */}
        <div>
            <h2>Join a poll</h2>
            <Form method="post">
                <input type="hidden" name="kind" value="join" />
                <label>
                    ID: <input type="number" name="appID" required />
                </label>
                <button type="submit">Join</button>
            </Form>
        </div>
        <div>
            <h2>Create a poll</h2>
            <Form method="post">
                <input type="hidden" name="kind" value="create" />
                <p>
                    <label>
                    Question: <input type="text" name="question" required />
                    </label>
                </p>
                {range(NUM_OPTIONS).map((i) => (
                    <p key={i}>
                        <label>
                            Option {i+1}: <input type="text" name={`option${i}`} required />
                        </label>
                    </p>
                ))}
                <p>
                    <label>
                    Can resubmit: <input type="checkbox" name="resubmit" />
                    </label>
                </p>
                <p>
                    <label>
                    Initial funding (in microAlgos): <input type="number" name="funding" defaultValue={0} />
                    </label>
                </p>
                <button type="submit">Create</button>
            </Form>
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
