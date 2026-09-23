---
title: "前言"
description: "前言"
order: 1
---

## 背景

纯函数式包管理器 **Nix** 是一款以极为独特的思路实现可复现性、声明式与可靠性的工具。它大概是一款绝大多数人都没听说过的小众包管理器，但其实是一项拥有十余年历史的成熟技术，并凭借自身的理念与实用性赢得了用户长久而坚定的支持。

近来 Nix 在日本也逐渐为人所知，但相关资料依然匮乏，学习成本一直居高不下。为此，本书作为一份能够系统学习 Nix 的入门资料被写了出来。

## 目的与目标读者

本书将对 Nix 的理念与机制进行讲解。讲解中会尽可能使用 [Nix Reference Manual](https://nixos.org/manual/nix/stable/) 的[术语表](https://nixos.org/manual/nix/stable/glossary.html)所定义的术语，目标是让你读完之后能够毫无障碍地阅读 Nix 官方文档。

同时，本书预设的读者是以下这些人：

- 想知道 Nix 到底是什么
- 想了解 Nix 的机制
- 曾在官方文档面前受挫
- 正在寻找基于 Flakes 的 Nix 讲解
<!-- - 听到「可复现性高／声明式」就会兴奋 -->

## 本书不涉及的内容

本书不会涉及以下内容：

- Nix CLI 的用法
- Nix 语言的写法
- 用 Nix 构建具体软件包的方法
- NixOS
- home-manager

本书始终只是一份讲解 Nix 机制的资料，而不是 Nix 教程。关于 Nix 的教程，笔者正在另写一本《Nix 入门：实战篇》，公开日期尚未确定。

如果你想立刻阅读教程，推荐 Determinate Systems 公司的 [Zero to Nix](https://zero-to-nix.com)，这是一份动手实践形式的教程。

https://zero-to-nix.com

另外，与 Nix 密切相关的软件 NixOS 和 home-manager 同样不在本书范围之内。简单说明一下：NixOS 是一个使用 Nix 以声明式方式管理系统的 Linux 发行版，home-manager 则是声明式的用户环境构建工具。

如果你想了解它们，[ryan4yjn](https://github.com/ryan4yin) 老师写过一份非常出色的教程。

https://nixos-and-flakes.thiscute.world

或者，也可以看看笔者的拙作。

https://zenn.dev/asa1984/articles/nixos-is-the-best

## 前置知识

- 用过 UNIX 系系统（Linux、MacOS）
- 用过包管理器

开篇提到 Nix 是纯函数式包管理器，但阅读本书并不需要纯函数式语言的知识。
另外，为了便于理解，文中有时会举一些包管理器或编程语言的例子，敬请谅解。

## 本书的结构

本书首先在「Nix 是什么」中梳理前置知识，接着在「为什么需要 Nix」中确认既有软件包管理技术存在的问题，然后在「Re: Nix 是什么」中讲解 Nix 的概要与理念。之后的各章会详细说明各项功能及其机制。由于各章内容都以前一章的知识为前提，建议按顺序阅读。

## 现在，前往 Nix 的世界！

准备工作到此就绪。
再次感谢你翻开本书。

那么，欢迎来到 Nix 的世界！

![Nix 的 Logo](https://raw.githubusercontent.com/NixOS/nixos-artwork/35ebbbf01c3119005ed180726c388a01d4d1100c/logo/nix-snowflake.svg)
_Welcome to Nix!_
