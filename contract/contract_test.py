from pathlib import Path
from json import load as json_load
from .contract import (
    approval_program,
    clear_state_program,
    contract,
)


def test_compile():
    target_dir = Path(__file__).parent

    with open(target_dir / "approval.teal", "r") as expected_approval_program_file:
        expected_approval_program = "".join(
            expected_approval_program_file.readlines()
        ).strip()
        assert approval_program == expected_approval_program

    with open(
        target_dir / "clear_state.teal", "r"
    ) as expected_clear_state_program_file:
        expected_clear_state_program = "".join(
            expected_clear_state_program_file.readlines()
        ).strip()
        assert clear_state_program == expected_clear_state_program

    with open(target_dir / "contract.json", "r") as expected_contract_file:
        expected_contract = json_load(expected_contract_file)
        assert contract.dictify() == expected_contract
