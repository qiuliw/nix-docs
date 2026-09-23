---
title: "　§4. Overlays"
description: "　§4. Overlays"
order: 14
---

## Overlays

借助 **Overlays** 这一机制，可以对 Nixpkgs 进行扩展或覆盖。你可以给 Nixpkgs 打补丁，也可以添加新的软件包。

Overlay 通过 Flake outputs 的 `overlays` attribute 导出。

```nix :Flake的outputs
overlays.<overlayの名前> = final: prev: #...
```

### 试用 Overlay

这里以 [NUR](https://github.com/nix-community/NUR) 为例。NUR（Nix User Repository）是一个社区驱动的软件包仓库，公开了近 4000 个软件包。NUR 本身并不做维护和审核，其机制是由用户把自己的仓库关联到 NUR，再由 NUR 定期同步（有意思的是，[Mozilla](https://github.com/mozilla/nixpkgs-mozilla) 也注册了自己的仓库）。

https://nur.nix-community.org

此前我们一直以 `nixpkgs.legacyPackages.${system}` 的形式引用 Nixpkgs 中的软件包，而使用 overlay 时则要改用 `import nixpkgs`。

```nix :flake.nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    nur.url = "github:nix-community/NUR";
  };

  outputs =
    {
      nixpkgs,
      flake-utils,
      nur,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        # `nur.overlays.<overlayの名前>`ではなく`nur.overlay`
        # `outputs.overlay`は現在非推奨だが恐らく後方互換性のために残されている
        overlays = [ nur.overlay ];
        pkgs = import nixpkgs { inherit system overlays; };
      in
      {
        packages = {
          default = pkgs.nur.repos.mic92.hello-nur;
        };
      }
    );
}
```

把 NUR 作为 overlay 添加之后，就可以通过 `pkgs.nur` 引用 NUR 中的软件包了。这份 `flake.nix` 重新导出了 NUR 维护者 [Mic92](https://github.com/Mic92) 提供的 `hello-nur`。我们来运行看看。

```bash :运行hello-nur
$ nix run
Hello, NUR!
```

还有各种各样的 overlay，感兴趣的话不妨自己去了解一下。
