---
title: "Re: Nix 是什么"
description: "Re: Nix 是什么"
order: 4
---

前置知识已经梳理完毕。接下来我们要正式开始学习 Nix。本章将讲解 Nix 的理念。

下面引用[官方网站](https://nixos.org)的内容并附上中文翻译。这里写的都是很重要的东西，请务必仔细读一遍。

https://nixos.org

## Nix

> _"Nix is a tool that takes a unique approach to package management and system configuration. Learn how to make reproducible, declarative and reliable systems."_
>
> _「Nix 是一款对软件包管理和系统配置采取独特思路的工具。来学习如何构建可复现、声明式且可靠的系统吧。」_

### 可复现（Reproducible）

> _"Nix builds packages in isolation from each other. This ensures that they are reproducible and don't have undeclared dependencies, so **if a package works on one machine, it will also work on another**."_
>
> _「Nix 会让各个软件包彼此隔离地构建。这保证了软件包是可复现的、不存在未声明的依赖，因此**如果一个软件包在某台机器上能正常工作，它在另一台机器上也能正常工作**。」_

### 声明式（Declarative）

> _"Nix makes it **trivial to share development and build environments** for your projects, regardless of what programming languages and tools you’re using."_
>
> _「无论你使用什么编程语言和工具，Nix 都能让**共享项目的开发环境与构建环境变得轻而易举**。」_

### 可靠（Reliable）

> _"Nix ensures that installing or upgrading one package **cannot break other packages**. It allows you to **roll back to previous versions**, and ensures that no package is in an inconsistent state during an upgrade."_
>
> _「Nix 确保安装或升级某一个软件包**绝不会破坏其他软件包**。它还允许你**回滚到之前的版本**，并保证升级过程中不会有软件包处于不一致的状态。」_

---

引用到此结束。

**可复现性**、**声明式**、**可靠性**是 Nix 的重要理念。这几个关键词在本书中会反复出现，请记住它们。

## 可复现的构建

所谓「可复现的构建」，指的是无论何时、在哪台机器上，构建结果都始终相同的构建。在软件的分发与部署中，可复现性是极其重要的要素。

Nix 凭借强大的构建系统，实现了大概是这世上最接近完美的可复现性。到了什么程度呢？NixOS 的最小 ISO 镜像这样一个庞大的软件包，其构建的可复现性达到了 100%。^[[Nixos-unstable’s iso_minimal.x86_64-linux is 100% reproducible!](https://discourse.nixos.org/t/nixos-unstable-s-iso-minimal-x86-64-linux-is-100-reproducible/13723)]

### 相关功能

- 纯函数式构建系统
- Nix Store（仓库）
- 二进制缓存
- Derivation（派生）
- Flakes

## 声明式的构建与开发环境搭建

你不必再手动一条条执行繁琐的构建步骤。只要用 **Nix 语言**把软件包定义写一次，之后从依赖关系解析到构建的全过程都由构建系统自动完成。

而且，不只是构建软件包，搭建开发环境同样可以借助 Nix 语言以声明式的方式完成。

### 相关功能

- Derivation
- Nix 语言
- Flakes

## 安全的软件包管理

「升级了一个软件包，结果环境坏掉了」在一般的包管理器里是常有的事，但这和 Nix 毫无关系。Nix 把软件包和软件包配置视为**不可变**的，因此不会发生源于升级的依赖关系问题。此外，Nix 会以**世代**的形式管理软件包配置，即便升级真的引发了问题，也能把软件包配置恢复到原来的状态。

### 相关功能

- Nix Store
- Profiles

## 与其他包管理器的比较

为了让 Nix 的特点更加清晰，这里与其他包管理器做一个简单的比较。不过请注意，这并不是在评定优劣。

1. 权限范围
2. 软件包仓库的形态
3. 是否支持二进制安装
4. 软件包数量

比较结果汇总成下表。

|    名称    | 权限范围 |     软件包仓库     |     二进制安装     | 软件包数量^[[repology.org](https://repology.org/repositories/statistics/total)] |
| :--------: | :------: | :----------------: | :----------------: | :----------------------------------------------------------------------------: |
| Arch Linux |   root   |       中心化       |        支持        |                                 约 7 万（AUR）                                 |
|   Cargo    |   用户   |       中心化       |       不支持       |                                    约 4000                                     |
|     Go     |   用户   |       分布式       |       不支持       |                                       -                                        |
|  **Nix**   |   用户   |   中心化／分布式   |        支持        |                         约 9 万（nixpkgs unstable）                            |

### 以用户权限运行

Nix 无法操作需要 root 权限的领域。例如，它可以构建内核或设备驱动，但不能把它们安装到环境中。这一点与 apt、rpm、Pacman 这类操作系统的包管理器不同。如果你想用 Nix 进行这类需要 root 权限的操作，就需要使用 NixOS。

另外，由于不会与系统的包管理器冲突，你可以在任何 Linux 发行版以及 MacOS 上使用 Nix。

### Nixpkgs 与分布式软件包仓库

软件包仓库分为两种：一种是中心化的，即用户或管理者把软件包登记到单一仓库中并从中取用；另一种是分布式的，即存在多个仓库，任何人都可以随意创建和使用仓库。

Nix 的软件包仓库是分布式的。虽然存在 [Nixpkgs](https://github.com/NixOS/nixpkgs) 这个官方仓库，但它终究只被看作众多仓库中的一个。借助 GitHub 等平台，用户可以自由地发布和使用软件包。这一点和 Go 语言非常相似。

### 支持二进制安装

Nix 通过**二进制缓存**这一机制，在保持可复现性的同时实现了直接安装已构建好的二进制。详情将在「二进制缓存」一章中展开。

### 数量最多的软件包

Nixpkgs 是软件包数量最多的开源软件包仓库。在撰写本文时（2024/03/31），滚动发布的 unstable 分支约有 9 万个软件包，同样在撰写时最新的 stable 分支（nixpkgs stable 23.11）则有约 8.8 万个。

https://repology.org/repositories/statistics/total
