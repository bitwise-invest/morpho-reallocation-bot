import { base } from "viem/chains";

export const DEFAULT_MIN_UTILIZATION_DELTA_BIPS = 0;
export const DEFAULT_MIN_APR_DELTA_BIPS = 0;

export const vaultsMinUtilizationDeltaBips: Record<number, Record<string, number>> = {
  [base.id]: {
    "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A": 100,
  },
};

export const vaultsMinAprDeltaBips: Record<number, Record<string, number>> = {};
