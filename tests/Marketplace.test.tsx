import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { it, expect } from "vitest";
import Marketplace from "../src/pages/Marketplace";

it("renders Marketplace heading", () => {
  render(
    <MemoryRouter>
      <Marketplace />
    </MemoryRouter>,
  );
  expect(screen.getByText("P2P Marketplace")).toBeInTheDocument();
});
