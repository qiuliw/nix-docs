---
title: "第 2 部：实践 Nix"
description: "第 2 部：实践 Nix"
order: 10
---

本章将学习构建之外的 Nix 实用用法。

- Nix CLI 基础
- 用 devShell 声明式地搭建开发环境
- 用 Profile 进行全局安装

## 【闲谈】传统命令体系与 Nix channels

<!-- 本書冒頭でNixをセットアップしたとき、実験的機能であるFlakesとNix commandを基軸に解説していくと述べました。ということは実験的機能ではない従来の機能があるということです。 -->

传统的 Nix 通过一个叫做 **Nix channels** 的功能来管理 Nix 语言的依赖关系。Channels 以 **Channel** 为单位来处理项目。Flakes 是以每个 Flake 为单位做本地化的依赖管理，而 Channels 则是全局管理。此外，它没有版本锁定机制，需要用户像 `apt update` 那样手动更新全局的 channel。

| 管理方式 | 项目单位 | 管理范围 | 版本锁定 |
| -------- | ---------------- | ---------- | ---------------- |
| Flakes   | Flake            | 本地   | 有             |
| Channels | Channel          | 全局 | 无             |

Channels 在可复现性方面存在很大的问题。因为不存在 `flake.nix`、`flake.lock` 这样的定义文件，依赖关系是被隐式管理的，导致不同机器上 channel 的构成和版本可能出现差异。

作为这一问题的解决方案而被提出的正是 Flakes。Channels 的机制类似操作系统的包管理器，而 Flakes 的机制则更接近现代编程语言的包管理器。

同时，配合 Flakes 还引入了一套名为 **Nix command** 的全新命令体系。传统命令是借助 Channels 来对 Nix 语言求值的，而 Nix command 则以 Flakes 为基础。另外，传统命令体系按用途分散成一个个独立命令（如 `nix-build`、`nix-store` 等），而 Nix command 全部整合为 `nix` 的子命令（如 `nix build`、`nix store` 等），因此命令体系更加直观。
