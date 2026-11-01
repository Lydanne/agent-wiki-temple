---
{
  "type": "Specification",
  "title": "metadata",
  "description": "metadata",
  "status": "draft",
  "sources": [],
  "x_agent": {
    "uid": "governance.metadata",
    "owner": null,
    "created_at": "2026-11-01T12:16:38+08:00",
    "updated_at": "2026-11-01T12:16:38+08:00",
    "relations": []
  }
}
---

# metadata

普通正文及索引使用 type、title、description、status、sources 与 x_agent。x_agent 必须有 uid、owner（未知 null）、created_at、updated_at、relations；UID 库内唯一，移动时保留。聚合键为 bundle_id + uid。feature_id 对应 features 下目录名。时间带时区、记录真实创建和修改时间。

sources 为 id/title/resource 对象列表，resource 相对指向 sources 中的来源包 index.md，可附证据锚点。外部原地址、固定提交 SHA、页码/时间段、取得情况在来源包正文记录。不能以循环引用代替原始依据。

relations 包含 type、target_uid；跨库另带 target_bundle。本地目标必须存在，关系类型为 references/part_of/depends_on/constrained_by/implements/supersedes。generated 的 by/at 仅记真实生成；verified 为 by/at 审核列表；stale_after 表示复核期限。元数据不授予权限。
