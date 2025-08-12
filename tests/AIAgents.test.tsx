import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, it, expect } from "vitest";
import AIAgents from "../src/pages/AIAgents";

vi.mock("../src/hooks/useToast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

it("renders AI Agents heading", () => {
  render(
    <MemoryRouter>
      <AIAgents />
    </MemoryRouter>,
  );
  expect(screen.getByText("AI Agents Marketplace")).toBeInTheDocument();
});
