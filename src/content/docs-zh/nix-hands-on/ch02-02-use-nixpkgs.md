---
title: "　§2. 使用 Nixpkgs"
description: "　§2. 使用 Nixpkgs"
order: 12
---

[Nixpkgs](https://github.com/NixOS/nixpkgs) 是 Nix 的官方软件包仓库，提供了约 9 万个软件包的构建表达式。使用 Nix 时几乎必然会用到 Nixpkgs。

此外，Nixpkgs 除了软件包，还一并提供了扩展 Nix 语言内置函数的库，以及「第 3 部：构建工具」中要讲解的构建用函数，因此它也扮演着 Nix 语言标准库的角色。详情请参考《Nix 入门》的 [Chapter 10 Nixpkgs](https://zenn.dev/asa1984/books/nix-introduction/viewer/10-nixpkgs)。

这里说明 Nixpkgs 的使用方法。

## Nixpkgs 的分支

本书使用 nixpkgs-unstable。

- nixos-xx.yy
  - LTS
  - 撰稿时最新的是 nixos-24.05
- nixpkgs-unstable
  - 滚动发布
  - 应用通过了若干测试的更新
- nixos-unstable
  - 滚动发布
  - 应用通过了 NixOS 专用测试的更新
- master
  - 最新的分支
  - 未经测试
  - 不应该使用

## 引入 Nixpkgs

我们引入 Nixpkgs，并把 `hello` 重新导出。

```nix :flake.nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    { nixpkgs, ... }:
    let
      # 自分のシステムに合わせて変更してください
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      packages.${system} = {
        hello = pkgs.hello;
      };
    };
}
```

只要能正常导出就说明没问题。

```bash
# outputsの確認
$ nix flake show
path:/path/to/flake?lastModified=<最終変更日時>&narHash=<ハッシュ>
└───packages
    └───x86_64-linux
        └───hello: package 'hello-2.12.1'

# 実行してみる
$ nix run .#hello
Hello, world!
```

### pkgs

惯例是把 `nixpkgs.legacyPackages.<平台>` 绑定到一个名为 `pkgs` 的变量上反复使用。通过 `pkgs.<软件包名>` 就能引用 Nixpkgs 中的软件包。请在 [search.nixos.org](https://search.nixos.org/packages) 上搜索并指定你需要的软件包。

## 支持多个平台

目前我们的 Flake 只导出了 `x86_64-linux` 用的软件包。我们希望它也能在 `aarch64-linux`、`aarch64-darwin` 上使用，即支持多个平台；但特意去写 `packages.aarch64-linux.hello`、`packages.aarch64-darwin.hello` 太啰嗦了，因此我们借助一些工具函数来让 `flake.nix` 的写法更简洁。

### 使用 flake-utils

flake-utils 是一个提供 Flake 相关工具函数的 Flake，这次我们使用其中的 `eachDefaultSystem` 函数。

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
      {
        packages = {
          hello = pkgs.hello;
        };
      }
    );
}
```

这样就不必在 outputs 中把平台硬编码进去了。传给 `eachDefaultSystem` 的是一个接收字符串并返回 AttrSet 的函数，该函数的参数（上例中的 `system`）会被传入平台名。

```:eachDefaultSystem的类型
eachDefaultSystem :: (String -> AttrSet) -> AttrSet
```

查看 outputs 可以发现，软件包已经面向多个平台导出了。

```bash
# outputsの確認
$ nix flake show
path:/path/to/flake?lastModified=<最終変更日時>&narHash=<ハッシュ>
└───packages
    ├───aarch64-darwin
    │   └───hello omitted (use '--all-systems' to show)
    ├───aarch64-linux
    │   └───hello omitted (use '--all-systems' to show)
    ├───x86_64-darwin
    │   └───hello omitted (use '--all-systems' to show)
    └───x86_64-linux
        └───hello: package 'hello-2.12.1'
```

`hello` 软件包已经面向 Intel/AMD/ARM 的 Linux 以及 Intel/Apple 芯片的 macOS 导出了。如果想支持上述之外的平台，可以使用 `eachSystem` 等函数。

> 即便使用了 `eachDefaultSystem` 函数，也不保证在各个平台上真的能够构建成功。它终究只是一个让 Flake 结构写得更简洁的工具函数。

### 自己编写工具函数

flake-utils 是一个零依赖的 Flake，所有函数都仅用 Nix 语言的内置函数实现。

```nix :eachDefaultSystem的实现
# 一部省略している
{
  defaultSystems = [
    "aarch64-darwin" # 64-bit ARM macOS
    "aarch64-linux" # 64-bit ARM Linux
    "x86_64-darwin" # 64-bit x86 macOS
    "x86_64-linux" # 64-bit x86 Linux
  ];


  eachSystem =
    systems: f:
    let
      op =
        attrs: system:
        let
          ret = f system;
          op =
            attrs: key:
            attrs
            // {
              ${key} = (attrs.${key} or { }) // {
                ${system} = ret.${key};
              };
            };
        in
        builtins.foldl' op attrs (builtins.attrNames ret);
    in
    builtins.foldl' op { } systems;

  eachDefaultSystem = eachSystem defaultSystems;
}
```

……对不熟悉 Nix 语言的人来说可能有点难。

如果利用 [Nixpkgs lib](https://nixos.org/manual/nixpkgs/stable/#id-1.4)，用更短的代码就能实现类似的函数。

```nix :flake.nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    { nixpkgs, ... }:
    let
      supportSystems = [
        "aarch64-darwin" # 64-bit ARM macOS
        "aarch64-linux" # 64-bit ARM Linux
        "x86_64-darwin" # 64-bit x86 macOS
        "x86_64-linux" # 64-bit x86 Linux
      ];
      forAllSystems = nixpkgs.lib.genAttrs supportSystems;
    in
    {
      packages = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          hello = pkgs.hello;
        }
      );
    };
}
```

与 `eachDefaultSystem` 不同，这种写法需要对 outputs 的每个 attribute 分别使用 `forAllSystems`，但大体上能做到同样的事。

关键在于 [`nixpkg.lib.genAttrs`](https://nixos.org/manual/nixpkgs/stable/#function-library-lib.attrsets.genAttrs)。Nixpkgs 不仅提供软件包，也提供 Nix 语言的库。

```:genAttrs的类型
genAttrs :: [ String ] -> (String -> Any) -> AttrSet
```

### 该用哪一个？

最常见的是 flake-utils，不过自备函数的人也不少。

另外还有一个比 flake-utils 功能更强大的库 [flake-parts](https://github.com/hercules-ci/flake-parts)。

https://github.com/hercules-ci/flake-parts

https://flake.parts

本书选用写法最简洁的 flake-utils。
