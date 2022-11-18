import * as algosdk from 'algosdk';
import { approvalProgram, clearProgram, contractDescription } from './generated/contracts';

export class PollClient {

    private constructor(public algod: algosdk.Algodv2, public appID: number, public sender: string, public signer: algosdk.TransactionSigner) {
        this.algod = algod;
        this.appID = appID;
        this.sender = sender;
        this.signer = signer;
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

    async status() {
        // TODO
    }

    static async createPoll({
        algod,
        sender,
        signer,
        canResubmit,
        options,
    }: {
        algod: algosdk.Algodv2,
        sender: string,
        signer: algosdk.TransactionSigner,
        canResubmit: boolean,
        options: string[]
    }): Promise<PollClient> {
        const composer = new algosdk.AtomicTransactionComposer();
        const suggestedParams = await algod.getTransactionParams().do();
        composer.addMethodCall({
            appID: 0, // indicates app creation
            method: contractDescription.getMethodByName("create"),
            methodArgs: [options, canResubmit],
            numGlobalByteSlices: 0, // TODO: increase
            numLocalByteSlices: 0, // TODO: increase
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

        return new PollClient(algod, txnData["application-index"], sender, signer);
    }

    static forExistingPoll({
        algod,
        appID,
        sender,
        signer,
    }: {
        algod: algosdk.Algodv2,
        appID: number,
        sender: string,
        signer: algosdk.TransactionSigner,
    }): PollClient {
        return new PollClient(algod, appID, sender, signer);
    }

}
