# 读取支付宝设置

读取支付宝支付配置信息；敏感密钥字段均返回空字符串，并通过 `*Configured` 布尔字段表示是否已配置。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/payment-settings/alipay` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "appId": "2021000000000000",
    "privateKey": "",
    "alipayPublicKey": "",
    "appPublicKey": "",
    "aesKey": "",
    "keyType": "PKCS8",
    "gateway": "https://openapi.alipay.com/gateway.do",
    "notifyUrl": "https://api.example.com/pay/alipay/notify",
    "returnUrl": "",
    "enableEncrypt": false,
    "timeoutMs": 10000,
    "privateKeyConfigured": true,
    "alipayPublicKeyConfigured": true,
    "appPublicKeyConfigured": false,
    "aesKeyConfigured": false
  },
  "success": true
}
```
