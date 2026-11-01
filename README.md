---
{
  "type": "Guide",
  "title": "agent-wiki-temple",
  "description": "agent-wiki-temple",
  "status": "draft",
  "sources": [],
  "x_agent": {
    "uid": "README",
    "owner": null,
    "created_at": "2026-11-01T12:16:38+08:00",
    "updated_at": "2026-11-01T12:16:38+08:00",
    "relations": []
  }
}
---

# agent-wiki-temple

单项目知识库模板，默认挂载在项目 `wiki/`。先读 [知识导航](index.md)，维护前读 [治理规范](governance/index.md)。

复制后修改 bundle.json 的 bundle_id/title/owner（如需），删除或改写示例来源与 Feature，重新填写文档 UID、实际时间、来源和负责人。保留未知值与 draft，不将模板或检查通过视为业务事实。

验证：`python3 scripts/check.py`、`python3 -m unittest discover -s tests`（也可使用 npm run check/test）。无需网络、企业 CLI 或安装依赖。元数据使用 JSON 兼容的 YAML Front Matter，所有正文和索引采用同一明确契约。

此实现只检查本仓库约定，不是完整 OKF 认证。结构对照及通用化范围见 [设计来源](ORIGIN.md)。
