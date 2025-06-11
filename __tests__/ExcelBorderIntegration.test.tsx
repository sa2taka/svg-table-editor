import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../src/App.js";

describe("Borders Integration", () => {
  it("should render app with unified borders picker", async () => {
    render(<App />);

    expect(screen.getByText("SVG Table Editor")).toBeInTheDocument();
    // Use getAllByText and check that we have at least one Borders element
    const bordersElements = screen.getAllByText("Borders");
    expect(bordersElements.length).toBeGreaterThan(0);
  });

  it("should show unified border options when clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Find the borders picker button by looking for the button containing "Borders" text
    const bordersButtons = screen.getAllByRole('button');
    const bordersButton = bordersButtons.find(button => 
      button.textContent?.includes('Borders')
    );
    expect(bordersButton).toBeDefined();
    
    if (bordersButton) {
      await user.click(bordersButton);
    }

    // Check if dropdown opened by looking for specific border options
    expect(screen.getByText("Individual Cell")).toBeInTheDocument();
    expect(screen.getByText("Selection Range")).toBeInTheDocument();
    expect(screen.getByText("Quick Presets:")).toBeInTheDocument();
    expect(screen.getByText("🚫 No Borders")).toBeInTheDocument();
  });

  it("should render table with cells", () => {
    render(<App />);

    // Check that table cells are rendered
    expect(screen.getByText("Cell (1,1)")).toBeInTheDocument();
  });

  it("should show selection when cells are clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Click on a cell to select it
    await user.click(screen.getByText("Cell (1,1)"));

    // Should show selection info
    expect(screen.getByText(/Selection:/)).toBeInTheDocument();
    expect(screen.getByText(/Single cell/)).toBeInTheDocument();
  });
});
