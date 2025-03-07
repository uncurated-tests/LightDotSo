#!/bin/bash

sudo apt install build-essential -y;
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y;
source "$HOME/.cargo/env";
git clone -b optfix2 https://github.com/Vectorized/create2crunch.git && cd create2crunch;
sed -i 's/0x4/0x40/g' src/lib.rs

export FACTORY="0x0000000000ffe8b47b3e2130213b802212439497";
export CALLER="0x0000000000000000000000000000000000000000";
export INIT_CODE_HASH="0xb5e9d23a8d8ca943a255b36822b7927b53c12abb407bbb13b4313f3f494500b8";
export LEADING=5; export TOTAL=7;
cargo run --release $FACTORY $CALLER $INIT_CODE_HASH 0 $LEADING $TOTAL;
