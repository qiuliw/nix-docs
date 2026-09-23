---
title: "总结"
description: "总结"
order: 14
---

讲解到此就全部结束了，辛苦了。

能读到这里的你，应该已经可以自己解释本书开头提出的以下内容了。

1. 纯函数式的构建系统
2. 通过 Nix Store 对软件包与依赖关系的严格管理
3. 通过 Nix 语言与 Flakes 实现的声明式构建
4. 通过 Profiles 实现的非破坏性软件包配置管理

最后再分享一点小知识。『Nix』在拉丁语中是『雪』的意思。Nix 的 logo 看起来像一片雪花，但仔细观察就会发现，它其实是由 6 个 λ（lambda）组合而成的——λ 正是纯函数式语言的基础计算模型「lambda 演算」的符号。是不是很酷？

![Nix 的 logo](https://raw.githubusercontent.com/NixOS/nixos-artwork/35ebbbf01c3119005ed180726c388a01d4d1100c/logo/nix-snowflake.svg)
_小知识：Nix 的 logo 非常尖锐，紧急时刻可以当武器用_

## 下一步

想必很多读者都在寻找能够动手实践的 Nix 教程。

最推荐的教程是 Determinate Systems 公司的 [Zero to Nix](https://zero-to-nix.com)。Zero to Nix 从安装 Nix 开始，以实战的形式带你学习 CLI 的用法和软件包的构建方法。

https://zero-to-nix.com

另外，作为本书续篇的教程《Nix 入门：实战篇》正在撰写中。公开日期尚未确定，内容预计会类似于 Zero to Nix 的日语版。

如果想更深入地理解 Nix 的内部机制，建议阅读 [Nix Reference Manual](https://nixos.org/manual/nix/stable/)。本书的大部分内容都参考自这份文档。

https://nixos.org/manual/nix/stable/

如果还想进一步了解 Nix 的理论背景，请阅读 Dolstra 先生的论文 [_The Purely Functional Software Deployment Model_](https://edolstra.github.io/pubs/phd-thesis.pdf)。

https://edolstra.github.io/pubs/phd-thesis.pdf

此外，对于从 Nix 进一步延伸、对 NixOS 感兴趣的读者，推荐 ryan4yjn 先生的 [NixOS & Flakes Book](https://nixos-and-flakes.thiscute.world)。

https://nixos-and-flakes.thiscute.world

## 结语

道理很简单：这个世界上不存在完美的软件，Nix 也仍有改进的余地。但是，未来的开发/构建/部署应当具备 Nix 所倡导的可复现性、声明式与可靠性——这一主张，我想所有开发者都会赞同。Nix 也许只是手段之一，但大家要去的方向是相同的。

无论你读完本书后是想试试 Nix，还是觉得不用也无妨，也无论你是否身处 Nix 社区，如果能与所有开发者一起创造健全的软件开发未来，我将不胜欣喜。

感谢你读完本书！
