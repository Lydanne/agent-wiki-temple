---
{
  "type": "Specification",
  "title": "commits",
  "description": "commits",
  "status": "draft",
  "sources": [],
  "x_agent": {
    "uid": "governance.commits",
    "owner": null,
    "created_at": "2026-11-01T12:16:38+08:00",
    "updated_at": "2026-11-01T12:40:19+08:00",
    "relations": []
  }
}
---

# commits

遵守目标仓库实际 Git 政策。验证并审阅精确暂存范围，排除敏感原件、缓存和凭证。默认建议使用 Conventional Commits；创建 PR、推送、合并及外部发布的权限分别判断，不继承源企业自动合并授权。

本库 Git 模式以根 git-policy.json 为准。工作流见 [Git 工作流](../.agents/skills/git-workflow/references/workflow.md)，执行前读取对应技能。
