import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PlaygroundPageClient } from "@/app/playground/playground-page-client";
import { homePageData } from "@/mocks/home-data";

describe("PlaygroundPageClient", () => {
  it("renders a playable workshop and generates a result", async () => {
    const user = userEvent.setup();

    render(<PlaygroundPageClient data={homePageData} />);

    expect(screen.getByText("真正可玩的模式台")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "打开创作台" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "生成争端现场" }));

    expect(screen.getByText("结果预览")).toBeInTheDocument();
    expect(screen.getAllByText(/vs/).length).toBeGreaterThan(0);
  });
});
