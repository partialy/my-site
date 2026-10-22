export type AlipayKeyType = 'PKCS1' | 'PKCS8';
export type AlipayTradeStatus = 'WAIT_BUYER_PAY' | 'TRADE_CLOSED' | 'TRADE_SUCCESS' | 'TRADE_FINISHED' | string;

export interface AlipayPayConfig {
  appId: string;
  privateKey: string;
  alipayPublicKey: string;
  appPublicKey?: string;
  aesKey?: string;
  keyType: AlipayKeyType;
  gateway: string;
  notifyUrl: string;
  returnUrl?: string;
  enableEncrypt: boolean;
  timeoutMs: number;
}

export interface CreatePayInput {
  outTradeNo: string;
  totalAmount: number | string;
  subject: string;
  body?: string;
  returnUrl?: string;
  notifyUrl?: string;
}

export interface CreateMiniPayInput extends CreatePayInput {
  buyerId?: string;
  buyerOpenId?: string;
}

export interface CreatePayResult {
  redirectUrl: string;
  outTradeNo: string;
}

export interface CreateMiniPayResult {
  outTradeNo: string;
  tradeNo: string;
}

export interface QueryTradeInput {
  outTradeNo?: string;
  tradeNo?: string;
}

export interface RefundTradeInput {
  outTradeNo?: string;
  tradeNo?: string;
  refundAmount: number | string;
  refundReason?: string;
  outRequestNo: string;
}

export interface NormalizedAlipayTrade {
  outTradeNo: string;
  tradeNo?: string;
  tradeStatus?: AlipayTradeStatus;
  totalAmount?: string;
  buyerLogonId?: string;
  raw: Record<string, unknown>;
}

export interface NormalizedAlipayRefund {
  outTradeNo?: string;
  tradeNo?: string;
  outRequestNo: string;
  refundAmount: string;
  refundStatus?: string;
  raw: Record<string, unknown>;
}

export interface AlipayNotifyPayload {
  outTradeNo: string;
  tradeNo?: string;
  tradeStatus?: AlipayTradeStatus;
  totalAmount?: string;
  buyerId?: string;
  gmtPayment?: string;
  raw: Record<string, unknown>;
}

export interface AlipayNotifyResult {
  ok: boolean;
  reason?: 'INVALID_SIGN' | 'IGNORED_STATUS' | 'HANDLER_FAILED';
  payload?: AlipayNotifyPayload;
}

export interface AlipayClientAdapter {
  pageExecute(method: string, httpMethod: 'GET' | 'POST', params: Record<string, unknown>): string;
  curl(httpMethod: string, path: string, options: Record<string, unknown>): Promise<{
    data?: Record<string, unknown>;
    responseHttpStatus?: number;
    traceId?: string;
  }>;
  checkNotifySign(postData: Record<string, unknown>, raw?: boolean): boolean;
}

export interface AlipayPaymentService {
  createPcPay(input: CreatePayInput): Promise<CreatePayResult>;
  createWapPay(input: CreatePayInput): Promise<CreatePayResult>;
  createMiniPay(input: CreateMiniPayInput): Promise<CreateMiniPayResult>;
  queryTrade(input: QueryTradeInput): Promise<NormalizedAlipayTrade>;
  refundTrade(input: RefundTradeInput): Promise<NormalizedAlipayRefund>;
  handleNotify(
    postData: Record<string, unknown>,
    hooks: { onPaid: (payload: AlipayNotifyPayload) => Promise<void> }
  ): Promise<AlipayNotifyResult>;
}
