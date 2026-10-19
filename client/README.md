# 前台访问记录接入

`client/` 暂无具体项目。未来在前台应用首次加载时调用 `trackVisit()`，例如：

```ts
import { trackVisit } from './visitTracker';

void trackVisit();
```

默认向同源 `/api/v1/visits` 上报当前路径、标题和来源，也可传入 `apiBaseUrl`。浏览器用 `localStorage` 保存访客 UUID 与最近一次上报的 UTC 日期；服务端再以 `(visitor_id, visit_day)` 唯一约束去重。清除浏览器存储、换浏览器或设备后会生成新的访客 ID，因此这是尽力去重，不是可靠的用户身份识别。每天只记录首次访问的页面，页面路径用于分析当日入口页。
