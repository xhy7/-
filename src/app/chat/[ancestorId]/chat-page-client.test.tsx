import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, vi } from "vitest";

import { ChatPageClient } from "@/app/chat/[ancestorId]/chat-page-client";
import { homePageData } from "@/mocks/home-data";

describe("ChatPageClient", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders conversation history in a timeline and applies quick prompts", async () => {
    const user = userEvent.setup();

    window.localStorage.setItem(
      "laozuzong:conversation-memory",
      JSON.stringify([
        {
          id: "turn-1",
          ancestorId: "su-shi",
          timestamp: 1710000000000,
          userMessage: "我今天真的有点累。",
          mode: "prototype",
          sceneType: "daily-chat",
          reply: "先坐下来，把气喘匀。",
          subtext: "他想先接住情绪。",
          styleTags: ["prototype", "daily-chat"],
        },
      ]),
    );

    render(<ChatPageClient data={homePageData} ancestorId="su-shi" />);

    expect(screen.getAllByText("先坐下来，把气喘匀。").length).toBeGreaterThan(0);
    expect(screen.getByText("对话记忆")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "帮我评文案" }));

    expect(
      screen.getByDisplayValue("你帮我看看这段文案是不是还不够锋利？"),
    ).toBeInTheDocument();
  });
});
