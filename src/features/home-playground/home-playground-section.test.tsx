import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, vi } from "vitest";

import { homePageData } from "@/mocks/home-data";
import { HomePlaygroundSection } from "@/features/home-playground/home-playground-section";

describe("HomePlaygroundSection", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits mode requests for the four entry cards", async () => {
    const user = userEvent.setup();
    const onRequestMode = vi.fn();

    render(
      <HomePlaygroundSection
        gameplayModes={homePageData.gameplayModes}
        creationHighlights={homePageData.creationHighlights}
        onRequestMode={onRequestMode}
      />,
    );

    expect(screen.getByText("跨时空吵架")).toBeInTheDocument();
    expect(screen.getByText("《深夜加班赋》")).toBeInTheDocument();
    expect(screen.getByText("下方工坊已接入 AI")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "预览争端脚本" }));
    await user.click(screen.getByRole("button", { name: "预览提问意图" }));
    await user.click(screen.getByRole("button", { name: "打开创作台" }));
    await user.click(screen.getByRole("button", { name: "打开命题台" }));

    expect(onRequestMode).toHaveBeenNthCalledWith(1, "cross-time-quarrel");
    expect(onRequestMode).toHaveBeenNthCalledWith(2, "truth-or-dare");
    expect(onRequestMode).toHaveBeenNthCalledWith(3, "fusion-creation");
    expect(onRequestMode).toHaveBeenNthCalledWith(4, "modern-reframe");
  });

  it("still supports creation preview callbacks", async () => {
    const user = userEvent.setup();
    const onPreviewCreation = vi.fn();

    render(
      <HomePlaygroundSection
        gameplayModes={homePageData.gameplayModes}
        creationHighlights={homePageData.creationHighlights}
        onPreviewCreation={onPreviewCreation}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "查看传播脚本" })[0]);

    expect(onPreviewCreation).toHaveBeenCalledWith("fusion-poem");
  });

  it("requests AI and renders generated result inside the workshop", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        requestId: "mock-001",
        ancestorId: "su-shi",
        mode: "prototype",
        sceneType: "conflict-mediation",
        output: {
          reply: "先把话放稳，再决定谁该先认错。",
          subtext: "他先压住桌上的火气，再准备分人下刀。",
          nextAction: "补一句你最介意的那一幕。",
          styleTags: ["prototype", "冲突调停"],
        },
        debug: {
          provider: "mock",
          model: "mock-single-role-writer",
          personaId: "su-shi",
          moodSummary: "情绪稳定偏积极，适合正常发挥 persona。",
          dominantTraits: ["幽默感", "历史忠诚度"],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <HomePlaygroundSection
        gameplayModes={homePageData.gameplayModes}
        creationHighlights={homePageData.creationHighlights}
        selectedAncestorName="苏轼"
        selectedMoodValue={78}
        selectedTraitTags={["幽默感", "历史忠诚度"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "生成争端现场" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai-reply",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(screen.getByText("先把话放稳，再决定谁该先认错。")).toBeInTheDocument();
    expect(screen.getByText("补一句你最介意的那一幕。")).toBeInTheDocument();
  });

  it("sends free-form truth-or-dare questions with ancestor-specific hints", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        requestId: "mock-truth",
        ancestorId: "su-shi",
        mode: "prototype",
        sceneType: "daily-chat",
        output: {
          reply: "若问我黄州那夜怕不怕，我先说怕，再把怕意煮进东坡肉里。",
          subtext: "苏轼会把追问转成自嘲和一点坦白。",
          nextAction: "把问题再问得更不体面一点。",
          styleTags: ["真心话", "自由提问"],
        },
        debug: {
          provider: "mock",
          model: "mock-single-role-writer",
          personaId: "su-shi",
          moodSummary: "情绪稳定偏积极，适合正常发挥 persona。",
          dominantTraits: ["幽默感", "历史忠诚度"],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <HomePlaygroundSection
        gameplayModes={homePageData.gameplayModes}
        creationHighlights={homePageData.creationHighlights}
        selectedAncestorName="苏轼"
      />,
    );

    await user.click(screen.getByRole("button", { name: "预览提问意图" }));
    expect(screen.queryByLabelText("历史问题")).not.toBeInTheDocument();
    expect(screen.getByText("和当前祖宗相关的问题提示")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("自由提问"));
    await user.type(screen.getByLabelText("自由提问"), "你在黄州最不敢承认的委屈是什么？");
    await user.click(screen.getByRole("button", { name: "生成回答界面" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const request = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      userMessage: string;
      contextNote: string;
    };

    expect(request.userMessage).toContain("玩家自由提问：你在黄州最不敢承认的委屈是什么？");
    expect(request.contextNote).toContain("同一玩法下请贴合苏轼");
  });

  it("uses the selected reviewer persona for AI review in creative modes", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requestId: "mock-fusion",
          ancestorId: "su-shi",
          mode: "ooc",
          sceneType: "creative-feedback",
          output: {
            reply: "把夜色、外卖与人心拧成一句，倒也能传。",
            subtext: "先把热闹写出来了，后劲还在往上翻。",
            nextAction: "不妨再找一位祖宗来挑刺。",
            styleTags: ["fusion", "深夜短诗"],
          },
          debug: {
            provider: "mock",
            model: "mock-single-role-writer",
            personaId: "su-shi",
            moodSummary: "情绪稳定偏积极，适合正常发挥 persona。",
            dominantTraits: ["幽默感", "历史忠诚度"],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requestId: "mock-review",
          ancestorId: "li-bai",
          mode: "prototype",
          sceneType: "creative-feedback",
          output: {
            reply: "你这首倒像提灯登楼，声势先到了，险处还欠一脚踏空的狠劲。",
            subtext: "李白的互评会先抬气势，再挑不够飞的地方。",
            nextAction: "把最想被记住的一句再改得更险一些。",
            styleTags: ["李白", "毒舌互评"],
          },
          debug: {
            provider: "mock",
            model: "mock-single-role-writer",
            personaId: "li-bai",
            moodSummary: "情绪高昂，输出可以更主动、更外放。",
            dominantTraits: ["幽默感", "OOC 偏移"],
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <HomePlaygroundSection
        gameplayModes={homePageData.gameplayModes}
        creationHighlights={homePageData.creationHighlights}
        selectedAncestorName="苏轼"
        selectedMoodValue={78}
        selectedTraitTags={["幽默感", "历史忠诚度"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "跨时代创作" }));
    await user.click(screen.getByRole("button", { name: "生成融合创作" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    await user.selectOptions(screen.getByLabelText("点评者"), "li-bai");
    await user.click(screen.getByRole("button", { name: "生成 AI 互评" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    const reviewRequest = JSON.parse(fetchMock.mock.calls[1][1].body as string) as {
      ancestorId: string;
      sceneType: string;
      mode: string;
      userMessage: string;
      contextNote: string;
    };

    expect(reviewRequest.ancestorId).toBe("li-bai");
    expect(reviewRequest.sceneType).toBe("creative-feedback");
    expect(reviewRequest.mode).toBe("prototype");
    expect(reviewRequest.userMessage).toContain("不同点评者必须有明显不同的关注点");
    expect(reviewRequest.contextNote).toContain("点评者专属声音");
    expect(reviewRequest.contextNote).toContain("李白点评要有飞扬气");
    expect(
      screen.getByText("你这首倒像提灯登楼，声势先到了，险处还欠一脚踏空的狠劲。"),
    ).toBeInTheDocument();
    expect(screen.getByText("把最想被记住的一句再改得更险一些。")).toBeInTheDocument();
  });
});
