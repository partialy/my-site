import { request } from './client';

export interface AlipaySettingsInput {
  appId: string;
  privateKey: string;
  alipayPublicKey: string;
  appPublicKey: string;
  aesKey: string;
  keyType: 'PKCS1' | 'PKCS8';
  gateway: string;
  notifyUrl: string;
  returnUrl: string;
  enableEncrypt: boolean;
  timeoutMs: number;
}

export interface WechatPaySettingsInput {
  appId: string;
  appSecret: string;
  miniAppId: string;
  miniAppSecret: string;
  mchId: string;
  merchantSerialNo: string;
  apiV3Key: string;
  privateKey: string;
  merchantCert: string;
  wechatPayPublicKey: string;
  wechatPayPublicKeyId: string;
  gateway: string;
  notifyUrl: string;
  oauthCallbackUrl: string;
  oauthAllowedOrigin: string;
  timeoutMs: number;
}

type AlipaySecretState = {
  privateKeyConfigured: boolean;
  alipayPublicKeyConfigured: boolean;
  appPublicKeyConfigured: boolean;
  aesKeyConfigured: boolean;
};
type WechatSecretState = {
  appSecretConfigured: boolean;
  miniAppSecretConfigured: boolean;
  apiV3KeyConfigured: boolean;
  privateKeyConfigured: boolean;
  merchantCertConfigured: boolean;
  wechatPayPublicKeyConfigured: boolean;
};

export type AlipaySettings = AlipaySettingsInput & AlipaySecretState;
export type WechatPaySettings = WechatPaySettingsInput & WechatSecretState;

function parseSettings<T>(value: unknown, textKeys: string[], boolKeys: string[]): T {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('支付设置格式异常');
  const item = value as Record<string, unknown>;
  if (textKeys.some((key) => typeof item[key] !== 'string') ||
    boolKeys.some((key) => typeof item[key] !== 'boolean') ||
    typeof item.timeoutMs !== 'number') throw new Error('支付设置格式异常');
  return item as T;
}

const alipayTexts = ['appId', 'privateKey', 'alipayPublicKey', 'appPublicKey', 'aesKey', 'keyType',
  'gateway', 'notifyUrl', 'returnUrl'];
const wechatTexts = ['appId', 'appSecret', 'miniAppId', 'miniAppSecret', 'mchId', 'merchantSerialNo',
  'apiV3Key', 'privateKey', 'merchantCert', 'wechatPayPublicKey', 'wechatPayPublicKeyId',
  'gateway', 'notifyUrl', 'oauthCallbackUrl', 'oauthAllowedOrigin'];

const parseAlipay = (value: unknown) => parseSettings<AlipaySettings>(value, alipayTexts,
  ['enableEncrypt', 'privateKeyConfigured', 'alipayPublicKeyConfigured', 'appPublicKeyConfigured', 'aesKeyConfigured']);
const parseWechat = (value: unknown) => parseSettings<WechatPaySettings>(value, wechatTexts,
  ['appSecretConfigured', 'miniAppSecretConfigured', 'apiV3KeyConfigured', 'privateKeyConfigured',
    'merchantCertConfigured', 'wechatPayPublicKeyConfigured']);

export const getAlipaySettings = () => request('/payment-settings/alipay', parseAlipay);
export const saveAlipaySettings = (input: AlipaySettingsInput) =>
  request('/payment-settings/alipay', parseAlipay, { method: 'PUT', body: input });
export const getWechatPaySettings = () => request('/payment-settings/wechat', parseWechat);
export const saveWechatPaySettings = (input: WechatPaySettingsInput) =>
  request('/payment-settings/wechat', parseWechat, { method: 'PUT', body: input });
