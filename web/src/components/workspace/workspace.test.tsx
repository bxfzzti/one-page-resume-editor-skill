import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WorkspaceShell } from "./workspace-shell";

const baseProject = {
  id: "project-1",
  title: "我的基础简历",
  versions: [],
  facts: [],
  runs: [],
};

describe("WorkspaceShell", () => {
  it("keeps the first task simple before a result exists", () => {
    render(<WorkspaceShell project={baseProject} />);
    expect(screen.getAllByText("继续当前任务").length).toBeGreaterThan(0);
    expect(screen.queryByText("历史版本")).not.toBeInTheDocument();
  });

  it("shows versions and a fact drawer after a result exists", () => {
    render(
      <WorkspaceShell
        project={{
          ...baseProject,
          versions: [
            {
              id: "version-1",
              title: "通用诊断结果",
              versionType: "base",
              contentJson: { summary: "结果" },
            },
          ],
          facts: [
            {
              id: "fact-1",
              status: "confirmed",
              sourceExcerpt: "负责用户运营",
              riskText: null,
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("历史版本")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "事实与风险" }).length).toBeGreaterThan(0);
  });
});
