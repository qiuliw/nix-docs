---
title: "用 NixOS 打造最强 Linux 桌面"
description: "nixos / nix / linux / dotfiles"
order: 3
---

随着 Web 与跨平台应用的发展，以及 [Proton](https://partner.steamgames.com/doc/steamdeck/proton?l=japanese) 让 Windows 游戏得以在 Linux 上运行，如今的 Linux 桌面在功能层面已经达到了不逊色于 Windows 和 Mac 的水准。

然而与这份发展相反，它的占有率至今依然极低。对 Linux 桌面心怀憧憬、但真要用起来就算了吧——抱持这种想法的人恐怕占了多数。究其原因，大致可以归结为以下三点。

1. 为了搭建环境必须经历繁琐的步骤，很折磨
2. 搞不清楚什么配置被写到了哪里
3. 总担心一不小心就把环境搞坏，心里发怵

其实，存在一个能漂亮地解决上述课题、宛如梦境般的 Linux 发行版。
它的名字是……

![NixOS](https://upload.wikimedia.org/wikipedia/commons/c/c4/NixOS_logo.svg)
_Logo 很帅_

这次我们就用 NixOS 来打造一个「我心目中最强的 Linux 桌面环境」吧。

## NixOS 是什么？

> NixOS: A Purely Functional Linux Distribution

NixOS 是一个以纯函数式包管理器 **Nix** 为基础的 Linux 发行版。在 NixOS 中，你竟然可以完全以声明式的方式完成环境搭建。也就是说，只要用代码描述出你期望的环境状态并交给 NixOS 处理，它就会自动完成软件包的安装与系统的配置。

「哎，自动安装加自动配置？依赖关系不会出问题吗？🤔」
对于产生这种疑问的读者，请放心。NixOS 的环境搭建是以 Nix 的构建这一形式进行的。Nix 拥有强大的构建系统，可复现性极高^[NixOS 最小化 ISO 的构建可复现性已达到 100%。]。在 NixOS 上，与依赖关系相关的问题几乎不会发生。

下面是我过去进行环境重建 RTA 的记录^[~~当时我使用 [Hyprland](https://hyprland.org) 作为桌面环境，现在改用 Xorg + XMonad。~~ 2024 年 2 月又从 XMonad 迁回了 Hyprland。]。

[https://twitter.com/asa_high_ost/status/1626605553123467264?s=20](https://twitter.com/asa_high_ost/status/1626605553123467264?s=20)

虽然显示约 20 分钟，但其中大部分是下载与安装处理的时间，实际手动敲命令的时间连 5 分钟都不到。

是不是有点兴趣了？
要了解 NixOS，首先需要了解包管理器 Nix。让我们细细道来。

## Nix

> Nix is a powerful package manager for Linux and other Unix systems that makes package management reliable and reproducible.

『_Nix_』在拉丁语中意为『_雪的结晶_』。作为包管理器，它具有以下特点。

- 高可复现性
- 拥有超过 8 万个软件包的官方软件包仓库 [nixpkgs](https://github.com/NixOS/nixpkgs)
  - 提供稳定版分支与滚动发布分支
- 可在 UNIX 系系统（各类 Linux、macOS）上使用

Nix 本身是独立于 NixOS 的通用工具。

Nix 不只是一个单纯的包管理器，它是集自有构建系统、被称为 Profiles 的环境构建功能等于一体的复合型软件。NixOS 的各项功能，都是以扩展 Nix 原有功能的形式实现的。本文将重点说明以下三项内容。

1. Derivation 与 Nix store
2. Nix 语言
3. Profiles
4. Flakes

让我们依次来看。

### Derivation 与 Nix store

Nix 的构建系统把软件包当作函数式语言中的值来对待。也就是说，软件包由无副作用的、引用透明的函数生成，且生成物按不可变的方式处理。

用 Nix 构建软件包后，会在 `/nix/store` 目录下创建一个名字中包含如下哈希值的子目录，构建产物就存放在其中。

```shell:Git 版本 2.41.0
                                          Package
                                            ┌┴┐
/nix/store/y0gvg44jdsbn8hnnr27ixjf102nk7a9x-git-2.41.0/
           └──────────────┬───────────────┘     └──┬──┘
                        Hash                    Version
```

Nix 使用一种被称为 **Derivation** 的东西来构建软件包。
简单来说，Derivation 就是一份极其严格的软件包配方。Derivation 把用于确定一个软件包的全部要素（依赖关系、源代码、构建脚本、环境变量、shell、系统架构等）都作为**输入**来处理。基于这些输入进行哈希计算，再把结果作为软件包的标识符附加到目录名上。只要输入相差哪怕 1 bit，就会得到完全不同的哈希值，因此软件包之间能被严格区分。

作为示例，这里附上一个在控制台输出 `Hello, World!` 的 Rust 程序的 Derivation。因为很长，所以折叠起来了。

<details>
<summary>hello-rs 的 Derivation</summary>

实际的 Derivation 以 `.drv` 文件的形式存放在 Nix store 中，下面是用 `nix derivation show` 命令以 JSON 格式美化输出后的结果。

- `builder`: 执行构建的 shell
- `env`: 环境变量
- `inputDrvs`: 依赖关系（Derivation）
- `inputsSrcs`: 源
- `outputs`: 放置构建产物的目录
- `system`: 系统架构

作为依赖关系，`inputDrvs` 中指定了 `/nix/store/9pvlx7xb9h7xbvmfmkvp54i8sa34pa6f-rustc-1.70.0.drv`（Rust 编译器的 Derivation）等。

```json
{
  "/nix/store/1b6b4lh490crvsdypk1nnv1qa6w3hzm5-hello-rs.drv": {
    "args": [
      "-e",
      "/nix/store/6xg259477c90a229xwmb53pdfkn6ig3g-default-builder.sh"
    ],
    "builder": "/nix/store/51sszqz1d9kpx480scb1vllc00kxlx79-bash-5.2-p15/bin/bash",
    "env": {
      "PKG_CONFIG_ALLOW_CROSS": "0",
      "__structuredAttrs": "",
      "buildInputs": "",
      "builder": "/nix/store/51sszqz1d9kpx480scb1vllc00kxlx79-bash-5.2-p15/bin/bash",
      "cargoBuildFeatures": "",
      "cargoBuildNoDefaultFeatures": "",
      "cargoBuildType": "release",
      "cargoCheckFeatures": "",
      "cargoCheckNoDefaultFeatures": "",
      "cargoCheckType": "release",
      "cargoDeps": "/nix/store/w7grdh3xyk94ahc4q2jh0rjlgcpsj981-cargo-vendor-dir",
      "cmakeFlags": "",
      "configureFlags": "",
      "configurePhase": "runHook preConfigure\nrunHook postConfigure\n",
      "depsBuildBuild": "",
      "depsBuildBuildPropagated": "",
      "depsBuildTarget": "",
      "depsBuildTargetPropagated": "",
      "depsHostHost": "",
      "depsHostHostPropagated": "",
      "depsTargetTarget": "",
      "depsTargetTargetPropagated": "",
      "doCheck": "1",
      "doInstallCheck": "",
      "mesonFlags": "",
      "name": "hello-rs",
      "nativeBuildInputs": "/nix/store/mkplk6shr1lvy3w0n2hpmkvv4rvkqa70-auditable-cargo-1.70.0 /nix/store/xv57wrly4ixy2d7lzajixfhzhyx54cbx-cargo-build-hook.sh /nix/store/9cd8rx3xfbqzihqwzfncbsn3bzqzdz7r-cargo-check-hook.sh /nix/store/1nq92m0mn1k9a8lbx6jcj00dbdw48j01-cargo-install-hook.sh /nix/store/3fk9yaj769bn5g6557xj512m8qix0h14-cargo-setup-hook.sh /nix/store/rdxwgdyfj0sa7sz6p4c6fp3irlhnwixn-rustc-1.70.0",
      "out": "/nix/store/hgaxjl9qvcla891yg6ipzphnl6sgj0hw-hello-rs",
      "outputs": "out",
      "patchRegistryDeps": "/nix/store/nk6b2ckznjic5wj8ddw0wgdrn4mbz3lg-patch-registry-deps",
      "patches": "",
      "postUnpack": "eval \"$cargoDepsHook\"\n\nexport RUST_LOG=\n",
      "propagatedBuildInputs": "",
      "propagatedNativeBuildInputs": "",
      "src": "/nix/store/xzl1xr811d6s1n4dgnk0xw8vrvsm6j0b-12v8dj6mcqpmrlsskcfd283sgi99zqpf-source",
      "stdenv": "/nix/store/blpvf60m29q02c0lc5fyhim30ma4y1vv-stdenv-linux",
      "strictDeps": "1",
      "system": "x86_64-linux"
    },
    "inputDrvs": {
      "/nix/store/29yjg4ilzpdwh4m45lv6c4m5v2lppsn2-bash-5.2-p15.drv": ["out"],
      "/nix/store/5yzp580n67ikaz10fylp82x97z8g8rni-cargo-check-hook.sh.drv": [
        "out"
      ],
      "/nix/store/9pvlx7xb9h7xbvmfmkvp54i8sa34pa6f-rustc-1.70.0.drv": ["out"],
      "/nix/store/fgc4aafdrqczbdga0fp5kds7r01ka28x-stdenv-linux.drv": ["out"],
      "/nix/store/gq69b4678qsswsqhfs3yzxla1qfxp1m9-cargo-setup-hook.sh.drv": [
        "out"
      ],
      "/nix/store/l8h3lmhbxvhndjb88qf5b84wk01f2xdj-cargo-vendor-dir.drv": [
        "out"
      ],
      "/nix/store/vmkhqrbba05vvz8gr5sc93yggkhrd0fk-cargo-install-hook.sh.drv": [
        "out"
      ],
      "/nix/store/zpi7glnyk7dwcbjwrnf970xh5466lwi8-cargo-build-hook.sh.drv": [
        "out"
      ],
      "/nix/store/zzax3dvxcll8aq0qw23phjxlim727hhi-auditable-cargo-1.70.0.drv": [
        "out"
      ]
    },
    "inputSrcs": [
      "/nix/store/6xg259477c90a229xwmb53pdfkn6ig3g-default-builder.sh",
      "/nix/store/nk6b2ckznjic5wj8ddw0wgdrn4mbz3lg-patch-registry-deps",
      "/nix/store/xzl1xr811d6s1n4dgnk0xw8vrvsm6j0b-12v8dj6mcqpmrlsskcfd283sgi99zqpf-source"
    ],
    "name": "hello-rs",
    "outputs": {
      "out": {
        "path": "/nix/store/hgaxjl9qvcla891yg6ipzphnl6sgj0hw-hello-rs"
      }
    },
    "system": "x86_64-linux"
  }
}
```

</details>

#### 多版本共存

所谓的 Dependency Hell（依赖地狱），源于多个软件分别依赖同一软件包的不同版本。如果被依赖的版本之间引入了破坏性变更，依赖它的软件中就可能有一方无法正常工作。

用 Nix 安装不同版本的软件包时，由于 Derivation 的输入发生了变化，输出的哈希值必然随之改变，从而被放置到彼此独立的目录中。

下面是我的环境中 Nix store 里 openssl 的一部分。可以看到多个版本共存。
其中有些版本号是重复的，但在 Nix 中，只要输入不完全一致，该软件包就会被视作不同的东西。在 Nix 里，软件包的版本号只不过是面向人类的语义标记而已。

```shell :openssl
h7zllwcidvkg8i5v6hkf49n3sd5lq290-openssl-3.0.5/
hggh523whplc4bk681c95r52bsjc2wb5-openssl-3.0.9/
ii5lq0igwk9xpq16s98yqswsgr1dbfi2-openssl-3.0.9/
ijk9j536zs30kha06rr966gplwxd7fbg-openssl-3.0.8/
ip9kk8kla5bff32mqjmwdn29sbhyd19c-openssl-3.0.8/
iw4cmla0978f1lgn23lmqmra3lrfwd4a-openssl-3.0.9/
```

#### 排除隐式依赖

Derivation 中至关重要的一点是：**输入以外的任何要素都无法影响构建**。Nix 会在 Derivation 指定的 shell 中，引入同样由 Derivation 指定的依赖关系与环境变量，启动一个**纯粹的**环境。在其中执行构建脚本，构建便告完成。

假设某个软件包依赖于开发环境中全局安装的软件包 X，而开发者忘记把软件包 X 写进依赖关系，那么由于 Nix 的纯粹构建环境中不会引入软件包 X，构建就会失败。也就是说，所有依赖关系都被摆到明面上，隐式依赖被彻底排除。

#### 二进制缓存

Nix 在安装软件包时必定会对 Derivation 求值，照理说本地总会跑一遍构建、耗费大量时间；但实际的安装速度快得惊人。
其实在 Nix 的官方软件包仓库 [nixpkgs](https://github.com/NixOS/nixpkgs) 中，有一个叫 [Hydra](https://github.com/NixOS/hydra) 的 CI 系统在持续缓存软件包的构建结果。

1. 从软件包仓库获取 Nix 表达式（后述）
2. 生成 Derivation
3. 用 Derivation 的哈希值向 Hydra 的缓存查询
4. 若缓存存在，则直接下载已构建好的二进制

Nix 的构建系统保证了只要哈希相同、构建结果就相同，因此可以在不损害可复现性的前提下加速安装。

### Nix 语言

Derivation 并不是让人直接读写的东西，而是借助用 Nix 的 DSL——**Nix 语言**写成的 **Nix 表达式**来生成。下面是用于构建前述 `hello-rs` 软件包的 Nix 表达式。

```nix :default.nix
{ pkgs ? import <nixpkgs> { }, ... }: {
  hello-rs = pkgs.rustPlatform.buildRustPackage {
    name = "hello-rs";
    src = ./.;
    cargoLock = { lockFile = ./Cargo.lock; };
  };
}
```

在 Nix 语言中，一个文件就是一个函数表达式。

```
{参数}: 输出
```

`pkgs ? import <nixpkgs> { }` 的含义是：当 `pkgs` 未作为参数给出时（为什么要绕这么一圈，后文会讲），就导入 nixpkgs。`<nixpkgs>` 表示本地已下载的 nixpkgs 的文件路径。nixpkgs 的实体是一组 Nix 表达式的集合。

本例的输出以 `key = vlue;` 的形式罗列，这种数据结构称为 **Attribute Set**。上述输出的 Attribute Set 中，键 `hello-rs` 对应的值是该软件包的 Derivation。
为了创建 Derivation，这里使用了 `pkgs.rustPlatform.buildRustPackage` 这个工具函数。由此可见，`pkgs`（= nixpkgs）同时也是 Nix 语言的库。

Nix 表达式说到底只是输出了一些数据而已，单凭它本身什么也做不了。只有当命令对 Nix 表达式求值时，软件包才会被真正构建出来。

```shell :构建命令
nix-build
```

实际构建之后，执行命令的目录下会出现一个名为 `result` 的符号链接。链接目标就是 Nix store 中构建产物的实体。

```shell
$ readlink ./result
/nix/store/hgaxjl9qvcla891yg6ipzphnl6sgj0hw-hello-rs
```

#### nix-shell

在 Nix 中，借助 Derivation 还能构建软件包之外的各种东西。

我们准备下面这个 Nix 表达式。它从刚才的 Nix 表达式中导入 hello-rs 的 Derivation，并用 `let in` 语法声明为 `hello-rs`。

```nix :shell.nix
{ pkgs ? import <nixpkgs> { }, ... }:
let
  hello-rs = (import ./default.nix pkgs).hello-rs;
in
pkgs.mkShell {
  buildInputs = [
    hello-rs
  ];
}
```

用 `nix-shell` 命令对 `shell.nix` 求值。

```
bash-5.1# nix-shell
# 开始构建软件包

[nix-shell:~/hello-rs]# hello-rs
Hello, world!

[nix-shell:~/hello-rs]# exit
exit

bash-5.1# hello
bash: hello: command not found
```

于是启动了一个临时配置好软件包路径的 shell 环境。这在准备开发环境时是非常方便的功能。

### Profiles

要让软件包真正可用，还需要把命令加入 PATH、把文件放置到合适位置等安装处理。Nix 的做法是：把软件包的实体文件统一管理在 `/nix/store` 中，再在需要的位置放置符号链接^[很像 [pnpm](https://pnpm.io/ja/) 吧。顺带说一句，Nix 出现得更早。]。

> 以下 shell 命令的执行结果，是在官方 Docker 镜像 [nixos/nix](https://hub.docker.com/r/nixos/nix) 上运行得到的。这个 Docker 镜像并非 NixOS，只是一个装好了 Nix 的环境。

Nix 不使用 `/usr/bin` 之类的全局目录，而是把符号链接放置在 `~/.nix-profile` 下。其内容如下所示，是一个我们熟悉的目录结构。

```shell
$ ls ~/.nix-profile
bin  etc  lib  libexec  manifest.nix  sbin  share
```

看一下用 Nix 安装的 curl 的 PATH，结果如下。PATH 指向的是 `~/.nix-pforile/bin` 中的符号链接。

```shell
$ echo $PATH
/root/.nix-profile/bin:（中略）

$ which curl
/root/.nix-profile/bin/curl

$ readlink $(which curl)
/nix/store/52fbv6j49khca4cfvwm35fqd984w2520-curl-7.86.0-bin/bin/curl
```

另外，`.nix-profile` 本身也是由 Nix 构建的，同样是一个符号链接。

```shell
$ readlink ~/.nix-profile
/nix/var/nix/profiles/default
```

在 `.nix-profile` 的实体文件所在的位置，放置着多个 Profile。而且它们全都是符号链接，结构与 `.nix-profile` 的内容相同。

```
$ readlink ~/.nix-profile
/nix/var/nix/profiles/default

$ ls -l /nix/var/nix/profiles/
default -> default-4-link
default-1-link -> /nix/store/d8c5588zaaylx31hax59j4pjj9pcik88-user-environment
default-2-link -> /nix/store/15nriql44lwh2dw9q5x8p22kaa882maz-profile
default-3-link -> /nix/store/hf0yc0syc71y9yryn9qqyhsq4i7kj0hi-profile
default-4-link -> /nix/store/15nriql44lwh2dw9q5x8p22kaa882maz-profile
per-user
```

Profiles 的机制如下图所示。每当执行针对软件包的操作（安装、卸载、更新）时，Nix 都会构建一个新的 Profile，并把 `default` 链接到它。

![图片](https://nixos.org/manual/nix/stable/figures/user-environments.png)
_引用自：[Profiles - Nix Reference Manual](https://nixos.org/manual/nix/stable/package-management/profiles.html)_

#### 不污染全局

由 Nix 管理的一切都被隔离在封闭的环境中，因此即便系统中存在其他包管理器，也不会与既有环境冲突。在 NixOS 之外的系统上也能安全地引入。

#### Profile 的回滚

对 Profile 的操作始终是非破坏性的，过去的 Profile 不会被覆盖，而是原样保留下来。利用这一点，只要把 `default` 的链接目标切换到任意世代的 Profile，就能回滚环境。

#### Profiles 中的安装/卸载

在 Nix 中，一般意义上的卸载命令**并不存在**。实际执行相当于卸载的命令时，只是重新构建了一个去掉了对应符号链接的 Profile，实体文件依然留在 Nix store 中。
放任不管会把存储空间耗尽，因此 Nix 内置了垃圾回收功能。设定周期后，它会自动删除 Nix store 中未被任何 Profile 链接的软件包。也可以用命令手动执行 GC。

## Flakes

其实，用 Nix 语言构建软件包存在若干问题。

1. 依赖于本地的软件包集合
2. 接口不统一

软件包集合的种类与版本，在每台机器上都可能不同。前面举例的 Nix 表达式中，`pkgs` 用 `import <nixpkgs> {}` 导入了本地的软件包集合，于是构建结果会因执行环境而异。
另外，`nix-build`、`nix-shell` 等命令虽按功能拆分开来，但这并未体现在 Nix 语言的语义中。这样一来，不同用途就得有多个入口点，很不好用。

解决这些问题的，正是 Nix 的项目管理功能 Flakes。Flakes 以与 Git 配合使用为前提，只要在 Git 仓库的根目录放置一个名为 `flake.nix` 的文件即可使用。

<details>
<summary>Nix channels</summary>

相对于 Flakes，旧版 Nix 的软件包仓库管理机制被称为 **Channels**。Channels 会订阅软件包仓库，并自动更新本地的软件包集合。也可以通过命令注册、订阅 nixpkgs 之外的软件包仓库。出于对可复现性的追求，如今的主流是 Flakes。

</details>

### flake.nix

`flake.nix` 的结构很简单，只有用于指定所依赖的外部 Flake（由 `flake.nix` 管理的 Git 仓库）的 `inputs`，以及可以定义任意 Nix 表达式的 `outputs`。

```nix :flake.nix
{
  inputs = {
    # 指定所依赖的 Flake
  };
  outputs = inputs: {
    # 在这里定义任意 Nix 表达式
  };
}
```

### inputs

Flakes 中不存在默认的软件包仓库。所有软件包仓库都必须作为依赖关系显式指定。
如果想使用 nixpkgs，就按下面这样写。

```nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs";
  };
  outputs = inputs: {};
}
```

这里导入的是 nixpkgs，准确地说是 nixpkgs 的 Flake。GitHub 仓库可以用 `github:<所有者>/<仓库>/<分支>` 的格式指定。Flakes 用户想要公开自己的项目时，只需把 Flake 上传到 GitHub 就行了。

此外，Flakes 会通过 `flake.lock` 文件**用 Git 的提交哈希来锁定版本**。用命令对 `flake.nix` 求值时，会获取当时最新的 `inputs` 中的 Flake，并生成 `flake.lock`。

<details>
<summary>flake.lock 的内容与提交哈希</summary>

可以确认 `flake.lock` 中的 `nodes.nixpkgs.rev` 与 nixpkgs 仓库的提交哈希是一致的。
[https://github.com/NixOS/nixpkgs/commit/d4d822f526f1f72a450da88bf35abe132181170f](https://github.com/NixOS/nixpkgs/commit/d4d822f526f1f72a450da88bf35abe132181170f)

```diff json :flake.lock
{
  "nodes": {
    "nixpkgs": {
      "locked": {
        "lastModified": 1688789517,
        "narHash": "sha256-2UpFTJ/bkWCs9Cs7ocko10U7b40VaI5+x57LDun52q4=",
        "owner": "nixos",
        "repo": "nixpkgs",
+       "rev": "d4d822f526f1f72a450da88bf35abe132181170f",
        "type": "github"
      },
      "original": {
        "owner": "nixos",
        "repo": "nixpkgs",
        "type": "github"
      }
    },
    "root": {
      "inputs": {
        "nixpkgs": "nixpkgs"
      }
    }
  },
  "root": "root",
  "version": 7
}
```

</details>

### outputs

`outputs` 是一个以 `inputs` 为参数的函数表达式。输出中可以指定软件包、开发用 shell、模板、NixOS modules（后述）等各种各样的东西。可指定的项目在 [Flakes - NixOS Wiki](https://nixos.wiki/wiki/Flakes) 中有罗列。

```nix :hello-rs 的 flake.nix
outputs = inputs: {
  packages."<system>"."<name>" = derivation;
  devShells."<system>"."<name>" = derivation;
  # templates, apps, formatter, overlays, nixosModules, etc...
};
```

例如，`packages` 可通过 `nix build`、`nix shell`、`nix run` 使用，`devShells` 则可通过 `nix develop` 使用。这样一来，多种用途就统一到了一个入口点。

### Nix command

以 `nix <subcommand>` 形式提供的命令体系称为 **Nix command**。Nix command 在内部使用 Flakes，借助 Flakes 的依赖关系管理来保障更为牢固的可复现性。

#### `nix build`

这是 `nix-build` 的 Nix command 版本，用于对 `outputs` 中的 `packages` 求值。
我们试着把 hello-rs 改造成 Flake 并使用。下面创建了这样一个 `flake.nix`。
它导入 `inputs` 中的 nixpkgs 并绑定到 `pkgs`，`packages` 中则导入了前面那个 Nix 表达式。之所以要写成 `pkgs ? import <nixpkgs> {}` 这种绕弯子的形式，是为了让非 Flakes 的传统命令也能对它求值。

```nix :hello-rs 的 flake.nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs";
  };
  outputs = inputs:
  let
    pkgs = import inputs.nixpkgs {
      system = "x86_64-linux";
    };
  in
  {
    packages."x86_64-linux" = import ./default.nix pkgs;
  };
}
```

用以下命令构建。由于 Flakes 经由 Git 追踪文件，与构建相关的文件必须已被暂存或提交。
Nix command 的参数以 `<Flake 的位置>#<名称>` 的形式给出。

```shell
git add .
nix build .#hello-rs
```

也可以引用远程的 Flake。指定 Flake 的写法与 `flake.nix` 中 `inputs` 的 url 记法格式相同。

```shell
nix build github:nixos/nixpkgs#git
```

#### `nix run`

与 `nix build` 一样会对 `packages` 求值，但它会在构建完成后执行一次随即结束，不会创建 `result` 目录。

#### `nix shell`

这是 `nix-shell` 的 Nix command 版本。`nix-shell` 有两种用法：准备一个 `shell.nix`，或者用 `nix-shell -p <软件包名>` 直接指定软件包；在 Nix command 中，前者被分离为 `nix develop`，后者为 `nix shell`。

#### `nix develop`

用于对 `devShell` 求值，是极其便利的开发环境构建功能。
准备下面这个 Nix 表达式，再执行 `nix develop` 命令，就会启动一个装有 Deno 的 bash。

```nix
{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/master";

  outputs = inputs: let
    pkgs = import inputs.nixpkgs {
      system = "x86_64-linux";
    };
  in {
    devShells."x86_64-linux".default = pkgs.mkShell {
      buildInputs = with pkgs; [
        deno
      ];
    };
  };
}
```

另外，如果与 [direnv](https://github.com/direnv/direnv)（进入存在 `.envrc` 文件的目录时会自动设置环境变量）配合使用，就能获得「只要切换目录，开发环境就自动启动」的绝佳开发体验（需要 [nix-direnv](https://github.com/nix-community/nix-direnv)）。

```shell
echo "use flake" >> .envrc
direnv allow # 启用 direnv
```

## NixOS 的功能

NixOS 扩展了 Nix 的 Profiles，使得需要 root 权限的系统级配置也能通过 Profiles 完成。它会在用户环境的 Profile——`profile` 之外，另行创建一个名为 `system` 的 Profile。

```shell
$ ls /nix/var/nix/profiles/system
activate  append-initrd-secrets  bin  boot.json  dry-activate  etc
extra-dependencies  firmware  init  init-interface-version  initrd
kernel  kernel-modules  kernel-params  nixos-version  specialisation
sw  system  systemd
```

放置在 `/etc` 下的各类配置文件、内核模块、服务、系统级命令等，都以符号链接的形式被放置于此。

### NixOS modules

这是 NixOS 最大的特色，也是极其便利的功能。有了它之后，我已经离不开它来用 Linux 了。

NixOS modules 是用 Nix 语言以声明式方式描述环境的功能。
作为示例，下面展示配置起来颇为麻烦的 IME 与字体相关的模块。

```nix
{pkgs, ...}: {
  i18n.inputMethod = {
    enabled = "fcitx5";
    fcitx5.addons = [pkgs.fcitx5-mozc];
  };

  fonts = {
    fonts = with pkgs; [
      noto-fonts-cjk-serif
      noto-fonts-cjk-sans
      noto-fonts-emoji
      nerdfonts
    ];
    fontDir.enable = true;
    fontconfig = {
      defaultFonts = {
        serif = ["Noto Serif CJK JP" "Noto Color Emoji"];
        sansSerif = ["Noto Sans CJK JP" "Noto Color Emoji"];
        monospace = ["JetBrainsMono Nerd Font" "Noto Color Emoji"];
        emoji = ["Noto Color Emoji"];
      };
    };
  };
}
```

写好之后执行 `nixos-rebuild switch` 命令，日文 IME 就会被启用，日文字体（Noto Fonts）也会被设为默认字体。

### 回滚功能

即便可复现性再高、能以声明式方式描述，写错配置把系统搞坏的可能性依然存在。
不过不用担心！NixOS 连系统环境也能回滚。在 NixOS 中，竟然可以利用上一世代的 Profile，直接从引导加载程序回滚环境。

![NixOS 的回滚](https://nixos.org/images/screenshots/nixos-grub.png)
_引用自：[Guides - How Nix Works - NixOS](https://nixos.org/guides/how-nix-works.html)_

就算配置搞砸了、陷入 Linux 无法启动的境地，只要重启后从引导加载程序加载一个安全的世代，就能立刻恢复。

**_把系统搞坏？管它呢！老子可是 NixOS！_**

## 安装操作系统

久等了。从这里开始我们就动手实操吧！

NixOS 提供了图形化安装器，我们就用它。请从下面的链接下载 ISO 并烧录到 U 盘。推荐使用 [ventoy](https://www.ventoy.net/en/index.html) 这个工具。

[https://nixos.org/download.html](https://nixos.org/download.html)

<details>
<summary>使用最小化 ISO 安装</summary>

想从控制台安装的读者，请下载 Minimal ISO image。安装手册的 *Installing NixOS* 中的 *Manual Installation* 一节写明了全部步骤。
按步骤安装完成后，别忘了用 `passwd` 给创建的用户设置密码。

> 步骤本身并不难，但其中包含一些 NixOS 特有的操作，因此初次接触的读者建议按照本文的方式，先用图形化安装器来安装。

[https://nixos.org/manual/nixos/stable/index.html#sec-installation](https://nixos.org/manual/nixos/stable/index.html#sec-installation)

</details>

<details>
<summary>与 Windows 双系统启动</summary>

1. 在 Windows 的设置中解除 BitLocker 加密
2. 在 BIOS/UEFI 中禁用 Secure Boot
3. 启动安装器后，用 Gparted 调整 Windows 存储分区的大小

如果 BitLocker 加密处于启用状态，禁用安全启动后登录 Windows 时会被要求输入恢复密钥，很麻烦，所以先关掉。关于存储分区的调整，Windows 自带工具无法缩小已碎片化的分区，因此请用 NixOS 安装器中内置的 Gparted 来缩小。

</details>

### NixOS installer

从引导加载程序中选择最上面的项目启动后，会出现这样的画面。对 Linux 桌面来说这是很常见的安装器。

![NixOS installer](/images/nixos-is-the-best/installer.png)

我们从安装器中逐项设置所需内容。先把安装器切换成日语。

![NixOS installer](/images/nixos-is-the-best/installer-lang.png)

选择区域设置。我把系统语言设为英语（en_US.utf-8），不过这里还是姑且选日语。至于数值与日期的区域设置，考虑到命令中日期显示成「○月○日」的样子会很别扭，这里选择 American English。

![Location](/images/nixos-is-the-best/installer-location.png)

键盘布局。我用的是 US 布局，所以选了它。可以在下面的输入框中打字来确认。

![Keyboard](/images/nixos-is-the-best/installer-keyboard.png)

设置用户名和密码。

![User](/images/nixos-is-the-best/installer-user.png)

选择桌面环境。凭喜好即可，如果没有特别偏好，就选与安装器相同的 GNOME 吧。之后用 NixOS modules 可以轻松更改，所以不必太在意。

![Desktop](/images/nixos-is-the-best/installer-desktop.png)

这里询问是否允许专有软件包。后面会在配置中统一处理，所以现在先不勾选。

![Unfree Software](/images/nixos-is-the-best/installer-unfree.png)

选择要安装到的分区。

![Partition](/images/nixos-is-the-best/installer-partition.png)

确认各项设置后执行安装。进度条可能会在 40% 左右停顿一阵子，不妨用手机看看 Nix 的手册，耐心等待。

![Install](/images/nixos-is-the-best/installer-install.png)

装完了！重启吧。

![All done](/images/nixos-is-the-best/installer-done.png)

引导加载程序启动后，选择 NixOS。默认设置下，宿主机为 UEFI 时引导加载程序是 systemed-boot，BIOS 时则是 Grub。

![Boot Loader](/images/nixos-is-the-best/boot-loader.png)
_systemed-boot_

出现登录界面后，用设置好的用户名和密码登录。

## 搭建环境

打开控制台，确认以下路径。

```shell
$ ls /etc/nixos/
configuration.nix hardware-configuration.nix
```

这两个文件是安装时自动生成的。`hardware-configuration.nix` 中写的是机器硬件相关的配置，因此我们的方针是不去动它，保持初始设置使用。
正题在 `configuration.nix` 这边，我们会大刀阔斧地改写它。

首先用 `nano` 添加下面的配置。由于位于 `/etc` 之下，需要 `sudo`。

```shell
sudo nano /etc/nixos/configuration.nix
```

```diff nix
# Edit this configuration file to define what should be installed on
# your system.  Help is available in the configuration.nix(5) man page
# and in the NixOS manual (accessible by running ‘nixos-help’).

{ config, pkgs, ... }:

{
   # 各项配置...

+  nix = {
+    settings = {
+      experimental-features = ["nix-command" "flakes"];
+    };
+  };
}
```

改写完毕后进行构建。

```
sudo nixos-rebuild switch
```

这项配置不需要重启，所以就这样继续作业。

通过上述配置，Nix command 与 Nix Flakes 都已启用。
我们试着用一下显示系统信息的 neofetch。

```shell
nix run github:nixos/nixpkgs/nixpkgs-unstable#neofetch
```

![neofetch](/images/nixos-is-the-best/neofetch.png)

最开始会有约 37.9MB 的下载，但这并不是软件包本体，而是在从指定的软件包仓库下载最新的软件包集合（Nix 表达式的集合）。由于它始终引用执行时刻最新的仓库，所以每当仓库有更新，下载处理也会再执行一次。

由于 `github:nixos/nixpkgs/nixpkgs-unstable` 很常用，它被设置了一个名为 `nixpkgs` 的别名。下面的命令与刚才那条等价。

```shell
nix run nixpkgs#neofetch
```

别名一览可以用以下命令查看。

```shell
nix registry list
```

### 改造成 Flake

既然启用了 Flakes，我们就把配置改造成 Flake 吧。
复制 `configuration.nix` 和 `hardware-configuration.nix`，创建一个 Git 仓库。

```shell
mkdir ~/.dotfiles && cd ~/.dotfiles
cp /etc/nixos/* .
git init
```

创建 `flake.nix`。用 `nix shell` 引入你喜欢的编辑器来编辑吧。
nixpkgs 我选择了滚动发布的 nixpkgs-unstable 分支。`outputs` 中用 `nixosConfigurations` 定义，Derivation 则使用 `nixpkgs.lib.nixosSystem` 这个工具函数。

```nix :flake.nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = inputs: {
    nixosConfigurations = {
      myNixOS = inputs.nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ./configuration.nix
        ];
      };
    };
  };
}
```

构建命令变成下面这样。

```shell
sudo nixos-rebuild switch --flake .#myNixOS
```

### 整备 shell 环境

我们把 `configuration.nix` 改写成下面这样。将默认 shell 换成 zsh，并引入各类软件包。

```diff nix
{ config, pkgs, ... }:
{
  # 各项配置...

  users.users.用户名 = {
    # ...
+    shell = pkgs.zsh; # 把默认 shell 改为 ZSH
  };

  # ...

+  # 连同配置一起启用软件包
+  programs = {
+    git = {
+      enable = true;
+    };
+    neovim = {
+      enable = true;
+      defaultEditor = true; # 设置 $EDITOR=nvim
+      viAlias = true;
+      vimAlias = true;
+    };
+    starship = {
+      enable = true;
+    };
+    zsh = {
+      enable = true;
+    };
+  };
}
```

用 `environment.systemPackages` 指定的软件包会安装到整个系统。如果想按用户安装，则使用 `users.users.用户名.packages`。

`programs` 不只是单纯安装软件包，还会自动完成各类配置。
例如，要在 bash 或 zsh 中启用 starship（外观相当不错的提示符），本来需要手动做若干设置，而在 NixOS modules 中只要写 `programs.starship.enable = true` 它就会自动配置好。
构建完成后，打开新的控制台标签页，就会启动外观炫酷的 zsh。

### 启用 IME 与日文字体

在 Linux 上配置这些通常相当麻烦，但用 NixOS modules 只需下面这些配置即可。
构建后请重启。届时会启动应用了 Noto Fonts 的漂亮 UI，IME 也已启用。

```diff nix
{ config, pkgs, ... }:
{
  # 各项配置

+ i18n.inputMethod = {
+   enabled = "fcitx5";
+   fcitx5.addons = [pkgs.fcitx5-mozc];
+ };

+ fonts = {
+   fonts = with pkgs; [
+     noto-fonts-cjk-serif
+     noto-fonts-cjk-sans
+     noto-fonts-emoji
+     nerdfonts
+   ];
+   fontDir.enable = true;
+   fontconfig = {
+     defaultFonts = {
+       serif = ["Noto Serif CJK JP" "Noto Color Emoji"];
+       sansSerif = ["Noto Sans CJK JP" "Noto Color Emoji"];
+       monospace = ["JetBrainsMono Nerd Font" "Noto Color Emoji"];
+       emoji = ["Noto Color Emoji"];
+     };
+   };
+ };
}
```

### 驱动与按键重映射

[nixos-hardware](https://github.com/NixOS/nixos-hardware) 是一个模块集合，能妥善处理硬件相关的配置。它提供了 Intel、AMD、NVIDIA 等驱动的配置，以及 Raspberry Pi、ThinkPad 等设备专用的配置。想知道有哪些可用模块，直接看仓库的 `flake.nix` 最快。

[xremap](https://github.com/k0kubun/xremap) 是在桌面环境中修改键位映射的工具，并且提供了 [NixOS 版](https://github.com/xremap/nix-flake/)。它可以把 CapsLock 改成 Ctrl，或者把 Ctrl + H 变成 BackSpace，还能只对部分应用生效或排除部分应用。

```diff nix :flake.nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
+   nixos-hardware.url = "github:NixOS/nixos-hardware/master"; # 硬件配置的集合
+   xremap.url = "github:xremap/nix-flake"; # 可以优雅地修改按键配置的工具
  };

  outputs = inputs: {
    nixosConfigurations = {
      myNixOS = inputs.nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ./configuration.nix
        ];
+       specialArgs = {
+           inherit inputs; # 等同于 `inputs = inputs;`
+       };
      };
    };
  };
}
```

```diff nix :configuration.nix
{
+ inputs,
  config,
  pkgs,
  ...
}:
{
  imports =
    [
      # ...
    ]
+   # 请根据自己的环境更改要导入的模块
+   ++ (with inputs.nixos-hardware.nixosModules; [
+     common-cpu-amd
+     common-gpu-nvidia
+     common-pc-ssd
+   ]);
+   # 让 xremap 的 NixOS modules 可用
+   ++ [
+     inputs.xremap.nixosModules.default
+   ]

+ # 用 xremap 优雅地修改按键配置
+ services.xremap = {
+   userName = "用户名";
+   serviceMode = "system";
+   config = {
+     modmap = [
+       {
+         # 把 CapsLock 替换为 Ctrl
+         name = "CapsLock is dead";
+         remap = {
+           CapsLock = "Ctrl_L";
+         };
+       }
+     ];
+     keymap = [
+       {
+         # 改成在任何应用中 Ctrl + H 都等于 Backspace
+         name = "Ctrl+H should be enabled on all apps as BackSpace";
+         remap = {
+           C-h = "Backspace";
+         };
+         # 把部分应用（终端模拟器）排除在外
+         application = {
+           not = ["Alacritty" "Kitty" "Wezterm"];
+         };
+       }
+     ];
+   };
+ };
}
```

### 其他实用配置

```diff nix :configuration.nix
{ config, pkgs, ... }:
{
+ # 更换内核
+ boot.kernelPackages = pkgs.linuxKernel.packages.linux_zen;

+ # 修改主机名
+ networking.hostName = "喜欢的主机名";

  nix = {
    settings = {
+     auto-optimise-store = true; # 优化 Nix store
      experimental-features = ["nix-command" "flakes"];
    };
+   # 自动执行垃圾回收
+   gc = {
+     automatic = true;
+     dates = "weekly";
+     options = "--delete-older-than 7d";
+   };
  };

+ # 允许专有软件包
+ nixpkgs.config.allowUnfree = true;

+ # 启用 tailscale（VPN）
+ # 非常方便，推荐
+ services.tailscale.enable = true;
+ networking.firewall = {
+   enable = true;
+   # 信任 tailscale 的虚拟网卡
+   # 这样就能以 `<Tailscale 的主机名>:<端口号>` 的方式访问
+   trustedInterfaces = ["tailscale0"];
+   allowedUDPPorts = [config.services.tailscale.port];
+ };

+ # 声音设置 —（默认可能已经是这样了）
+ sound.enable = true;
+ hardware.pulseaudio.enable = false; # 替换为 pipewire
+ security.rtkit.enable = true; # pipewire 所必需
+ services.pipewire = {
+   enable = true;
+   alsa.enable = true;
+   alsa.support32Bit = true;
+   jack.enable = true;
+   pulse.enable = true;
+ };

+ # 麦克风降噪应用
+ programs = {
+   noisetorch.enable = true;
+ };

+ # 以 rootless 方式启用 Docker
+ virtualisation = {
+   docker = {
+     enable = true;
+     rootless = {
+       enable = true;
+       setSocketVariable = true; # 设置 $DOCKER_HOST
+     };
+   };
+ };

+ # 面向 Linux 桌面的包管理器
+ # 将应用沙箱化后运行
+ # 用于安装 NixOS 未支持的应用
+ services.flatpak.enable = true;
+ xdg.portal.enable = true; # flatpak 所必需

+ # 安装 Steam
+ # Proton Experimental 请从 Steam 的设置中启用
+ programs.steam = {
+   enable = true;
+   remotePlay.openFirewall = true;
+   dedicatedServer.openFirewall = true;
+ };

+ # Steam 的字体会乱码，所以追加字体配置
+ # 只让 Steam 使用 Migu 1P 字体
  fonts = {
    fonts = with pkgs; [
      # ...
+     migu
    ];
    fontDir.enable = true;
    fontconfig = {
      # ...
+     localConf = ''
+       <?xml version="1.0"?>
+       <!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
+       <fontconfig>
+         <description>Change default fonts for Steam client</description>
+         <match>
+           <test name="prgname">
+             <string>steamwebhelper</string>
+           </test>
+           <test name="family" qual="any">
+             <string>sans-serif</string>
+           </test>
+           <edit mode="prepend" name="family">
+             <string>Migu 1P</string>
+           </edit>
+         </match>
+       </fontconfig>
+     '';
    };
  };
}
```

## home-manager

NixOS modules 更偏向于面向系统环境的功能，而面向用户环境的环境构建工具则另有其人。

[hoem-manager](https://github.com/nix-community/home-manager) 是 nix-community 出品的用户环境构建工具。它和 Nix 一样，在其他发行版或 Mac 上也能使用。虽然无法配置需要 root 权限的领域，但对于运行在用户环境中的应用，它能提供比 NixOS modules 更丰富多彩的配置。

### 引入

有「作为 NixOS modules 引入」和「单独引入 home-manager」两种方式。为了让 home-manager 的配置在非 NixOS 环境中也能复用，这次我们采用单独引入的方式。

```diff nix :flake.nix
{
  inputs = {
    # ...
+   home-manager = {
+     url = "github:nix-community/home-manager";
+     inputs.nixpkgs.follows = "nixpkgs";
+   };
  };

  outputs = inputs: {
    # ...
+   homeConfigurations = {
+     myHome = inputs.home-manager.lib.homeManagerConfiguration {
+       pkgs = import inputs.nixpkgs {
+         system = "x86_64-linux";
+         config.allowUnfree = true; # 允许专有软件包
+       };
+       extraSpecialArgs = {
+         inherit inputs;
+       };
+       modules = [
+         ./home.nix
+       ];
+     };
+   };
}
```

```nix :home.nix
{
  home = rec { # 用 rec 让 Attribute Set 内部可以引用其他值
    username="用户名";
    homeDirectory = "/home/${username}"; # 把值嵌入字符串
    stateVersion = "22.11";
  };
  programs.home-manager.enable = true; # 用 home-manager 自身启用 home-manager
}
```

开始构建。由于引入时加了 `inputs.nixpkgs.follow` 选项，需要先删除 `flake.lock` 再构建。删除后别忘了暂存。

```
rm flake.lock
git add .
nix run nixpkgs#home-manager -- switch --flake .#myHome
```

只要第 1 世代的 Profile 被创建出来就算成功。

### home.file

home-manager 利用 Nix 的 Profiles，可以把任意文件以符号链接的形式放置到 $HOME 之下的位置。

```nix
home.file = {
  "wallpaper.png" = {
    target = "Wallpaper/wallpaper.png"; # 放置到 ~/Wallpaper/wallpaper.png
    source = ./wallpaper.png; # 要放置的文件
  };
};
```

### home.packages

指定想要安装的软件包。

```diff nix :home.nix
+ home.packages = with pkgs; [
+   bat
+   bottom
+   exa
+   httpie
+   pingu
+   ripgrep
+ ];
```

前面已经出现过好几次 `with` 语法了，上面和下面的代码是等价的。

```nix
home.packages = [
  pkgs.bat
  pkgs.bottom
  pkgs.eza
  pkgs.httpie
  pkgs.pingu
  pkgs.ripgrep
];
```

### programs

与 NixOS modules 一样，可以利用 programs 进行各种配置。
以下配置仅作示例，请自行在 [Home Manager option search](https://mipmip.github.io/home-manager-option-search/) 中检索。

#### zsh & starship

```nix :zsh.nix
{pkgs, ...}: {
  programs.zsh = {
    enable = true;
    autocd = true; # 不用 cd，只写文件路径就能切换目录
    enableCompletion = true; # 自动补全
    enableAutosuggestions = true; # 输入建议
    syntaxHighlighting.enable = true; # 语法高亮
    shellAliases = {
      cat = "bat";
      grep = "rg";
      ls = "eza --icons always --classify always";
      la = "eza --icons always --classify always --all ";
      ll = "eza --icons always --long --all --git ";
      tree = "eza --icons always --classify always --tree";
    };
  };
}
```

<details>
<summary>starship（把图标换成 Nerdfonts）</summary>

如果想在 starship 中启用以下配置，请先禁用 NixOS modules 中的 starship。

```diff nix :configuration.nix
- starship = {
-   enable = true;
- };
+ # starship = {
+ #   enable = true;
+ # };
```

```nix :starship.nix
{
  programs.starship = {
    enable = true;
    settings = {
      # Nerd Font Symbols
      aws.symbol = "  ";
      buf.symbol = " ";
      c.symbol = " ";
      conda.symbol = " ";
      dart.symbol = " ";
      directory.read_only = " ";
      docker_context.symbol = " ";
      elixir.symbol = " ";
      elm.symbol = " ";
      git_branch.symbol = " ";
      golang.symbol = " ";
      guix_shell.symbol = " ";
      haskell.symbol = " ";
      haxe.symbol = "⌘ ";
      hg_branch.symbol = " ";
      java.symbol = " ";
      julia.symbol = " ";
      lua.symbol = " ";
      memory_usage.symbol = " ";
      meson.symbol = "喝 ";
      nim.symbol = " ";
      nix_shell.symbol = " ";
      nodejs.symbol = " ";
      os.symbols = {
        Alpine = " ";
        Amazon = " ";
        Android = " ";
        Arch = " ";
        CentOS = " ";
        Debian = " ";
        DragonFly = " ";
        Emscripten = " ";
        EndeavourOS = " ";
        Fedora = " ";
        FreeBSD = " ";
        Garuda = "﯑ ";
        Gentoo = " ";
        HardenedBSD = "ﲊ ";
        Illumos = " ";
        Linux = " ";
        Macos = " ";
        Manjaro = " ";
        Mariner = " ";
        MidnightBSD = " ";
        Mint = " ";
        NetBSD = " ";
        NixOS = " ";
        OpenBSD = " ";
        openSUSE = " ";
        OracleLinux = " ";
        Pop = " ";
        Raspbian = " ";
        Redhat = " ";
        RedHatEnterprise = " ";
        Redox = " ";
        Solus = "ﴱ ";
        SUSE = " ";
        Ubuntu = " ";
        Unknown = " ";
        Windows = " ";
      };
      package.symbol = " ";
      python.symbol = " ";
      rlang.symbol = "ﳒ ";
      ruby.symbol = " ";
      rust.symbol = " ";
      scala.symbol = " ";
      spack.symbol = "🅢 ";
    };
  };
}
```

</details>

#### Git

```nix :git.nix
{pkgs, ...}: {
  programs.git = {
    enable = true;
    userName = "Git 用的用户名";
    userEmail = "Git 用的邮箱地址";
  };

  # GitHub CLI
  programs.gh = {
    enable = true;
    extensions = with pkgs; [gh-markdown-preview]; # 推荐
    settings = {
      editor = "nvim";
    };
  };
}
```

#### Neovim

把 Neovim 的插件管理全部交给 Nix，这样即便更换环境，只要 `home-manager switch` 就能在任何地方复现 Neovim 环境。
（我自己的情况是：Vim 插件用 lazy.nvim 管理，只把 LSP 和格式化工具交给 Nix 管理。）

用 `extrapackages` 指定的软件包不会把 PATH 反映到用户环境，仅在 Neovim 内部生效。即使与 `home.packages` 中指定的软件包重复也没有问题。

```nix :neovim.nix
{pkgs, ...}: {
  programs.neovim = {
    enable = true;
    viAlias = true;
    vimAlias = true;
    plugins = with pkgs.vimPlugins; [
      # Treesitter
      (nvim-treesitter.withPlugins (plugins:
        with plugins; [
          tree-sitter-markdown
          tree-sitter-nix
          # ...
        ]))
      telescope-nvim
      # ...
    ];

    # 仅在 Neovim 内部加入 PATH 的软件包
    # 在这里指定 LSP、格式化工具以及其他从 Neovim 调用的工具吧
    extraPackages = with pkgs; [
      ripgrep
      biome
      nodePackages.eslint
      nodePackages.prettier
      nodePackages.typescript-language-server
      # ...
    ];

    # 字符串会被展开到 ~/.config/nvim/init.lua
    extraLuaConfig = builtins.readFile ./init.lua;
  };
}
```

用 `builtins.<函数名>` 可以调用 Nix 语言的内置函数。这里用 `readFile` 函数把文件作为字符串读入。

#### direnv

```nix :direnv.nix
{
  programs.direnv = {
    enable = true;
    nix-direnv.enable = true;
  };
}
```

#### 语言与工具

把工具安装到全局。

```nix :development.nix
{pkgs, ...}: {
  home.packages = with pkgs; [
    gcc
    go
    nodejs-slim # 不带 npm 的 Node.js 本体
    nodePackages.pnpm
    nodePackages.wrangler
    deno
    bun
    python312
    zig
  ];
}
```

我自己在需要认真搭建开发环境时，不会使用全局安装的工具，而是为每个项目用 `flake.nix` 构建 devShell。

#### Rust 工具链

用 Nix 安装 Rust 时，直接装的话工具链管理会很麻烦，强烈推荐使用 [oxalica/rust-overlay](https://github.com/oxalica/rust-overlay) 或 [nix-community/fenix](https://github.com/nix-community/fenix)。下面以 rust-overlay 为例添加一下。

```diff nix :flake.nix
{
  inputs = {
    # ...
+   rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = inputs: {
    # ...
    homeConfigurations = {
      myHome = inputs.home-manager.lib.homeManagerConfiguration {
        pkgs = import inputs.nixpkgs {
          system = "x86_64-linux";
          config.allowUnfree = true; # 允许专有软件包
+         overlays = [(import inputs.rust-overlay)];
        };
        extraSpecialArgs = {
          inherit inputs;
        };
        modules = [
          ./home.nix
        ];
      };
    };
}
```

```diff nix :development.nix
{pkgs, ...}: {
  home.packages = with pkgs; [
    # ...
+   rust-bin.stable.latest.default
  ];
}
```

[Overlays](https://nixos.wiki/wiki/Overlays) 是用于覆盖、扩展 nixpkgs 的机制。因此，通过 rust-overlay 添加的软件包和普通软件包一样，可以经由 `pkgs` 访问。`rust-bin.stable.latest.default` 会一次性安装 Rust 最新的 Stable 工具链。

另外，还可以像下面这样添加构建目标。

```diff nix
- rust-bin.stable.latest.default
+ (rust-bin.stable.latest.default.override {
+   targets = ["wasm32-unknown-unknown" "wasm32-wasi"];
+ })
```

这些本来是用 rustup 管理的东西，但也可以借助 Nix 以声明式方式管理。

#### Wezterm

一款终端模拟器。此外，Alacritty、Kitty 等也都能用 `programs` 配置。

```nix :wezterm.nix
{
  programs.wezterm = {
    enable = true;
    extraConfig = builtins.readFile ./wezterm.lua;
  };
}
```

```lua :wezterm.lua
local wezterm = require("wezterm")

return {
	-- Theme
	color_scheme = "MyTheme",

	-- Font
	font = wezterm.font_with_fallback({
		{ family = "JetBrainsMono Nerd Font", weight = "Regular" },
		{ family = "JetBrainsMono Nerd Font", weight = "Regular", assume_emoji_presentation = true },
		{ family = "Noto Sans CJK JP" },
	}),
	font_size = 14.0,

	-- Padding
	window_padding = {
		left = 10,
		right = 10,
		top = 10,
		bottom = 10,
	},

	-- Tab
	use_fancy_tab_bar = false,
	hide_tab_bar_if_only_one_tab = true,

	-- Misc
	use_ime = true, -- Enable IME
	check_for_updates = false, -- Disable update check
	audible_bell = "Disabled", -- Disable bell
}
```

#### 浏览器

Firefox 以及 Chrome、Brave、Vivaldi 等各类 Chromium 系浏览器都能用 programs 配置。
用 `commandLineArgs` 可以添加启动时的选项^[[把浏览器彻底变成暗色](https://scrapbox.io/asa1984/ブラウザを完全にDarkにする)]。

```nix :browser.nix
{
  programs = {
    firefox.enable = true;
    google-chrome.enable = true;
    vivaldi = {
      enable = true;
      commandLineArgs = ["--enable-features=WebUIDarkMode" "--force-dark-mode"];
    };
  };
}
```

#### VS Code

如果用 `programs.vscode.enabal = true;` 启用 VS Code，`settings.json` 等配置文件的写入权限会被 Nix 锁定，导致 VS Code 的设置同步功能无法使用。如果想用同步功能，请改用 `home.packages = [pkgs.vscode];` 来安装。

#### 其他应用

```nix :apps.nix
{pkgs, ...}: {
  # Spotify TUI
  programs.ncspot.enable = true;

  # OBS
  programs.obs-studio.enable = true;

  home.packages = with pkgs; [
    discord
    discord-ptb
    gnome.totem # 视频播放器
    gnome.evince # PDF 阅读器
    parsec-bin # 速度超快的远程桌面客户端
    remmina # VNC 客户端
    slack
    spotify
  ];
}
```

### 启用

拆分成模块之后，用 `imports` 指定文件路径来导入。它与 `import` 的行为略有不同，可以理解为：`imports` 会把指定文件的输出部分原样展开到调用方的代码中。

```nix :home.nix
{
  imports = [
    ./zsh.nix
    ./starship.nix
    ./neovim.nix
    ./direnv.nix
    ./development.nix
    ./wezterm.nix
    ./browser.nix
    ./apps.nix
  ];

  # ...
}

```

再执行一次命令，安装便会开始，用户环境也就搭建完毕了。接下来就按自己的喜好去调整配置吧。辛苦了。

## 痛点

> 说到底还是看平衡

> 为难的时候就用 Docker 吧

读到这里的读者想必已经明白 NixOS 的魅力了。
但另一方面，NixOS 是一个思想极其强烈的 Linux 发行版，必然伴随着权衡取舍。把一个堪称「非纯粹性集合体」的系统驾驭到这种程度固然值得称赞，但我们也需要正确地了解它做不到的事。

### 不可变的文件

理所当然地，它与要求文件可变的软件相性不佳。例如，当某个软件试图改写由 Nix 管理的配置文件时（比如某些安装程序会改写 `.bashrc` 之类以向 PATH 添加目录），由于 Nix 限制了写入权限，操作会失败。如果这造成困扰，把相应的配置或软件包放到 Nix 的管理范围之外即可；实际上，在其他 Linux 发行版或 Mac 上只单独使用 Nix 的话几乎不会有问题，但在以 Nix 为系统基础的 NixOS 上，有时就没那么顺利了。

### Nix 的笼子之外

在 NixOS 上，要安装通过自有安装程序或二进制形式分发的软件，用户需要自己写 Nix 表达式把它包起来。
例如对于直接下载可执行文件的形式，利用 nixpkgs 的 [Fetcher](https://ryantm.github.io/nixpkgs/builders/fetchers/) 就能下载。不过为了保障可复现性，需要事先指定哈希。如果抓取到的文件哈希与指定的哈希不一致，下载就会失败。

另外，现代开发中通常会用编程语言专属的包管理器来管理依赖关系，而要把它们构建成 Nix 包，就必须把这些包的信息引入到 Nix 一侧。与 Rust 这类拥有健全包管理器的语言相性很好，但若要去包装某些「行为不端」的包管理器，有时就得经历一番折腾。

### 资料稀缺

是的，资料很少。NixOS 是 Linux 用户惯用的 Arch Wiki 不管用的少数发行版之一，取而代之的是你得和 [NixOS Discourse](https://discourse.nixos.org) 以及 GitHub 的 issue 大眼瞪小眼。
想了解 NixOS 或 home-manager 的配置，就去看别人的 GitHub 仓库读代码，并用 [NixOS search](https://search.nixos.org/options) 和 [Home Manager option search](https://mipmip.github.io/home-manager-option-search/) 检索选项的详细信息吧。然后也请你来写文章！

## _NixOS is the best_

当年我面对着被自己搞坏、再也启动不了的 Arch Linux 黯然神伤时，只因为觉得 Logo 很帅就随手装了它，回过神来，手头的 Windows 机器已经全都变成 NixOS 了。深受触动的我到处宣扬 NixOS 的威力有多棒，却没有一个人愿意用，于是就有了这篇文章。

![How Nix manage packages](https://pbs.twimg.com/media/Fm02rGNaYAECO88?format=jpg&name=large)
_学校的公共空间_

我并不是真心在说「这就是最好的 Linux 发行版！」，但它确实是最有意思的发行版，所以请一定亲手试试。

## 参考

- [NixOS Wiki](https://nixos.wiki/wiki/Main_Page)
  - 非官方 Wiki（NixOS 界的 Arch Wiki）
  - 在 NixOS 上查东西时首先参考它
- [Nix reference Manual](https://nixos.org/manual/nix/stable/introduction.html)
  - 适合用来理解 Nix 的概念与机制
  - 包含命令参考。
- [Zero to Nix](https://zero-to-nix.com)
  - 质量高到离谱的 Nix 教程
  - 写这篇文章的过程中才发现。真想一开始就用它来学😭
- [NixOS Discourse](https://discourse.nixos.org)
  - 官方论坛
- [NixOS search](https://search.nixos.org/packages)
  - 官方的 nixpkgs 与 NixOS 选项检索站点
- [Home Manager option search](https://mipmip.github.io/home-manager-option-search/)
  - 第三方的 home-manager 选项检索站点
- [Tailscale on NixOS: A new Minecraft server in ten minutes](https://tailscale.com/blog/nixos-minecraft/)
  - Tailscale 的博客，讲用 NixOS 和 Tailscale 搭建 Minecraft 服务器
  - 把 NixOS 用作基础设施的案例
- [HERP 中的 Nix 实践（HERPにおけるNix活用）](https://blog.ryota-ka.me/posts/2022/10/08/how-we-use-nix-in-herp-inc)
  - 实际在使用 Nix 的公司的人写的博客
  - 非常通俗易懂

- 用到的软件包等
  - [NixOS/nix](https://github.com/NixOS/nix)
  - [NixOS/nixpkgs](https://github.com/NixOS/nixpkgs)
  - [NixOS/nixos-hardware](https://github.com/NixOS/nixos-hardware)
  - [xremap/nix-flake](https://github.com/xremap/nix-flake)
  - [oxalica/rust-overlay](https://github.com/oxalica/rust-overlay)

- NixOS/home-manager 的配置
  - [sherubthakur/dotfiles](https://github.com/sherubthakur/dotfiles)
    - 我是通过 [r/unixporn 的这个帖子](https://www.reddit.com/r/unixporn/comments/wy695w/xmonad_the_functional_setup/)知道 NixOS 的
  - [Ruixi-rebirth/flakes](https://github.com/Ruixi-rebirth/flakes)
  - [Misterio77/nix-config](https://github.com/Misterio77/nix-config)
  - [fufexan/dotfiles](https://github.com/fufexan/dotfiles)
  - [asa1984/dotfiles](https://github.com/asa1984/dotfiles)
    - 这是我的配置
