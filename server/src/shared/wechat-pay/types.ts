export type WechatTradeState =
  | 'SUCCESS'
  | 'REFUND'
  | 'NOTPAY'
  | 'CLOSED'
  | 'REVOKED'
  | 'USERPAYING'
  | 'PAYERROR'
  | string;
export type WechatRefundStatus = 'SUCCESS' | 'CLOSED' | 'PROCESSING' | 'ABNORMAL' | string;

export interface WechatPayConfig {
  appId: string;
  appSecret?: string;
  miniAppId?: string;
  miniAppSecret?: string;
  mchId: string;
  merchantSerialNo: string;
  apiV3Key: string;
  privateKey: string;
  merchantCert?: string;
  wechatPayPublicKey?: string;
  wechatPayPublicKeyId?: string;
  gateway: string;
  notifyUrl: string;
  oauthCallbackUrl?: string;
  oauthAllowedOrigin?: string;
  timeoutMs: number;
}

export interface WechatCreatePayInput {
  outTradeNo: string;
  totalAmount: number | string;
  description: string;
  attach?: string;
  notifyUrl?: string;
  payerOpenid?: string;
  payerClientIp?: string;
}

export interface WechatJsapiPayResult {
  outTradeNo: string;
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: 'RSA';
  paySign: string;
}

export interface WechatNativePayResult {
  outTradeNo: string;
  codeUrl: string;
}

export interface WechatQueryTradeInput {
  outTradeNo?: string;
  transactionId?: string;
}

export interface NormalizedWechatTrade {
  outTradeNo: string;
  transactionId?: string;
  tradeState?: WechatTradeState;
  successTime?: string;
  totalAmount?: number;
  payerOpenid?: string;
  raw: Record<string, unknown>;
}

export interface WechatRefundTradeInput {
  outTradeNo?: string;
  transactionId?: string;
  outRefundNo: string;
  refundAmount: number | string;
  totalAmount: number | string;
  refundReason?: string;
  notifyUrl?: string;
}

export interface NormalizedWechatRefund {
  outTradeNo?: string;
  transactionId?: string;
  outRefundNo: string;
  refundId?: string;
  refundAmount: string;
  refundStatus?: WechatRefundStatus;
  successTime?: string;
  raw: Record<string, unknown>;
}

export interface WechatPayNotifyPayload {
  outTradeNo: string;
  transactionId?: string;
  tradeState?: WechatTradeState;
  totalAmount?: number;
  payerOpenid?: string;
  successTime?: string;
  raw: Record<string, unknown>;
}

export interface WechatRefundNotifyPayload extends NormalizedWechatRefund {}

export interface WechatNotifyResult {
  ok: boolean;
  reason?: 'INVALID_SIGN' | 'DECRYPT_FAILED' | 'IGNORED_STATUS' | 'HANDLER_FAILED';
  payload?: WechatPayNotifyPayload | WechatRefundNotifyPayload;
}

export interface WechatOauthOpenidResult {
  openid: string;
  scope?: string;
}

export interface WechatPaymentService {
  createJsapiPay(input: WechatCreatePayInput): Promise<WechatJsapiPayResult>;
  createMiniPay(input: WechatCreatePayInput): Promise<WechatJsapiPayResult>;
  createNativePay(input: WechatCreatePayInput): Promise<WechatNativePayResult>;
  queryTrade(input: WechatQueryTradeInput): Promise<NormalizedWechatTrade>;
  refundTrade(input: WechatRefundTradeInput): Promise<NormalizedWechatRefund>;
  queryRefund(outRefundNo: string): Promise<NormalizedWechatRefund>;
  handlePayNotify(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
    hooks: { onPaid: (payload: WechatPayNotifyPayload) => Promise<void> }
  ): Promise<WechatNotifyResult>;
  handleRefundNotify(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
    hooks: { onRefunded: (payload: WechatRefundNotifyPayload) => Promise<void> }
  ): Promise<WechatNotifyResult>;
  getOauthUrl(returnTo: string): string;
  exchangeCodeForOpenid(code: string): Promise<WechatOauthOpenidResult>;
}
