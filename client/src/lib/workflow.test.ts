import { describe, expect, it } from "vitest";
import { advanceWorkflowStep, selectWorkflow, shouldAutoAdvanceWorkflow } from "./workflow";

describe("advanceWorkflowStep", () => {
  it("moves to the next step in a workflow", () => {
    expect(advanceWorkflowStep(1, 4)).toBe(2);
  });

  it("returns to the first step after the last step", () => {
    expect(advanceWorkflowStep(3, 4)).toBe(0);
  });

  it("safely handles an empty workflow", () => {
    expect(advanceWorkflowStep(0, 0)).toBe(0);
  });

  it("switches an industry workflow and resets the highlighted step", () => {
    expect(selectWorkflow("retail")).toEqual({ industry: "retail", activeStep: 0 });
  });

  it("only auto-advances when reduced motion is not requested", () => {
    expect(shouldAutoAdvanceWorkflow(false)).toBe(true);
    expect(shouldAutoAdvanceWorkflow(true)).toBe(false);
  });
});
