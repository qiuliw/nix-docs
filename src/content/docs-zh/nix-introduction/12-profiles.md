---
title: "Profiles"
description: "Profiles"
order: 12
---

为了避免把问题复杂化，到目前为止我们一直回避了全局安装这个话题。全局安装是一种会改变系统全局状态的操作，看上去与我们至今学到的 Nix 的种种特性截然相反。

即便是在全局安装这件事上，Nix 也有着非常独特的机制。有了它，全局安装就变成了一种不会污染用户环境的干净操作，也使得 Nix 能够与其他包管理器共存。同时，这一机制还是本书未涉及的 NixOS 与 home-manager 的基础。

本章将介绍 Nix 的软件包配置管理机制 **Profiles**^[[6.1. Profiles - Nix Reference Manual](https://nixos.org/manual/nix/stable/package-management/profiles)]。

## Profile

假设我们全局安装了 `hello`，来看看它的 PATH。

```bash
$ which hello
/home/<用户名>/.nix-profile/bin/hello
```

可以看到它位于一个名为 `~/.nix-profile` 的神秘目录之下。用 Nix 安装的东西不是全都应该保存在 Nix Store 里吗？

其实，上面这个文件是一个**符号链接**，`~/.nix-profile/bin/hello` 链接到了 Nix Store 下的 Store 对象。

```bash
$ readlink $(which hello)
/nix/store/7bl684y3qpxrv01ird085rpf5kl6rk6f-hello-2.12.1/bin/hello
```

接下来我们再看看 `~/.nix-profile` 内部。

```
~/.nix-profile
├─/bin
├─/etc
├─/include
├─/lib
├─/libexec
├─/sbin
└─/share
```

这是典型的类 UNIX 系统的目录结构。放在这里的文件全都是链接到 Store 对象的符号链接。

这种仅由指向 Store 对象的符号链接构成的目录，就称为 **Profile**。

## Profile 的世代功能

其实 `~/.nix-profile` 本身也是一个符号链接。

```bash
$ readlink ~/.nix-profile
/home/<用户名>/.local/state/nix/profiles/profile
```

而它的链接目标同样还是符号链接……

```bash
$ readlink ~/.local/state/nix/profiles/profile
profile-7-link
$ readlink ~/.local/state/nix/profiles/profile-7-link
/nix/store/nqgsdc76ahkzgk4ysdhqjakmci4720iw-profile
```

最终竟然追踪到了 Nix Store。

Profile 与普通的 Nix 软件包一样，都是由 Nix 构建出来的。虽说是构建，其实只是为 Store 对象创建符号链接而已。
在 Nix 中，全局的安装/卸载/升级都意味着构建一个新的 Profile。安装软件包，就是构建一个新增了符号链接的 Profile；卸载，就是构建一个排除了目标符号链接的 Profile；升级，则是构建一个把目标符号链接改为指向更新的 Store 对象的 Profile。

`~/.local/state/nix/profiles` 目录下保存着过去的各个 Profile。当 Profile 发生变更时，Nix 并不会直接修改当前的 Profile，而是构建一个全新的 Profile，再把符号链接的目标切换到新的 Profile 上。正因如此，软件包配置的变更才成为一种安全的操作。

更进一步，利用过去的 Profile 保持不变这一点，还可以回滚软件包配置。例如想把软件包配置退回到上一个状态时：在前面的例子中，当前 Profile 链接到的是 `~/.local/state/nix/profiles` 下的 `profile-7-link`，也就是第 7 代 Profile，那么只要把它重新链接到上一代的 `profile-6-link` 即可。

## 多用户

在用 Nix Store 统一管理软件包的同时，借助 Profiles 还能支持多用户。

（请注意，下图的符号链接结构与前文示例略有不同。）

![多用户场景下使用 Profile 的示意图](https://nixos.org/manual/nix/stable/figures/user-environments.png)
_[Nix Reference Manual - 6.1.Profiles](https://nixos.org/manual/nix/stable/package-management/profiles)_

## Profiles 的应用

Profiles 是 NixOS、home-manager 等工具的基石。

### NixOS

NixOS 是一个把 Profiles 扩展到系统级、从而能够执行 root 权限操作的 Linux 发行版。Nix 在用户主目录下进行操作，而 NixOS 则把符号链接放置在 `/etc`、`/run` 等位置。
更进一步，NixOS 把世代功能扩展到了引导加载器层面，万一操作系统无法启动，也可以从引导加载器恢复到安全的世代环境。

另外，Nix 本体的 Profiles 是通过命令操作以过程式的方式进行安装的，而 NixOS 则可以用 Nix 语言来描述要安装的软件包和操作系统的环境配置，从而以声明式的方式管理 Profiles。各种实用配置都被做成了可复用的 NixOS modules，能够大幅简化环境搭建工作。

### home-manager

home-manager 是由 [nix-community](https://github.com/nix-community) 开发的声明式用户环境搭建工具。与 NixOS 一样，它也能以声明式的方式管理 Profiles；区别在于 NixOS 面向的是系统区域，而 home-manager 专注于用户环境的管理。它把大量面向用户环境的配置做成了模块，许多 NixOS 用户都会同时使用 home-manager。
