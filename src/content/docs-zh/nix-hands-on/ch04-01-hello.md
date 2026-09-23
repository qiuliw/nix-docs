---
title: "　§1. 构建 hello"
description: "　§1. 构建 hello"
order: 20
---

对于心想「到底要 `Hello, world!` 到什么时候啊」的你，你好！
本书是入门书，所以会一路 Hello World 到最后。毕竟打招呼是很重要的。

话虽如此，在此之前我们已经构建过好几次 GNU Hello 了。这次我们要连同 Git 一起把 Flake 搭建起来，从零开始把自制的 `hello` 打包成 Nix 包。让我们完整地走一遍从编写程序到构建的全过程。

## 1. 搭建 Flake

```bash :创建 Flake
nix flake new hello-nix
```

执行该命令后会创建 `hello-nix/` 目录，其中放置了如下的 `flake.nix`。

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

## 2. 引入 inputs

初始的 inputs 中设置的是 `github:nixos/nixpkgs?ref=nixos-unstable`（等价于 `github:nixos/nixpkgs/nixos-unstable`），但这次我们做的包希望在 NixOS 以外的系统上也能使用，因此改用 nixpkgs-unstable。另外，还要用 flake-utils 来支持多个平台。

```diff nix :flake.nix
{
- description = "A very basic flake";
+ description = "hello package written in Rust";

  inputs = {
-   nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
+   nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
+   flake-utils.url = "github:numtide/flake-utils";
  };

- outputs = { self, nixpkgs }: {
-
-   packages.x86_64-linux.hello = nixpkgs.legacyPackages.x86_64-linux.hello;
-
-   packages.x86_64-linux.default = self.packages.x86_64-linux.hello;
-
- };
+ outputs =
+   { nixpkgs, flake-utils, ... }:
+   flake-utils.lib.eachDefaultSystem (
+     system:
+     let
+       pkgs = nixpkgs.legacyPackages.${system};
+     in
+     {
+       packages = {
+         hello = pkgs.hello;
+         default = pkgs.hello;
+       };
+     }
+   );
}
```

现在和初始状态一样，导出的仍是 Nixpkgs 的 GNU Hello，接下来我们会把它替换成我们自己的 `hello`。

## 3. 编写 hello

现在的代码只是把 Nixpkgs 提供的 GNU Hello 重新导出而已，我们把它换成自制的 `hello` 吧。和上次一模一样就没意思了，这次我们用 Rust 来写。

```bash :创建 hello
mkdir src
touch ./src/hello.rs
```

```rust :src/hello.rs
fn main() {
    println!("Hello, world!");
}
```

此时热心的 Rustacean 大概会建议说「Hey you! 用 Cargo（Rust 的项目管理工具）啊！」，但出于种种原因，这次我们只使用 rustc（Rust 编译器）。

用 mkDerivation 编写构建表达式。

```diff nix :flake.nix
{
  description = # (略)

  inputs = # (略)

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
+       hello = pkgs.stdenv.mkDerivation {
+         pname = "hello";
+         version = "0.0.1";
+         src = ./src;
+         nativeBuildInputs = with pkgs; [ rustc ];
+         buildPhase = ''
+           rustc ./hello.rs
+         '';
+         installPhase = ''
+           mkdir -p $out/bin
+           cp ./hello $out/bin/hello
+         '';
+       };
      in
      {
        packages = {
-         hello = pkgs.hello;
-         default = pkgs.hello;
+         inherit hello;
+         default = hello;
        };
      }
    );
}
```

通过 `nativeBuildInputs` 把 rustc 引入构建环境，在 `buildPhase` 中进行编译。生成的可执行文件则在 `installPhase` 中复制到 `$out/bin`。

用 `nix run` 运行看看。

```bash :运行
$ nix run
# 发生错误！
```

出现了「找不到文件！」的错误。这次我们把 Flake 做成了 Git 仓库，因此 Nix 会经由 Git 来查找文件，而新添加的文件还没有被暂存，所以报错了。先 `git add` 再 `nix run` 吧。

```bash :暂存后再运行
$ git add .

$ nix run
Hello, world!
```

## 4. 重构

像这次这样的小项目，只用一个 `flake.nix` 就足够了；但如果是大型项目，写在 `flake.nix` 里的内容最好控制到最少，所以我们来拆分文件。另外，软件包的元信息还不够完善，我们也给 mkDerivation 补充一些配置。

在开始重构之前先提交一次。

```bash :先提交
git commit --message="add hello-rs"
```

### 5.1. 拆分文件

用 `import` 也可以，但这里我们采用 Nixpkgs 所使用的 **callPackage 模式**^[[Callpackage Design Pattern - Nix Pills](https://nixos.org/guides/nix-pills/13-callpackage-design-pattern)]。创建 `nix/` 目录，把原本写在 `flake.nix` 里的构建表达式移到 `nix/hello.nix`。

```nix :nix/hello.nix
{ stdenv, rustc }:
stdenv.mkDerivation {
  pname = "hello";
  version = "0.0.1";

  src = ../src; # 注意！这是从 nix/hello-rs.nix 看向 src/ 的相对路径
  nativeBuildInputs = [ rustc ];
  buildPhase = ''
    rustc ./hello.rs
  '';
  installPhase = ''
    mkdir -p $out/bin
    cp ./hello $out/bin/hello
  '';
}
```

用 `pkgs.callPackage` 导入 `nix/hello.nix`。

```diff nix :flake.nix
{
  description = # (略)

  inputs = # (略)

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
-       hello = # (略)
      in
      {
        packages = {
-         inherit hello;
-         default = hello;
+         hello = pkgs.callPackage ./nix/hello.nix { };
+         default = pkgs.callPackage ./nix/hello.nix { };
        };
      }
    );
}
```

请运行一下，确认能得到相同的结果。

```bash :运行确认
# 因为新增了 nix/hello.nix，所以要暂存
$ git add .

$ nix run
Hello, world!
```

`callPackage` 函数接受 Path 和 AttrSet 两个参数，并把 `pkgs` 传给由 Path 指定的 Nix 文件中的函数。正如 [_1.1. Nix 语言的基础_](ch01-01-nix-lang-basics) 中讲过的那样，以 AttrSet 为参数的函数可以从接收到的 AttrSet 中解构出 attribute，因此前面的 `hello.nix` 就是用 `{ stdenv, rustc }` 的写法取出了 `pkgs.stdenv` 和 `pkgs.rustc`。
另外，这次我们给 `callPackage` 的第二个参数传的是空 AttrSet，而这个 AttrSet 会被合并到 `pkgs` 中。也就是说，准确地讲传给 `hello.nix` 的是 `pkgs // {}`。

```:callPackage 理想中的类型
callPackage :: Path -> AttrSet -> Derivation
```

### 5.2. 添加 meta attribute

在 mkDerivation 中，可以通过名为 `meta` 的 attribute 设置详细的元信息。

```diff nix :nix/hello.nix
-{ stdenv, rustc }:
+{
+  stdenv,
+  rustc,
+  lib,
+}:
stdenv.mkDerivation {
  pname = "hello";
  version = "0.0.1";

  src = ../src; # 注意！这是从 nix/hello-rs.nix 看向 src/ 的相对路径
  nativeBuildInputs = [ rustc ];
  buildPhase = ''
    rustc ./hello.rs
  '';
  installPhase = ''
    mkdir -p $out/bin
    cp ./hello $out/bin/hello
  '';

+ meta = {
+   mainProgram = "hello";
+   description = "A hello world program written in Rust";
+   longDescription = ''
+     This is a demo package for the Nix-Hands-On, which is a hello world program written in Rust.
+   '';
+   license = lib.licenses.mit;
+   platforms = lib.platforms.all;
+ };
}
```

#### mainProgram

`mainProgram` 指定 `nix run` 时执行的程序。它用于包含多个可执行文件的软件包，或者包名与可执行文件名不一致的软件包。`nix run` 默认执行 `<store 路径>/bin/<pname>`。

#### description 与 longDescription

写在 `description`/`longDescription` 中的说明会显示在 [search.nixos.org](https://search.nixos.org/) 上。
此外，`description` 也是 `nix search <flake-url> <搜索词>` 的检索对象。

```bash :利用 description 进行搜索
# "rust" 并不包含在包名中，但包含在 description 中，因此能被搜到
❯ nix search . rust
* packages.x86_64-linux.default (0.0.1)
  A hello world program written in **Rust**

* packages.x86_64-linux.hello (0.0.1)
  A hello world program written in **Rust**
```

#### license

`license` 用于指定软件包的许可证。`lib.licenses` 是一个收录了各种许可证的 AttrSet，定义在 [nixpkgs/lib/licenses.nix](https://github.com/NixOS/nixpkgs/blob/master/lib/licenses.nix) 中。如果在 `meta.license` 中指定被标记为 unfree 的许可证，在默认设置下求值时会报错。

```nix :指定 Unfree 的许可证
# 指定一个禁止商用、禁止改编的许可证
# https://creativecommons.org/licenses/by-nc-nd/4.0/deed.ja
license = lib.licenses.cc-by-nc-40;
```

```bash :对 Unfree 软件包求值
$ nix run
# 发生错误！
```

通过设置 `$NIXPKGS_ALLOW_UNFREE` 环境变量，或者在导入 Nixpkgs 时指定 `allowUnfree = true`，就可以允许对使用 unfree 许可证的软件包求值。

```bash
# 由于要用 Nix 语言的非纯函数（getEnv）读取环境变量，需要加上 --impure 选项
$ NIXPKGS_ALLOW_UNFREE=1 nix run --impure
Hello, world!
```

```nix :导入 Nixpkgs 时指定 allowUnfree
pkgs = import nixpkgs {
  inherit system;
  config = {
    allowUnfree = true;
  };
};
```

#### platforms

`platforms` 用 List 指定软件包支持的平台。它定义在 [nixpkgs/lib/systems/doubles.nix](https://github.com/NixOS/nixpkgs/blob/master/lib/systems/doubles.nix) 中，主要可以按以下类别指定平台。

- OS（Linux、Darwin、Windows、FreeBSD、Cygwin、UNIX 等）
- CPU 架构（x86、ARM、RISC-V 等）
- 等等……

如果试图在 `platforms` 未指定的平台上对软件包求值，就会报错。例如，`platforms` 只指定了 `lib.platforms.darwin`（macOS），却在 Linux 上求值，就会发生错误。

```bash :仅支持 macOS
platforms = lib.platforms.darwin;
```

这次我们做的是跨平台的软件包，所以指定了 `lib.platforms.all`。

#### 其他 attribute

`meta` 中的信息基本上是供 Nixpkgs 使用的，因此其余内容就不再赘述。关于其他 attribute 及详细说明，请参阅下面的官方手册。

https://nixos.org/manual/nixpkgs/stable/#sec-standard-meta-attributes
