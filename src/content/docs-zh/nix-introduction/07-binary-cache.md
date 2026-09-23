---
title: "二进制缓存"
description: "二进制缓存"
order: 7
---

其实，上一章介绍的 Nix Store（仓库）准确来说只是 Nix Store 的一种，叫作**本地 Store**。按内部格式的不同，Nix Store 有多个种类。

- 本地 Store
- SSH Store
- 虚设 Store（Dummy Store）
- 本地守护进程 Store
- 二进制缓存 Store

一般来说，「Nix Store」多数是指本地 Store，但其他 Store 也各有各的职责。这里我们特别讲解其中最重要的**二进制缓存 Store**。

## Store 路径与确定性构建

Nix 会根据构建输入生成哈希，并把它作为构建产物的标识符（Store 路径）。反过来说，只要生成了相同的 Store 路径，就意味着能得到相同的构建产物。
Store 路径是在执行构建之前生成的。如果在 Store 路径生成的那一刻，已经存在具有相同 Store 路径的 Store 对象，Nix 就会跳过构建。

在一般的构建系统中，对构建结果缓存的利用只局限于有限的范围。而 Nix 的构建由于保证了对相同输入会输出相同的构建结果，因此可以安全地跳过构建。Nix 的构建是可复现的，换句话说是可预测的。具有这种性质的构建被称为**确定性构建**。

## Substituter^[[glossary - Nix Reference Manual](https://nixos.org/manual/nix/stable/glossary#gloss-substituter)]

除了本地 Store 之外，Nix 还可以使用称为 **Substituter**（替代者）的额外 Nix Store。

在使用 Substituter 的情况下，Nix 的构建按以下步骤执行：

1. 生成 Store 路径
2. 确认本地 Store 中是否存在已构建的 Store 对象
   - 若存在则跳过构建
3. 确认 Substituter 中是否存在已构建的 Store 对象
   - 若存在则跳过构建，并把 Substituter 的 Store 对象取到本地 Store
4. 若本地 Store 和 Substituter 中都不存在，则执行构建

Substituter 的行为就像是对本地 Store 的扩展。而 Substituter 只有与后文介绍的二进制缓存 Store 结合起来，才能真正发挥威力。

## 二进制缓存 Store^[[4.4. Store Types - Nix Reference Manual](https://nixos.org/manual/nix/stable/store/types/)]

**二进制缓存 Store** 是一种内部格式专门用于提供已构建的 Store 对象（**二进制缓存**）的 Nix Store。二进制缓存 Store 也有若干种类。

- 本地二进制缓存 Store
- HTTP 二进制缓存 Store
- S3 二进制缓存 Store

HTTP 二进制缓存 Store 使用 HTTP 协议，S3 二进制缓存则使用兼容 S3 的对象存储，二者都经由互联网提供二进制缓存。也就是说，只要把二进制缓存 Store 指定为 Substituter，就能不在本地构建，而是直接从互联网下载构建产物！

Nix 的官方软件包仓库 [Nixpkgs](https://github.com/NixOS/nixpkgs) 通过 [cache.nixos.org](https://cache.nixos.org) 提供 Nixpkgs 的已构建二进制。Nixpkgs 的二进制缓存 Store 默认就被加入到了 Substituter 中。因此，从 Nixpkgs 安装软件包非常快。

这是一件令人惊叹的事情。因为借助 Substituter 与二进制缓存 Store，在本地机器上构建源代码所得到的结果，与直接从互联网获取已构建二进制所得到的结果是等价的。

### NAR^[[[5.2.1. File system objects] Dolstra, Eelco. 2006. _The Purely Functional Software Deployment Model_.](https://edolstra.github.io/pubs/phd-thesis.pdf)]

**NAR**（**N**ix **AR**chive）是 Nix 所使用的归档格式，用于对 Store 对象进行序列化。

NAR 的诞生是因为 TAR 这类既有的归档格式并不够用。Nix 的构建系统是确定性的，但一般的归档格式会添加填充、不对文件排序、或是加入时间戳，因而是非确定性的。这意味着序列化的结果可能不唯一。而 Nix Store 要进行哈希计算，就要求序列化在比特级别上唯一，因此 NAR 作为一种确定性的归档格式被开发出来。

## 二进制缓存相关的工具与服务

### Cachix

Cachix 是一项可以托管 Nix 二进制缓存的 CI 服务。使用 Cachix，个人也能轻松提供二进制缓存。它可以与 GitHub Actions 等 CI 联动。

https://www.cachix.org

### Attic

Attic 是一款可自托管的二进制缓存服务器，用 Rust 实现。据说开发者 zhaofengli 把实例建在 [fly.io](https://fly.io) 上，数据库使用 [Neon](https://neon.tech)，存储使用 [Cloudflare R2](https://developers.cloudflare.com/r2/)^[[Introducing Attic, a self-hostable Nix Binary Cache server](https://discourse.nixos.org/t/introducing-attic-a-self-hostable-nix-binary-cache-server/24343)]。

https://github.com/zhaofengli/attic

## Nix Store 相关的各种功能

### `nix copy`

`nix copy` 命令用于把 Store 对象复制到另一个 Nix Store。你可以把本地 Store 的 Store 对象复制到二进制缓存 Store，也可以把 Store 对象直接传输到另一台机器的本地 Store。无论依赖关系多么复杂，由于 Nix 完整掌握着依赖关系树（Closures，闭包），都能安全地传输。

### 远程构建^[[7.2. Remote Builds](https://nixos.org/manual/nix/stable/advanced-topics/distributed-builds)]

1. 在本地机器指定构建输入
2. 在远程机器执行构建
3. 把远程机器的构建结果复制到本地机器

你可以只把构建过程委托给远程机器。比如从性能较低的机器把构建委托给性能更高的机器，从而缩短构建时间。
