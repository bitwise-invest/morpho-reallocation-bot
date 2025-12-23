import { DEFAULT_MIN_CAPITAL_DELTA_PERCENT } from "@morpho-blue-reallocation-bot/config";
import { maxUint256, zeroAddress } from "viem";

import { VaultData } from "../../utils/types";
import { Strategy } from "../strategy";

export class EqualizeCapital implements Strategy {
  findReallocation(vaultData: VaultData) {
    const marketsData = vaultData.marketsData.filter(
      (marketData) => marketData.params.collateralToken !== zeroAddress,
    );

    const totalCapital = marketsData.reduce((acc, marketData) => acc + marketData.vaultAssets, 0n);
    const numMarkets = BigInt(marketsData.length);

    console.log(`Total capital: ${totalCapital.toString()}`);
    console.log(`Number of markets: ${numMarkets.toString()}`);

    if (numMarkets === 0n || totalCapital === 0n) {
      return [];
    }

    const targetAllocation = totalCapital / numMarkets;
    const remainder = totalCapital % numMarkets;

    console.log(`Target allocation: ${targetAllocation.toString()}`);
    console.log(`Remainder: ${remainder.toString()}`);

    // Calculate target for each market and delta (change needed)
    const deltas = marketsData.map((marketData, i) => {
      const target = targetAllocation + (i < Number(remainder) ? 1n : 0n);
      const delta = target - marketData.vaultAssets;
      const deltaAsPctOfTarget = Math.abs(Number(delta) / Number(targetAllocation));
      return { marketData, target, delta, deltaAsPctOfTarget };
    });

    const aboveMinThreshold = deltas.some(
      (d) => d.deltaAsPctOfTarget >= DEFAULT_MIN_CAPITAL_DELTA_PERCENT,
    );

    if (!aboveMinThreshold) {
      const maxDeltaPct = Math.max(...deltas.map((d) => d.deltaAsPctOfTarget));
      console.log(
        `Delta: ${(maxDeltaPct * 100).toFixed(6)}% (Target allocation: ${targetAllocation.toString()}) is below minimum threshold: ${(DEFAULT_MIN_CAPITAL_DELTA_PERCENT * 100).toFixed(2)}%`,
      );
      return [];
    }

    console.log(
      `Deltas: ${deltas.map((delta) => `${delta.marketData.id}: ${delta.delta.toString()}`).join(", ")}`,
    );

    // Sum all deltas - should be 0 (capital is conserved), but rounding may cause imbalance
    const totalDelta = deltas.reduce((sum, { delta }) => sum + delta, 0n);

    console.log(`totalDelta: ${totalDelta.toString()}`);

    // Fix rounding imbalance by adjusting the last market's delta
    if (totalDelta !== 0n && deltas.length > 0) {
      const lastDelta = deltas[deltas.length - 1];
      if (lastDelta) {
        lastDelta.delta -= totalDelta;
      }
    }

    // Convert to allocations: only include markets with non-zero deltas
    // Contract expects `assets` = target = current + delta
    // IMPORTANT: Sort so withdrawals (negative delta) come BEFORE supplies (positive delta)
    // This is required because MORPHO.supply() does a transferFrom, which needs the vault
    // to have idle tokens first (obtained from withdrawals)
    const sortedDeltas = deltas
      .filter(({ delta }) => delta !== 0n)
      .sort((a, b) => (a.delta < b.delta ? -1 : a.delta > b.delta ? 1 : 0)); // negative deltas first

    // For the LAST supply (positive delta), use maxUint256 to tell the contract
    // to supply whatever was actually withdrawn. This handles interest accrual
    // between data fetch and tx execution, avoiding InconsistentReallocation errors.
    const allocations = sortedDeltas.map(({ marketData, delta }, index) => {
      const isLastSupply = delta > 0n && index === sortedDeltas.length - 1;
      return {
        marketParams: marketData.params,
        assets: isLastSupply ? maxUint256 : marketData.vaultAssets + delta,
      };
    });

    console.log(
      `Allocations: ${allocations.map((allocation) => `${allocation.marketParams.collateralToken}: ${allocation.assets.toString()}`).join(", ")}`,
    );

    return allocations;
  }
}
