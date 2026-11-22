# 保存支付宝设置

更新支付宝支付配置；密钥与加密字段传空字符串表示保留数据库原值，非空时校验 PEM 格式合法性。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `PUT` |
| 路径 | `/api/v1/admin/payment-settings/alipay` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录（密钥字段不入审计） |
| 成功状态码 | `200` |

## 请求体（JSON）

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `appId` | `string` | 是 | 最多 200 字符 |
| `privateKey` | `string` | 是 | 最多 64 KiB PEM 私钥，空字符串保留原值 |
| `alipayPublicKey` | `string` | 是 | 最多 64 KiB PEM 公钥，空字符串保留原值 |
| `appPublicKey` | `string` | 是 | 最多 64 KiB PEM 公钥，空字符串保留原值 |
| `aesKey` | `string` | 是 | 最多 200 字符，空字符串保留原值 |
| `keyType` | `'PKCS1' \| 'PKCS8'` | 是 | 私钥格式 |
| `gateway` | `string` | 是 | HTTP(S) URL |
| `notifyUrl` | `string` | 是 | HTTP(S) URL 或空串 |
| `returnUrl` | `string` | 是 | HTTP(S) URL 或空串 |
| `enableEncrypt` | `boolean` | 是 | 是否开启 AES 加密 |
| `timeoutMs` | `number` | 是 | 整数 `1000–120000` |

## 响应示例

返回脱敏后的最新支付宝设置（同 [getAlipaySettings.md](getAlipaySettings.md)，`msg: "支付宝设置已保存"`）。
