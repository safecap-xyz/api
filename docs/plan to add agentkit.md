
let's draft a plan for how we're going to architect this feature has to do with agent kit and connected wallet the wallet provider whatever you've already connected so let's say the wallet provider is metamask you're connected and your dap and then you in your API you invoke agent kit you pass a metamask as a wallet provider and then let's use whatever examples we have in front of us let's say your wallet provider is metamask you invoke agent kit and you pass a metamask as a wallet provider and then let's use whatever examples we have in front of us let's say your wallet provider is metamask you invoke agent kit and you pass a metamask as a wallet provider and then let's use whatever examples we have in front of us then we'll also pass in an action provider 

```
import { cdpApiActionProvider, pythActionProvider } from "@coinbase/agentkit";

const agentKit = await AgentKit.from({
    walletProvider,
    actionProviders: [
        cdpApiActionProvider({
            apiKeyName: "CDP API KEY NAME",
            apiKeyPrivate: "CDP API KEY PRIVATE KEY",
        }),
        pythActionProvider(),
    ],
});
```

full docs here: 
`https://coinbase.github.io/agentkit/agentkit/typescript/index.html#create-an-agentkit-instance-with-a-specified-wallet-provider`

the action to take: 
twitter - `account_details`

we want to use smart wallet provider:
```
import { SmartWalletProvider, SmartWalletConfig } from "@coinbase/agentkit";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const networkId = process.env.NETWORK_ID || "base-sepolia";

const privateKey = process.env.PRIVATE_KEY || generatePrivateKey();
const signer = privateKeyToAccount(privateKey);

// Configure Wallet Provider
const walletProvider = await SmartWalletProvider.configureWithWallet({
  networkId,
  signer,
  smartWalletAddress: undefined, // If not provided a new smart wallet will be created
  paymasterUrl: undefined, // Sponsor transactions: https://docs.cdp.coinbase.com/paymaster/docs/welcome
});
```

