---
{
  "type": "Specification",
  "title": "lifecycle",
  "description": "lifecycle",
  "status": "draft",
  "sources": [],
  "x_agent": {
    "uid": "governance.lifecycle",
    "owner": null,
    "created_at": "2026-11-01T12:16:38+08:00",
    "updated_at": "2026-11-01T12:16:38+08:00",
    "relations": []
  }
}
---

# lifecycle

draft：新建或语义变更后待核验；stable：真实审核通过且适用范围明确，必须记录 verified；deprecated：保留历史并指向替代内容。自动生成、格式检查、CI、Git 合并不等于人工业务审核，不自动填写 verified。

证据冲突保留版本和差异；超过复核期限或实现变化时重验。迁移 x_xgj 到 x_agent 时逐项映射并保留真实 UID/历史时间，不把重命名时间伪装成原始创建时间。
