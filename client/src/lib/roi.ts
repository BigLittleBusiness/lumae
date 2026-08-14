export type RoiInputs = {
  monthlyTouchpoints: number;
  annualCustomerValue: number;
  responseRatePercent: number;
  actionableRatePercent: number;
  recoveryRatePercent: number;
  annualPlatformCost: number;
};

function nonNegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function percentage(value: number) {
  return Math.min(100, nonNegative(value));
}

/**
 * An editable scenario model, not a forecast. Each input is supplied by the visitor.
 */
export function calculateRoi(inputs: RoiInputs) {
  const monthlyTouchpoints = nonNegative(inputs.monthlyTouchpoints);
  const annualCustomerValue = nonNegative(inputs.annualCustomerValue);
  const responseRate = percentage(inputs.responseRatePercent) / 100;
  const actionableRate = percentage(inputs.actionableRatePercent) / 100;
  const recoveryRate = percentage(inputs.recoveryRatePercent) / 100;
  const annualPlatformCost = nonNegative(inputs.annualPlatformCost);

  const annualResponses = monthlyTouchpoints * 12 * responseRate;
  const actionableResponses = annualResponses * actionableRate;
  const recoveredOutcomes = actionableResponses * recoveryRate;
  const annualRetainedValue = recoveredOutcomes * annualCustomerValue;
  const netIllustrativeValue = annualRetainedValue - annualPlatformCost;
  const valueMultiple = annualPlatformCost > 0 ? annualRetainedValue / annualPlatformCost : 0;

  return {
    annualResponses,
    actionableResponses,
    recoveredOutcomes,
    annualRetainedValue,
    annualPlatformCost,
    netIllustrativeValue,
    valueMultiple,
  };
}
