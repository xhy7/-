import type {
  AiReplyRequest,
  AiReplyResponse,
  AncestorDetailPreview,
  HomePageData,
  ModeIntentPreview,
} from "@/shared/contracts/home";

export interface HomePageGateway {
  getHomePageData(): Promise<HomePageData>;
  getAncestorDetailPreview(ancestorId: string): Promise<AncestorDetailPreview>;
  prepareModeIntent(modeId: string): Promise<ModeIntentPreview>;
}

export interface AiReplyGateway {
  generateReply(request: AiReplyRequest): Promise<AiReplyResponse>;
}
