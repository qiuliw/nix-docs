---
title: "　§5. Flake 的 outputs"
description: "　§5. Flake 的 outputs"
order: 9
---

## outputs 的 schema

从技术上讲，`flake.nix` 的 outputs 中可以写任意的 Nix 表达式，但实际上最好遵循标准的 schema。用法和具体行为将在[_第 2 部：实践 Nix_](ch02-00-nix-practice)中讲解。

### CLI 使用的 attribute

Nix 的许多命令都以 `flake.nix` 为入口点来对 Nix 表达式求值。此时，具体使用 outputs 中的哪个 attribute，是由命令决定的。

```nix :flake.nix的outputs
outputs = { ... }:
{
  # `nix build <flake-url>#name`でビルド
  packages."<プラットフォーム>"."<パッケージ名>" = <Derivation>;
  # `nix build <flake-url>`でビルド
  packages."<プラットフォーム>".default = <Derivation>;

  # Nixpkgsで使われているattribute
  # packagesとほぼ同じ
  legacyPackages."<プラットフォーム>"."<パッケージ名>" = <Derivation>;

  # `nix run `<flake-url>#<name>`で実行
  apps."<プラットフォーム>"."<パッケージ名>" = {
    type = "app";
    program = "<ストアパス>";
  };
  # `nix run `<flake-url>`で実行
  apps."<プラットフォーム>".default = <Derivation>;

  # `nix fmt`で実行
  formatter."<プラットフォーム>" = <Derivation>;

  # `nix develop <flake-url>#<name>`でNixシェルを起動
  devShells."<プラットフォーム>"."<name>" = <Derivation>;
  # `nix develop <flake-url>`でNixシェルを起動
  devShells."<プラットフォーム>".default = <Derivation>;

  # `nix flake check`で実行
  checks."<プラットフォーム>"."<name>" = <Derivation>;

  # `nix flake init -t <flake>#<name>`でテンプレートを使う
  templates."<name>" = {
    path = "<ストアパス>";
    description = "templateの説明文";
  };
  # `nix flake init -t <flake>`でテンプレートを使う
  templates.default = ...
}
```

### 从 Nix 语言中使用的 attribute

这些是从 Nix 语言导入 `flake.nix` 时会用到的 attribute。关于 Overlay，将在 [_2.4. Overlays_](ch02-04-overlays) 中讲解。

```nix :flake.nix的outputs
outputs = { ... }:
{
  # derivation以外の汎用的なNix言語ライブラリ
  # CLIからは利用せず、Nix式としてインポートする
  lib.<name> = <任意のNix式>;

  # Overlay
  # CLIからは利用せず、Nix式としてインポートする
  overlays."<name>" = final: prev: { };
}
```

### Nix 之外的工具使用的 attribute

Nix 之外的工具有时会要求提供自己专用的 attribute。

```nix :flake.nix的outputs
outputs = { ... }:
{
  # NixOS
  ## `sudo nixos-rebuild switch --flake .#<hostname>`でNixOSの設定を適用
  nixosConfigurations."<hostname>" = {};
  ## NixOS module
  nixosModules."<name>" = { config, ... }: { options = {}; config = {}; };

  # home-manager
  ## home-managerの設定
  homeConfigurations = {
    "<ユーザー名@ホスト名>" = ...
  };
  ## home-manager module
  homeManagerModules = # home-managerのモジュール

  # Hydra
  ## Hydraのジョブセット
  hydraJobs."<AttrSet>"."<プラットフォーム>" = derivation;

  # deploy-rs
  deploy.nodes.<name> = # デプロイノード
}
```
