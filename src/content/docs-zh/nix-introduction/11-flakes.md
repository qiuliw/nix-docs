---
title: "Flakes"
description: "Flakes"
order: 11
---

**Flakes** 是「Nix 语言的」依赖关系管理系统^[[8.5.15. nix flake - Nix Reference Manual](https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-flake)]。正如 Cargo 之于 Rust、npm 之于 Node.js、pip 之于 Python，Flakes 就是负责管理 Nix 语言依赖关系的那一个。

你或许会困惑：Nix 本身就是依赖关系管理系统，为什么还要再来一个？请回想上一章的内容——Nix 中的软件包仓库其实就是 Nix 语言的库。也就是说，在 Nix 中使用软件包仓库，本质上就是把 Nix 语言的外部库作为依赖引入进来。

观察 Nix 构建软件包的流程，会发现 Nix 比其他构建系统多出一个阶段。大多数构建系统是由人编写构建配方，再据此执行构建；而 Nix 则是由人编写 Nix 语言，生成严格的构建配方（Derivation），再据此进行构建。

在 Nix 中，依赖解析会发生两次。第一次是在求值 Nix 表达式时，由 Flakes 解析 Nix 语言的依赖关系；第二次是在 realise Derivation 时，由 Nix Store 解析 Derivation 的依赖关系。

![Flakes 图解](/images/nix-introduction/flakes.png)
_使用 Flakes 的构建流程_

也就是说，Flakes 是 Nix 高层表示世界中的依赖关系管理系统。

## Flake

在 Flakes 中，相当于 Nix 语言「软件包」的东西被称为 **Flake**，就像 Rust 的包被称为 Crate 一样。

Flakes 以配合 Git 使用为前提，一个 Flake 的实体就是在根目录放置了名为 `flake.nix` 的特殊文件的 Git 仓库。
`flake.nix` 所起的作用类似于 npm 的 `package.json` 或 Cargo 的 `Cargo.toml`。从扩展名就能看出，`flake.nix` 本身也是用 Nix 语言编写的。此外，`flake.nix` 还充当着 Nix 语言的入口点。

`flake.nix` 的结构非常简单，其中记述了项目所依赖的 Flake（**inputs**）与项目输出的 Nix 表达式（**outputs**）。
在求值某个 Flake 时，Nix 会获取 inputs 中指定的 Flake，并把它们的 outputs 作为参数传给当前正在求值的 Flake 的 outputs。依赖解析同样很简单。

### 锁定依赖关系

正如现代包管理器通过 lock 文件锁定依赖关系那样，Flakes 也通过 `flake.lock` 文件锁定 inputs 的版本。Flakes 使用 **Git 的提交哈希**来锁定依赖关系。也就是说，Flake（≈软件包仓库）的版本会精确到提交级别保持一致。相同的 Nix 表达式会输出相同的 Derivation，相同的 Derivation 会输出相同的软件包，因此可以说 Nix 的可复现性已经堪称完备。

### 对可用文件的限制

Flakes 利用 Git 并不只是为了锁定依赖关系。
Nix 语言能够读取文件，主要用于获取源代码和构建脚本；但由于可以不受限制地指定要读取的文件路径，某些情况下就可能出现「文件时有时无」的问题。Flakes 会限制对不在 Flake 的 Git 仓库管理之下的文件的访问。例如，当试图访问仓库之外的文件、被 `.gitignore` 排除的文件，或是尚未加入暂存区的文件时，Nix 语言就会报错。

Flakes 也是一项提升 Nix 语言纯粹性的功能。

## inputs

inputs 中指定的是 Flake 的 URL 或文件路径。

```nix
{
  inputs = {
    # 指定 GitHub 仓库
    example-github.url = "github:所有者/仓库/分支";

    # 指定 Flake 的归档文件
    example-archive.url = "https://example.com/example.tar.gz";

    # 指定 Flake 的本地目录
    example-directory.url = "path:/path/to/flake";
  };
}
```

基本上大多数情况都是指定 GitHub 仓库，不过也可以用 URL 指定归档文件。指定 GitHub 仓库时，`flake.lock` 会借助 Git 自动完成版本锁定；而指定归档文件时，则要求该 URL 对应的内容必须是不可变的。

专注于 Nix 的公司 [Determinate Systems](https://determinate.systems) 提供了名为 [FlakeHub](https://flakehub.com) 的 Flake 共享平台，它以归档文件的形式提供 Flake。

https://flakehub.com

## outputs^[[Flakes - NixOS Wiki](https://nixos.wiki/wiki/Flakes#Output_schema)]

outputs 是一个函数，在求值 Flake 时，inputs 中指定的各 Flake 的 outputs 会作为参数传入。outputs 返回一个 Attribute Set。

其实，outputs 能返回的并不只有软件包。outputs 中可以指定如下内容。

```nix
{
  inputs = {
    # 所依赖的 Flake
  };

  outputs = inputs: {
    packages."<系统架构>"."<软件包名>" = derivation;
    devShells."<系统架构>"."<devShell 的名称>" = derivation;
    formatter."<系统架构>"."<软件包名>" = derivation;
    templates."<模板名称>" = {
      path = "<Store 路径>";
      description = "模板的说明";
    };

    # ...还有很多其他项
  };
}
```

除上述之外还可以指定多个 attribute，并且可以由第三方程序进行扩展。例如 NixOS 的部署工具 [deploy-rs](https://github.com/serokell/deploy-rs) 就期望 Flake 的 outputs 中存在名为 deploy 的 attribute，而这是 deploy-rs 独有的约定。
说到底，Flake 的 outputs 也不过是 Nix 语言而已，因此根据求值它的程序不同，可以有各种各样的用法。

### packages

顾名思义，packages 中指定的是软件包的 Derivation。这里指定的 Derivation 可以用 `nix build` 构建，用 `nix run` 构建并运行。

### devShells

devShell 是声明式的开发环境搭建功能，可以通过 `nix develop` 命令使用。

`nix develop` 期望 Flake 的 outputs 中 `devShells` 处放置的是 `mkShell` 函数的返回值。`mkShell` 是 Nixpkgs 提供的特殊函数。

```nix
mkShell {
  packages = [
    # 想要使用的软件包
  ];
  shellHook = ''
    # 希望在 devShell 启动时执行的 shell 脚本
  '';
}
```

对 `mkShell` 返回的 Derivation 执行 realise，会构建出一段写有 shell 脚本的文本。这段 shell 脚本会把 `mkShell` 参数中指定的 `packages` 添加到 PATH，并把 `shellHook` 中编写的脚本赋值给 shellHook 环境变量。

而 `nix develop` 则按以下顺序工作。

1. 启动 Bash
2. 读取 outputs 中的 devShell，对 `mkShell` 返回的 Derivation 执行 realise
3. 执行构建出来的脚本
4. 执行 shellHook 环境变量中的内容
5. （引入了 `mkShell` 中声明的软件包的开发环境搭建完成！）

在 devShell 中安装的软件包只在 devShell 内部生效，不会被全局安装。这一功能接近 Python 的 venv，但 devShell 可以用于任何编程语言。

devShell 的优点在于：与 Docker 不同，它不需要使用虚拟环境，而且可以直接使用宿主系统上已经安装的软件包。这虽然属于非纯粹的状态，但可以这样区分使用：开发环境中优先考虑便利性而非纯粹性，而构建则在纯粹的环境中进行。

### formatter

这里指定 Nix 语言格式化工具的 Derivation。大多数情况下会指定 `nixfmt`、`alejandra` 或 `nixpkgs-fmt`。可以通过 `nix fmt` 执行。

### templates

templates 可以定义目录模板，通过 `nix flake init --template` 使用。
