interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * 输出 Schema.org JSON-LD 结构化数据脚本。
 * 对 `<` 进行 Unicode 转义，防止内联脚本注入风险。
 */
export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
