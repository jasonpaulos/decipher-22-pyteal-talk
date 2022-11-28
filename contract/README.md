# Polling Smart Contract

This smart contract is written with [PyTeal](https://github.com/algorand/pyteal) for the Algorand blockchain.

## Development Setup

This project requires Python 3.10.

Setup venv (one time):

* `python3 -m venv venv`

Active venv:

* `. venv/bin/activate` (if your shell is bash/zsh)
* `. venv/bin/activate.fish` (if your shell is fish)

Install dependencies:

* pip install -r requirements.txt`

Format code:

* `black .`

Lint using flake8:

* `flake8`

Type checking using mypy:

* `mypy .`

Run unit tests:

* `pytest`

Run the decipher jupyter notebook (assuming your working directory is the `contract` folder):

* jupyter-lab ../slides.ipynb
