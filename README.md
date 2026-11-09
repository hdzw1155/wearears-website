# WearEars 官网

WearEars 把跨品牌耳机的电量和声学控制带到 Wear OS。这个仓库是中英文官网，提供产品入口、设备验证记录、开发者指南、合作方式和项目动态。应用源码与安装包由 [WearEars 应用仓库](https://github.com/hdzw1155/WearEars) 维护。

第一阶段的审查分支为 `codex-v1`。视觉规范、验证结果和后续工作见 [第二阶段交接](HANDOFF_TO_GEMINI.md)。

## 本地开发

使用 Node.js 22.23.4 或更新版本。第一阶段使用 Node.js 24 构建和验证。

```sh
npm ci
npm run dev
```

开发地址默认为 `http://localhost:4321/`。构建与本地预览可依次运行以下命令。

```sh
npm run check
npm run build
npm run preview
```

`npm run sync:releases` 从 WearEars 的公开 GitHub Releases 更新本地快照。日常构建使用已提交的快照，构建过程无需访问 GitHub API。同步前后可以用 `git diff -- src/data/releases.json` 检查记录的变更。

## 页面与接口

| 中文 | English | 内容 |
| --- | --- | --- |
| `/` | `/en/` | 品牌首屏、核心能力、四层架构和访问入口 |
| `/project/` | `/en/project/` | 产品说明、安装流程和应用发布入口 |
| `/compatibility/` | `/en/compatibility/` | 按型号、品牌和证据状态查询设备 |
| `/developers/` | `/en/developers/` | 应用源码、驱动契约和参与方式 |
| `/partners/` | `/en/partners/` | 联合验证、驱动协作方向与联系入口 |
| `/blog/` | `/en/blog/` | 真实发布记录、项目里程碑及技术资料 |
| `/privacy/` | `/en/privacy/` | 官网当前的数据处理说明 |

`/compatibility.json` 是带 `schemaVersion` 的公开数据文件。`/sitemap.xml` 提供中英文页面与语言对应关系，`/robots.txt` 指向站点地图。`404.html` 是未知路径使用的错误页。

## 项目结构

```text
.
├── astro.config.mjs         静态站点构建配置
├── package.json / package-lock.json / tsconfig.json
├── public/brand/             原创标识、首屏 SVG、社交分享图
├── scripts/
│   └── sync-releases.mjs    更新公开发布快照
├── src/
│   ├── components/          架构图、页面引导、发布列表
│   ├── data/                设备记录与发布快照
│   ├── layouts/             全站页头、页脚与元数据
│   ├── lib/site.ts          站点身份、语言、路由与联系配置
│   ├── pages/              语言路由、静态接口与 404
│   ├── styles/site.css      设计 Token、组件样式与响应式规则
│   └── views/              七个页面的中英文内容
├── docs/screenshots/         浏览器实际截图
├── HANDOFF_TO_GEMINI.md      第二阶段设计、工程与测试交接
└── README.md
```

## 内容维护

- 设备记录在 `src/data/compatibility.ts`。每条记录分别描述电量、降噪和通透能力，并附源资料链接。手表型号或实测日期缺失时保留 `null`。
- 首批设备证据来自应用仓库的 README 和协议验证文档。`src/lib/site.ts` 固定来源提交，更新版本前要核对声明与证据是否仍然对应。
- `src/views/Journal.astro` 维护技术资料与项目里程碑。GitHub 发布日期来自快照中的 `published_at`，页面按北京时间显示。
- 合作邮箱由 `src/lib/site.ts` 的 `contactEmail` 配置。空值时合作页提供 GitHub 公开讨论入口。有可公开的邮箱后再启用邮件链接。

## 静态部署

将 `npm run build` 生成的 `dist/` 发布到已确认的静态托管环境。页面采用目录索引和尾随斜线，需保留目录结构，并将 `404.html` 配置为返回 HTTP 404 的错误文档。正式域名配置为 `https://wearears.com`，域名如需变更，应同步更新 `astro.config.mjs` 与 `src/lib/site.ts`。上线后复查规范链接、分享图、站点地图和错误响应。

第一阶段交付主站源码和可部署构建。正式托管与 DNS 待确认。`docs`、`partners`、`blog`、`me` 和 `lab` 子域属于后续规划，现有开发者、合作和动态入口均留在主站。

[桌面截图](docs/screenshots/home-desktop.png) · [移动端截图](docs/screenshots/home-mobile.png)
