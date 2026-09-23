---
title: "第3部: 构建工具"
description: "第3部: 构建工具"
order: 16
---

我们已经学习了用 Nix 语言构建软件包的机制，但 derivation 函数过于原始，并不实用。实际进行构建时，我们会使用 **Nixpkgs** 提供的构建工具。

[NixOS/nixpkgs](https://github.com/NixOS/nixpkgs) 是官方提供的 Flake。Nixpkgs 既是一个提供了将近 9 万个软件包的巨型软件包仓库，同时也是 Nix 语言的标准库。概要请参阅下面的讲解。

https://zenn.dev/asa1984/books/nix-introduction/viewer/10-nixpkgs

本部分将更深入地了解 Nixpkgs 提供的以下三样东西。

- Nixpkgs libs
- Standard environment（标准环境）
- 构建辅助工具（build helper）
