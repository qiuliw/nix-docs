---
title: "附录B. NixOS"
description: "附录B. NixOS"
order: 24
---

这是为对本书未涉及的 NixOS 感兴趣的读者准备的链接集。

## 入门资料

### NixOS & Flakes Book

这是一本可以学习基于 Flakes 的 NixOS 用法的书。作为 NixOS 的入门读物，它是最值得推荐的文档。

https://nixos-and-flakes.thiscute.world

### nix-starter-configs

这个并非文档，而是 NixOS 配置的模板。它会帮助你迈出第一步。

https://github.com/Misterio77/nix-starter-configs

## 博客

### 用 NixOS 与 Raspberry Pi 搭自宅服务器（NixOSとRaspberry Piで自宅server）

这是 [ymgyt](https://github.com/ymgyt) 所写的、共 5 部分的博客系列。其中介绍了如何用 NixOS 和 Raspberry Pi 搭建家庭服务器。文中涉及了使用 [deploy-rs](https://github.com/serokell/deploy-rs) 部署 NixOS、以及用 [ragenix](https://github.com/yaxitech/ragenix) 管理机密信息等 NixOS 特有的主题。

https://blog.ymgyt.io/entry/homeserver-with-nixos-and-raspberrypi-install-nixos/

### Tailscale on NixOS: A new Minecraft server in ten minutes

文中介绍了如何利用 VPN 服务 [Tailscale](https://tailscale.com) 与 NixOS 搭建 Minecraft 服务器。读完你会发现，当 Tailscale 带来的网络抽象与 NixOS 的声明式配置结合在一起时，搭建服务器会变得简单得可怕。

https://tailscale.com/blog/nixos-minecraft

### 我日常使用的 OS：NixOS（ぼくが普段使っているOS - NixOS）

这是促使笔者开始使用 NixOS 的文章之一。

https://tech.dely.jp/entry/2018/12/03/110227

## 视频

### Nix in 100 Seconds

虽然标题写的是 Nix，但内容几乎都是对 NixOS 的讲解。

https://youtu.be/FJVFXsNzYZQ?si=X5fVZeWxkSjz1qp-

## dotfiles

NixOS 的 dotfiles 与其他 Linux 发行版有着不一样的风味。下面列举的这些 dotfiles，单看 star 数就已经相当离谱了，而且每一个都在进行着有趣的尝试，请务必去看一看。

https://github.com/Mic92/dotfiles
https://github.com/fufexan/dotfiles
https://github.com/Misterio77/nix-config
https://github.com/ryan4yin/nix-config
