---
name: deployment-commands
description: How to format server deployment commands for the user
metadata:
  type: feedback
---

When giving server deployment commands, always list each command on its own line, numbered, without `&&` chaining. Each command must be executable independently. The user will execute them one by one on the server.

**Why:** User prefers to copy-paste and execute commands individually on their Bandwagon VPS, rather than pasting long chained commands.
**How to apply:** When deployment is needed, list commands as:

**第 1 条：**
```bash
command1
```

**第 2 条：**
```bash
command2
```

Never use `&&` or `;` to chain commands. Include `pm2 save` as the last step. Server directory is `/root/aipainting`.
