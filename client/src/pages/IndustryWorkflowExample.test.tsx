/** @vitest-environment jsdom */
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IndustryWorkflowExample } from "./Home";

function setReducedMotion(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({ matches, addEventListener: () => {}, removeEventListener: () => {} }),
  });
}

describe("IndustryWorkflowExample", () => {
  beforeEach(() => {
    setReducedMotion(true);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("switches to the selected industry workflow and resets to its first step", async () => {
    const user = userEvent.setup();
    render(<IndustryWorkflowExample />);

    await user.click(screen.getByRole("tab", { name: "Healthcare" }));

    expect(screen.getByRole("tab", { name: "Healthcare" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("A concern after an appointment")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Capture the experience/i }).getAttribute("aria-pressed")).toBe("true");
  });

  it("progresses active steps when motion is allowed and stays still for reduced motion", () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    const firstRender = render(<IndustryWorkflowExample />);

    act(() => vi.advanceTimersByTime(2600));
    expect(screen.getByRole("button", { name: /See the relevant context/i }).getAttribute("aria-pressed")).toBe("true");

    firstRender.unmount();
    setReducedMotion(true);
    render(<IndustryWorkflowExample />);
    act(() => vi.advanceTimersByTime(5200));
    expect(screen.getByRole("button", { name: /Capture the moment/i }).getAttribute("aria-pressed")).toBe("true");
  });

  it("keeps every industry workflow selectable in a mobile-sized browser context", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    const user = userEvent.setup();
    render(<IndustryWorkflowExample />);

    const cases = [
      ["Financial services", "A concern during digital onboarding"],
      ["Healthcare", "A concern after an appointment"],
      ["Professional services", "A client signals concern after a milestone"],
      ["Retail", "A delivery experience needs attention"],
      ["SaaS & technology", "A support interaction points to friction"],
    ] as const;

    for (const [label, title] of cases) {
      await user.click(screen.getByRole("tab", { name: label }));
      expect(screen.getByRole("tab", { name: label }).getAttribute("aria-selected")).toBe("true");
      expect(screen.getByText(title)).toBeTruthy();
      expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
    }
  });
});
