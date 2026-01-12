// tests/components/TierCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TierCard } from "@mre/ui";

describe("TierCard Component", () => {
  const mockProps = {
    name: "Starter",
    description: "Perfect for getting started",
    features: ["Feature 1", "Feature 2", "Feature 3"],
  };

  it("should render tier information", () => {
    render(<TierCard {...mockProps} />);

    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Perfect for getting started")).toBeInTheDocument();
    expect(screen.getByText("Feature 1")).toBeInTheDocument();
    expect(screen.getByText("Feature 2")).toBeInTheDocument();
    expect(screen.getByText("Feature 3")).toBeInTheDocument();
  });

  it("should show Current badge for current tier", () => {
    render(<TierCard {...mockProps} isCurrent={true} />);

    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("should show Select button when onSelect provided", () => {
    render(<TierCard {...mockProps} onSelect={() => {}} />);

    expect(screen.getByText("Select Tier")).toBeInTheDocument();
  });

  it("should call onSelect when button clicked", async () => {
    const onSelect = vi.fn();
    const userEvent = await import("@testing-library/user-event");

    render(<TierCard {...mockProps} onSelect={onSelect} />);

    const button = screen.getByText("Select Tier");
    await userEvent.default.click(button);

    expect(onSelect).toHaveBeenCalled();
  });

  it("should disable button for current tier", () => {
    render(<TierCard {...mockProps} isCurrent={true} onSelect={() => {}} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Current Tier");
  });

  it("should not show button when onSelect not provided", () => {
    render(<TierCard {...mockProps} />);

    const button = screen.queryByRole("button");
    expect(button).not.toBeInTheDocument();
  });
});
