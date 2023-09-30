# zkMon Contracts

## Intro

This repository contains the smart contracts for the zkMon drop by Polychain Monsters x Modulus Labs.

## How does it work?

The zkMon collection is a regular ERC721 contract. The supply is to be capped at 1,000 items. There are 9 different types of monsters. Within each type, each monster image is unique. The type of a monster is stored on-chain, the image by default off-chain.

A zk proof can be used to verify that the collection was created authentically by our AI artist making the AI execution officially verified by the Ethereum network.

## Todos

- Merge zkMonMetadata and zkMonRandomness into zkMon main contract to have everything in one place
- Add function to optionally put image and merkle path of a single NFT on-chain by its owner -> needs merkle root verification
- Depending on launch platform, integrate mint process
