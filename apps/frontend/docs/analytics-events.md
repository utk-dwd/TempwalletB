# TempWallets.com - Analytics Event Documentation

This document outlines the events tracked in the TempWallets application using Mixpanel. All events are tracked via the `analyticsService`.

## User Properties

These properties are set on a user's profile via `analyticsService.identifyUser()`.

| Property          | Type   | Description                                           |
| ----------------- | ------ | ----------------------------------------------------- |
| `$name`           | String | User's profile name.                                  |
| `walletAddress`   | String | The user's primary EOA wallet address (distinct_id).  |
| `profileName`     | String | A copy of the user's profile name.                    |
| `totalWalletsCreated`| Number | A counter for how many temp wallets they have made. |
| `lastLogin`       | Date   | The timestamp of the user's last connection.          |

---

## Events

### Wallet Connection

| Event Name                    | Description                                                   | Properties                                     |
| ----------------------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| `Wallet Connection Attempted` | Fired when the user clicks "Connect Wallet".                  | `networkName`, `desiredAccount`                |
| `Wallet Connection Success`   | Fired when MetaMask is successfully connected.                | `connectedAccount`                             |
| `Wallet Connection Failed`    | Fired if there is an error during the connection process.     | `errorMessage`                                 |
| `Network Switch Requested`    | Fired when the app prompts the user to switch networks.       | `targetNetworkName`, `targetChainId`           |
| `Network Added`               | Fired when a new network is successfully added to MetaMask.   | `networkName`, `chainId`                       |

### Wallet Operations

| Event Name                    | Description                                                   | Properties                                     |
| ----------------------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| `Wallet Creation Started`     | Fired when any "create wallet" process begins.                | `creationType` ('standard', 'random', 'custom'), `walletNumber`, `networkName` |
| `Wallet Creation Success`     | Fired when a smart account is successfully deployed.          | `walletAddress`, `walletNumber`, `index`       |
| `Wallet Creation Failed`      | Fired if smart account deployment fails.                      | `errorMessage`, `creationType`                 |
| `Transaction Initiated`       | Fired when the user initiates a transaction from a temp wallet.| `fromWalletAddress`, `tokenSymbol`, `networkName`|
| `Transaction Success`         | Fired when the transaction is confirmed on-chain.             | `transactionHash`, `fromWalletAddress`, `tokenSymbol` |
| `Transaction Failed`          | Fired if the transaction fails to send or gets rejected.      | `errorMessage`, `fromWalletAddress`            |

### UI Interactions

| Event Name                      | Description                                                  | Properties                                    |
| ------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| `Wallet Selected`               | Fired when a user clicks on a wallet in the list.            | `walletAddress`, `walletNumber`               |
| `Network Changed`               | Fired when a user selects a new network from the dropdown.   | `previousNetwork`, `newNetwork`               |
| `Create Wallet Button Clicked`  | Fired when a user clicks any of the "create" buttons.        | `creationType` ('standard', 'random', 'custom') |
| `Address Copy Clicked`          | Fired when a user clicks a copy icon for an address.         | `walletAddress`, `copySource` ('list', 'details') |
| `Wallet Sort Changed`           | Fired when the user changes the sort order of the wallet list.| `sortType` ('original', 'balance', etc.)      |
| `Profile Edit Started`          | Fired when user clicks the "edit" icon on their profile.     | -                                             |
| `Profile Edit Saved`            | Fired when the user saves their profile changes.             | -                                             |
| `Wallet Name Edit Started`      | Fired when the user clicks the "edit" icon on wallet name.   | `walletAddress`                               |
| `Export/Import Wallets Clicked` | Fired when the user clicks the export or import button.      | `actionType` ('export', 'import')             |
| `Logout Clicked`                | Fired when the user clicks the logout button.                | -                                             |
| `Policy Viewed`                 | Fired when the user opens the Terms of Use or Privacy Policy.| `policyType` ('terms', 'privacy')             |