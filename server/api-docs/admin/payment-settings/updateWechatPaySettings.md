# 保存微信支付设置

更新微信支付配置并校验私钥、证书与 `apiV3Key`（32 字节）；私钥与证书匹配时若未填 `merchantSerialNo` 会自动从证书提取。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `PUT` |
| 路径 | `/api/v1/admin/payment-settings/wechat` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录（密钥证书不入审计） |
| 成功状态码 | `200` |

## 请求体（JSON）

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `appId`、`miniAppId`、`mchId`、`merchantSerialNo`、`wechatPayPublicKeyId` | `string` | 是 | 各最多 200 字符 |
| `appSecret`、`miniAppSecret`、`apiV3Key` | `string` | 是 | 空串保留原值；`apiV3Key` 非空时须为 32 字节 |
| `privateKey`、`merchantCert`、`wechatPayPublicKey` | `string` | 是 | 最多 64 KiB PEM 内容，空串保留原值 |
| `gateway`、`notifyUrl`、`oauthCallbackUrl`、`oauthAllowedOrigin` | `string` | 是 | HTTP(S) URL 或空串 |
| `timeoutMs` | `number` | 是 | 整数 `1000–120000` |

## 响应示例

返回脱敏后的最新微信支付设置（同 [getWechatPaySettings.md](getWechatPaySettings.md)，`msg: "微信支付设置已保存"`）。
