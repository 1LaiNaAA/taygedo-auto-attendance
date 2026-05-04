# 塔吉多签到

基于 TypeScript 的塔吉多自动签到服务，首选运行在 GitHub Actions。

项目读取 `TAYGEDO_ACCOUNTS` JSON Secret，完成塔吉多 APP 签到和游戏签到后，把更新后的账号信息写回 `updated-accounts.json`，再由 workflow 用 `gh secret set` 覆写回同一个 Secret。

## 功能特点

- 🌟 支持多账号
- 🤖 支持 GitHub Actions 定时执行
- 📱 支持塔吉多 APP 签到和游戏签到
- 🔄 支持失败重试
- 💾 支持将刷新后的 token 写回 GitHub Secret
- 🚀 支持手动触发工作流
- 🔔 支持通知推送

## 快速开始

本项目默认围绕 GitHub Actions 使用。创建仓库后，先配置 Secrets，再启用工作流即可。

### GitHub Actions 部署

1. **Fork 或直接使用本仓库**

   如果你打算自己托管，先把仓库放到你的 GitHub 账号下。

2. **配置 GitHub Secrets**

   进入仓库的 `Settings` -> `Secrets and variables` -> `Actions`，添加下列 Secrets：

   | Secret 名称 | 说明 | 是否必填 |
   |------------|------|---------|
   | `TAYGEDO_ACCOUNTS` | 塔吉多账号 JSON，多个账号放在同一个数组里 | 必填 |
   | `GH_SECRET_UPDATE_TOKEN` | 用于覆盖 `TAYGEDO_ACCOUNTS` 的 GitHub PAT | 必填 |
   | `TAYGEDO_NOTIFICATION_URLS` | 通知 URL，多个 URL 用逗号分隔 | 可选 |
   | `TAYGEDO_MAX_RETRIES` | 最大重试次数，默认 `3` | 可选 |

3. **启用 GitHub Actions**

   进入仓库的 `Actions` 页面，启用工作流。

4. **执行签到**

   工作流会按计划自动执行。你也可以在 `Actions` 页面手动运行 `attendance` 工作流。

### 工作流说明

- **attendance** (`.github/workflows/attendance.yml`)
  - 每天定时执行一次
  - 支持手动触发
  - 签到结束后，会在至少一个账号刷新成功时更新 `TAYGEDO_ACCOUNTS`

## 配置说明

### 1. 塔吉多账号

将账号配置为 JSON 数组，写入 `TAYGEDO_ACCOUNTS`。

```json
[
  {
    "id": "main",
    "name": "主账号",
    "uid": "123456",
    "deviceId": "abcdef1234567890",
    "refreshToken": "your-refresh-token",
    "roleId": "optional-role-id",
    "roleName": "optional-role-name"
  }
]
```

字段说明：

- `id`：账号唯一标识
- `name`：通知中显示的名称
- `uid`：塔吉多用户 ID
- `deviceId`：登录设备 ID
- `refreshToken`：当前可用的刷新凭证
- `roleId`：可选，游戏角色 ID
- `roleName`：可选，游戏角色名

### 2. GitHub PAT

`GH_SECRET_UPDATE_TOKEN` 需要具备更新当前仓库 Secrets 的权限。工作流会使用它执行 `gh secret set TAYGEDO_ACCOUNTS < updated-accounts.json`。

### 3. 通知配置

`TAYGEDO_NOTIFICATION_URLS` 可填写一个或多个通知地址，多个地址使用英文逗号分隔。

### 4. 重试配置

`TAYGEDO_MAX_RETRIES` 控制单个账号的最大重试次数，默认值为 `3`。

## 本地运行

```bash
pnpm install
TAYGEDO_ACCOUNTS='[{"id":"main","name":"主账号","uid":"123456","deviceId":"device","refreshToken":"token"}]' pnpm action
```

运行后会生成 `updated-accounts.json`。

## 注意事项

- `TAYGEDO_ACCOUNTS` 中的 token 会在每次签到后更新，请保持 Secret 可写。
- 如果所有账号都刷新失败，工作流不会覆盖 `TAYGEDO_ACCOUNTS`。
- 建议 `GH_SECRET_UPDATE_TOKEN` 使用细粒度 PAT，并只赋予目标仓库所需权限。
