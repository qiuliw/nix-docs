---
title: "Nixpkgs"
description: "Nixpkgs"
order: 10
---

[Nixpkgs](https://github.com/NixOS/nixpkgs) 是 Nix 的官方软件包仓库。它以 GitHub 仓库的形式管理，提交数已超过 60 万次。

https://github.com/NixOS/nixpkgs

Nixpkgs 不只是一个软件包仓库，作为 Nix 生态的核心，它还承担着其他重要角色。本章我们来详细了解 Nixpkgs。

本章内容大多参考自 [Nixpkgs Manual](https://nixos.org/manual/nixpkgs/stable/)。

https://nixos.org/manual/nixpkgs/stable/

## 惊人的软件包数量

最令人吃惊的是它的软件包数量。事实上，Nixpkgs 是目前软件包数量最多的软件包仓库。

下图是 [Repology](https://repology.org) 对各软件包仓库统计数据的可视化结果。横轴为「软件包数量」，纵轴为「保持在最新状态的软件包数量」。绝大多数软件包仓库都聚集在左下区域，只有 AUR 与 Nixpkgs 远远地位于右侧。而位于最右上方的，是 Nixpkgs 的滚动发布分支 nixpkgs unstable。

![Repology 绘制的软件包仓库统计散点图。横轴标注为 `Number of packages in repository`，纵轴标注为 `Number of fresh packages in repository`。若把图表上下左右分为四个区域，绝大多数软件包仓库的点位于左下方，而 Nixpkgs 的各个分支与 AUR 的点则远远地位于右侧。AUR 的点位于右下方，Nixpkgs 的各分支则位于右上方。nixpkgs unstable 的点在整张图中位于最右上方。](https://repology.org/graph/map_repo_size_fresh.svg)
_引用自 [repology.org](https://repology.org/repositories/graphs)_

在本章撰写时（2024/03/31），nixpkgs unstable 中有 90924 个软件包，撰写时最新的 stable 分支 nixpkgs stable 23.11 中有 88843 个软件包。

Nix 虽然在构建系统上有严格的约束和独有的概念，但由于 Nix 语言的灵活性极高，因此能够把一般包管理器难以覆盖的范围也用 Nix 包装起来。

可以在下面的网站上搜索软件包。

https://search.nixos.org/packages

## Nixpkgs 的分支

Nixpkgs 有多个分支。首先是滚动发布的 unstable 分支与稳定版的 stable 分支。稳定版分支的新版本基本上只包含安全更新。

此外还有面向 NixOS 用户的 `nixos-*` 分支和面向非 NixOS 用户的 `nixpkgs-*` 分支。它们的区别在于所执行测试的内容不同^[[Differences between Nix channels - NixOS Discourse](https://discourse.nixos.org/t/differences-between-nix-channels/13998/5)]。Nixpkgs 使用名为 [Hydra](https://nixos.org/hydra/) 的 CI 工具来构建和测试软件包。每个分支都配置了对应的任务，只有构建成功且通过测试，更新才会被合入。

`nixpkgs-unstable` 与 `nixos-unstable` 在所有分支中最紧密地跟随 `master` 分支，但从 `master` 同步过来通常会有数天的延迟。这是因为更新必须先经过测试、确认安全之后才会被反映过来。

另外，Nixpkgs 也使用 Hydra 来创建二进制缓存：把构建产物上传到 AWS 的 S3，并通过 [cache.nixos.org](https://cache.nixos.org) 提供二进制缓存。

## 支持的平台

Nixpkgs 主要支持的平台如下。

- `x86_64-linux`
- `aarch64-linux`
- `aarch64-darwin`
- `x86_64-darwin`

其中 `x86_64-linux` 获得的支持级别最高，而 `aarch64-darwin`（Apple Silicon）获得的支持高于 `x86_64-darwin`（Intel Mac）。

Nixpkgs 也支持上述以外的平台，[RFC046](https://github.com/NixOS/rfcs/blob/master/rfcs/0046-platform-support-tiers.md) 的 [Appendix A](https://github.com/NixOS/rfcs/blob/master/rfcs/0046-platform-support-tiers.md#appendix-a-non-normative-description-of-platforms-in-november-2019) 中按支持 Tier 列出了各个平台。需要注意的是，该列表的数据截至 2019 年 11 月，例如 `aarch64-darwin` 的 Tier 就与当前情况有所出入。

## Unfree 软件包

在 Nixpkgs 中，专有软件被归类为 Unfree 软件包，默认情况下无法安装。
官方给出的解释是：Nixpkgs 的用户都是自由软件的使用者，Nixpkgs 的用户与开发者希望限制并严格管理对非自由软件的访问。

当然，只要进行相应设置，Unfree 软件包也可以正常安装。

[Install unfree packages](https://nixos.org/manual/nixpkgs/stable/#sec-allow-unfree)

https://nixos.org/manual/nixpkgs/stable/#sec-allow-unfree

## Nixpkgs 的本质

事实上，Nixpkgs 本身就是一个 Nix 表达式。Nix 的软件包仓库更接近于编程语言中的库。实际使用 Nixpkgs 时，我们是用 Nix 语言导入 Nixpkgs 的 Nix 表达式，就像在编程语言中导入外部库一样。

换句话说，Nixpkgs 就是「一个收录了约 9 万个软件包构建函数的 Nix 语言库」。

## 软件包之外的产出

### [Nixpkgs lib](https://nixos.org/manual/nixpkgs/stable/#id-1.4)

提供了 Nix 语言的标准库。

### [Standard Environment](https://nixos.org/manual/nixpkgs/stable/#chap-stdenv)

Standard Environment（直译：标准环境）提供了构建 UNIX 软件包所需的标准构建环境，也就是在 Derivation 一章中作为 `stdenv` 登场的那个东西。
`stdenv.mkDerivation` 是 Nixpkgs 提供的最重要的函数之一，因为 Nixpkgs 提供的绝大多数软件包都是使用 stdenv 构建的。

Nix 语言的内置函数 `derivation` 存在一个问题：用于实际构建时过于原始。相比之下，stdenv 从一开始就内置了[各种工具](https://nixos.org/manual/nixpkgs/stable/#sec-tools-of-stdenv)，包括 `gcc`、`coreutils`、`find`、`grep`、`make` 等代表性的 GNU 工具链、便于构建的 shell 脚本，以及执行构建所用的 shell——Bash。此外，Linux 的 stdenv 中还引入了用于给可执行文件打补丁的 [patchelf](https://github.com/NixOS/patchelf)。

stdenv 会自动化大量构建步骤，因此在构建使用标准 `make` 或 `make install` 的 UNIX 软件包时，完全不需要编写构建脚本。即便不属于这种情况，它也提供了与编写普通构建脚本差别不大的接口来进行定制。

stdenv 还有很多其他功能，本书就介绍到这里。

### [构建辅助工具](https://nixos.org/manual/nixpkgs/stable/#part-builders)

为了抽象各编程语言和框架的典型构建工作流，Nixpkgs 提供了各种构建用的工具函数。

#### [Fetchers](https://nixos.org/manual/nixpkgs/stable/#chap-pkgs-fetchers)

这里提供了构建系统一章中介绍过的 Fetcher。再说明一次：Fetcher 的机制是预先指定待下载内容的哈希值，如果执行时下载到的内容哈希不一致就异常终止，从而在保持可复现性的前提下允许从互联网获取资源。

`fetchFromGitHub`、`fetchFromGitLab` 这类从源码托管平台获取源代码的 Fetcher，是 Nixpkgs 中使用最广泛的 Fetcher 之一。

#### [镜像](https://nixos.org/manual/nixpkgs/stable/#chap-images)

Nixpkgs 提供了用于构建 AppImage、Snap 以及 Docker 镜像的函数。

使用 `dockerTools.buildImage` 函数，无需编写 Dockerfile 就能用 Nix 语言构建 Docker 镜像。由于只有显式指定的软件包才会被包含进镜像，所以不仅可复现性有保障，还能做出比 [distroless](https://github.com/GoogleContainerTools/distroless) 更加精简的镜像。

#### [语言与框架](https://nixos.org/manual/nixpkgs/stable/#chap-language-support)

Nixpkgs 提供了按语言和框架划分的构建工具函数。例如 Rust 对应 `rustPlatform.buildRustPackage`，Go 对应 `buildGoModule`。还有把 Vim 插件打包成 Nix 软件包的 `vimPlugins` 函数。

这一领域在 Nixpkgs 之外也有大量活跃开发，例如 Rust 的 [crane](https://github.com/ipetkov/crane)、Poetry（Python 中 pip 的替代包管理器之一）的 [poetry2nix](https://github.com/nix-community/poetry2nix) 等，存在众多的库。
