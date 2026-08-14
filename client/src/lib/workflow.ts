export function advanceWorkflowStep(currentStep: number, stepCount: number): number {
  if (stepCount <= 0) return 0;
  const normalisedStep = Math.max(0, Math.min(currentStep, stepCount - 1));
  return (normalisedStep + 1) % stepCount;
}

export function selectWorkflow<Industry extends string>(industry: Industry) {
  return { industry, activeStep: 0 } as const;
}

export function shouldAutoAdvanceWorkflow(prefersReducedMotion: boolean): boolean {
  return !prefersReducedMotion;
}
