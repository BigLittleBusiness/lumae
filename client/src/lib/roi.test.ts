import { describe, expect, it } from "vitest";
import { calculateRoi } from "./roi";

describe("calculateRoi", () => {
  it("calculates an editable annual retention scenario", () => {
    const result = calculateRoi({
      monthlyTouchpoints: 1000,
      annualCustomerValue: 1200,
      responseRatePercent: 20,
      actionableRatePercent: 15,
      recoveryRatePercent: 25,
      annualPlatformCost: 2628,
    });

    expect(result.annualResponses).toBe(2400);
    expect(result.actionableResponses).toBe(360);
    expect(result.recoveredOutcomes).toBe(90);
    expect(result.annualRetainedValue).toBe(108000);
    expect(result.netIllustrativeValue).toBe(105372);
    expect(result.valueMultiple).toBeCloseTo(41.0959, 3);
  });

  it("safely clamps invalid and percentage inputs", () => {
    const result = calculateRoi({
      monthlyTouchpoints: -2,
      annualCustomerValue: Number.NaN,
      responseRatePercent: 140,
      actionableRatePercent: -10,
      recoveryRatePercent: 30,
      annualPlatformCost: -5,
    });

    expect(result.annualRetainedValue).toBe(0);
    expect(result.annualPlatformCost).toBe(0);
    expect(result.valueMultiple).toBe(0);
  });
});
