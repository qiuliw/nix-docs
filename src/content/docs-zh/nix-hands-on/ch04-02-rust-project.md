---
title: "　§2. 构建 Rust 项目"
description: "　§2. 构建 Rust 项目"
order: 21
---

通常，Rust 的项目（crate）是用 Cargo 管理的。这次我们使用 Nixpkgs 提供的 Rust 构建工具，把 crate 打包成 Nix 包。

## 准备 devShell

Rust 有一个优秀的工具叫 [rustup](https://github.com/rust-lang/rustup)，平时我们用它来管理 Rust 工具链；但这次我们要用 Nix 的 devShell 以声明式的方式管理工具链。

### Rust 工具链的管理

那么，就从 Nixpkgs 安装 `rustc` 和 `cargo`……本想这么做，但直接从 Nixpkgs 安装 Rust 工具链其实并不实用。因为 Nixpkgs 维护的 Rust 版本只有最新的稳定版，想获取过去的版本就必须回溯 Nixpkgs 的提交历史，而且它也不提供 nightly。另外，由于不经过 rustup，也无法添加编译目标（例如：添加 WASM 作为目标）。

于是我们改用 [rust-overlay](https://github.com/oxalica/rust-overlay)。rust-overlay 是一个提供 Rust 工具链 overlay 的 Flake，可以指定工具链版本、添加编译目标。

https://github.com/oxalica/rust-overlay

除了 rust-overlay 之外，提供 Rust 工具链的 Flake 还有好几个，其中 [fenix](https://github.com/nix-community/fenix) 与 rust-overlay 并列，同样被广泛使用。fenix 还提供 rust-analyzer。

https://github.com/nix-community/fenix

<details>
<summary>nixpkgs-mozilla</summary>

实际上，Mozilla 官方也通过一个叫 [nixpkgs-mozilla](https://github.com/mozilla/nixpkgs-mozilla) 的 Flake 提供 Rust 的 overlay；不过上述那些 Flake 本就是以取代 nixpkgs-mozilla 为目的而提供的，因此似乎并不推荐为了 Rust 而使用 nixpkgs-mozilla。

</details>

### devShell 的配置

我们来配置 devShell。

```bash :创建目录
mkdir rust-with-nix
cd rust-with-nix
touch flake.nix
```

```nix :flake.nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      nixpkgs,
      flake-utils,
      rust-overlay,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ rust-overlay.overlays.default ];
        };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.rust-bin.stable.latest.default
          ];
        };
      }
    );
}
```

把 rust-overlay 添加到 inputs 时，我们指定了 `inputs.nixpkgs.follow` 这个选项。由于 rust-overlay 依赖 Nixpkgs，如果直接朴素地引入，就会同时存在「我们的 Flake 的 inputs 里的 Nixpkgs」和「rust-overlay 的 inputs 里的 Nixpkgs」这两个版本的 Nixpkgs。从依赖关系一致性的角度看，分离开来是更理想的，但相应地会占用更多存储空间。这次我们把 rust-overlay 所依赖的 Nixpkgs 替换成了我们自己引入的 Nixpkgs。

加入 Overlay 后，`pkgs` 中会新增一个名为 `rust-bin` 的 attribute。用 `nix develop` 启动 devShell，能确认 `cargo` 和 `rustc` 已经安装好，就 OK 了。

## 1. 基本的构建

### 创建 crate

初始化 crate。

```bash :初始化 crate
$ cargo init

# 确认可以运行
$ cargo run
Hello, world!
```

### 打包为 Nix 包

首先就以这个状态把它打包成 Nix 包试试。

使用 Nixpkgs 提供的 `pkgs.rustPlatform.buildRustPackage`。

```nix :nix/rust-with-nix.nix
{ rustPlatform }:
rustPlatform.buildRustPackage {
  pname = "rust-with-nix";
  version = "0.1.0";

  src = ../.;
  cargoLock.lockFile = ../Cargo.lock;
}
```

```diff nix :flake.nix
 {
   inputs = # ...

   outputs =
     {
       nixpkgs,
       flake-utils,
       rust-overlay,
       ...
     }:
     flake-utils.lib.eachdefaultsystem (
       system:
       let
         pkgs = # ...
       in
       {
         devshells.default = # ...
+        packages.default = pkgs.callPackage ./nix/rust-with-nix.nix { };
       }
     );
 }
```

确认用 Nix 构建后可以运行。

```bash
$ nix run
Hello, world!
```

### 使用 rust-overlay

`pkgs.rustPlatform` 内部使用的是 Nixpkgs 的 Cargo 和 rustc，我们把它改成使用这次在 devShell 中所用的 rust-overlay 的 Rust 工具链。

用 `pkgs.makeRustPlatform` 创建一个把 cargo 和 rustc 替换成 rust-overlay 版本的 rustPlatform。

```diff nix :nix/rust-with-nix.nix
-{ rustPlatform }:
+{ makeRustPlatform, rust-bin }:
+let
+  toolchain = rust-bin.stable.latest.default;
+  rustPlatform = makeRustPlatform {
+    cargo = toolchain;
+    rustc = toolchain;
+  };
+in
 rustPlatform.buildRustPackage {
   pname = "rust-with-nix";
   version = "0.1.0";

   src = ../.;
   cargoLock.lockFile = ../Cargo.lock;
 }
```

应该可以正常运行。

```bash
$ nix rust
Hello, world!
```

## 2. 构建依赖 OpenSSL 的 crate

我们来做一个稍微进阶一点的构建。引入名为 [reqwest](https://github.com/seanmonstar/reqwest) 的 HTTP 客户端库。

```bash :添加依赖 crate
cargo add reqwest --features=blocking
```

<details>
<summary>blocking feature</summary>

通常 reqwest 运行在异步运行时之上。Rust 本体虽然有表达异步处理的类型和语法，但实际执行任务的运行时必须作为库额外引入。这次的主题终究是讲解用 Nix 进行构建，所以我们启用了 `blocking` feature，使其能在原生 Rust 下同步运行。

</details>

把 `main.rs` 改写成下面这样。

```rust :src/main.rs
fn main() {
    let url = match std::env::args().nth(1) {
        Some(url) => url,
        None => panic!("No URL provided"), // 没有参数时异常退出
    };

    let response = reqwest::blocking::get(&url).unwrap();

    println!("Statu code: {}", response.status());
}
```

这是一个接收 URL 作为参数、向该 URL 发送 GET 请求并显示响应状态码的程序。

用 `cargo run` 运行看看。

```bash
$ cargo run https://example.com
# 报错！
# 被告知找不到 pkg-config 或 OpenSSL
```

在笔者的环境中，它报错说「找不到 pkg-config」。不过在读者的环境中，构建也可能会成功。

默认的 reqwest 依赖 OpenSSL，构建时会利用 pkg-config 去查找 OpenSSL 的库。因此在没有安装 pkg-config 或 OpenSSL 的环境中就会发生构建错误。这是 Cargo 自身无法解决的依赖关系，正是所谓的隐式依赖。

最简单也最受推荐的解决方法，是启用 reqwest 的 `rustls-tls` feature，改用 Rust 实现的 TLS 库 [rustls](https://github.com/rustls/rustls) 来替代 OpenSSL。

不过这次我们偏要不用 rustls，而是尝试在 devShell 中安装 OpenSSL 再进行构建。

### 扩展 devShell

给 devShell 添加 OpenSSL 和 pkg-config。

```diff nix :flake.nix
  # ...
  devShells.default = pkgs.mkShell {
-   packages = [
-     pkgs.rust-bin.stable.latest.default
-   ];
+   packages = with pkgs; [
+     openssl
+     pkg-config
+     rust-bin.stable.latest.default
+   ];
  };
  # ...
```

再次启动 devShell 并构建。

```bash :在 devShell 内运行
$ nix develop
$ cargo run https://example.com
Statu code: 200
```

构建成功，并显示出了向 example.com 发送请求所得到的响应状态码。

在大量使用外部库的场景下，devShell 非常有效。它不需要全局安装，能以项目为单位管理依赖关系，因此可以不必担心与其他项目的依赖冲突，安心地推进开发。

### 打包为 Nix 包

和 devShell 一样，构建表达式中也需要添加依赖关系。与 mkDerivation 函数相同，把运行时依赖（OpenSSL）加到 `buildInputs`，把构建时依赖（pkg-config）加到 `nativeBuildInputs`。

```diff nix nix/rust-with-nix.nix
-{ makeRustPlatform, rust-bin }:
+{
+  makeRustPlatform,
+  rust-bin,
+  openssl,
+  pkg-config,
+}:
 let
   toolchain = rust-bin.stable.latest.default;
   rustPlatform = makeRustPlatform {
     cargo = toolchain;
     rustc = toolchain;
   };
 in
 rustPlatform.buildRustPackage {
   pname = "rust-with-nix";
   version = "0.1.0";

+  buildInputs = [ openssl ];
+  nativeBuildInputs = [ pkg-config ];

   src = ../.;
   cargoLock.lockFile = ../Cargo.lock;
 }
```

确认用 Nix 也能构建。

```bash
$ nix build
$ ./result/bin/rust-with-nix https://example.com
Statu code: 200
```

成功了！

## 内部究竟做了什么？

`pkgs.rustPlatform.buildRustPackage` 接收 SHA-256 字符串或 `Cargo.lock` 的 Path 作为参数，并把它转换成获取依赖 crate 的 fetcher。其内部似乎会利用 `pkgs.fetchzip` 或 `pkgs.fetchurl`，从 [crates.io](https://crates.io) 获取 crate 的 tarball。

依赖关系和源代码获取完毕后，接下来就是在 buildPhase 中执行 `cargo build` 来构建软件包。另外，如果存在测试，还会在 checkPhase 中执行 `cargo test`（可以用 `doCheck = false` 禁用；如果测试需要使用网络，设为 false 会比较好）。

详情请参阅 Nixpkgs 中关于 Rust 构建的文档。

[https://github.com/NixOS/nixpkgs/blob/master/doc/languages-frameworks/rust.section.md](https://github.com/NixOS/nixpkgs/blob/master/doc/languages-frameworks/rust.section.md)

## Nixpkgs 以外的 Rust 构建工具

Rust 在 Nix 社区中也是非常受欢迎的语言，因此 Nixpkgs 之外也有多个构建工具可用。在笔者的观察范围内，似乎 [crane](https://github.com/ipetkov/crane) 尤其被广泛使用。

https://github.com/ipetkov/crane
https://github.com/nix-community/naersk
https://github.com/cargo2nix/cargo2nix

## 其他语言的构建

对于 Rust 以外的语言，同样提供了支持类似构建方式的函数。Nixpkgs 的 `/doc/languages-framworks` 目录下存放着各语言构建相关的文档，请参阅你所需语言的那一份。

https://github.com/NixOS/nixpkgs/tree/master/doc/languages-frameworks

另外，如果要寻找 Nixpkgs 以外的构建工具，[awesome-nix](https://github.com/nix-community/awesome-nix) 或许也会有帮助。

https://github.com/nix-community/awesome-nix?tab=readme-ov-file#programming-languages
