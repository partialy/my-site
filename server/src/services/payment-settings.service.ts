import { X509Certificate, createPrivateKey, createPublicKey } from 'node:crypto';
import { z } from 'zod';
import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';
import { ConfigManager, SysConfigKey } from '../config/config-manager';
import type { AlipayPayConfig } from '../shared/alipay-pay';
import type { WechatPayConfig } from '../shared/wechat-pay';

const urlField = z.string().trim().max(500).refine((value) => {
  if (!value) return true;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); }
  catch { return false; }
}, '请输入完整的 HTTP(S) 地址');
const text = (max = 200) => z.string().trim().max(max);
const pem = text(64 * 1024);

export const alipaySettingsSchema = z.strictObject({
  appId: text(), privateKey: pem, alipayPublicKey: pem, appPublicKey: pem, aesKey: text(),
  keyType: z.enum(['PKCS1', 'PKCS8']), gateway: urlField, notifyUrl: urlField,
  returnUrl: urlField, enableEncrypt: z.boolean(), timeoutMs: z.number().int().min(1000).max(120000),
});

export const wechatPaySettingsSchema = z.strictObject({
  appId: text(), appSecret: text(), miniAppId: text(), miniAppSecret: text(),
  mchId: text(), merchantSerialNo: text(), apiV3Key: text(),
  privateKey: pem, merchantCert: pem, wechatPayPublicKey: pem,
  wechatPayPublicKeyId: text(), gateway: urlField, notifyUrl: urlField,
  oauthCallbackUrl: urlField, oauthAllowedOrigin: urlField,
  timeoutMs: z.number().int().min(1000).max(120000),
});

type AlipaySettings = z.infer<typeof alipaySettingsSchema>;
type WechatPaySettings = z.infer<typeof wechatPaySettingsSchema>;

const alipayDefaults: AlipaySettings = {
  appId: '', privateKey: '', alipayPublicKey: '', appPublicKey: '', aesKey: '',
  keyType: 'PKCS8', gateway: 'https://openapi.alipay.com/gateway.do', notifyUrl: '',
  returnUrl: '', enableEncrypt: false, timeoutMs: 10000,
};
const wechatDefaults: WechatPaySettings = {
  appId: '', appSecret: '', miniAppId: '', miniAppSecret: '', mchId: '',
  merchantSerialNo: '', apiV3Key: '', privateKey: '', merchantCert: '',
  wechatPayPublicKey: '', wechatPayPublicKeyId: '', gateway: 'https://api.mch.weixin.qq.com',
  notifyUrl: '', oauthCallbackUrl: '', oauthAllowedOrigin: '', timeoutMs: 10000,
};

const alipaySecretFields = ['privateKey', 'alipayPublicKey', 'appPublicKey', 'aesKey'] as const;
const wechatSecretFields = ['appSecret', 'miniAppSecret', 'apiV3Key', 'privateKey', 'merchantCert', 'wechatPayPublicKey'] as const;

function badField(field: string, message: string): never {
  throw new ApiError(400, ApiCode.ValidationError, message, { fieldErrors: { [field]: [message] } });
}

function checkKey(value: string, field: string, privateKey: boolean): void {
  if (!value) return;
  try { privateKey ? createPrivateKey(value) : createPublicKey(value); }
  catch { badField(field, '密钥文件内容不是有效的 PEM 格式'); }
}

export class PaymentSettingsService {
  constructor(private readonly config: ConfigManager) {}

  private alipay(): AlipaySettings {
    return { ...alipayDefaults, ...this.config.getSysConfig().get(SysConfigKey.AlipaySettings) as Partial<AlipaySettings> | undefined };
  }

  private wechat(): WechatPaySettings {
    return { ...wechatDefaults, ...this.config.getSysConfig().get(SysConfigKey.WechatPaySettings) as Partial<WechatPaySettings> | undefined };
  }

  getAlipay() {
    const settings = this.alipay();
    const visible = { ...settings };
    for (const key of alipaySecretFields) visible[key] = '';
    return { ...visible, privateKeyConfigured: Boolean(settings.privateKey),
      alipayPublicKeyConfigured: Boolean(settings.alipayPublicKey),
      appPublicKeyConfigured: Boolean(settings.appPublicKey), aesKeyConfigured: Boolean(settings.aesKey) };
  }

  getWechat() {
    const settings = this.wechat();
    const visible = { ...settings };
    for (const key of wechatSecretFields) visible[key] = '';
    return { ...visible, appSecretConfigured: Boolean(settings.appSecret),
      miniAppSecretConfigured: Boolean(settings.miniAppSecret), apiV3KeyConfigured: Boolean(settings.apiV3Key),
      privateKeyConfigured: Boolean(settings.privateKey), merchantCertConfigured: Boolean(settings.merchantCert),
      wechatPayPublicKeyConfigured: Boolean(settings.wechatPayPublicKey) };
  }

  updateAlipay(input: AlipaySettings) {
    const previous = this.alipay();
    const next = { ...input };
    for (const key of alipaySecretFields) next[key] ||= previous[key];
    checkKey(next.privateKey, 'privateKey', true);
    checkKey(next.alipayPublicKey, 'alipayPublicKey', false);
    checkKey(next.appPublicKey, 'appPublicKey', false);
    this.config.setSysConfig(SysConfigKey.AlipaySettings, '支付宝支付设置', next);
    return this.getAlipay();
  }

  updateWechat(input: WechatPaySettings) {
    const previous = this.wechat();
    const next = { ...input };
    for (const key of wechatSecretFields) next[key] ||= previous[key];
    checkKey(next.privateKey, 'privateKey', true);
    checkKey(next.wechatPayPublicKey, 'wechatPayPublicKey', false);
    if (next.merchantCert) {
      let cert: X509Certificate;
      try { cert = new X509Certificate(next.merchantCert); }
      catch { badField('merchantCert', '商户证书文件内容无效'); }
      if (next.merchantSerialNo && next.merchantSerialNo.toUpperCase() !== cert.serialNumber.toUpperCase()) {
        badField('merchantSerialNo', '商户证书序列号与上传的证书不一致');
      }
      if (next.privateKey && !cert.checkPrivateKey(createPrivateKey(next.privateKey))) {
        badField('privateKey', '商户私钥与上传的商户证书不匹配');
      }
      next.merchantSerialNo ||= cert.serialNumber;
    }
    if (next.apiV3Key && Buffer.byteLength(next.apiV3Key) !== 32) badField('apiV3Key', 'APIv3 密钥须为 32 字节');
    this.config.setSysConfig(SysConfigKey.WechatPaySettings, '微信支付设置', next);
    return this.getWechat();
  }

  getAlipayConfig(): AlipayPayConfig {
    const value = this.alipay();
    if (!value.appId || !value.privateKey || !value.alipayPublicKey || !value.notifyUrl) {
      throw new ApiError(409, ApiCode.Failure, '支付宝支付配置不完整');
    }
    if (value.enableEncrypt && !value.aesKey) throw new ApiError(409, ApiCode.Failure, '支付宝接口加密密钥未配置');
    return { ...value, appPublicKey: value.appPublicKey || undefined, aesKey: value.aesKey || undefined,
      returnUrl: value.returnUrl || undefined };
  }

  getWechatConfig(): WechatPayConfig {
    const value = this.wechat();
    if (!value.appId || !value.mchId || !value.apiV3Key || !value.privateKey ||
      !value.merchantCert || !value.merchantSerialNo || !value.notifyUrl) {
      throw new ApiError(409, ApiCode.Failure, '微信支付配置不完整');
    }
    if (value.wechatPayPublicKey && !value.wechatPayPublicKeyId) {
      throw new ApiError(409, ApiCode.Failure, '微信支付平台公钥 ID 未配置');
    }
    return { ...value, appSecret: value.appSecret || undefined, miniAppId: value.miniAppId || undefined,
      miniAppSecret: value.miniAppSecret || undefined, merchantCert: value.merchantCert || undefined,
      wechatPayPublicKey: value.wechatPayPublicKey || undefined,
      wechatPayPublicKeyId: value.wechatPayPublicKeyId || undefined,
      oauthCallbackUrl: value.oauthCallbackUrl || undefined,
      oauthAllowedOrigin: value.oauthAllowedOrigin || undefined };
  }
}
