import React from 'react';
import { Form, ActionFunctionArgs, redirect } from "react-router-dom";
import * as algosdk from "algosdk";
import { PollClient } from '../pollClient';

export const algod = new algosdk.Algodv2("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "http://localhost:4001", "");

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
    const option1 = data.get("option1");
    const option2 = data.get("option2");
    const option3 = data.get("option3");
    const resubmit = data.get("resubmit"); // null when unchecked, "on" when checked
    const funding = data.get("funding");

    if (!option1 || !option2 || !option3) {
        throw new Response("Options are required", { status: 400 });
    }

    alert(JSON.stringify({
        option1, option2, option3, resubmit, funding
    }))

    const client = await PollClient.createPoll({
        algod,
        sender: account.addr,
        signer: algosdk.makeBasicAccountTransactionSigner(account),
        canResubmit: resubmit === "on",
        options: [
            option1.valueOf() as string,
            option2.valueOf() as string,
            option3.valueOf() as string
        ]
    });

    return redirect(`poll/${client.appID}`);
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
                <p>Options:</p>
                <p><input type="text" name="option1" required /></p>
                <p><input type="text" name="option2" required /></p>
                <p><input type="text" name="option3" required /></p>
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
