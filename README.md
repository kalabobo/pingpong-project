# pingpong-project

一个可在电脑和手机浏览器使用的「乒乓球失误记录」应用，已升级到 v3：支持免费 CloudBase 数据库存储，并提供微信小程序端代码。

## v3 功能
- 网页端记录比赛时间、回合阶段、失误大类和细分失误。
- 失误细分基于较明确、可针对改进的技术/战术描述。
- 微信小程序端改为 CloudBase 直连数据库（免费优先，不依赖自建 HTTP 服务）。
- 自动生成基础统计：总数、最高频大类、最高频细分。

## 目录
- `index.html` `styles.css` `app.js`: 网页端
- `server.py`: 兼容保留的后端 API（可选）
- `miniprogram/`: 微信小程序代码（推荐）

## 启动方式（网页端可选）
### 1) 启动后端（仅网页端 API 模式需要）
```bash
python3 server.py
```
默认地址：`http://127.0.0.1:8787`

### 2) 启动前端静态页面
```bash
python3 -m http.server 4173
```
访问：`http://127.0.0.1:4173`

## 微信小程序（免费方案）
1. 下载并打开微信开发者工具。
2. 导入 `miniprogram/` 目录。
3. 确认 `miniprogram/app.js` 中 `wx.cloud.init` 的 `env` 是你自己的环境 ID。
4. 在 CloudBase 控制台创建文档型数据库集合：`records`。
5. 编译运行后即可直接读写云数据库（不需要配置 `API_BASE`、不需要开启 HTTP 服务）。

## 说明
- `miniprogram/config.js` 为旧版 API 路径保留文件，CloudBase 直连方案默认不再依赖它。
