---
title: "Nix 的安装与配置"
description: "Nix 的安装与配置"
order: 3
---

## 安装 Nix

这里不使用官方安装器，而是使用 Determinate Systems 的 [nix-installer](https://github.com/DeterminateSystems/nix-installer)。

https://github.com/DeterminateSystems/nix-installer

相比官方安装器，nix-installer 有以下优势：

- 自带卸载器
- 支持 Linux 容器环境
- **自动启用 Flakes 与 Nix command**

本书以 Flakes 和 Nix command 为主线来讲解 Nix 的用法。这两者都是 Nix 的实验性功能，必须在配置中启用后才能使用。本来需要用户手动启用，而 nix-installer 会自动帮你完成这一步。

<details>
<summary>使用官方安装器安装的读者请看</summary>

请在 `~/.config/nix/nix.conf` 或 `/etc/nix/nix.conf` 中添加以下一行：

```
experimental-features = nix-command flakes
```

</details>

<details>
<summary>NixOS / home-manager 用户请看</summary>

请分别添加以下配置：

1. 使用 NixOS 时

```nix
nix.settings.experimental-features = [ "nix-command" "flakes" ];
```

2. 使用 home-manager 时

```nix
nix.settings.experimental-features = [ "nix-command" "flakes" ];
```

</details>

<details>
<summary>用实验性功能真的没问题吗？</summary>

Flakes 和 Nix command 因其实用性已经成为事实上的标准，普及程度之高，已经到了无法再被删除或大幅改动的地步。今后学习 Nix 没有理由回避它们，因此本书以这些功能为基础进行讲解。

顺带一提，尽管 Flakes 和 Nix command 已经如此普及，以它们为主线讲解的资料却寥寥无几——这也是笔者撰写本书的原因之一。

</details>

## 笔者的环境

本书中出现的代码在以下两种环境中都做过验证：

| CPU    | 运行环境               | Nix 版本 |
| ------ | ---------------------- | --------------- |
| x86_64 | Ubuntu 22.04 (Docker)  | Nix 2.20        |
| x86_64 | NixOS (nixos-unstable) | Nix 2.18        |

只要是 Linux，应该都能正常运行。
至于 macOS，因为笔者没有 Mac，所以没有做过验证。如果遇到问题，欢迎随时提交 [issue](https://github.com/asa1984/nix-zenn-articles)。
