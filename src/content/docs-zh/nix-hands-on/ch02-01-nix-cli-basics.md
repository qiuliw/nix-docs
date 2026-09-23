---
title: "　§1. Nix CLI 基础"
description: "　§1. Nix CLI 基础"
order: 11
---

## flake-url 的别名

每敲一次命令就要写一长串 flake-url 实在麻烦。用 `nix registry` 命令可以为 flake-url 设置别名。

默认就已经定义了若干别名，例如 `github:NixOS/nixpkgs/nixpkgs-unstable`（Nixpkgs 的 nixpkgs-unstable 分支）被分配了 `nixpkgs` 这个别名。此后从命令行使用 Nixpkgs 时，我们都会用这个别名。

<details>
<summary>默认别名一览</summary>

不只是官方的 Flake，一些第三方 Flake 也设置了别名。

```bash :nix registry list
$ nix registry list
global flake:agda github:agda/agda
global flake:arion github:hercules-ci/arion
global flake:blender-bin github:edolstra/nix-warez?dir=blender
global flake:bundlers github:NixOS/bundlers
global flake:cachix github:cachix/cachix
global flake:composable github:ComposableFi/composable
global flake:disko github:nix-community/disko
global flake:dreampkgs github:nix-community/dreampkgs
global flake:dwarffs github:edolstra/dwarffs
global flake:emacs-overlay github:nix-community/emacs-overlay
global flake:fenix github:nix-community/fenix
global flake:flake-parts github:hercules-ci/flake-parts
global flake:flake-utils github:numtide/flake-utils
global flake:helix github:helix-editor/helix
global flake:hercules-ci-agent github:hercules-ci/hercules-ci-agent
global flake:hercules-ci-effects github:hercules-ci/hercules-ci-effects
global flake:home-manager github:nix-community/home-manager
global flake:hydra github:NixOS/hydra
global flake:mach-nix github:DavHau/mach-nix
global flake:nickel github:tweag/nickel
global flake:nix github:NixOS/nix
global flake:nix-darwin github:LnL7/nix-darwin
global flake:nix-serve github:edolstra/nix-serve
global flake:nixops github:NixOS/nixops
global flake:nixos-hardware github:NixOS/nixos-hardware
global flake:nixos-homepage github:NixOS/nixos-homepage
global flake:nixos-search github:NixOS/nixos-search
global flake:nixpkgs github:NixOS/nixpkgs/nixpkgs-unstable
global flake:nur github:nix-community/NUR
global flake:patchelf github:NixOS/patchelf
global flake:poetry2nix github:nix-community/poetry2nix
global flake:pridefetch github:SpyHoodle/pridefetch
global flake:sops-nix github:Mic92/sops-nix
global flake:systems github:nix-systems/default
global flake:templates github:NixOS/templatesash
```

</details>

## Flake 的 outputs 与命令的对应关系

| output         | 对应的命令      |
| -------------- | --------------------- |
| packages       | `nix build`/`nix run` |
| legacyPackages | `nix build`/`nix run` |
| apps           | `nix run`             |
| devShells      | `nix develop`         |
| formatter      | `nix fmt`             |
| checks         | `nix flake check`     |
| templates      | `nix flake init`      |

## nix build

```bash :nix build
# ビルド
nix build <flake-url>#<パッケージ名>
```

```nix :对应的attribute
# パッケージ
packages.<プラットフォーム>.<指定したパッケージ名> = <Derivation>;

# パッケージ（Nixpkgs）
legacyPackages.<プラットフォーム>.<パッケージ名> = <Derivation>;
```

它会对相应的 attribute 求值，并 realise 生成的 store derivation。平台会自动选择。

命令执行后，会在当前目录下创建一个名为 `result` 的符号链接，指向该软件包的 Store 路径。

```bash :构建GNU Hello
# x86_64-linuxで実行すると、
# NixpkgsのlegacyPackages.x86_64-linux.helloが評価される
$ nix build nixpkgs#hello

$ readlink result
/nix/store/4prjbnvjp40kkqjds62ywy9sr94j9g4b-hello-2.12.1

$ ls result
bin/ share/
```

## nix run

```bash :nix run
# 実行
nix run <flake-url>#<パッケージ名>
```

```nix :对应的attribute
# パッケージ
packages.<プラットフォーム>.<指定したパッケージ名> = <Derivation>;

# パッケージ（Nixpkgs）
legacyPackages.<プラットフォーム>.<パッケージ名> = <Derivation>;

# apps
apps."<プラットフォーム>"."<app名>" = {
  type = "app";
  program = "<ストアパス>";
};
```

从对相应 attribute 求值并 realise 这一点来说，它与 `nix build` 相同；但 `nix run` 不创建 `result`，而是把软件包提供的可执行文件运行一次。默认执行的是 `<软件包的 Store 路径>/bin/<软件包名>`。

此外还有 `nix run` 专用的 attribute——`apps`。`apps` 与 `packages` 不同，不能通过 `nix build` 使用，适合用来定义脚本这类一次性的处理^[相当于 Node.js `package.json` 中的 `scripts`。]。

## nix shell

```bash :nix run
# Nixシェルの起動
nix shell <flake-url>#<パッケージ名>
```

```nix :对应的attribute
# パッケージ
packages.<プラットフォーム>.<指定したパッケージ名> = <Derivation>;

# パッケージ（Nixpkgs）
legacyPackages.<プラットフォーム>.<パッケージ名> = <Derivation>;
```

它会启动一个被称为 **Nix shell** 的 shell。具体来说，是构建指定的软件包，并启动一个把其 Store 路径直接加入 `PATH` 环境变量的新 shell（`$SHELL`）。用 Ctrl + D 或 `exit` 退出 Nix shell 后即可恢复原状。

```bash :Nix shell
$ nix shell nixpkgs#hello

# $PATHにhelloの実行ファイルが一時的に追加される
[Nixシェル]$ hello
Hello, world!

# Nixシェルを終了
[Nixシェル]$ exit

$ hello
hello: command not found
```

想临时引入某个软件包时非常方便。

## nix develop

```nix :devShells的形式
devShells.${system}.${name} = <Derivation>;
```

```bash :对应的命令
nix develop <flake-url>#<name>
```

- nix develop

可以声明式地定义 Nix shell。用法将在后面讲解。

## nix fmt

```bash :nix fmt
nix fmt <flake-url>
```

```nix :formatter的形式
formatter.<プラットフォーム> = <Derivation>;
```

它会执行在 `formatter` 中设置的格式化工具。可以设置任意的格式化工具，通常设置的是以下 Nix 语言格式化工具之一：

- [nixfmt](https://github.com/NixOS/nixfmt)
- [alejandra](https://github.com/kamadorueda/alejandra)

另外，也有一些项目使用 [treefmt](https://github.com/numtide/treefmt) 来统一格式化 Nix 语言之外的文件。

<details>
<summary>nixfmt-rfc-style</summary>

nixfmt 有 nixfmt-classic 和 nixfmt-rfc-style 两种，本书中出现的 Nix 表达式基本上都用 nixfmt-rfc-style 格式化。
nixfmt 原本并不是官方的格式化工具，2024 年被移交到了官方仓库^[[Transfer to NixOS GitHub organisation #155](https://github.com/NixOS/nixfmt/issues/155)]。目前正在作为符合 [RFC 166](https://github.com/NixOS/rfcs/blob/master/rfcs/0166-nix-formatting.md) 的格式化工具推进实现^[[RFC 166 implementation tracking issue #153](https://github.com/NixOS/nixfmt/issues/153)]。由于尚未稳定，nixfmt-rfc-style 只在 Nixpkgs 的 unstable 分支中提供。

</details>

## Flake 的操作

### nix flake init/new

```bash
nix flake init
nix flake init --template <flake-url>#<テンプレート名>

nix flake new <ディレクトリ名>
nix flake new <ディレクトリ名> --template <flake-url>#<テンプレート名>
```

```nix :对应的attribute
templates.<テンプレート名> = <テンプレートの設定>;
```

用于初始化 / 新建 Flake。默认会创建如下的 `flake.nix`。

<details>
<summary>默认创建的 flake.nix</summary>

```nix :flake.nix
{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs }: {

    packages.x86_64-linux.hello = nixpkgs.legacyPackages.x86_64-linux.hello;

    packages.x86_64-linux.default = self.packages.x86_64-linux.hello;

  };
}
```

</details>

通过 `--template` 选项可以使用模板。官方也提供了模板。

https://github.com/NixOS/templates

```bash :使用c-hello模板
$ nix flake new c-hello --template github:nixos/templates#c-hello
wrote: /path/to/c-hello/Makefile.in
wrote: /path/to/c-hello/configure.ac
wrote: /path/to/c-hello/flake.nix
wrote: /path/to/c-hello/hello.c
```

### nix flake lock/update

生成 / 更新 `flake.lock`。

### nix flake show

```bash :nix flake show
nix flake show <flake-url>
```

获取 Flake 的 `packages` 中导出的软件包列表。

### nix flake check

```bash :nix flake check
nix flake check <flake-url>#<チェック名>
```

```nix :对应的attribute
checks.<プラットフォーム>.<チェック名> = <Derivation>;
```

`nix flake check` 是用于测试 Flake 的命令，它会 realise 对应的 derivation。例如可以用来验证某个软件包是否能够构建，从而确认 Flake 的正常性。如果不指定检查名，则会对所有检查求值。

## Nix Store

### nix store gc

对 Nix Store 执行垃圾回收的命令。它会删除所有不被任何地方引用的 Store 路径，实质上就是卸载命令。由于要解析记录依赖关系的数据库后才删除，可能会比较耗时。

### nix store delete

```bash :nix store delete
nix store delete <store-path>
```

删除指定的 Store 路径。由于执行的是安全删除，如果目标 Store 路径被其他地方引用，就不会被删除。和 `nix store gc` 一样需要解析数据库，删除可能会比较耗时。

## 【闲谈】Nixpkgs 的 legacyPackages

Nixpkgs 的软件包不是从 `packages` 导出的，而是从 `legacyPackages` 这个 attribute 导出的。正如 Nixpkgs 的 `flake.nix` 注释中所写的那样，这里的 legacy 并不是「旧软件包」的意思。

https://github.com/NixOS/nixpkgs/blob/78642712b23839a9cbcb9dc654579890019173ed/flake.nix#L84-L92

执行 `nix flake show` 这类获取软件包列表的命令时，Nix 为了获取软件包的元信息，会对 `packages` 中导出的全部 Nix 表达式求值（但不构建）。然而 Nixpkgs 的软件包数量实在太多，如果从 `packages` 导出，就会触发近 9 万个软件包的求值，耗时极其漫长。

于是就有了 `legacyPackages`。默认情况下 Nix 会忽略 `legacyPackages`。实际对 Nixpkgs 执行 `nix flake show`，`legacyPackages` 部分会显示为 `omitted`。

<details>
<summary>对 Nixpkgs 执行 nix flake show 的结果</summary>

```bash
$ nix flake show nixpkgs
github:NixOS/nixpkgs/<コミットハッシュ>
├───checks
│   ├───aarch64-darwin
│   │   └───tarball omitted (use '--all-systems' to show)
│   ├───aarch64-linux
│   │   ├───nixosSystemAcceptsLib omitted (use '--all-systems' to show)
│   │   └───tarball omitted (use '--all-systems' to show)
│   ├───armv6l-linux
│   │   ├───nixosSystemAcceptsLib omitted (use '--all-systems' to show)
│   │   └───tarball omitted (use '--all-systems' to show)
│   ├───armv7l-linux
│   │   ├───nixosSystemAcceptsLib omitted (use '--all-systems' to show)
│   │   └───tarball omitted (use '--all-systems' to show)
│   ├───i686-linux
│   │   ├───nixosSystemAcceptsLib omitted (use '--all-systems' to show)
│   │   └───tarball omitted (use '--all-systems' to show)
│   ├───powerpc64le-linux
│   │   └───tarball omitted (use '--all-systems' to show)
│   ├───riscv64-linux
│   │   ├───nixosSystemAcceptsLib omitted (use '--all-systems' to show)
│   │   └───tarball omitted (use '--all-systems' to show)
│   ├───x86_64-darwin
│   │   └───tarball omitted (use '--all-systems' to show)
│   ├───x86_64-freebsd
│   │   └───tarball omitted (use '--all-systems' to show)
│   └───x86_64-linux
│       ├───nixosSystemAcceptsLib: derivation 'nixos-system-nixos-24.11.20240815.8b90819'
│       └───tarball: derivation 'nixpkgs-tarball-24.11pre20240815.8b90819'
├───devShells
│   ├───aarch64-darwin
│   │   └───default omitted (use '--all-systems' to show)
│   ├───aarch64-linux
│   │   └───default omitted (use '--all-systems' to show)
│   ├───armv6l-linux
│   │   └───default omitted (use '--all-systems' to show)
│   ├───armv7l-linux
│   │   └───default omitted (use '--all-systems' to show)
│   ├───i686-linux
│   │   └───default omitted (use '--all-systems' to show)
│   ├───powerpc64le-linux
│   │   └───default omitted (use '--all-systems' to show)
│   ├───riscv64-linux
│   │   └───default omitted (use '--all-systems' to show)
│   ├───x86_64-darwin
│   │   └───default omitted (use '--all-systems' to show)
│   ├───x86_64-freebsd
│   │   └───default omitted (use '--all-systems' to show)
│   └───x86_64-linux
│       └───default: development environment 'nix-shell'
├───htmlDocs: unknown
├───legacyPackages
│   ├───aarch64-darwin omitted (use '--legacy' to show)
│   ├───aarch64-linux omitted (use '--legacy' to show)
│   ├───armv6l-linux omitted (use '--legacy' to show)
│   ├───armv7l-linux omitted (use '--legacy' to show)
│   ├───i686-linux omitted (use '--legacy' to show)
│   ├───powerpc64le-linux omitted (use '--legacy' to show)
│   ├───riscv64-linux omitted (use '--legacy' to show)
│   ├───x86_64-darwin omitted (use '--legacy' to show)
│   ├───x86_64-freebsd omitted (use '--legacy' to show)
│   └───x86_64-linux omitted (use '--legacy' to show)
├───lib: unknown
└───nixosModules
    ├───notDetected: NixOS module
    └───readOnlyPkgs: NixOS module
```

</details>

显式加上 `--legacy` 选项，就会显示 `legacyPackages` 的内容。

## 【闲谈】nixpkgs-weekly

由于 Nixpkgs 的更新频率非常高，从命令行使用 Nixpkgs 时会频繁触发下载。这多少让人有些烦躁，因此笔者使用的是发布在 [FlakeHub](https://flakehub.com)^[Determinate Systems 提供的 Flake 共享平台] 上的 [nixpkgs-weekly](https://flakehub.com/flake/DeterminateSystems/nixpkgs-weekly)。nixpkgs-weekly 对官方的 nixpkgs-unstable 做快照，每周更新一次。用 `nix registry add` 添加别名后使用会很方便。
