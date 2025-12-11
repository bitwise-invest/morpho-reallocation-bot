import {
  encodeFunctionData,
  type Account,
  type Address,
  type Chain,
  type Client,
  type Transport,
} from "viem";
import { estimateGas, writeContract } from "viem/actions";

import { metaMorphoAbi } from "../abis/MetaMorpho.js";

import { Strategy } from "./strategies/strategy.js";
import { fetchVaultData } from "./utils/fetchers.js";

export class ReallocationBot {
  private chainId: number;
  private client: Client<Transport, Chain, Account>;
  private vaultWhitelist: Address[];
  private strategy: Strategy;
  constructor(
    chainId: number,
    client: Client<Transport, Chain, Account>,
    vaultWhitelist: Address[],
    strategy: Strategy,
  ) {
    this.chainId = chainId;
    this.client = client;
    this.vaultWhitelist = vaultWhitelist;
    this.strategy = strategy;
  }

  async run() {
    const { client } = this;
    const { vaultWhitelist } = this;
    const vaultsData = await Promise.allSettled(
      vaultWhitelist.map((vault) => fetchVaultData(this.chainId, vault)),
    );

    // Filter out failed fetches (vaults not indexed yet)
    const successfulVaults = vaultsData
      .filter(
        (result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchVaultData>>> =>
          result.status === "fulfilled",
      )
      .map((result) => result.value);

    // Log warnings for vaults that couldn't be fetched
    vaultsData.forEach((result, index) => {
      if (result.status === "rejected") {
        const vaultAddress = vaultWhitelist[index];
        if (vaultAddress) {
          console.warn(
            `⚠️  Vault ${vaultAddress} not found in database. It may not be indexed yet or doesn't exist.`,
          );
        }
      }
    });

    if (successfulVaults.length === 0) {
      console.log("No vaults available for reallocation");
      return;
    }

    await Promise.all(
      successfulVaults.map(async (vaultData) => {
        const reallocation = await this.strategy.findReallocation(vaultData);

        if (!reallocation) return;

        try {
          /// TX SIMULATION

          const populatedTx = {
            to: vaultData.vaultAddress,
            data: encodeFunctionData({
              abi: metaMorphoAbi,
              functionName: "reallocate",
              args: [reallocation],
            }),
            value: 0n, // TODO: find a way to get encoder value
          };

          await estimateGas(client, populatedTx);

          // TX EXECUTION

          await writeContract(client, {
            address: vaultData.vaultAddress,
            abi: metaMorphoAbi,
            functionName: "reallocate",
            args: [reallocation],
          });

          console.log(`Reallocated on ${vaultData.vaultAddress}`);
        } catch (error) {
          console.log(`Failed to reallocate on ${vaultData.vaultAddress}`);
          console.error("reallocation error", error);
        }
      }),
    );
  }
}
