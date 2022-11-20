const fs = require('fs');
const path = require('path');

function generateContractFile(approvalProgram, clearStateProgram, contractDescription) {
    const approvalProgramContents = Array.from(approvalProgram).map(value => value.toString()).join(",");
    const clearStateProgramContents = Array.from(clearStateProgram).map(value => value.toString()).join(",");
    const contractDescriptionContent = Buffer.from(contractDescription).toString().trim();
    return `// GENERATED FILE - DO NOT EDIT
import { ABIContract } from 'algosdk';

export const approvalProgram = Uint8Array.from([${approvalProgramContents}]);
export const clearProgram = Uint8Array.from([${clearStateProgramContents}]);
export const contractDescription = new ABIContract(${contractDescriptionContent});
`;
}

function copyContractCode() {
    const contractDir = path.join(__dirname, "..", "..", "contract");
    const approvalProgramPath = path.join(contractDir, "approval.teal.tok");
    const clearStateProgramPath = path.join(contractDir, "clear_state.teal.tok");
    const contractDescriptionPath = path.join(contractDir, "contract.json");

    const approvalProgram = fs.readFileSync(approvalProgramPath);
    const clearStateProgram = fs.readFileSync(clearStateProgramPath);
    const contractDescription = fs.readFileSync(contractDescriptionPath);

    const generatedDir = path.join(__dirname, "..", "src", "generated");
    if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir);
    }

    const generatedContractPath = path.join(generatedDir, "contracts.ts");
    const generatedContents = generateContractFile(approvalProgram, clearStateProgram, contractDescription);

    fs.writeFileSync(generatedContractPath, generatedContents);
}

copyContractCode();
