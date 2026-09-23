---
title: "来做一个二进制缓存吧"
description: "nix"
order: 2
---

> 本文是 [Nix Advent Calendar 2024](https://adventar.org/calendars/10086) 第 15 天的文章。
> 
> [https://adventar.org/calendars/10086](https://adventar.org/calendars/10086)

## 二进制缓存

**二进制缓存**是 Nix 的招牌功能之一。它利用 Nix 构建的幂等性，无需实际执行构建，就能直接从已注册的**二进制缓存 store** 获取构建产物。

详情请参阅以下资料。

https://speakerdeck.com/asa1984/nixru-men-paradaimubian

https://zenn.dev/asa1984/books/nix-introduction/viewer/07-binary-cache

### 官方的二进制缓存

Nixpkgs 通过 [cache.nixos.org](https://cache.nixos.org/) 提供二进制缓存，而 Nix 默认就配置为使用这个二进制缓存 store。注册到 Nixpkgs 的软件包会先由名为 [Hydra](https://github.com/NixOS/hydra) 的 CI 系统构建，之后保存到托管于 AWS S3 的二进制缓存 store 中。

作为世界最大的开源软件包仓库，Nixpkgs 的二进制缓存 store 自然也极其庞大：截至 2022 年，其托管的对象超过**6 亿个**（合计 **425TiB**）^[[NixOS Foundation's Financial Summary: A Transparent Look into 2022 - Meta / NixOS Foundation - NixOS Discourse](https://discourse.nixos.org/t/nixos-foundations-financial-summary-a-transparent-look-into-2022/28107/16)]，而 2023 年 S3 的月度成本据说约为**14,500 美元**^[[NixOS Foundation Financial Summary : A Transparent Look into 2023 - Meta / NixOS Foundation - NixOS Discourse](https://discourse.nixos.org/t/nixos-foundation-financial-summary-a-transparent-look-into-2023/43640)]。夸张……

https://cache.nixos.org/

### Cachix

[Cachix](https://www.cachix.org/) 是一项二进制缓存的托管服务。它支持 GitHub Actions、CircleCI 等各类 CI 系统，可以轻松地创建二进制缓存。Nixpkgs 之外提供二进制缓存的开发者，绝大多数都在使用 Cachix。

https://www.cachix.org/

## 动手做一个二进制缓存

个人要提供二进制缓存，最简单的办法是使用 Cachix；不过这次我们自己来搭一个 S3 二进制缓存 store。其实做一个二进制缓存并没有那么难，只要有 Nix 本体和兼容 S3 的对象存储，就能轻松搞定。

这次我们用 GitHub Actions 和 Cloudflare R2 搭建一个创建二进制缓存的 CI。成品在下面的仓库中。

https://github.com/asa1984/binary-cache-example

### 所需之物

- Nix 2.24
  - 推荐通过 [DeterminateSystems/nix-installer](https://github.com/DeterminateSystems/nix-installer) 安装
  - 会用到的命令
    - [nix key generate-secret](https://nix.dev/manual/nix/2.24/command-ref/new-cli/nix3-key-generate-secret)
    - [nix key convert-secret-to-public](https://nix.dev/manual/nix/2.24/command-ref/new-cli/nix3-key-convert-secret-to-public)
    - [nix copy](https://nix.dev/manual/nix/2.24/command-ref/new-cli/nix3-copy)
    - [nix store sign](https://nix.dev/manual/nix/2.24/command-ref/new-cli/nix3-store-sign)
    - [nix store verify](https://nix.dev/manual/nix/2.24/command-ref/new-cli/nix3-store-verify)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
  - 因为对钱包友好所以选它
  - 如果使用其他 S3 兼容对象存储，请自行对照替换

### 大致流程

1. 构建软件包
2. 生成私钥、公钥
3. 用 `nix sign` 给构建产物签名
4. 用 `nix copy` 把 store 对象复制到二进制缓存 store（Cloudflare R2）

## 准备软件包

没有可构建的软件包就无从谈起。这次我准备了一个编译时间相对较长的 Rust 软件包。各类文件请从[成品仓库](https://github.com/asa1984/binary-cache-example)中取用。

文件结构大致如下。

```:文件结构
./
├── flake.lock
├── flake.nix
├── hello-server/
│   ├── Cargo.lock
│   ├── Cargo.toml
│   ├── default.nix
│   ├── src/
│   │   └── main.rs
│   └── .gitignore
└── .gitignore
```

### hello-server

这是一个在 http://localhost:3000 返回 `Hello, World!` 的简单 Web 服务器。由于依赖 [tokio](https://docs.rs/tokio/latest/tokio/) 和 [axum](https://docs.rs/axum/latest/axum/)，构建会稍微花些时间。

```toml :hellor-server/Cargo.toml
[package]
name = "hello-server"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.7.9"
tokio = { version = "1.42.0", features = ["full"] }
```

```rust :hello-server/src/main.rs
use axum::{routing::get, Router};

#[tokio::main]
async fn main() {
    let app = Router::new().route("/", get(|| async { "Hello, World!" }));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Listen on http://localhost:3000");
    axum::serve(listener, app).await.unwrap();
}
```

### Nix 表达式

构建 hello-server 的 Nix 表达式如下。它遵循 [callPackage 模式](https://zenn.dev/asa1984/books/nix-hands-on/viewer/ch04-01-hello#5.1.-%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E5%88%86%E5%89%B2)编写。

```nix :hello-server/default.nix
{ rustPlatform, ... }:
rustPlatform.buildRustPackage {
  name = "hello-server";
  src = ./.;
  cargoLock = {
    lockFile = ./Cargo.lock;
  };
}
```

然后准备一个大致如下的 `flake.nix`。

```nix :flake.nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    inputs:
    let
      allSystems = [
        "aarch64-linux" # 64-bit ARM Linux
        "x86_64-linux" # 64-bit x86 Linux
        "aarch64-darwin" # 64-bit ARM macOS
        "x86_64-darwin" # 64-bit x86 macOS
      ];
      forAllSystems = inputs.nixpkgs.lib.genAttrs allSystems;
    in
    {
      packages = forAllSystems (
        system:
        let
          pkgs = inputs.nixpkgs.legacyPackages.${system};
        in
        rec {
          default = hello-server;
          hello-server = pkgs.callPackage ./hello-server { };
        }
      );
    };
}
```

只要能用 `nix run` 构建成功就 OK。别忘了 `git add`！^[在 Git 仓库内创建的 Flake 会经由 Git 追踪文件，因此未被暂存的文件无法带入构建环境。详情参见「[§3. 创建 Flake｜Nix 入门：实战篇](https://zenn.dev/asa1984/books/nix-hands-on/viewer/ch01-03-flakes)」。]

## 搭建 CI

### 1. 创建 Cloudflare R2 存储桶、签发令牌

创建 Cloudflare R2 的存储桶。创建后签发 API 令牌，并记下以下信息。

- API 端点
- ID
- 令牌

这一块请对照官方文档操作。

https://developers.cloudflare.com/r2/

### 2. 创建签名用的密钥

要把 store 对象保存到二进制缓存 store，需要用 `nix store sign` 对目标 store 对象签名。我们来创建签名用的密钥。

首先用 `nix key generate-secret` 生成私钥。不用多说，请万分小心地保管，切勿泄露。
按照惯例，密钥名多采用 `cache.nixos.org-1`、`nix-community.cachix.org-1` 这样的 `<存储桶域名>-<编号>` 形式。末尾的编号会在万一需要重新生成密钥时递增。

```bash :生成私钥
nix key generate-secret --key-name <密钥名> > secret.key
```

从生成的私钥再生成对应的公钥。

```bash :生成公钥
nix key convert-secret-to-public < ./secret.key > ./public.key
```

用户会把这个公钥注册到 Nix 中，用于验证从二进制缓存 store 下载的对象是否正当。如何把公钥注册到 Nix，将在下一节说明。

### 3. 给 flake.nix 添加 nixConfig

`/etc/nix/nix.conf` 或 `~/.config/nix/nix.conf` 中写着类似下面的配置。

```bash :/etc/nix/nix.conf
# 省略
substituters = https://cache.nixos.org/
trusted-public-keys = cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY=
# 省略
```

`substituters` 是二进制缓存 store 的端点，`trusted-public-keys` 是与之对应的公钥。Nix 在构建软件包时会向注册在 `substituters` 中的 Nix store 查询，若找到缓存便将其下载。

用户可以像下面这样配置，以添加要使用的二进制缓存 store。

```bash :nix.conf
substituters = <二进制缓存 store A> <二进制缓存 store B>
trusted-public-keys = <二进制缓存 store A 的公钥> <二进制缓存 store B 的公钥>
```

---

虽然用上述方法就能注册二进制缓存 store，但每次都要手动添加配置未免麻烦。其实在 `flake.nix` 中也可以进行与 `nix.conf` 同样的配置。

通常 Nix 会读取写在 `/etc/nix/nix.conf` 或 `~/.config/nix/nix.conf` 中的配置，而在 `flake.nix` 中设置一个名为 `nixConfig` 的 attribute，就能写入该 Flake 专用的配置。

请添加如下配置。

```diff nix :flake.nix
{
+ nixConfig = {
+   extra-substituters = [ "<存储桶的端点>" ];
+   extra-trusted-public-keys = [ "<签名的公钥>" ];
+ };

  # 省略
}
```

这样一来，在对这个 `flake.nix` 求值时就会自动使用二进制缓存了。

> **默认的 Nix 不会读取写在 `flake.nix` 中的配置**。
> 
> 可以通过以下方法启用这些配置。
> 
> - 在 `nix run`、`nix build` 等命令的选项中加上 `--accept-flake-config`
> - 在 `/etc/nix/nix.conf` 或 `~/.config/nix/nix.conf` 中添加 `accept-flake-config = true` 这一行

### 4. 编写工作流

先把工作流的全貌放上来。

```yaml :.github/workflow/setup-binary-cache.yaml
env:
  AWS_PROFILE_NAME: builder
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  BINARY_CACHE_SECRET_KEY: ${{ secrets.BINARY_CACHE_SECRET_KEY }}
  S3_API_ENDPOINT: ${{ secrets.S3_API_ENDPOINT }}

jobs:
  copy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: DeterminateSystems/nix-installer-action@main

      - name: Build package
        run: nix build . --accept-flake-config

      - name: Sign package with secret key
        run: |
          echo $BINARY_CACHE_SECRET_KEY > ./secret.key
          nix store sign --recursive --key-file ./secret.key

      - name: Configure AWS credentials
        run: |
          nix shell nixpkgs#awscli --command aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID --profile $AWS_PROFILE_NAME
          nix shell nixpkgs#awscli --command aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY --profile $AWS_PROFILE_NAME

      - name: Copy package
        run: nix copy --to s3://nix-cache\?profile=$AWS_PROFILE_NAME\&endpoint=$S3_API_ENDPOINT\&compression=zstd
```

#### 环境变量

从仓库设置中注册 secrets。
有几个环境变量名带有 `AWS` 前缀，请不要在意。~~只是笔者嫌麻烦没有改写成 Cloudflare R2 的说法而已。~~

| 环境变量名                 | 内容                                |
| -------------------------- | ----------------------------------- |
| `$AWS_PROFILE_NAME`        | 随便取个名字                        |
| `$S3_API_ENDPOINT`         | Cloudflare R2 的 API 端点           |
| `$AWS_ACCESS_KEY_ID`       | Cloudflare R2 的访问 ID             |
| `$AWS_SECRET_ACCESS_KEY`   | Cloudflare R2 的 API 令牌           |
| `$BINARY_CACHE_SECRET_KEY` | 生成的签名用私钥                    |

#### 安装 Nix

使用 DeterminateSystems 提供的 action。

```yaml
- uses: DeterminateSystems/nix-installer-action@main
```

https://github.com/DeterminateSystems/nix-installer-action

#### 构建

加上 `--accept-flake-config` 选项后，就能使用写在 `flake.nix` 中的 `nixConfig` 配置。如果希望默认就是这个行为，请在 `/etc/nix/nix.conf` 或 `~/.config/nix/nix.conf` 中添加 `accept-flake-config = true` 这一行。

```yaml
- name: Build package
  run: nix build . --accept-flake-config
```

加上它是为了之后验证二进制缓存是否生效。

#### 给 store 对象签名

用 `nix sign` 给构建产物签名。

```yaml
- name: Sign package with secret key
  run: |
    echo $BINARY_CACHE_SECRET_KEY > ./secret.key
    nix store sign --recursive --key-file ./secret.key
```

加上 `--recursive` 选项后，也会对 [clousures](https://zenn.dev/asa1984/books/nix-introduction/viewer/08-derivation#closures)（全部运行时依赖的 store 对象）进行签名。后面要用的 `nix copy` 在复制目标 store 对象时，也会把其全部运行时依赖一并复制^[正因如此，才能做到用 `nix copy` 把 store 对象从机器 A 复制到机器 B 的本地 store，然后直接在机器 B 上运行这种操作。]，所以需要这个选项。

#### 配置访问存储桶的 credentials

Nix 基本上假定使用的是 AWS S3，因此会从 `~/.aws/credentials` 读取访问存储桶所需的密钥信息。它只是个普通文本文件，用 `echo` 之类写进去也行，不过既然都用 Nix 了，我们就用 `nix shell` 装上 `awscli` 来配置。

```yaml
- name: Configure AWS credentials
  run: |
    nix shell nixpkgs#awscli --command aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID --profile $AWS_PROFILE_NAME
    nix shell nixpkgs#awscli --command aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY --profile $AWS_PROFILE_NAME
```

#### 复制到二进制缓存 store

最后把构建产物复制到二进制缓存 store。

```yaml
- name: Copy package
  run: nix copy --to s3://nix-cache\?profile=$AWS_PROFILE_NAME\&endpoint=$S3_API_ENDPOINT\&compression=zstd
```

在 `nix copy` 中，可以通过下面这种特殊格式 URL 的查询参数来设置若干选项。

```bash
s3://nix-cache?profile=$AWS_PROFILE_NAME&endpoint=$S3_API_ENDPOINT&compression=zstd
```

- **profile**
  - 要使用的 credentials 的 profile。这次是用 `awscli` 配置的那个。
- **endpoint**
  - 复制目标存储桶的端点
- **compression**
  - 二进制缓存的压缩方式
  - 可设置为 `xz`、`bzip2`、`gzip`、`zstd`、`none`
    - 这次采用了能更快完成压缩的 `zstd`

详细选项请阅读官方参考文档。

https://nix.dev/manual/nix/2.24/store/types/s3-binary-cache-store.html?highlight=compression#settings

## 结果

我们看看 GitHub Actions 的日志，验证一下二进制缓存的效果。以下是我创建的仓库的 GitHub Actions 日志。

### 第 1 次构建

在二进制缓存尚不存在时，首次执行的耗时如下。

- 整体：2 分 7 秒
- 构建：1 分 17 秒

https://github.com/asa1984/binary-cache-example/actions/runs/12337582115/attempts/1

### 第 2 次构建

我们手动重新执行一次工作流。由于给 `nix build` 加了 `--accept-flake-config` 选项，它应该会使用上次创建的二进制缓存。

---

结果，构建时间大幅缩短了。

- 整体：1 分 8 秒
- 构建：**20 秒**

https://github.com/asa1984/binary-cache-example/actions/runs/12337582115/attempts/3

构建日志的最后一行从 `building` 变成了 `copying`。

```:第 1 次的构建日志
（中略）
building '/nix/store/d0dms08lf7l7y3c9wplv9dr2ch6ad1q3-hello-server.drv'...
```

```:第 2 次的构建日志
（中略）
copying path '/nix/store/mnx7gwcszr2bbmi7nxhlppb3s15dibsa-hello-server' from 'https://cache.asa1984.dev'...
```

## 小结

你是否发现，做一个二进制缓存出乎意料地简单？速度即正义，所以它在任何地方都能大显身手。个人使用固然不错，但如果能把二进制缓存用在大规模部署上、加快部署时间，那就相当带劲了。希望做基础设施的朋友们都来试试。

---

二进制缓存好处多多，但也有几点需要注意。

第一点是**二进制缓存的体积**。首先前提是，保存的 store 对象包含全部运行时依赖，因此体积会相当可观。在此基础上，一旦修改源代码或更新编译器、共享库，store 路径就会变化，于是又会保存新的二进制缓存；如果不加思索地不断创建二进制缓存，存储桶的体积就会急剧膨胀。

如果担心存储桶体积增长，不妨制定一套删除旧对象的策略。

第二点是**构建环境的平台**。这次工作流的执行环境用的是 `ubuntu-latest`（x86_64-linux），因此在 ARM CPU 或 macOS 上无法使用我们的二进制缓存。这并非 Nix 二进制缓存特有的问题，但如果想支持多个平台，就要相应地准备好合适的构建环境。

这次我也考虑过利用 GitHub Actions 的 `macos-latest` runner 来为 aarch64-darwin 提供二进制缓存，但大概是因为 `macos-latest` 环境较少，等待工作流执行的时间实在太长，只好作罢。

读到这里如果你觉得「好麻烦啊～」，那么考虑使用 Cachix 或许是个不错的选择。

## 闲话：与二进制缓存相关的有趣项目

### magic-nix-cache

[magic-nix-cache](https://github.com/DeterminateSystems/magic-nix-cache) 是一个让你能在 GitHub Actions 内使用二进制缓存的 action。它利用 GitHub Actions 的 cache API 来缓存 runner 的本地 store，并在 localhost 上启动二进制缓存服务器。

https://github.com/DeterminateSystems/magic-nix-cache

由于无法对外公开，它只能在 GitHub Actions 内部使用。笔者就用这个 action 缩短了 CI 用 devShell 的构建时间。

https://github.com/asa1984/asa1984.dev/blob/main/.github/actions/setup/action.yaml

### attic

[attic](https://github.com/zhaofengli/attic) 是一个用 Rust 实现的二进制缓存服务器。它功能丰富，支持利用 [FastCDC](https://docs.rs/fastcdc/latest/fastcdc/) 进行分块、创建私有二进制缓存等。

https://github.com/zhaofengli/attic

据说作者 [zhaofengli](https://github.com/zhaofengli) 用 [fly.io](https://fly.io/) 托管 attic，用 [Neon](https://neon.tech/) 作数据库，对象存储则使用 Cloudflare R2。

https://discourse.nixos.org/t/introducing-attic-a-self-hostable-nix-binary-cache-server/24343

## 闲话：Nix 的论文

在 Nix 的开发者 [Eelco Dolstra](https://github.com/edolstra) 的论文《[Nix: A Safe and Policy-Free System for Software Deployment](https://edolstra.github.io/pubs/nspfssd-lisa2004-final.pdf)》和《[The Purely Functional Software Deployment Model](https://edolstra.github.io/pubs/phd-thesis.pdf)》中，二进制缓存被作为一个重要概念加以论述。

说到底，Nix 的开发目的就是实现「正确的部署」。这里的「部署」指的是把软件放置到目标机器上并使其可用，说白了就是软件的安装。
在此基础上，论文提出了一组重要的二元对立：**源码部署**与**二进制部署**。源码部署是指把源代码发送到目标机器并在部署目的地进行构建；二进制部署则是指在发送端事先执行构建，再把构建产物发送到目标机器。

二进制部署是为了优化部署、即缩短部署时间而进行的。但作为权衡，它可能会损害一致性。如果你有过「二进制安装之后不好使，于是改在本地构建再安装」的经历，想必会深有体会。

Nix 的划时代之处在于，[纯函数式的构建系统](https://zenn.dev/asa1984/books/nix-introduction/viewer/05-pure-functional-build)让源码部署与二进制部署变得等价了。既然构建是确定性的，那么从零开始构建与直接从二进制缓存下载构建产物，结果就不会有任何差别^[补充一句，Nix 并不保证比特级别的同一性，因此这里要加上「在实用层面上」这一限定。]。

综合以上可以看出：并不是 Nix 在追求安全性与完整性的过程中，顺带催生了二进制缓存这一副产品；而是它从一开始就带着上述问题意识，发明了一套要求严格性与完整性的构建系统。
