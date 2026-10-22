import { URLSearchParams } from 'node:url';
import WxPay from 'wechatpay-node-v3';
import { fenToYuan, yuanToFen } from './amount';
import type {
  NormalizedWechatRefund,
  NormalizedWechatTrade,
  WechatJsapiPayResult,
  WechatNativePayResult,
  WechatOauthOpenidResult,
  WechatPayConfig,
  WechatPaymentService,
  WechatPayNotifyPayload,
  WechatRefundNotifyPayload,
} from './types';

const SUCCESS_TRADE_STATES = new Set(['SUCCESS']);
const SUCCESS_REFUND_STATES = new Set(['SUCCESS']);

type SdkOutput = {
  status?: number;
  data?: unknown;
  error?: unknown;
  errRaw?: unknown;
};

function assertSdkSuccess(result: SdkOutput, action: string): Record<string, unknown> {
  if (result.status && result.status >= 200 && result.status < 300) {
    return (result.data || {}) as Record<string, unknown>;
  }
  const data = (result.data || {}) as Record<string, unknown>;
  const message = String(data.message || data.code || result.error || result.errRaw || '请求失败');
  throw new Error(`微信支付${action}失败: ${message}`);
}

function pickHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
  const value = headers[name] || headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function decryptNotifyResource(pay: WxPay, config: WechatPayConfig, rawBody: string): Record<string, unknown> {
  const parsed = JSON.parse(rawBody) as {
    resource?: {
      ciphertext?: string;
      associated_data?: string;
      nonce?: string;
    };
  };
  const resource = parsed.resource;
  if (!resource?.ciphertext || !resource.associated_data || !resource.nonce) {
    throw new Error('微信支付通知缺少 resource');
  }
  return pay.decipher_gcm(resource.ciphertext, resource.associated_data, resource.nonce, config.apiV3Key);
}

function normalizeTrade(data: Record<string, unknown>): NormalizedWechatTrade {
  const amount = data.amount as { total?: unknown } | undefined;
  const payer = data.payer as { openid?: unknown } | undefined;
  return {
    outTradeNo: String(data.out_trade_no || data.outTradeNo || ''),
    transactionId:
      typeof data.transaction_id === 'string'
        ? data.transaction_id
        : typeof data.transactionId === 'string'
          ? data.transactionId
          : undefined,
    tradeState:
      typeof data.trade_state === 'string'
        ? data.trade_state
        : typeof data.tradeState === 'string'
          ? data.tradeState
          : undefined,
    successTime:
      typeof data.success_time === 'string'
        ? data.success_time
        : typeof data.successTime === 'string'
          ? data.successTime
          : undefined,
    totalAmount: typeof amount?.total === 'number' ? amount.total : undefined,
    payerOpenid: typeof payer?.openid === 'string' ? payer.openid : undefined,
    raw: data,
  };
}

function normalizeRefund(data: Record<string, unknown>, fallbackOutRefundNo: string): NormalizedWechatRefund {
  const amount = data.amount as { refund?: unknown } | undefined;
  return {
    outTradeNo: typeof data.out_trade_no === 'string' ? data.out_trade_no : undefined,
    transactionId: typeof data.transaction_id === 'string' ? data.transaction_id : undefined,
    outRefundNo: String(data.out_refund_no || data.outRefundNo || fallbackOutRefundNo),
    refundId: typeof data.refund_id === 'string' ? data.refund_id : undefined,
    refundAmount: fenToYuan(typeof amount?.refund === 'number' ? amount.refund : 0),
    refundStatus:
      typeof data.status === 'string'
        ? data.status
        : typeof data.refund_status === 'string'
          ? data.refund_status
          : undefined,
    successTime: typeof data.success_time === 'string' ? data.success_time : undefined,
    raw: data,
  };
}

function toPayNotifyPayload(data: Record<string, unknown>): WechatPayNotifyPayload {
  const trade = normalizeTrade(data);
  return {
    outTradeNo: trade.outTradeNo,
    transactionId: trade.transactionId,
    tradeState: trade.tradeState,
    totalAmount: trade.totalAmount,
    payerOpenid: trade.payerOpenid,
    successTime: trade.successTime,
    raw: data,
  };
}

function toRefundNotifyPayload(data: Record<string, unknown>): WechatRefundNotifyPayload {
  return normalizeRefund(data, String(data.out_refund_no || ''));
}

function normalizeOauthReturnTo(config: WechatPayConfig, returnTo: string): string {
  if (!config.oauthAllowedOrigin) return returnTo || '/checkout';
  try {
    const url = new URL(returnTo, config.oauthAllowedOrigin);
    const allowed = new URL(config.oauthAllowedOrigin);
    if (url.origin !== allowed.origin) return `${allowed.origin}/checkout`;
    return url.toString();
  } catch {
    return `${config.oauthAllowedOrigin}/checkout`;
  }
}

async function readJsonResponse(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  const data = text ? JSON.parse(text) as Record<string, unknown> : {};
  if (!response.ok) {
    throw new Error(String(data.errmsg || data.errcode || data.message || `HTTP ${response.status}`));
  }
  return data;
}

function preloadWechatPayPublicKey(config: WechatPayConfig): void {
  if (!config.wechatPayPublicKey || !config.wechatPayPublicKeyId) return;
  const sdk = WxPay as unknown as { certificates?: Record<string, string> };
  sdk.certificates = {
    ...(sdk.certificates || {}),
    [config.wechatPayPublicKeyId]: config.wechatPayPublicKey,
  };
}

export function createWechatPaymentService(options: {
  config: WechatPayConfig;
  client?: WxPay;
}): WechatPaymentService {
  const config = options.config;
  preloadWechatPayPublicKey(config);
  const createPayClient = (appid: string) => new WxPay({
    appid,
    mchid: config.mchId,
    serial_no: config.merchantSerialNo,
    publicKey: Buffer.from(config.merchantCert || config.privateKey),
    privateKey: Buffer.from(config.privateKey),
    key: config.apiV3Key,
    userAgent: 'nodebase-wechat-pay/1.0',
  });
  const pay = options?.client || createPayClient(config.appId);
  const miniPay = config.miniAppId ? createPayClient(config.miniAppId) : pay;

  return {
    async createJsapiPay(input) {
      if (!input.payerOpenid) throw new Error('JSAPI 支付缺少 openid');
      const result = await pay.transactions_jsapi({
        description: input.description,
        out_trade_no: input.outTradeNo,
        notify_url: input.notifyUrl || config.notifyUrl,
        amount: {
          total: yuanToFen(input.totalAmount),
          currency: 'CNY',
        },
        attach: input.attach,
        payer: {
          openid: input.payerOpenid,
        },
        scene_info: input.payerClientIp ? { payer_client_ip: input.payerClientIp } : undefined,
      });
      return {
        ...assertSdkSuccess(result, 'JSAPI 下单'),
        outTradeNo: input.outTradeNo,
      } as unknown as WechatJsapiPayResult;
    },
    async createMiniPay(input) {
      if (!config.miniAppId) throw new Error('微信小程序支付缺少 WECHAT_MINI_APP_ID');
      if (!input.payerOpenid) throw new Error('微信小程序支付缺少 openid');
      const result = await miniPay.transactions_jsapi({
        description: input.description,
        out_trade_no: input.outTradeNo,
        notify_url: input.notifyUrl || config.notifyUrl,
        amount: {
          total: yuanToFen(input.totalAmount),
          currency: 'CNY',
        },
        attach: input.attach,
        payer: {
          openid: input.payerOpenid,
        },
        scene_info: input.payerClientIp ? { payer_client_ip: input.payerClientIp } : undefined,
      });
      return {
        ...assertSdkSuccess(result, '小程序下单'),
        outTradeNo: input.outTradeNo,
      } as unknown as WechatJsapiPayResult;
    },
    async createNativePay(input) {
      const result = await pay.transactions_native({
        description: input.description,
        out_trade_no: input.outTradeNo,
        notify_url: input.notifyUrl || config.notifyUrl,
        amount: {
          total: yuanToFen(input.totalAmount),
          currency: 'CNY',
        },
        attach: input.attach,
        scene_info: input.payerClientIp ? { payer_client_ip: input.payerClientIp } : undefined,
      });
      const data = assertSdkSuccess(result, 'Native 下单');
      const codeUrl = String(data.code_url || '');
      if (!codeUrl) throw new Error('微信 Native 下单缺少 code_url');
      return { outTradeNo: input.outTradeNo, codeUrl } satisfies WechatNativePayResult;
    },
    async queryTrade(input) {
      if (!input.outTradeNo && !input.transactionId) throw new Error('outTradeNo 与 transactionId 至少传一个');
      const result = await pay.query(input.transactionId
        ? { transaction_id: input.transactionId }
        : { out_trade_no: input.outTradeNo! });
      return normalizeTrade(assertSdkSuccess(result, '查单'));
    },
    async refundTrade(input) {
      if (!input.outTradeNo && !input.transactionId) throw new Error('outTradeNo 与 transactionId 至少传一个');
      const transaction = input.transactionId
        ? { transaction_id: input.transactionId }
        : { out_trade_no: input.outTradeNo! };
      const result = await pay.refunds({
        ...transaction,
        out_refund_no: input.outRefundNo,
        reason: input.refundReason,
        notify_url: input.notifyUrl || config.notifyUrl.replace(/\/notify$/, '/refund-notify'),
        amount: {
          refund: yuanToFen(input.refundAmount),
          total: yuanToFen(input.totalAmount),
          currency: 'CNY',
        },
      });
      return normalizeRefund(assertSdkSuccess(result, '退款'), input.outRefundNo);
    },
    async queryRefund(outRefundNo) {
      if (!outRefundNo.trim()) throw new Error('outRefundNo 必填');
      return normalizeRefund(assertSdkSuccess(await pay.find_refunds(outRefundNo.trim()), '退款查单'), outRefundNo);
    },
    async handlePayNotify(rawBody, headers, hooks) {
      const valid = await pay.verifySign({
        timestamp: pickHeader(headers, 'wechatpay-timestamp'),
        nonce: pickHeader(headers, 'wechatpay-nonce'),
        serial: pickHeader(headers, 'wechatpay-serial'),
        signature: pickHeader(headers, 'wechatpay-signature'),
        body: rawBody,
        apiSecret: config.apiV3Key,
      });
      if (!valid) return { ok: false, reason: 'INVALID_SIGN' };
      let data: Record<string, unknown>;
      try {
        data = decryptNotifyResource(pay, config, rawBody);
      } catch {
        return { ok: false, reason: 'DECRYPT_FAILED' };
      }
      const payload = toPayNotifyPayload(data);
      if (!payload.tradeState || !SUCCESS_TRADE_STATES.has(payload.tradeState)) {
        return { ok: true, reason: 'IGNORED_STATUS', payload };
      }
      try {
        await hooks.onPaid(payload);
        return { ok: true, payload };
      } catch {
        return { ok: false, reason: 'HANDLER_FAILED', payload };
      }
    },
    async handleRefundNotify(rawBody, headers, hooks) {
      const valid = await pay.verifySign({
        timestamp: pickHeader(headers, 'wechatpay-timestamp'),
        nonce: pickHeader(headers, 'wechatpay-nonce'),
        serial: pickHeader(headers, 'wechatpay-serial'),
        signature: pickHeader(headers, 'wechatpay-signature'),
        body: rawBody,
        apiSecret: config.apiV3Key,
      });
      if (!valid) return { ok: false, reason: 'INVALID_SIGN' };
      let data: Record<string, unknown>;
      try {
        data = decryptNotifyResource(pay, config, rawBody);
      } catch {
        return { ok: false, reason: 'DECRYPT_FAILED' };
      }
      const payload = toRefundNotifyPayload(data);
      if (!payload.refundStatus || !SUCCESS_REFUND_STATES.has(payload.refundStatus)) {
        return { ok: true, reason: 'IGNORED_STATUS', payload };
      }
      try {
        await hooks.onRefunded(payload);
        return { ok: true, payload };
      } catch {
        return { ok: false, reason: 'HANDLER_FAILED', payload };
      }
    },
    getOauthUrl(returnTo) {
      if (!config.oauthCallbackUrl) throw new Error('微信网页授权回调地址未配置');
      const safeReturnTo = normalizeOauthReturnTo(config, returnTo);
      const params = new URLSearchParams({
        appid: config.appId,
        redirect_uri: config.oauthCallbackUrl,
        response_type: 'code',
        scope: 'snsapi_base',
        state: Buffer.from(safeReturnTo, 'utf8').toString('base64url'),
      });
      return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
    },
    async exchangeCodeForOpenid(code): Promise<WechatOauthOpenidResult> {
      if (!config.appSecret) throw new Error('微信网页授权缺少 AppSecret');
      const params = new URLSearchParams({
        appid: config.appId,
        secret: config.appSecret,
        code,
        grant_type: 'authorization_code',
      });
      const data = await readJsonResponse(
        await fetch(`https://api.weixin.qq.com/sns/oauth2/access_token?${params.toString()}`)
      );
      const openid = typeof data.openid === 'string' ? data.openid : '';
      if (!openid) throw new Error(`微信网页授权失败: ${String(data.errmsg || data.errcode || '缺少 openid')}`);
      return { openid, scope: typeof data.scope === 'string' ? data.scope : undefined };
    },
  };
}

