---
title: "Nix 语言"
description: "Nix 语言"
order: 9
---

支撑 Nix「声明式」这一理念的要素，正是 Nix 的 DSL^[领域特定语言。针对特定问题而专门设计的编程语言（例如 SQL：用于数据库查询的 DSL）]——**Nix 语言**。

只要用 Nix 语言定义好软件包并生成 store derivation，之后 Nix 就会自动解析依赖关系并执行构建。在声明式构建中，你无需担心所需的软件包是否已经安装、构建步骤是否正确之类的问题。

尽管 Nix 的构建系统有着严格的约束，还引入了 Derivation 这样的独有概念，但它依然能够包装现有软件的构建过程，原因就在于 Nix 语言的灵活性。软件包的构建可以作为程序来编写，因此具有很高的可扩展性与可复用性。

本章将介绍 Nix 语言的作用与特点。

## Nix 语言的作用

上一章提到 store derivation 是由 Nix 语言生成的，但这并不意味着 Nix 语言的编译目标就是 store derivation。Derivation 只是 Nix 语言中的一种数据而已，Nix 语言本身的用途要更加通用一些。具体来说有以下几类：

1. 定义软件包
2. 定义开发环境
3. 配置操作系统环境（NixOS）
4. 其他（第三方用途）

需要注意的是，Nix 语言本身什么也不做。Nix 表达式返回的只是数据，真正执行操作的是使用这些返回值的程序。例如，`nix build` 命令会构建用 Nix 语言定义的软件包，而 `nix develop` 则会启动用 Nix 语言定义的开发环境。

## Instantiation^[[11. Glossary - Nix Reference Manual](https://nixos.org/manual/nix/stable/glossary.html?highlight=instant#gloss-instantiate)]

从 Nix 表达式生成 store derivation 的过程称为 **Instantiation**（实例化）。在对 Nix 表达式执行 instantiate 时，Nix 期望该表达式返回一个 Derivation。Derivation 由 Nix 语言的内置函数 `derivation` 生成。

### Nix 语言的构建流程

1. 求值 Nix 表达式
2. 从 Nix 表达式返回的 Derivation 生成 store derivation（Instantiation）
3. 从 store derivation 构建出 Store 对象（Realisation）

## Nix 语言的特点

- 纯函数式语言
- 惰性求值
- 面向特定领域的功能
- 动态类型

Nix 语言虽然是纯函数式语言，但请放心，它并不存在单子（Monad）之类的复杂概念。由于它是一门 DSL，因此内置了与 Nix Store 和 Derivation 相关的函数。

## 数据类型

- 原始类型
  - 字符串
  - 数值
  - **路径**
  - 布尔值
  - Null
- 列表
- **Attribute Set**

### 原始类型

#### 字符串

```nix
"string"
```

用 `''` 可以书写多行字符串。

```nix
''
string
string
string
''
```

用 `${}` 可以嵌入变量。

```nix
# x = 1;
"x is ${x}" # -> x is 1
```

#### 数值

整数

```nix
123
```

小数

```nix
3.14
```

#### 路径

Nix 语言把文件路径作为一种独立的数据类型来支持，而不是当作字符串。

以 `./` 开头的路径，是相对于书写该路径的 Nix 语言文件的相对路径。

```
./example.txt
```

它与 UNIX 的文件路径用法相同。

```
../example.txt
```

#### 布尔值

```nix
true
```

```nix
false
```

#### Null

```
null
```

### 列表

列表的元素之间用空格分隔。

```
[ "foo" "bar" "baz" ]
```

```
[ 1 2 3]
```

### Attribute Set

**Attribute Set**（简称 **AttrSet**）直译为「属性的集合」，即由名称与值成对组成的 attribute 的集合。它是一种接近于其他编程语言中结构体或对象类型的数据类型。

名称与值之间用等号连接，每个 attribute 必须以分号结尾。

```nix
{
  x = 1;
  y = 2;
}
```

加上表示 recursive 的 `rec` 关键字后，就可以引用 AttrSet 内部的值。

```nix
rec {
  x = 1;
  y = x;
}
```

用 `.` 可以访问字段。

```nix
# a = { x = 1; y = 2; };
a.x # -> 1
```

## 函数

在 Nix 语言中，一个文件必须构成一个函数。

参数与返回值之间用冒号分隔。

```nix
参数: 返回值
```

```nix
# 若 number = 1，则返回值为 2
number: number + 1
```

调用函数时，只需在函数名后空一格再写上参数即可。

```nix
# add = number: number + 1
add 1 # -> 2
```

### 解构赋值

```nix
# 若 args = { x = 1; y = 2; }，则返回值为 { x = 2; y = 1; }
args: {
  x = args.y;
  y = args.x;
}
```

当参数是 AttrSet 时，可以使用解构赋值。

```nix
# 若 args = { x = 1; y = 2; }，则返回值为 { x = 2; y = 1; }
{ x, y }: {
  x = y;
  y = x;
}
```

如果只想使用传入 AttrSet 中的一部分 attribute，可以用 `...` 关键字忽略其余部分。

```nix
# 若参数为 { x = 1; y = 2; }，则返回值为 { y = 1; }
{ x, ... }: {
  y = x;
}
```

### let-in 语法

使用 let-in 语法可以在函数内声明变量。这是函数式语言中常见的语法。

```nix
# 若参数为 { x = 1; y = 2; }，则返回值为 { a = 2; b = 3; }
{ x, y }: let
  add = number: number + 1;
  a = add x;
  b = add y;
in {
  a = a;
  b = b;
}
```

### 常量

若没有参数，则该文件就是一个常量文件。

```nix
# 始终返回 123
123
```

```nix
# 始终返回 { x = 1; y = 2; }
{
  x = 1;
  y = 2;
}
```

## 内置函数

内置函数数量非常多，这里只挑选其中几个介绍。全部内置函数的说明请参阅以下文档。

https://nixos.org/manual/nix/stable/language/builtins#builtins-fetchurl

### readFile

`readFile` 是把文件读取为字符串的函数。其参数需要指定为路径类型。

```nix
readFile <路径>
```

另一方面，Nix 中并不存在 `writeFile` 之类的函数。Nix 语言的内置函数基本上都是只读的，不存在写入类的函数^[严格来说，`derivation` 函数会产生对 Nix Store 的写入。]。

### fetchurl

`fetchurl` 是最原始的 Fetcher。

```nix
fetchurl {
  url = "<URL>";
  sha256 = "<预期下载内容的 SHA256 哈希>";
}
```

### fromJSON/fromTOML/toJSON/toXML

针对常用的数据格式，Nix 提供了从字符串转换为 Attribute Set、或从 Attribute Set 转换为字符串的函数。

## import 函数

`import` 函数是用于调用外部 Nix 文件中函数的内置函数。

假设有如下的文件结构。

```
./
├─main.nix
└─sub/
  ├─default.nix
  └─imported.nix
```

假设 `imported.nix` 是下面这样的函数，我们考虑从 `main.nix` 调用 `imported.nix`。

```nix :imported.nix
{ x, y }: {
  a = x;
  b = y;
}
```

给 `import` 传入路径作为参数即可完成导入。

```nix :main.nix
let
  f = import ./sub/imported.nix;
in
f { x = 1; y = 2; } # -> { a = 1; b = 2; }
```

下面的写法与上面的代码等价。

```nix :main.nix
import ./sub/imported.nix { x = 1; y = 2; }; # -> { a = 1; b = 2; }
```

### default.nix

有一个名为 `default.nix` 的特殊文件。

我们把 `imported.nix` 复制一份，命名为 `default.nix`。

```
./
├─main.nix
└─sub/
  ├─default.nix
  └─imported.nix
```

当给 `import` 指定一个目录路径时，`import` 会导入该目录下的 `default.nix`。

```nix :main.nix
import ./sub { x = 1; y = 2; }; # -> { a = 1; b = 2; }
```

其用法与 Node.js 的 `index.js`、Rust 的 `mod.rs` 完全一致。

## derivation 函数

`derivation` 函数是 Nix 语言中最重要的内置函数。它返回一个 Attribute Set，并以副作用的形式生成 store derivation。由于带有副作用，看上去似乎会破坏 Nix 语言的纯粹性，但由于 Nix Store 与 Nix 语言巧妙地隐藏了内部动作，从外部看它依然保持着纯函数式的性质。

```nix
derivation {
  name = "<软件包名>";
  system = "<系统架构>";
  builder = "<执行构建的可执行文件路径>";
}
```

`derivation` 是一个非常原始的函数，因此实际构建软件包时，我们会使用下一章要介绍的 Nixpkgs 所提供的库。

## Nix 语言与 Nix Store 的相互作用

其实，`import`、`readFile` 这类读取外部文件的函数与 Derivation 有着密切的关系。这些函数并不是直接读取路径所指定的文件，而是读取 Store 路径。具体来说，它们会在内部把目标文件作为 Store 对象 realise 到 Nix Store 中。

再往下就涉及更复杂的内容了，想深入了解的读者请参阅以下文档。

https://nixos.org/manual/nix/stable/language/import-from-derivation
