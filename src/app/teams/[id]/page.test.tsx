import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TeamDetailsPageContent } from "./TeamDetailsPageContent";

// Mock fetch
global.fetch = vi.fn();

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({ data: { user: { email: "owner@example.com" } } })),
}));

describe("TeamDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderTeamDetailsPage() {
    return render(<TeamDetailsPageContent id="team-123" />);
  }

  it("renders member list", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => [{ id: "m1", email: "owner@example.com", role: "owner" }],
    } as unknown as Response);

    renderTeamDetailsPage();
    expect(await screen.findByText("owner@example.com")).toBeInTheDocument();
    expect(screen.getByText("OWNER")).toBeInTheDocument();
  });

  it("invites a new member", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: "m1", email: "owner@example.com", role: "owner" }] } as unknown as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as unknown as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => [
        { id: "m1", email: "owner@example.com", role: "owner" },
        { id: "m2", email: "new@test.com", role: "member" }
      ] } as unknown as Response);

    renderTeamDetailsPage();
    
    // Wait for loading to finish
    const input = await screen.findByPlaceholderText(/colleague@example.com/i);
    const button = screen.getByText(/^Add$/i);

    fireEvent.change(input, { target: { value: "new@test.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("new@test.com")).toBeInTheDocument();
    });
  });
});
