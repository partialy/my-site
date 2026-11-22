# 读取微信支付设置

读取微信支付 v3 配置信息；密钥与证书内容返回空字符串，通过 `*Configured` 布尔字段表示配置状态。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/payment-settings/wechat` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "appId": "wx0000000000000000",
    "appSecret": "",
    "miniAppId": "",
    "miniAppSecret": "",
    "mchId": "1900000000",
    "merchantSerialNo": "SERIAL0001",
    "apiV3Key": "",
    "privateKey": "",
    "merchantCert": "",
    "wechatPayPublicKey": "",
    "wechatPayPublicKeyId": "",
    "gateway": "https://api.mch.weixin.qq.com",
    "notifyUrl": "https://api.example.com/pay/wechat/notify",
    "oauthCallbackUrl": "",
    "oauthAllowedOrigin": "",
    "timeoutMs": 10000,
    "appSecretConfigured": false,
    "miniAppSecretConfigured": false,
    "apiV3KeyConfigured": true,
    "privateKeyConfigured": true,
    "merchantCertConfigured": true,
    "wechatPayPublicKeyConfigured": false
  },
  "success": true
}
```
