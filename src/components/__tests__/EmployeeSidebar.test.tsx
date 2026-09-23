import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import type { Resource } from "@/features/appointment-timeline/types";

const resources: Resource[] = [
  { id: "emp-1", name: "Ana", color: "#00f068" },
  { id: "emp-2", name: "Luis", color: "#7bcfff", avatar: "https://cdn.test/luis.jpg" },
];

describe("EmployeeSidebar", () => {
  it("renders the employee's avatar photo when present", () => {
    render(
      <EmployeeSidebar resources={resources} selectedId={null} onSelect={vi.fn()} />,
    );

    const avatar = screen.getByAltText("Luis");
    expect(avatar).toHaveAttribute("src", "https://cdn.test/luis.jpg");
  });

  it("falls back to the color dot when there is no avatar", () => {
    render(
      <EmployeeSidebar resources={resources} selectedId={null} onSelect={vi.fn()} />,
    );

    expect(screen.queryByAltText("Ana")).not.toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
  });
});
