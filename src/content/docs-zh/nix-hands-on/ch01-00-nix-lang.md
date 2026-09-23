---
title: "第 1 部：Nix 语言"
description: "第 1 部：Nix 语言"
order: 4
---

让我们开始入门 **Nix 语言**吧。

## Nix 语言的特点

- 领域特定语言
- 不可变
- 面向表达式
- 纯函数式
- 惰性求值
- 动态类型

这些特点乍看之下颇有些唬人，但实际上它是一门非常简单的语言。

首先，Nix 语言是为特定目的（例如定义软件包的构建过程）而设计的语言，并不像通用编程语言那样具备各种通用功能。所以虽然同为函数式语言，它并没有 OCaml 或 Haskell 那样高级的语言特性。
Nix 语言的使用体验与其说像编程语言，不如说更接近 JSON、YAML 这类配置描述语言。除非你是库的作者，否则几乎不会用 Nix 语言写复杂的程序。把它想成「一个能用函数、能做点简单计算的加强版 JSON」会更好理解。

## 需要的知识

不需要有纯函数式语言的使用经验，只要知道「纯函数」大致是什么就足够了。
另一方面，关于 **Nix Store** 和 **Derivation** 的知识则是必需的。Nix 语言与 Nix 的内部机制紧密相连，缺少这些知识会很难理解 Nix 语言。

如果你对此还不太清楚，请先过一遍以下讲解。

https://zenn.dev/asa1984/books/nix-introduction/viewer/05-pure-functional-build

https://zenn.dev/asa1984/books/nix-introduction/viewer/06-nix-store

https://zenn.dev/asa1984/books/nix-introduction/viewer/08-derivation

## 【闲谈】类型系统

在 Nix 走过的十多年历史中，并非没有人提议过为 Nix 语言引入类型系统。

Nix 的 GitHub 仓库中有一个已关闭的 issue，标题是 [Static type system](https://github.com/NixOS/nix/issues/14)。截至撰稿时最新的 issue 是 #11298，而这个 issue 的编号竟然是 **#14**——它是 2012 年由 Nix 的作者 [Eelco Dolstra](https://github.com/edolstra) 先生亲自提出的。

> Nix won't be complete until it has static typing.

https://github.com/NixOS/nix/issues/14

然后它在 2018 年被[关闭](https://github.com/NixOS/nix/issues/14#event-1553720064)了。面对「为什么要关掉」的提问，先生的回答是：

> Because it's not realistically going to happen (and I'm cleaning up some backlog issues).

真令人伤感！

正如 [TAPL 第 1 章](https://www.ohmsha.co.jp/LinkClick.aspx?fileticket=EtTyUXyhRHY%3d&tabid=104&mid=739)所指出的那样，为一门原本没有类型系统的语言事后补上类型系统是极其困难的，所以这也是无可奈何的事。
