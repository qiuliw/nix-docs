---
title: "　§1. stdenv"
description: "　§1. stdenv"
order: 17
---

## Standard Environment

**stdenv**（Standard Environment，标准环境）是一个提供了构建 UNIX 软件包所需标准环境的 derivation。Nixpkgs 提供的软件包中，绝大多数都直接或间接地使用 **stdenv** 进行构建。

stdenv 在 Linux 和 Darwin（macOS）上的内容略有不同，这里我们以 Linux 的 stdenv 为例进行讲解。由于 stdenv 的功能非常丰富，我们只挑选其中重要的部分来说明。

## stdenv 的构成

对 stdenv 进行 realise 之后，其 store 路径的内容如下：

```bash :stdenv 的 store 路径内容
├── nix-support/
└── setup
```

其中重要的是名为 `setup` 的、约 1700 行的 shell 脚本。它的开头部分如下所示。

```sh :setup 的开头部分
export SHELL=/nix/store/i1x9sidnvhhbbha2zhgpxkhpysw6ajmr-bash-5.2p26/bin/bash
initialPath="/nix/store/cnknp3yxfibxjhila0sjd1v3yglqssng-coreutils-9.5 /nix/store/5my5b6mw7h9hxqknvggjla1ci165ly21-findutils-4.10.0 /nix/store/fy6s9lk05yjl1cz2dl8gs0sjrd6h9w5f-diffutils-3.10 /nix/store/9zsm74npdqq2lgjzavlzaqrz8x44mq9d-gnused-4.9 /nix/store/k8zpadqbwqwalggnhqi74gdgrlf3if9l-gnugrep-3.11 /nix/store/2ywpssz17pj0vr4vj7by6aqx2gk01593-gawk-5.2.2 /nix/store/nzzl7dnay9jzgfv9fbwg1zza6ji7bjvr-gnutar-1.35 /nix/store/7m0l19yg0cb1c29wl54y24bbxsd85f4s-gzip-1.13 /nix/store/cx1220ll0pgq6svfq7bmhpdzp0avs09w-bzip2-1.0.8-bin /nix/store/70anjdzz5rj9lcamll62lvp5ib3yqzzr-gnumake-4.4.1 /nix/store/i1x9sidnvhhbbha2zhgpxkhpysw6ajmr-bash-5.2p26 /nix/store/6rv8ckk0hg6s6q2zay2aaxgirrdy4l6v-patch-2.7.6 /nix/store/xzdawyw3njki7gx2yx4bkmhdzymgjawm-xz-5.6.2-bin /nix/store/rnndls2fiid1sic81i06dkqjhh24lpvr-file-5.45"
defaultNativeBuildInputs="/nix/store/dv5vgsw8naxnkcc88x78vprbnn1pp44y-patchelf-0.15.0 /nix/store/i4iynx9axbq23sd0gyrc5wdb46zz6z8l-update-autotools-gnu-config-scripts-hook /nix/store/h9lc1dpi14z7is86ffhl3ld569138595-audit-tmpdir.sh /nix/store/m54bmrhj6fqz8nds5zcj97w9s9bckc9v-compress-man-pages.sh /nix/store/wgrbkkaldkrlrni33ccvm3b6vbxzb656-make-symlinks-relative.sh /nix/store/5yzw0vhkyszf2d179m0qfkgxmp5wjjx4-move-docs.sh /nix/store/fyaryjvghbkpfnsyw97hb3lyb37s1pd6-move-lib64.sh /nix/store/kd4xwxjpjxi71jkm6ka0np72if9rm3y0-move-sbin.sh /nix/store/pag6l61paj1dc9sv15l7bm5c17xn5kyk-move-systemd-user-units.sh /nix/store/jivxp510zxakaaic7qkrb7v1dd2rdbw9-multiple-outputs.sh /nix/store/ilaf1w22bxi6jsi45alhmvvdgy4ly3zs-patch-shebangs.sh /nix/store/cickvswrvann041nqxb0rxilc46svw1n-prune-libtool-files.sh /nix/store/xyff06pkhki3qy1ls77w10s0v79c9il0-reproducible-builds.sh /nix/store/aazf105snicrlvyzzbdj85sx4179rpfp-set-source-date-epoch-to-latest.sh /nix/store/gps9qrh99j7g02840wv5x78ykmz30byp-strip.sh /nix/store/62zpnw69ylcfhcpy1di8152zlzmbls91-gcc-wrapper-13.3.0"
defaultBuildInputs=""
export NIX_ENFORCE_PURITY="${NIX_ENFORCE_PURITY-1}"
export NIX_ENFORCE_NO_NATIVE="${NIX_ENFORCE_NO_NATIVE-1}"

# （中略）
```

`$SHELL` 指向 Bash 的 store 路径，`$initialPath` 指向 coreutils、make 等工具的 store 路径，`$defaultNativeBuildInputs` 则指向多个 shell 脚本以及 gcc 的 store 路径。
虽然这里省略了，但在这些内容之下，还有用于辅助构建的 Bash 函数定义、设置 `$PATH` 的处理，以及执行被称为 **Phase**（阶段）的各个构建步骤的处理。

还记得在 [_1.4. Nix 语言与 derivation_](ch01-04-derivation) 中，我们用 derivation 函数构建 `hello-txt`（只写着 `Hello` 的一个 txt 文件）时，用 `/bin/sh` 执行了 shell 脚本吗？
stdenv 的 `setup` 正是在那里被执行的 shell 脚本。`setup` 会构建出一个「构建环境」，其中的 PATH 包含了执行构建的 shell（Bash）、标准工具集（如 coreutils）以及其他辅助构建的自定义 shell 脚本。也就是说，它为我们准备好了构建所需的最低限度的环境。

这种构建方式意外地原始呢。不过，加入 PATH 的工具和 shell 脚本的路径全都是 store 路径，而且构建环境被沙箱化、与宿主环境相隔离，因此外部因素没有任何可乘之机。

## stdenv 中包含的工具

stdenv 的 PATH 中包含了一般 UNIX 环境下常用的工具。

https://nixos.org/manual/nixpkgs/stable/#sec-tools-of-stdenv

- Bash
- gcc
- coreutils（`cat`/`cp`/`ls` 等）
- findutils（`find`）
- diffutils（`diff`/`cmp`）
- sed
- grep
- awk
- tar
- 归档工具
  - gzip
  - bzip2
  - xz
- make
- 辅助构建的 shell 脚本
- patchelf（仅限 Linux）

stdenv 还有一个变体叫做 **stdenvNoCC**，它不包含 gcc。

### shell 脚本

<!-- TODO -->

<!-- いくつかのbash関数が定義されており、ビルドスクリプト内でそのまま利用することができます。 -->

TODO!

### patchelf

在 Linux 上会引入 [patchelf](https://github.com/NixOS/patchelf)。patchelf 是一个直接对 ELF 格式二进制文件打补丁的工具，可以修改动态链接库的路径。

## 来构建 GNU Hello 吧！

要实际进行构建，需要使用 `stdenv.mkDerivation` 函数，把软件包的源代码和依赖关系添加到 stdenv 中。

在详细了解 `mkDerivation` 函数之前，我们先用 stdenv 亲手构建一次 GNU Hello。只要能通过 `nix build .#hello` 构建成功就算完成。

首先创建 Flake。

```bash :创建 Flake
$ mkdir gnu-hello-nix
$ cd gnu-hello-nix
$ touch flake.nix
```

```nix :flake.nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      { }
    );
}
```

下载 GNU Hello 的源代码（tarball）。不需要解压。

```bash :获取 hello 的源代码
# 如果没有 wget，就用 nix shell 临时获取一个
# 很方便！
$ nix shell nixpkgs#wget

# 从北陆先端科学技术大学院大学的镜像站下载
$ wget https://ftp.jaist.ac.jp/pub/GNU/hello/hello-2.12.tar.gz

$ ls
flake.nix  hello-2.12.tar.gz
```

终于要开始编写构建表达式了。

stdenv 和普通软件包一样，由 Nixpkgs 的 legacyPackages 提供。
`stdenv.mkDerivation` 函数接受一个 AttrSet 作为参数。我们来指定包名和源代码。

```diff nix :flake.nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
-     { }
+     {
+       packages = {
+         hello = pkgs.stdenv.mkDerivation {
+           pname = "hello";
+           version = "2.12";
+ 　　　　　　src = ./hello-2.12.tar.gz;
+         };
+       };
+     }
    );
}
```

这样 Nix 表达式就完成了。让我们构建并运行看看！

```bash
$ nix build .#hello

$ ls result
bin/ share/

$ ./result/bin/hello
Hello, world!
```

成功了！

## mkDerivation 函数

在前面的例子中，我们完全没有编写构建脚本就完成了构建。这是因为 mkDerivation 函数的默认值中，已经预置了「自动构建并安装以 `make` 作为构建工具的 UNIX 软件包」这套配置。当然，mkDerivation 是通用的构建函数，如果软件包不属于这种情况，就需要覆盖默认值后再使用。

### 环境变量

<!-- TODO -->

TODO!

### name/pname/version

`pname` 指定包名，`version` 指定版本。`name` 默认为 `${pname}-${version}`。

### src

`src` 指定源代码目录，或者归档文件（tarball）的 store 路径。这次我们传入的是 tarball 的 Path。

在这里指定的源代码，可以在构建脚本中通过 `$src` 引用。

### buildInputs 与 nativeBuildInputs

这次由于 stdenv 默认内置的 gcc 和 make 就已经够用，所以我们没有额外引入依赖包；如果需要其他软件包，就将它们添加到 `buildInputs` 或 `nativeBuildInputs` 中。

`nativeBuildInputs` 用于添加构建时依赖，`buildInputs` 用于添加运行时依赖。前面提到的 stdenv 默认内置的软件包就包含在 `nativeBuildInputs` 中。

### Phase

用 stdenv 执行构建时，首先由 `setup` shell 脚本搭建构建环境，之后调用名为 `genericBuild` 的 bash 函数。`genericBuild` 会执行 `buildCommandPath` 或 `buildCommand`，以及多个 **Phase**。

stdenv 把构建划分成了多个步骤。

- Controlling phase
- Unpack phase
- Patch phase
- Configure phase
- Build phase
- Check phase
- Install phase
- Fixup phase

在前面构建 GNU Hello 时，我们完全没有编写构建脚本就构建成功了。这是因为各个 phase 的默认值中已经应用了典型 UNIX 软件包的构建配置。像 GNU Hello 这样以 `make` 作为构建工具的软件包，大致按以下步骤构建：

1. 解压源代码的 tarball（unpack phase）
2. 执行 `make` 进行构建（build phase）
3. 执行 `make install` 把构建产物放置到指定位置（install phase）

<details>
<summary>Phase 的默认设置</summary>

各个 phase 的默认脚本以 bash 函数的形式定义在 [nixpkgs/pkgs/stdenv/generic/setup.sh](https://github.com/NixOS/nixpkgs/blob/e1d92cda6fd1bcec60e4938ce92fcee619eea793/pkgs/stdenv/generic/setup.sh) 中。这个 `setup.sh` 会在 realise stdenv 时作为 store 对象 `setup` 放置到 store 中。

下面是 unpack phase 的默认脚本 `unpackPhase` 函数。
https://github.com/NixOS/nixpkgs/blob/e1d92cda6fd1bcec60e4938ce92fcee619eea793/pkgs/stdenv/generic/setup.sh#L1167-L1243

</details>

当然，stdenv 也能构建不遵循上述步骤的软件包。这种情况下，就用自定义的构建脚本覆盖各个 phase。

这里我们挑选几个重要的 phase 进行说明。其他 phase 请参阅官方手册。

https://nixos.org/manual/nixpkgs/stable/#sec-stdenv-phases

#### Unpack phase

如果传给 `src`（`$src`）的 store 路径是归档文件，就会在 unpack phase 中解压。如果不是归档文件而是普通目录，则跳过解压处理。

```bash :解压 GNU Hello 的归档文件
$ tar -xzf hello-2.12.tar.gz
```

```diff nix :指定已解压的源代码
stdenv.mkDerivation {
  name = "hello";
- src = ./hello-2.12.tar.gz;
+ src = ./hello-2.12;
}
```

`$src` 本身，或者解压 `$src` 后得到的目录，就是 stdenv 中的初始工作目录。

Unpack phase 几乎没有覆盖的必要，大多数情况下保持默认即可。

#### Build phase

最常被覆盖的就是 build phase。如果你要自己编写构建脚本，就覆盖这个 phase。

```diff nix :覆盖 Build phase
stdenv.mkDerivation {
  name = "hello";
  src = ./hello-2.12.tar.gz;
+ buildPhase = ''
+   make
+ '';
}
```

#### Check phase

Check phase 主要用于执行测试。

#### Install phase

这里编写把 build phase 构建出的产物放置到 Nix store 的处理。有一点需要注意：`$out` 不会被自动创建，因此必须在脚本中创建 `$out` 目录，或者直接把文件复制到 `$out`。

默认情况下会执行 `make install`，这里我们改成用 `cp` 朴素地复制构建产物试试。

```diff nix :覆盖 Install phase
stdenv.mkDerivation {
  name = "hello";
  src = ./hello-2.12.tar.gz;
+ installPhase = ''
+   mkdir -p $out/bin
+   cp hello $out/bin
+ '';
}
```

```bash :执行构建
$ nix build .#hello

# 用 tree 命令确认 result 的结构
$ nix run nixpkgs#tree -- result
result
└── bin
    └── hello
```

在这个例子中，我们改成了只把可执行文件 `hello` 复制到 `$out/bin`，因此 `result` 中不再包含 `share`。

### Phase 的划分有必要吗？

Phase 的划分并非出于功能上的限制，所以比如说，在 build phase 中一口气完成从解压源代码、构建到安装的全部处理也是可行的。实际上，在个人使用的软件包中，确实有人就是这么写的。

之所以把 phase 拆分成多个，是为了让构建流程可以复用。例如，解压归档文件这一处理在许多软件包中都是共通的，但之后的流程却大相径庭，因此把解压部分独立成 unpack phase 就能复用。

另外，Nixpkgs 提供的软件包可以用 `overrideAttrs` 等函数覆盖 mkDerivation 的配置。下面的代码把 Nixpkgs 提供的 `hello` 的 `installPhase` 覆盖成了与刚才介绍的例子相同的内容。

```nix :覆盖 hello 的 installPhase
pkgs.hello.overrideAttrs {
  installPhase = ''
    mkdir -p $out/bin
    cp hello $out/bin
  '';
};
```

多亏了 phase 是分离的，只需最小限度的改动就能完成。
如果考虑软件包的可复用性，还是应该把 phase 好好地分开。基本上只要有意识地区分 build phase 和 install phase 就足够了。

## 互联网访问的问题

在刚才构建 `hello` 时，我们先用 wget 把源代码下载到本地，再指定给 `src`；不过把获取源代码的处理也写进构建表达式会更优雅一些。

我们在 `nativeBuildInputs` 中加入 `wget`，并改为在 `unpackPhase` 中获取源代码。

```diff nix :flake.nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        packages = {
          hello = pkgs.stdenv.mkDerivation {
            pname = "hello";
            version = "2.12";
-           src = ./hello-2.12.tar.gz;
+           nativeBuildInputs = with pkgs; [ wget ];
+           unpackPhase = ''
+             wget https://ftp.gnu.org/gnu/hello/hello-2.12.tar.gz
+             tar -xvf hello-2.12.tar.gz
+             cd hello-2.12
+           '';
          };
        };
      }
    );
}
```

来构建看看。

```bash :执行构建与 wget 的报错
❯ nix build .#hello
error: builder for '/nix/store/a903fx91awgp0lk3a5lwqxbr0imi357y-hello-2.12.drv' failed with exit code 4;
       last 4 log lines:
       > Running phase: unpackPhase
       > --2024-08-17 08:33:20--  https://ftp.gnu.org/gnu/hello/hello-2.12.tar.gz
       > Resolving ftp.gnu.org (ftp.gnu.org)... failed: Temporary failure in name resolution.
       > wget: unable to resolve host address 'ftp.gnu.org'
       For full logs, run 'nix log /nix/store/a903fx91awgp0lk3a5lwqxbr0imi357y-hello-2.12.drv'.
```

居然失败了。看 wget 的错误信息可以发现，是名称解析失败了。

> --2024-08-17 08:33:20-- https://ftp.gnu.org/gnu/hello/hello-2.12.tar.gz
> Resolving ftp.gnu.org (ftp.gnu.org)... failed: Temporary failure in name resolution.
> wget: unable to resolve host address 'ftp.gnu.org'

由于 Nix 的构建环境是沙箱化的，无法访问互联网，因此构建脚本无法获取互联网上的资源。这非常麻烦。尤其对于拥有独立包管理器的语言来说，这意味着无法解析软件包的依赖关系，是致命的问题。

当然，Nix 提供了解决这一问题的机制。在下一节中，我们将学习在保证幂等性的前提下实现互联网访问的机制——**Fetcher**。

## 参考

https://nixos.org/guides/nix-pills/19-fundamentals-of-stdenv

https://nixos.org/manual/nixpkgs/stable/#part-stdenv
