import { config } from "dotenv";
import { createConfig, factory } from "ponder";
import { getAbiItem, http } from "viem";
import { base, unichain } from "viem/chains";

import { adaptiveCurveIrmAbi } from "./abis/AdaptiveCurveIrm";
import { metaMorphoAbi } from "./abis/MetaMorpho";
import { metaMorphoFactoryAbi } from "./abis/MetaMorphoFactory";
import { morphoBlueAbi } from "./abis/MorphoBlue";

// Load .env from root directory
config();

const baseRpcUrl = process.env.RPC_URL_8453 ?? base.rpcUrls.default.http[0];
const unichainRpcUrl = process.env.RPC_URL_130 ?? unichain.rpcUrls.default.http[0];

const networks = {
  base: {
    chainId: base.id,
    transport: http(baseRpcUrl),
  },
  unichain: {
    chainId: unichain.id,
    transport: http(unichainRpcUrl),
  },
};

export default createConfig({
  networks,
  contracts: {
    Morpho: {
      abi: morphoBlueAbi,
      network: {
        base: {
          address: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
          startBlock: 13977148,
        },
        unichain: {
          address: "0x8f5ae9CddB9f68de460C77730b018Ae7E04a140A",
          startBlock: 9139027,
        },
      },
    },
    AdaptiveCurveIRM: {
      abi: adaptiveCurveIrmAbi,
      network: {
        base: {
          address: "0x46415998764C29aB2a25CbeA6254146D50D22687",
          startBlock: 13977152,
        },
        unichain: {
          address: "0x9a6061d51743B31D2c3Be75D83781Fa423f53F0E",
          startBlock: 9139027,
        },
      },
    },
    MetaMorpho: {
      abi: metaMorphoAbi,
      network: {
        base: {
          address: factory({
            address: "0xA9c3D3a366466Fa809d1Ae982Fb2c46E5fC41101",
            event: getAbiItem({ abi: metaMorphoFactoryAbi, name: "CreateMetaMorpho" }),
            parameter: "metaMorpho",
          }),
          startBlock: 13978134,
        },
        unichain: {
          address: factory({
            address: "0xe9EdE3929F43a7062a007C3e8652e4ACa610Bdc0",
            event: getAbiItem({ abi: metaMorphoFactoryAbi, name: "CreateMetaMorpho" }),
            parameter: "metaMorpho",
          }),
          startBlock: 9316789,
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
