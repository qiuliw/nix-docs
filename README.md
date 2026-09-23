# Nix Docs

Nix 是一个声明式、可复现的软件包管理器和构建系统，通过显式声明依赖（传统动态链接库依赖是隐式的，极易错误）和构建环境，减少版本冲突并保证环境一致性。

它将软件及其完整依赖作为构建输入，并将构建结果存储在 Nix Store 中，从而避免不同软件之间的版本冲突，并支持同时使用多个版本，用于创建**可复现的隔离开发环境**：项目声明所需的工具和依赖，其他机器可以获得相同的环境。

本项目是基于 [asa1984/zenn-articles](https://github.com/asa1984/zenn-articles) 的 Nix 文档站点（日本語 / 中文）。

**站点:** https://qiuliw.github.io/nix-docs/

- 中文：https://qiuliw.github.io/nix-docs/docs/zh
- 日文：https://qiuliw.github.io/nix-docs/docs

## 内容

- **Nix 入门** — Nix 的概念与机制
- **Nix 入门：实战篇** — CLI / 语言 / 构建实践
- **文章** — NixOS 桌面、二进制缓存等

## 开发

```bash
npm install
npm run dev
```

推送到 `main` 后，GitHub Actions 会自动部署到 GitHub Pages。

## 致谢

原文著作权归 [asa1984](https://github.com/asa1984) 所有。站点模板基于 [svelte-docs-starter](https://github.com/code-gio/svelte-docs-starter)。
