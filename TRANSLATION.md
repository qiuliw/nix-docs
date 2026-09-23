# 中文翻译术语表（Nix Docs）

翻译目标：简体中文，技术准确、行文自然，保留代码与专有名词。

## 必须保留英文的术语

| 原文 | 译法 |
|------|------|
| Nix / NixOS / nixpkgs / Nixpkgs | 不译 |
| Flake / Flakes | 不译（可写「Flake（片状配置）」仅首次） |
| Derivation | Derivation（派生）— 首次可括注，后文用 Derivation |
| Store / Nix Store | Nix Store（仓库）— 首次括注后可用「Store」 |
| Closure | Closure（闭包） |
| Overlay / Overlays | Overlay |
| Profile / Profiles | Profile |
| Channel / Channels | Channel |
| Garbage Collection / GC | 垃圾回收（GC） |
| Sandbox | 沙箱 |
| Home Manager / home-manager | home-manager |
| Hydra / Cachix | 不译 |
| stdenv | stdenv |
| flake.nix / flake.lock | 不译 |

## 常用译法

| 日文 | 中文 |
|------|------|
| パッケージマネージャ | 包管理器 |
| 純粋関数型 | 纯函数式 |
| 再現性 | 可复现性 |
| 宣言的 | 声明式 |
| 信頼性 | 可靠性 |
| ビルド | 构建 |
| 依存関係 | 依赖关系 |
| バイナリキャッシュ | 二进制缓存 |
| ハッシュ | 哈希 |
| 入門 | 入门 |
| ハンズオン | 实战 / 动手实践 |
| 仕組み | 机制 / 原理 |
| 前提知識 | 前置知识 |
| 用語集 | 术语表 |

## 格式规则

1. 保留 YAML frontmatter 结构；翻译 `title`、`description`；保留 `order` 数值。
2. 代码块内容、命令、路径、URL **一字不改**。
3. 代码块语言标记（含 `shell:标题`）保持原样；若标题是日文可译成中文。
4. Markdown 链接文字可译，URL 不改。
5. HTML `<details>/<summary>` 中的 summary 文字要翻译。
6. 图片路径 `/images/...` 保持不变。
7. 语气：书面、准确、可读；不要机翻腔；不要漏译段落。
8. 日文人名、项目名保留原文。
