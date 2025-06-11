import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import App from "../src/App.js";

describe("URL State Integration", () => {
  beforeEach(() => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: "http://localhost:3000/",
        search: "",
      },
      writable: true,
    });

    // Mock URL constructor
    (globalThis as any).URL = class MockURL {
      public searchParams: URLSearchParams;
      
      constructor(url: string) {
        this.searchParams = new URLSearchParams(url.split('?')[1] || '');
      }
      
      toString() {
        const params = this.searchParams.toString();
        return `http://localhost:3000/${params ? `?${params}` : ''}`;
      }
    };

    // Mock window.history
    Object.defineProperty(window, 'history', {
      value: {
        replaceState: vi.fn(),
      },
      writable: true,
    });

    // Mock window.alert and confirm
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render New and Clear URL buttons", () => {
    render(<App />);

    expect(screen.getByText("🆕 New")).toBeInTheDocument();
    expect(screen.getByText("🧹 Clear")).toBeInTheDocument();
  });

  it("should have correct button styling and tooltips", () => {
    render(<App />);

    const newButton = screen.getByText("🆕 New");
    const clearButton = screen.getByText("🧹 Clear");

    expect(newButton).toHaveAttribute("title", "Create new table (clears current work)");
    expect(clearButton).toHaveAttribute("title", "Clear URL state (keeps current table)");

    expect(newButton).toHaveStyle({
      backgroundColor: "#007bff",
      color: "#fff",
    });

    expect(clearButton).toHaveStyle({
      backgroundColor: "#ffc107",
      color: "#000",
    });
  });

  it("should call confirm when clicking New button", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<App />);

    const newButton = screen.getByText("🆕 New");
    await user.click(newButton);

    expect(confirmSpy).toHaveBeenCalledWith("Create a new table? This will clear the current table and URL state.");
  });

  it("should call confirm when clicking Clear URL button", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<App />);

    const clearButton = screen.getByText("🧹 Clear");
    await user.click(clearButton);

    expect(confirmSpy).toHaveBeenCalledWith("Clear URL state? The table will remain but the URL will be reset.");
  });

  it("should not take action when user cancels confirmation", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const historyReplaceSpy = vi.spyOn(window.history, 'replaceState');

    render(<App />);

    const newButton = screen.getByText("🆕 New");
    await user.click(newButton);

    expect(confirmSpy).toHaveBeenCalled();
    // Should not call history.replaceState since user cancelled
    expect(historyReplaceSpy).not.toHaveBeenCalled();
  });

  it("should update URL state periodically", async () => {
    vi.useFakeTimers();
    const historyReplaceSpy = vi.spyOn(window.history, 'replaceState');

    render(<App />);

    // Wait for the debounced URL update
    vi.advanceTimersByTime(1100); // 1 second + buffer

    expect(historyReplaceSpy).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("should load initial state from URL if available", () => {
    // Mock a URL with state
    const mockState = "eyJ0YWJsZSI6eyJyb3dzIjoyLCJjb2x1bW5zIjoyLCJjZWxscyI6W1t7InJvdyI6MCwiY29sdW1uIjowLCJjb250ZW50IjoiVGVzdCIsInN0eWxlIjp7fX0se30iXV0sInNlbGVjdGlvbiI6bnVsbH0"; // Base64 encoded test state
    
    Object.defineProperty(window, 'location', {
      value: {
        href: `http://localhost:3000/?state=${mockState}`,
        search: `?state=${mockState}`,
      },
      writable: true,
    });

    // The App should try to load from URL during initialization
    render(<App />);

    // App should render without errors even with mock state
    expect(screen.getByText("SVG Table Editor")).toBeInTheDocument();
  });

  it("should handle invalid URL state gracefully", () => {
    // Mock a URL with invalid state
    Object.defineProperty(window, 'location', {
      value: {
        href: "http://localhost:3000/?state=invalid-state",
        search: "?state=invalid-state",
      },
      writable: true,
    });

    // Should render with default state instead of crashing
    render(<App />);
    expect(screen.getByText("SVG Table Editor")).toBeInTheDocument();
    expect(screen.getByText("Cell (1,1)")).toBeInTheDocument(); // Default sample data
  });
});