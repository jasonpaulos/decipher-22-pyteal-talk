import * as algosdk from 'algosdk';
import { approvalProgram, clearProgram, contractDescription } from './generated/contracts';

export const NUM_OPTIONS = 7;

export interface PollStatus {
    question: string,
    canResubmit: boolean
    isOpen: boolean
    results: Array<{ option: string, count: number }>
}

export class PollClient {

    constructor(public algod: algosdk.Algodv2, public appID: number, public sender: string, public signer: algosdk.TransactionSigner) {
        this.algod = algod;
        this.appID = appID;
        this.sender = sender;
        this.signer = signer;
    }

    async pollStatus(): Promise<PollStatus> {
        const appInfo = await this.algod.getApplicationByID(this.appID).do();
        const globalState = appInfo["params"]["global-state"];
        if (!globalState) {
            throw new Error("Global state not present");
        }
        const data = parseAppState(globalState);
        const results: Array<{ option: string, count: number }> = [];
        for (let i = 0; i < NUM_OPTIONS; i++) {
            results.push({
                option: data["option_name_" + String.fromCharCode(i)] as string,
                count: data["option_count_" + String.fromCharCode(i)] as number
            });
        }
        return {
            question: data["question"] as string,
            canResubmit: !!data["resubmit"],
            isOpen: !!data["open"],
            results,
        };
    }

    async mySubmittedOption(): Promise<number | undefined> {
        const address = algosdk.decodeAddress(this.sender).publicKey;
        let box: algosdk.modelsv2.Box
        try {
            box = await this.algod.getApplicationBoxByName(this.appID, address).do();
        } catch (err) {
            const typedErr = err as algosdk.BaseHTTPClientError;
            if (typedErr.response && typedErr.response.status === 404) {
                return undefined;
            }
            throw err;
        }
        if (box.value.byteLength !== 1) {
            throw new Error(`Unexpected box length. Expected length 1, but got ${box.value.byteLength}`);
        }
        return box.value[0];
    }

    async fundPollApp(amount: number) {
        const appAddr = algosdk.getApplicationAddress(this.appID);
        const composer = new algosdk.AtomicTransactionComposer();
        const suggestedParams = await this.algod.getTransactionParams().do();
        composer.addTransaction({
            txn: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                from: this.sender,
                to: appAddr,
                amount,
                suggestedParams,
            }),
            signer: this.signer,
        });
        await composer.execute(this.algod, 10);
    }

    async openPoll() {
        const composer = new algosdk.AtomicTransactionComposer();
        const suggestedParams = await this.algod.getTransactionParams().do();
        composer.addMethodCall({
            appID: this.appID,
            method: contractDescription.getMethodByName("open"),
            sender: this.sender,
            signer: this.signer,
            suggestedParams,
        });
        await composer.execute(this.algod, 10);
    }

    async closePoll() {
        const composer = new algosdk.AtomicTransactionComposer();
        const suggestedParams = await this.algod.getTransactionParams().do();
        composer.addMethodCall({
            appID: this.appID,
            method: contractDescription.getMethodByName("close"),
            sender: this.sender,
            signer: this.signer,
            suggestedParams,
        });
        await composer.execute(this.algod, 10);
    }

    async submitResponse(appID: number, choice: number) {
        const composer = new algosdk.AtomicTransactionComposer();
        const suggestedParams = await this.algod.getTransactionParams().do();
        composer.addMethodCall({
            appID: this.appID,
            method: contractDescription.getMethodByName("submit"),
            methodArgs: [choice],
            sender: this.sender,
            signer: this.signer,
            suggestedParams,
        });
        await composer.execute(this.algod, 10);
    }

    static async createPoll({
        algod,
        sender,
        signer,
        question,
        canResubmit,
        options,
    }: {
        algod: algosdk.Algodv2,
        sender: string,
        signer: algosdk.TransactionSigner,
        question: string,
        canResubmit: boolean,
        options: string[]
    }): Promise<number> {
        const composer = new algosdk.AtomicTransactionComposer();
        const suggestedParams = await algod.getTransactionParams().do();
        composer.addMethodCall({
            appID: 0, // indicates app creation
            method: contractDescription.getMethodByName("create"),
            methodArgs: [question, options, canResubmit],
            numGlobalByteSlices: 1 + NUM_OPTIONS,
            numGlobalInts: 2 + NUM_OPTIONS,
            numLocalByteSlices: 0,
            numLocalInts: 0,
            approvalProgram,
            clearProgram,
            sender,
            signer,
            suggestedParams,
        });

        const result = await composer.execute(algod, 10);

        const txnData = await algod.pendingTransactionInformation(result.txIDs[0]).do();
        if (typeof txnData["application-index"] !== "number") {
            throw new Error(`Unable to get created application ID from txn ${result.txIDs[0]} confirmed in round ${result.confirmedRound}`);
        }

        return txnData["application-index"];
    }
}

interface TealKeyValue {
    key: string
    value: TealValue
}

interface TealValue {
    bytes: string
    type: 1 | 2
    uint: number
}

function parseAppState(state: TealKeyValue[]): Record<string, string | number> {
    const data: Record<string, string | number> = {};
    for (const keyValue of state) {
        const key = Buffer.from(keyValue.key, 'base64').toString();
        let value;
        if (keyValue.value.type === 1) {
            value = Buffer.from(keyValue.value.bytes, 'base64').toString();
        } else {
            value = keyValue.value.uint;
        }
        data[key] = value;
    }
    return data;
}