# API Key 迁移邮件模板

## 主题：您的 API Key 已迁移到新系统

---

亲爱的 {{userName}},

您的 API Key "{{keyName}}" 已成功迁移到新的认证系统。

### 🔑 新的 API Key

```
{{newApiKey}}
```

**⚠️ 重要提示：**
- 请妥善保存此 Key，它**仅显示一次**
- 旧的 API Key 将在 **2 周后失效**（{{expirationDate}}）
- 请在失效前更新您的应用程序配置

### 📋 Key 详情

- **名称**: {{keyName}}
- **创建时间**: {{createdAt}}
- **过期时间**: {{expiresAt}}

### 🔧 如何更新

1. **复制上面的新 API Key**
2. **更新您的应用程序配置**：
   ```bash
   # 替换旧的 API Key
   export API_KEY="{{newApiKey}}"
   ```
3. **测试您的应用程序**确保正常工作

### ❓ 常见问题

**Q: 为什么要迁移？**
A: 我们升级到了 Better Auth 认证系统，提供更强的安全性和更多功能（速率限制、权限系统等）。

**Q: 旧的 API Key 什么时候失效？**
A: 旧的 API Key 将在 **{{expirationDate}}** 失效。请在此日期前完成迁移。

**Q: 我有多个 API Keys 怎么办？**
A: 您会收到多封邮件，每封包含一个新 Key。请逐一更新。

### 🆘 需要帮助？

如果您在迁移过程中遇到任何问题，请：
- 📧 发送邮件到：support@oksai.cc
- 💬 在线客服：https://oksai.cc/support
- 📚 查看文档：https://docs.oksai.cc/api-keys

---

此致  
敬礼

oksai.cc 团队  
{{currentDate}}
