import { config } from "dotenv";
import { createConfig, factory } from "ponder";
import { getAbiItem } from "viem";
import { base } from "viem/chains";

import { adaptiveCurveIrmAbi } from "./abis/AdaptiveCurveIrm";
import { metaMorphoAbi } from "./abis/MetaMorpho";
import { metaMorphoFactoryAbi } from "./abis/MetaMorphoFactory";
import { morphoBlueAbi } from "./abis/MorphoBlue";

config();

export default createConfig({
  chains: {
    [base.id]: {
      ...base,
      rpc: process.env.RPC_URL_8453 ?? base.rpcUrls.default.http[0],
    },
  },
  contracts: {
    Morpho: {
      abi: morphoBlueAbi,
      chain: {
        [base.id]: {
          address: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
          startBlock: 13977148,
        },
      },
    },
    AdaptiveCurveIRM: {
      abi: adaptiveCurveIrmAbi,
      chain: {
        [base.id]: {
          address: "0x46415998764C29aB2a25CbeA6254146D50D22687",
          startBlock: 13977152,
        },
      },
    },
    MetaMorpho: {
      abi: metaMorphoAbi,
      chain: {
        [base.id]: {
          address: factory({
            address: "0xA9c3D3a366466Fa809d1Ae982Fb2c46E5fC41101",
            event: getAbiItem({ abi: metaMorphoFactoryAbi, name: "CreateMetaMorpho" }),
            parameter: "metaMorpho",
          }),
          startBlock: 13978134,
        },
      },
    },
  },
  database: {
    kind: "postgres",
    connectionString:
      process.env.POSTGRES_DATABASE_URL ?? "postgres://ponder:ponder@localhost:5433/ponder",
  },
});
