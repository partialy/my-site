import { AlipaySdk } from 'alipay-sdk';
import type {
  AlipayClientAdapter,
  AlipayNotifyPayload,
  AlipayPaymentService,
  AlipayPayConfig,
  CreateMiniPayInput,
  CreateMiniPayResult,
  CreatePayInput,
  CreatePayResult,
  NormalizedAlipayRefund,
  NormalizedAlipayTrade,
  QueryTradeInput,
  RefundTradeInput,
} from './types';

const PAID_STATUSES = new Set(['TRADE_SUCCESS', 'TRADE_FINISHED']);

export function normalizeAmount(value: number | string): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('支付金额必须大于 0');
  }
  return n.toFixed(2);
}

function createRealClient(config: AlipayPayConfig): AlipayClientAdapter {
  const sdk = new AlipaySdk({
    appId: config.appId,
    privateKey: config.privateKey,
    alipayPublicKey: config.alipayPublicKey,
    gateway: config.gateway,
    keyType: config.keyType,
    timeout: config.timeoutMs,
    encryptKey: config.aesKey,
  });
  return sdk as unknown as AlipayClientAdapter;
}

function buildPayParams(config: AlipayPayConfig, input: CreatePayInput, productCode: string): Record<string, unknown> {
  return {
    notifyUrl: input.notifyUrl || config.notifyUrl,
    returnUrl: input.returnUrl || config.returnUrl,
    bizContent: {
      out_trade_no: input.outTradeNo,
      product_code: productCode,
      total_amount: normalizeAmount(input.totalAmount),
      subject: input.subject,
      body: input.body,
    },
  };
}

function normalizeTrade(data: Record<string, unknown>): NormalizedAlipayTrade {
  return {
    outTradeNo: String(data.outTradeNo || data.out_trade_no || ''),
    tradeNo: typeof data.tradeNo === 'string' ? data.tradeNo : typeof data.trade_no === 'string' ? data.trade_no : undefined,
    tradeStatus:
      typeof data.tradeStatus === 'string'
        ? data.tradeStatus
        : typeof data.trade_status === 'string'
          ? data.trade_status
          : undefined,
    totalAmount:
      typeof data.totalAmount === 'string'
        ? data.totalAmount
        : typeof data.total_amount === 'string'
          ? data.total_amount
          : undefined,
    buyerLogonId:
      typeof data.buyerLogonId === 'string'
        ? data.buyerLogonId
        : typeof data.buyer_logon_id === 'string'
          ? data.buyer_logon_id
          : undefined,
    raw: data,
  };
}

function normalizeRefund(data: Record<string, unknown>, input: RefundTradeInput): NormalizedAlipayRefund {
  return {
    outTradeNo:
      typeof data.outTradeNo === 'string'
        ? data.outTradeNo
        : typeof data.out_trade_no === 'string'
          ? data.out_trade_no
          : input.outTradeNo,
    tradeNo:
      typeof data.tradeNo === 'string' ? data.tradeNo : typeof data.trade_no === 'string' ? data.trade_no : input.tradeNo,
    outRequestNo: input.outRequestNo,
    refundAmount:
      typeof data.refundFee === 'string'
        ? data.refundFee
        : typeof data.refund_fee === 'string'
          ? data.refund_fee
          : normalizeAmount(input.refundAmount),
    refundStatus:
      typeof data.refundStatus === 'string'
        ? data.refundStatus
        : typeof data.refund_status === 'string'
          ? data.refund_status
          : undefined,
    raw: data,
  };
}

function normalizeNotify(postData: Record<string, unknown>): AlipayNotifyPayload {
  return {
    outTradeNo: String(postData.out_trade_no || postData.outTradeNo || ''),
    tradeNo:
      typeof postData.trade_no === 'string'
        ? postData.trade_no
        : typeof postData.tradeNo === 'string'
          ? postData.tradeNo
          : undefined,
    tradeStatus:
      typeof postData.trade_status === 'string'
        ? postData.trade_status
        : typeof postData.tradeStatus === 'string'
          ? postData.tradeStatus
          : undefined,
    totalAmount:
      typeof postData.total_amount === 'string'
        ? postData.total_amount
        : typeof postData.totalAmount === 'string'
          ? postData.totalAmount
          : undefined,
    buyerId:
      typeof postData.buyer_id === 'string'
        ? postData.buyer_id
        : typeof postData.buyerId === 'string'
          ? postData.buyerId
          : undefined,
    gmtPayment:
      typeof postData.gmt_payment === 'string'
        ? postData.gmt_payment
        : typeof postData.gmtPayment === 'string'
          ? postData.gmtPayment
          : undefined,
    raw: postData,
  };
}

export function createAlipayPaymentService(options: {
  config: AlipayPayConfig;
  client?: AlipayClientAdapter;
}): AlipayPaymentService {
  const config = options.config;
  const client = options.client || createRealClient(config);

  async function createPay(input: CreatePayInput, method: string, productCode: string): Promise<CreatePayResult> {
    const redirectUrl = client.pageExecute(method, 'GET', buildPayParams(config, input, productCode));
    return { redirectUrl, outTradeNo: input.outTradeNo };
  }

  return {
    createPcPay(input) {
      return createPay(input, 'alipay.trade.page.pay', 'FAST_INSTANT_TRADE_PAY');
    },
    createWapPay(input) {
      return createPay(input, 'alipay.trade.wap.pay', 'QUICK_WAP_WAY');
    },
    async createMiniPay(input: CreateMiniPayInput): Promise<CreateMiniPayResult> {
      if (!input.buyerId && !input.buyerOpenId) {
        throw new Error('支付宝小程序支付缺少买家标识 (buyerId 或 buyerOpenId)');
      }
      const result = await client.curl('POST', '/v3/alipay/trade/create', {
        body: {
          out_trade_no: input.outTradeNo,
          total_amount: normalizeAmount(input.totalAmount),
          subject: input.subject,
          buyer_id: input.buyerId,
          buyer_open_id: input.buyerOpenId,
          body: input.body,
        },
        needEncrypt: config.enableEncrypt,
        requestTimeout: config.timeoutMs,
      });
      const data = (result.data || {}) as Record<string, unknown>;
      const tradeNo = String(data.trade_no || data.tradeNo || '');
      if (!tradeNo) {
        throw new Error(`支付宝交易创建失败: ${String(data.sub_msg || data.msg || '未返回 trade_no')}`);
      }
      return {
        outTradeNo: input.outTradeNo,
        tradeNo,
      };
    },
    async queryTrade(input: QueryTradeInput) {
      if (!input.outTradeNo && !input.tradeNo) {
        throw new Error('outTradeNo 与 tradeNo 至少传一个');
      }
      const result = await client.curl('POST', '/v3/alipay/trade/query', {
        body: {
          out_trade_no: input.outTradeNo,
          trade_no: input.tradeNo,
        },
        needEncrypt: config.enableEncrypt,
        requestTimeout: config.timeoutMs,
      });
      return normalizeTrade(result.data || {});
    },
    async refundTrade(input: RefundTradeInput) {
      if (!input.outTradeNo && !input.tradeNo) {
        throw new Error('outTradeNo 与 tradeNo 至少传一个');
      }
      if (!input.outRequestNo) {
        throw new Error('outRequestNo 必填');
      }
      const result = await client.curl('POST', '/v3/alipay/trade/refund', {
        body: {
          out_trade_no: input.outTradeNo,
          trade_no: input.tradeNo,
          refund_amount: normalizeAmount(input.refundAmount),
          refund_reason: input.refundReason,
          out_request_no: input.outRequestNo,
        },
        needEncrypt: config.enableEncrypt,
        requestTimeout: config.timeoutMs,
      });
      return normalizeRefund(result.data || {}, input);
    },
    async handleNotify(postData, hooks) {
      if (!client.checkNotifySign(postData, true)) {
        return { ok: false, reason: 'INVALID_SIGN' };
      }
      const payload = normalizeNotify(postData);
      if (!payload.tradeStatus || !PAID_STATUSES.has(payload.tradeStatus)) {
        return { ok: true, reason: 'IGNORED_STATUS', payload };
      }
      try {
        await hooks.onPaid(payload);
        return { ok: true, payload };
      } catch {
        return { ok: false, reason: 'HANDLER_FAILED', payload };
      }
    },
  };
}

