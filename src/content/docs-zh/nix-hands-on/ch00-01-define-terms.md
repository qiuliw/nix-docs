---
title: "术语的定义"
description: "术语的定义"
order: 2
---

术语含糊不清不仅会妨碍学习，还会成为无谓争论的根源。与 Nix 相关的术语尤其容易被混淆，因此这里先明确定义本书中使用的术语。

本书尽可能使用 Nix Reference Manual 2.20 版 [13. Glossary](https://nix.dev/manual/nix/2.20/glossary) 中定义的术语。Nix 特有的术语一律保留英文原文^[书中会不时出现诸如「realise 一个被 instantiate 的 store derivation」这类看起来有些怪异的句子，还请见谅。]。

https://nix.dev/manual/nix/2.20/glossary

本节将定义本书中「Nix」一词的含义。

## Nix

Nix 本身不过是一个包管理器，但它具有以下多个不同的侧面：

- 作为包管理器的 Nix
- 作为构建系统的 Nix
- Nix 语言（领域特定语言）
- Nixpkgs（软件包注册表）
- NixOS（Linux 发行版）

由于它们都冠以「Nix」之名，在某些语境下难免让人困惑。

因此，本书约定「Nix」一词专指「由 [NixOS/nix](https://github.com/NixOS/nix) 开发的那个包管理器」。

https://github.com/NixOS/nix

Nix 具有以下特点和功能：

- 特点
  - 面向所有 UNIX 类操作系统的包管理器
  - 以用户权限运行
- 功能
  - 软件包管理（[Nix Store](https://zenn.dev/asa1984/books/nix-introduction/viewer/06-nix-store)）
  - 软件包组合管理（[Profiles](https://zenn.dev/asa1984/books/nix-introduction/viewer/12-profiles)）
  - 构建系统
  - Nix 语言的求值

Nix 是一个支持各种 Linux 发行版和 macOS 的通用工具。由于它在独立于常规文件结构（[Filesystem Hierarchy Standard](https://ja.wikipedia.org/wiki/Filesystem_Hierarchy_Standard)）的位置进行软件包管理，因此不会与 APT、Pacman、RPM、Homebrew 等包管理系统冲突；又因为它以用户权限运行，所以也无法完全取代它们。

与其说 Nix 是操作系统的包管理器，不如说它更接近编程语言的包管理器（如 Cargo、npm）。

本书着重于 Nix 作为通用工具的一面，并讲解它的用法。

## Nix 语言

Nix 语言是 Nix 专用的编程语言（领域特定语言）。由于 Nix 语言与使用它的工具（即包管理器 Nix）同名，为避免混淆，本书一律称其为「Nix 语言」。

## NixOS

**作为包管理器的 Nix 与 NixOS 是两回事**。

NixOS 并不只是把 Nix 当作一个单纯的包管理器来用。NixOS 是一个特殊的 Linux 发行版：用 Nix 语言描述操作系统的配置（用户、网络、服务、驱动等），交由 Nix 求值并构建，然后由 NixOS 一侧应用这些变更来完成环境搭建。

与以用户权限运行的 Nix 不同，NixOS 能够操作 root 权限范围内的区域，因此可以安装内核、驱动这类系统级软件包。

包管理器 Nix 的开发在 [NixOS/nix](https://github.com/NixOS/nix) 中进行，而 NixOS 则由 [NixOS/nixpkgs](https://github.com/NixOS/nixpkgs) 提供——从这一点也能看出两者是相互区分的存在。

https://github.com/NixOS/nix

https://github.com/NixOS/nixpkgs

本书不涉及 NixOS 的内容。
