---
title: "　§3. 创建 Flake"
description: "　§3. 创建 Flake"
order: 7
---

到目前为止写过的简单 Nix 表达式都没有依赖。当你开始写更复杂的 Nix 表达式时，就需要引入外部依赖了。下面我们用 Nix 的项目管理兼依赖管理功能 **Flakes**，来创建一个 Nix 语言的项目——**Flake**。

## 什么是 Flakes

不熟悉 Nix 的人常说 Flakes「很难」，但那要么是因为没有得到恰当的讲解，要么是存在误解。实际上 Flakes 的功能非常简单。

对于有 Node.js、Rust、Go 等语言经验的人来说，Flakes 所做的大部分事情都相当熟悉。

创建 Flake 时，要用一个名为 `flake.nix` 的特殊 Nix 文件（相当于 `package.json`/`Cargo.toml`/`go.mod`）来声明这个 Flake。这个文件中记录项目的依赖关系以及要导出的 Nix 表达式。此外，还会用一个名为 `flake.lock` 的锁文件（相当于 `package-lock.json`/`Cargo.lock`/`go.sum`）来锁定依赖关系，从而保证项目的可复现性。

归根结底，Flakes 就是把现代语言普遍都具备的项目管理功能引入到了 Nix 语言中，仅此而已。

## 术语梳理

本书中按以下含义区分使用这些术语：

- **Flakes**：Nix 语言的项目管理功能兼依赖管理功能
- **Flake**：受 Flakes 管理的 Nix 语言项目
- `flake.nix`：声明 Flake 的文件
- `flake.lock`：锁定 Flake 依赖关系的文件
- **inputs**：Flake 的依赖关系
- **outputs**：Flake 所导出的 Nix 表达式

## flake.nix 的形式与作用

`flake.nix` 的结构非常简单，其本质是一个带有 `inputs` 和 `outputs` 两个 attribute 的 AttrSet（还有其他 attribute，但不重要，这里从略）。

```nix
{
  inputs = <AttrSet> # 依存するFlake、省略可
  outputs = <Function> # Flakeの出力
}
```

`flake.nix` 不仅用来声明 Flake，同时也充当 Nix 语言求值时的入口点。

## 用 Flake 写 Hello world

我们把最开始那个返回 `"Hello, world!"` 的 Nix 表达式改造成 Flake。首先创建 `flake.nix`。

```bash
mkdir hello-world
cd hello-world
touch flake.nix
```

```nix :flake.nix
{
  # このFlakeには依存がないのでinputsを省略
  # inputs = { };

  outputs = _inputs: {
    hello = "Hello, world!";
  };
}
```

来对这个 Flake 求值看看。

```bash
$ nix eval .#hello
Hello, world!
```

`.#hello` 采用的是 `<文件路径>#<outputs 函数返回值的 attribute>` 这样的形式。`#` 之前是 Flake reference（后文介绍），`#` 之后指定的是 outputs 函数所返回 AttrSet 中的 attribute。

`flake.nix` 是一个特殊的 Nix 文件，其求值流程与普通 Nix 表达式不同。
对 Flake 求值时，Nix 会向 `outputs` 函数的参数传入一个 AttrSet。这个 AttrSet 中包含了 `inputs` 里指定的依赖关系，Flake 的依赖解析就发生在这一步。然后，`outputs` 函数的返回值就作为该 Flake 最终的求值结果返回。

## 给 Flake 引入依赖

接下来我们创建一个带依赖的 Flake。在 `sub` 目录下另建一个 Flake，然后在主 Flake 中使用它。

```bash :在sub目录下创建flake.nix
mkdir ./sub
touch ./sub/flake.nix
```

```: 目录结构
./
├── sub/
│  └── flake.nix <- 依存
└── flake.nix    <- 本体のFlake
```

`sub` 目录下的 Flake 以 `add_a_b` 的名字导出一个接收两个参数并对其应用 `+` 运算符的函数。

```nix :./sub/flake.nix
{
  # add関数をエクスポートするFlake
  outputs = _inputs: {
    add_a_b = a: b: a + b;
  };
}
```

接着，在主 Flake 的 inputs 中指定 `sub` 目录下的 Flake。

```nix :./flake.nix
{
  inputs = {
    # "path:./sub" は、subデイレクトリのFlakeを示すflake-url（後述）
    sub_flake.url = "path:./sub";
  };

  outputs = { sub_flake, ... }: {
    # ./sub#addを使って 1 + 2 を計算
    sum_1_2 = sub_flake.add_a_b 1 2;
  };
}
```

最后，实际求值看看。

```bash
$ nix eval .#sum_1_2
3
```

成功了！

请注意，首次求值时会生成 `flake.lock`。

## inputs

Flakes 没有中心化的注册表（例如 [npmjs.com](https://www.npmjs.com)、[crates.io](https://crates.io)）。取而代之的是直接指定 GitHub 仓库或提供 Flake 归档的 URL。这种去中心化的方式与 Go 的模块管理机制很相似。

指定依赖的 Flake 时，使用一种表示 Flake 位置的表达形式——**Flake reference**。

```nix :flake.nix
{
  inputs = {
    local-flake.url = "path:./path/to/flake"; # ローカルのFlake
    github-flake.url = "github:owner/repo/branch"; # GitHubリポジトリ
    git-https-flake.url = "git+https://path/to/flake"; # Gitリポジトリ
    tarball-flake.url = "https://path/to/flake"; # tarball
    nested-flake.url = "github:owner/repo/branch?dir=path/to/flake"; # ルートにflake.nixがない場合
  };

  outputs = #省略
}
```

### Flake reference

Flake reference 有两种写法：用 AttrSet 表示，以及用类 URL 语法表示。上面示例中用的是类 URL 语法。

#### 用 AttrSet 表示

这种写法用得不多。

```nix
{
  type = "github";
  owner = "NixOS";
  repo = "nixpkgs";
}
```

#### 用类 URL 语法表示

因为比用 AttrSet 指定更简洁，大多数情况下都使用类 URL 语法。这种语法似乎没有正式的名称，这里沿用 Nix man 手册中的说法，称之为 **flake-url**。

flake-url 不只用于 `flake.nix`，在 Nix 的 CLI 中也会用到，请记住这种格式。

| 种类             | 形式                                  | 说明                                    |
| ---------------- | ------------------------------------- | --------------------------------------- |
| 本地 Flake  | `path:./path/to/flake`                | 本地的 Flake                         |
| GitHub 仓库 | `github:owner/repo/branch`            | GitHub 仓库                        |
| Git 仓库    | `git+https://path/to/flake`           | 任意的 Git 仓库（如 GitLab）       |
| 归档       | `https://path/to/flake`               | 打包成 tarball 的 Flake 的 URL       |
| 带 `?dir` 的 URL    | `<任意的flake-url>?dir=path/to/flake` | 根目录下没有 `flake.nix` 时的指定方式 |

关于文件路径，去掉前缀 `path:` 虽然不会报错，但含义会发生改变，导致每次对 Flake 求值时都会重新生成 `flake.lock`，请务必注意。

实际上除了上面列出的之外还有其他形式和参数，这里只介绍最常用的。详情请参考官方参考手册。

https://nix.dev/manual/nix/2.20/command-ref/new-cli/nix3-flake#flake-references

### flake.lock

`flake.lock` 是用于锁定依赖关系的文件。前面的例子中我们没有用 Git 就创建了 Flake，但基本上 Flakes 是以与 Git 配合使用为前提的。尤其是要在互联网上公开 Flake 时，做成 Git 仓库是必需的。

当引入受 Git 管理的 Flake 作为依赖时，`flake.lock` 会使用 **Git 的提交哈希**来锁定版本。

例如，假设有如下这样一个依赖 [Nixpkgs](https://github.com/NixOS/nixpkgs) 的 Flake。Nixpkgs 是 Nix 的官方软件包仓库，详细用法将在「[_2.2. 使用 Nixpkgs_](ch02-02-use-nixpkgs)」中说明。

```nix :flake.nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = _: { }; # 返り値は省略
}
```

对这个 Flake 求值就会生成 `flake.lock`。这次我们用 `nix flake lock` 命令来手动锁定。

```
$ nix flake lock
warning: creating lock file '/path/to/flake.lock'
```

打开 `flake.lock` 看看，可以发现里面记录了提交哈希。

```json :flake.lock
{
  "nodes": {
    "nixpkgs": {
      "locked": {
        "lastModified": 1722073938,
        "narHash": "sha256-OpX0StkL8vpXyWOGUD6G+MA26wAXK6SpT94kLJXo6B4=",
        "owner": "NixOS",
        "repo": "nixpkgs",

        // ↓これがコミットハッシュ
        "rev": "e36e9f57337d0ff0cf77aceb58af4c805472bfae",
        "type": "github"
      },
      "original": {
        "owner": "NixOS",
        "ref": "nixpkgs-unstable",
        "repo": "nixpkgs",
        "type": "github"
      }
    },
    "root": {
      "inputs": {
        "nixpkgs": "nixpkgs"
      }
    }
  },
  "root": "root",
  "version": 7
}
```

本例对应的是以下这次提交。

https://github.com/NixOS/nixpkgs/commit/e36e9f57337d0ff0cf77aceb58af4c805472bfae

一旦锁定，之后就会按照 `flake.lock` 来解析依赖关系，从而能够得到提交级别完全一致的 Nix 表达式。

## outputs

```nix
{ inputs, self, ... }: <attrset>
```

outputs 是一个接收 AttrSet 并返回 AttrSet 的函数。由于可以返回任意的 AttrSet，实质上什么都能导出。

不过，虽说什么都能返回，实际上还是有一定规则的，最好返回 Flake 使用者所期待的输出。前面的例子为了便于说明，刻意无视了这些规则。关于 outputs 的规则，将在后面的章节中详细说明。

### outputs 的参数

- `inputs`：最初在 inputs 中定义的所依赖的 Flake
- `self`：Flake 自身

## Git 与 Flake

把 Flake 做成 Git 仓库之后，Flakes 就会改为通过 Git 来追踪文件。例如有如下 Nix 表达式：

```nix
import ./something.nix
```

```nix
builtins.readFile ./something.nix
```

假设此时 `something.nix` 还没有被 git 暂存（即未被追踪）。在这种状态下对 Flake 求值，就会出现「文件路径不存在」的错误。

Flake 一旦检测到自己处于 Git 仓库中，就会切换到只通过 Git 获取文件的模式。因此，**当你往 Flake 中新增文件时，求值之前必须先执行 `git add`，哪怕只是临时的**。

为了让 Nix 语言的可复现性更加牢固，Flakes 就是这样借助 Git 进行严格的文件管理的。

<details>
<summary>gitignore</summary>

由于是通过 Git 追踪文件，被 `.gitignore` 指定的文件无法在 Flake 中使用。

在 Flakes 出现之前，为了在读取源代码时不把该忽略的文件也一并读进来，人们有时会使用解析 `.gitignore` 来过滤文件的函数；而现在 Flakes 会自动帮你排除，因此不再需要了。由于 Flakes 目前仍被定位为实验性功能，这类过滤函数至今仍保留在 Nixpkgs 中。

</details>

## Flakes 与非纯内置函数

在 Flake 内部，非纯内置函数的使用受到限制。

```nix :flake.nix
{
  # inputs = { };

  outputs = _: {
    now = builtins.currentTime;
  };
}
```

对这个 Flake 求值，会直接报出 `currentTime` 在 `builtins` 中不存在的错误。而显式加上 `--impure` 求值则不会报错。

```bash :非纯函数的限制与impure选项
$ nix eval .#now
error: attribute 'currentTime' missing

       at /nix/store/jwa6z6jlpmb8ln8w2p38401xrv6ny2a3-source/flake.nix:4:24:

            3|
            4|   outputs = _: { now = builtins.currentTime; };
             |                        ^
            5| }

$ nix eval --impure .#now
1723722280
```

也有不报错的情况。`getEnv` 不会返回错误，而是始终返回空字符串。

```nix :flake.nix
{
  # inputs = { };

  outputs = _: {
    user = builtins.getEnv "USER";
  };
}
```

```bash :getEnv不会报错
$ nix eval .#user
""

$ nix eval --impure .#user
"asahi"
```

## 小结

- Flakes 管理 Nix 语言的项目
- Flakes 解析 Nix 语言的依赖关系
- Flake 可以导出任意的 Nix 表达式
- Flake 通过 Git 和对非纯函数的限制来保证 Nix 表达式的纯粹性
- 与 Git 配合使用时，别忘了 `git add`
