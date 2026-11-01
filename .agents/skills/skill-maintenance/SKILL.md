---
name: skill-maintenance
description: 在当前项目 .agents/skills 中创建或通用化技能，检查可移植性和发布范围。
---

先核对已有技能，优先扩展。SKILL.md frontmatter 包含 name/description，正文说明触发条件、必要步骤、工具与成功标准；仅将较大场景细节放 references。不得硬编码企业账号、主机、绝对路径、CLI 登录态或自动合并授权。仅依赖宿主实际提供能力；工具入口由项目元数据和可信配置确定。检查所有引用与示例，按当前仓库政策交付；向其他仓库发布只包含用户指定的技能范围。

新增通用脚本优先 Node.js ESM（.mjs）与 node:test，优先内置库。需要专项库或已有 Python 实现时可使用 Python，但须标明依赖与运行命令，不使通用模板默认依赖 Python。
