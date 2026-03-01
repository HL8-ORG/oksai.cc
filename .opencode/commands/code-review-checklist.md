---
description: 代码审查清单。用于进行全面代码审查，确保代码质量、安全性和可维护性。当用户说"代码审查"、"code review"、"review"、"审查"时使用。
argument-hint: '[scope] [--all] [--fix]'
---

# 代码审查清单

用于进行全面代码审查的综合清单，确保代码质量、安全性和可维护性。

## 上下文

- **当前分支:** !`git branch --show-current`
- **暂存区变更:** !`git diff --cached --stat 2>/dev/null | head -20 || echo "暂无暂存变更"`
- **工作区变更:** !`git diff --stat 2>/dev/null | head -20 || echo "暂无未暂存变更"`

## 用户指令

$ARGUMENTS

**重要：** 如果用户提供了具体指令，优先遵循用户指令而非默认行为。

## 审查范围

| 参数 | 说明 | 示例 |
|:---|:---|:---|
| `--all` | 审查所有变更（暂存+工作区） | `/code-review-checklist --all` |
| `--staged` | 仅审查暂存区变更（默认） | `/code-review-checklist --staged` |
| `--fix` | 尝试自动修复发现的问题 | `/code-review-checklist --fix` |
| `<path>` | 审查指定文件或目录 | `/code-review-checklist libs/auth` |

---

## 审查类别

### 1. 项目规范（AGENTS.md）

**检查项：**

- [ ] 代码注释、文档、错误消息使用中文
- [ ] Git 提交信息使用英文
- [ ] 公共 API / Controller / Service 有完整 TSDoc 注释
- [ ] 代码变更时同步更新了相关注释
- [ ] 遵循 Nx monorepo 工作流（使用 `pnpm nx` 而非直接工具）

**检查方法：**

```bash
# 检查暂存区文件
git diff --cached --name-only

# 检查是否有未使用中文的注释（示例）
git diff --cached -- "*.ts" --unified=0 | grep -E "^\+.*//|^\+.*\*"
```

---

### 2. Spec 优先开发

**检查项：**

- [ ] 新功能开发前已创建 spec 文档（`specs/{feature}/design.md`）
- [ ] 实现进度已记录在 `implementation.md`
- [ ] 架构决策已记录在 `decisions.md`（如有重要决策）
- [ ] 代码实现与 spec 设计保持一致

**检查方法：**

```bash
# 列出现有 specs
ls -d specs/*/ 2>/dev/null

# 检查当前分支是否对应某个 spec
git branch --show-current | grep -E "feature|feat"
```

---

### 3. 功能性

**检查项：**

- [ ] 代码实现了预期功能
- [ ] 边界情况已处理
- [ ] 错误处理得当
- [ ] 无明显 bug 或逻辑错误

---

### 4. 代码质量

**检查项：**

- [ ] 代码可读性好，结构清晰
- [ ] 函数短小且职责单一
- [ ] 变量命名具有描述性
- [ ] 无代码重复
- [ ] 遵循项目规范

**检查方法：**

```bash
# 运行 Biome lint 检查
pnpm biome lint --reporter summary
```

---

### 5. 安全性

**检查项：**

- [ ] 无明显安全漏洞
- [ ] 存在输入验证
- [ ] 敏感数据处理得当
- [ ] 无硬编码的密钥

**检查方法：**

```bash
# 检查是否有硬编码密钥
git diff --cached | grep -iE "(password|secret|api.?key|token).*=.*['\"]"
```

---

## 审查流程

1. **获取变更范围**：根据参数确定审查哪些文件
2. **逐项检查**：按上述类别依次检查
3. **记录问题**：发现的问题按严重程度分类
4. **输出报告**：生成审查报告
5. **自动修复**（可选）：如果指定 `--fix`，尝试自动修复可修复的问题

## 输出格式

```
## 代码审查报告

### 审查范围
- 分支: {branch}
- 文件数: {count}
- 变更统计: +{add} -{del}

### 检查结果

| 类别 | 状态 | 通过/总数 |
|:---|:---|:---|
| 项目规范 | ✅/⚠️/❌ | X/X |
| Spec 优先 | ✅/⚠️/❌ | X/X |
| 功能性 | ✅/⚠️/❌ | X/X |
| 代码质量 | ✅/⚠️/❌ | X/X |
| 安全性 | ✅/⚠️/❌ | X/X |

### 发现的问题

1. [严重] {问题描述}
2. [警告] {问题描述}
3. [建议] {问题描述}

### 审查结论

✅ 通过 / ⚠️ 需修复 / ❌ 不通过
```

---

## 执行审查

根据上述清单，对当前变更进行审查并输出报告。
