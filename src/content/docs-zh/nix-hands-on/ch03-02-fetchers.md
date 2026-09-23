---
title: "　§2. Fetcher"
description: "　§2. Fetcher"
order: 18
---

## Fetcher 的机制

**Fetcher** 是一种在不损害可复现性的前提下从互联网获取资源的机制。Fetcher 以 Nix 语言函数的形式提供，按用途分为各种各样的种类，但它们全都接受一个**哈希值**作为参数。执行 fetcher 时，Nix 会验证事先指定的哈希与从获取到的资源计算出的哈希是否一致。如果不一致，就抛出异常并终止 Nix 表达式的求值。机制虽然简单，却能可靠地保证幂等性。

## 各种各样的 Fetcher

### 内置的 Fetcher

Nix 语言以内置函数的形式提供了若干 fetcher。这里介绍 `fetchGit` 和 `fetchTarball`。

#### fetchGit

顾名思义，这是获取 Git 仓库的 fetcher。我们试着获取一下 [NixOS/nix](https://github.com/NixOS/nix)。这里指定写作本文时的最新提交哈希。

```nix :fetchGitDemo.nix
builtins.fetchGit {
  url = "https://github.com/NixOS/nix";
  ref = "master"; # 分支
  rev = "59def6c23b6d5173cc07990cf4d17d5a3ee1bddc"; # 提交哈希
}
```

```bash :fetchGitDemo.nix 的求值结果
$ nix eval --file ./fetchGitDemo.nix
# ↓实际上是一行，为便于阅读调整了显示方式
{
  lastModified = 1723483316;
  lastModifiedDate = "20240812172156";
  narHash = "sha256-3D7e6g4doWtOXHleD1n555nw411bAu0rSSpsUWp8ti4=";
  outPath = "/nix/store/dpinwg1p2kynwji4hlvk7jqyv9zhyi8s-source";
  rev = "59def6c23b6d5173cc07990cf4d17d5a3ee1bddc";
  revCount = 18115;
  shortRev = "59def6c";
  submodules = false;
}
```

仓库获取成功了。
`fetchGit` 返回一个 AttrSet。`outPath` 是获取到的仓库所在的 store 路径，`narHash` 是 Nix 独有的归档格式 [NAR](https://zenn.dev/asa1984/books/nix-introduction/viewer/07-binary-cache#nar) 的哈希。其余则是 Git 仓库的元数据。
把这个 AttrSet 传给 mkDerivation 的 `src`，就可以直接用于构建。

#### fetchTarball

用于获取 Tarball（如 `.tar.gz`）。刚才我们是以 Git 仓库的形式获取的，这次改为从 GitHub 的 release 获取 tarball。

`fetchTarball` 需要指定 tarball 的哈希，但我们还不知道哈希是多少，所以先填一个空字符串。

```nix :fetchTarballDemo.nix
builtins.fetchTarball {
  url = "https://github.com/NixOS/nix/archive/refs/tags/2.24.2.tar.gz";
  sha256 = "";
}
```

```bash :fetchTarballDemo.nix 的求值与报错
$ nix eval --file ./fetchTarballDemo.nix
error:
       … while evaluating the file '/home/asahi/Anything/nix-src/fetchTarballDemo.nix':

       … while calling the 'fetchTarball' builtin

         at /home/asahi/Anything/nix-src/fetchTarballDemo.nix:1:1:

            1| builtins.fetchTarball {
             | ^
            2|   url = "https://github.com/NixOS/nix/archive/refs/tags/2.24.2.tar.gz";

       error: hash mismatch in file downloaded from 'https://github.com/NixOS/nix/archive/refs/tags/2.24.2.tar.gz':
         specified: sha256:0000000000000000000000000000000000000000000000000000
         got:       sha256:063yg69fx8s27q1zjihss0zci4744scj0cnf460yg11nn7kkzvlx
```

如果给 `sha256` 指定空字符串，就会改用 `sha256:0000000000000000000000000000000000000000000000000000` 这个哈希来做验证。当然不可能一致，所以会失败，但此时正确的哈希也会一并显示出来。填入正确的哈希后再求值一次。

```diff nix :fetchTarballDemo.nix
builtins.fetchTarball {
  url = "https://github.com/NixOS/nix/archive/refs/tags/2.24.2.tar.gz";
- sha256 = "";
+ sha256 = "sha256:063yg69fx8s27q1zjihss0zci4744scj0cnf460yg11nn7kkzvlx";
}
```

```bash :再次对 fetchTarballDemo.nix 求值
$ nix eval --file ./fetchTarballDemo.nix
"/nix/store/11ny982v57jfyrm4q4iv2y3i4i76s2zk-source"
```

store 路径显示出来了。`fetchTarball` 会把获取到的 tarball 解压，因此 store 路径的内容是一个目录。

## Nixpkgs 提供的 Fetcher

Nixpkgs 提供了各种各样的 fetcher，请根据各自的用途选用合适的那一个。

### fetchFromGitHub

这是使用最广泛的 fetcher，用于从 GitHub 获取源代码。

`rev` 指定 release 的 tag 名。`hash` 不是提交哈希，而是获取到的归档文件的哈希。

```nix :fetchGitDemo.nix
fetchFromGitHub {
  owner = "NixOS";
  repo = "nix";
  rev = "2.24.2";
  hash = "sha256-ne4/57E2hOeBIc4yIJkm5JDIPtAaRvkDPkKj7pJ5fhg=";
};
```

与之类似的 fetcher 还有 `fetchFromGitLab`。

## 编程语言专用的 Fetcher

现代编程语言大多拥有自己专属的包管理器，因此不能像 `fetchurl` 或 `fetchFromGitHub` 那样简单地处理。针对这一问题，主要有以下几种解决思路。

#### 1. 解析锁文件并转换为 fetcher

这是主流做法。现代包管理器都拥有描述依赖关系的文件和锁文件，因此通过解析它们就能转换为 fetcher。

以 Rust 的包管理器 Cargo 为例，`Cargo.lock` 中记录了软件包的位置和校验和，读取它就能转换为 fetcher。

不只是 Rust，Nixpkgs 为各种编程语言都提供了对应的专用 fetcher。

#### 2. 代码生成

这种方式是利用工具生成写有 fetcher 的 Nix 文件，然后对其求值。相比第 1 种方法在 Nix 语言内部就能闭环，这种方法需要一个执行代码生成的外部工具。

属于这一类的工具有 [zon2nix](https://github.com/nix-community/zon2nix)。它会解析定义 Zig 依赖关系的 `build.zig.zon`，并生成写有对应 fetcher 的 Nix 文件。

#### 3. 手动编写 fetcher

在 Node.js 的 npm 或 Python 的 pip 中这种情况很常见：软件包安装完成后，还会执行该包特有的安装处理。这种情况无法靠自动生成 fetcher 来应对，必须手动编写 fetcher。

### Flakes as Fetcher

实际上，Flakes 也可以当作 fetcher 来用。给 Flake 的 inputs 加上 `flake = false` 选项，就能获取非 Flake 的东西。

```nix :flake.nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    gnu-hello-src = {
      url = "https://ftp.gnu.org/gnu/hello/hello-2.12.tar.gz";
      flake = false;
    };
  };

  outputs =
    {
      nixpkgs,
      flake-utils,
      gnu-hello-src,
      ...
    }:
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
            src = gnu-hello-src;
          };
        };
      }
    );
}
```

我们把 GNU Hello 源代码的 tarball 指定为 inputs，然后直接把它传给了 mkDerivation 的 `src`。

可以顺利构建。

```bash :构建 & 运行
$ nix run .#hello
Hello, world!
```

这次我们指定的是归档文件的 URL，但也可以像 `github:owner/repo` 那样指定 GitHub 仓库，此时会像 `fetchFromGitHub` 一样获取源代码。

它与普通 fetcher 最大的区别在于，无需自己写哈希，`flake.lock` 就能自动管理。首次获取时会自动生成 `flake.lock`，更新时也只需执行 `nix flake update`。

缺点在于，只要对 Flake 求值，就一定会获取全部 inputs。Fetcher 作为普通的 Nix 表达式求值，得益于惰性求值，在真正需要之前不会执行；而 Flake 一旦被求值，为了进行版本锁定就会获取全部 inputs，因此可能会获取到不必要的资源。

## Fetcher 的自动生成

[nvfetcher](https://github.com/berberman/nvfetcher) 是一个从配置文件生成 fetcher 代码的工具，支持 Git 仓库、pypi 软件包等。

https://github.com/berberman/nvfetcher

在需要使用大量 fetcher 时会很方便。也可以与 GitHub Actions 等 CI 结合，实现定期更新 fetcher 的用法。
