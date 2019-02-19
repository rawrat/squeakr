# Squeakr: Decentralised Private Twitter

Squeakr is a demo application designed to showcase the power of privEOS. It is basically a simple form of Twitter on the blockchain, but all tweets are private. Only approved followers can see the tweets. The app pays for any privEOS fees. The service is free for the users.

## Installation

### Deploy the contract
```
cd contract
make setup
make deploy
make fundpriveos
```

### Install the privEOS Library
```
git checkout https://github.com/rawrat/priveos-client
cd priveos-client
npm link
```
### Run the app
```
cd frontend
npm install
npm link priveos
npm run serve
```