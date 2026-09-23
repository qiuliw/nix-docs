---
title: "　§1. Nix 语言基础"
description: "　§1. Nix 语言基础"
order: 5
---

我们先来学习 Nix 语言的基本语法和功能，通过对一些简单表达式求值来找找感觉。

## 用 Nix 语言写 Hello world

先来一个 Hello world。

创建如下的 `hello-world.nix`：

```nix :hello-world.nix
"Hello, world!"
```

用 `nix eval` 命令对这个 Nix 文件求值。

```bash
$ nix eval --file ./hello-world.nix
"Hello, world!"
```

……这与其说是程序，倒不如说只是一个字符串。用 Nix 语言写成的程序被称为 **Nix 表达式**^[「表达式（expression）」是程序的语法要素（称为「项（term）」）之一，反复求值后必定归结为某个「值」。]，而 Nix 表达式必须返回且仅返回一个值。`hello-world.nix` 的内容就是一个极其原始的 Nix 表达式：它总是返回 `"Hello, world!"` 这个字符串。

另外，Nix 语言本身并不具备向标准输出打印值的功能。上面的例子只是 `nix eval` 命令把 `hello-world.nix` 的求值结果输出到了标准输出而已。

### REPL

用 `nix repl` 命令可以启动 Nix 语言的 REPL。

```bash :在REPL中Hello world
$ nix repl
nix-repl> "Hello, world!"
"Hello, world!"
```

## 数据类型

- 原始类型
  - Number
  - String
  - Path
  - Boolean
  - Null
- 复合类型
  - List
  - Attribute Set

### Number

```bash :Number型与算术运算
# integer
nix-repl> 1
1

# integerの四則演算
nix-repl> 1 + 2
3

# floatを含む算術演算はfloatになる
nix-repl> 1.0 / 3
0.333333
```

#### 关于算术运算符语法的注意事项

除法运算符 `/` 如果不在操作数与运算符之间加空格，就会被解释为 Path 类型（后文介绍）。

```bash :除法运算符与Path类型
nix-repl> 10/2
/10/2

nix-repl> 10 / 2
5
```

另外，由于 Nix 语言允许短横线命名（kebab-case），减法运算符 `-` 有时会被当作变量名的一部分。

```bash :减法运算符与kebab-case
# nはNumber型の変数
nix-repl> n-1
error: undefined variable 'n-1'
       at «string»:1:1:
            1| n-1
             | ^
```

### String

```bash :String型
nix-repl> "Hello, world!"
"Hello, world!"

# 複数行の文字列
nix-repl> ''
          aaaa
          bbbb
          cccc
          ''
"aaaa\nbbbb\ncccc\n"

# String + String -> String
nix-repl> "Hello, " + "world!"
"Hello, world!"
```

使用 `${}` 可以嵌入变量。Nix 语言的变量将在后文介绍。

```bash :嵌入变量
# `${}`で文字列に変数を埋め込む
nix-repl> a = "Nix lang"
nix-repl> b = "poor"
nix-repl> "${a} is ${b}"
"Nix lang is poor"
```

### Path

`Path` 类型是 Nix 语言特有的类型，用于表示文件路径。

```bash :在REPL中
# 評価すると絶対パスが返ってくる
nix-repl> ./path/to/something
/absolute/path/to/something
```

Path 是以**书写该 Path 的那个 Nix 文件为基准的相对路径**来书写的。例如，`./.` 表示该 Nix 文件所在的目录。

```:/path/to/something.nix
./.
```

```bash :对something.nix求值
$ nix eval --file /path/to/something.nix
/path/to
```

对 Path 求值会显示绝对路径。不过在内部，它采用的是与单纯的文件路径不同的另一种形式，并且与 **derivation** 有着紧密的关联。详情将在 [_1.4. Nix 语言与 derivation_](ch01-04-derivation) 中说明。

Path 与 Path、或 Path 与 String 之间可以用 `+` 运算符拼接。Path + String 的结果是 Path。

```bash :Path的拼接
# Path + Path -> Path
nix-repl> /path + /to + /something
/path/to/something

# Path + String -> Path
nix-repl> ./. + "/hello"
<現在のディレクトリの絶対パス>/hello
```

### List

```bash :List型
nix-repl> [1 2 3]
[ 1 2 3 ]

# Listの要素は異なる型でもよい
nix-repl> ["a" 1 [2 3]]
[ "a" 1 [ ... ] ]
```

List 可以用 `++` 运算符拼接。

```nix :List与++运算符
# List ++ List -> List
nix-repl> [1 2 3] ++ [4 5 6]
[ 1 2 3 4 5 6 ]
```

有一点需要注意：如果想在 List 中应用函数，必须用 `()` 括起来以明确范围。很多人在这个行为上栽过跟头，因此官方文档中也专门写了[注意事项](https://nix.dev/manual/nix/2.20/language/values#list)。

```bash :在List中使用函数时的注意事项
# 関数fの定義: Numberを受け取り、1を加えて返す（関数については後述）
nix-repl> f = a: a + 1

# `()`で囲んだ場合、以下のListは`[Number Number Number]`と評価される
nix-repl> [1 2 (f 3)]
[ 1 2 4 ]

# `()`で囲まないと`[Number Number Function Number]`として扱われる
nix-repl> [1 2 f 3]
[ 1 2 «lambda @ «string»:1:1» 3 ]
```

### Attribute Set

**Attribute Set**（也称 **AttrSet** 或简称 **Set**）相当于记录类型或字典类型，持有键值对。这样的一对被称为 **attribute**（属性）。

```bash :AttrSet型
nix-repl> { a = 1; b = 2; }
{ a = 1; b = 2; }

# Attribute Setのattributeにアクセス
nix-repl> { a = 1; b = 2; }.a
1
```

attribute 也可以用字符串来访问。

```bash :用字符串访问
nix-repl> { a = 1; b = 2; }."a"
1
```

加上 `rec`（recursive 的意思）之后，就可以引用自身的 attribute。

```bash :rec关键字
# attributeを相互に参照
nix-repl> rec { a = 1; b = a + 1; }
{ a = 1; b = 2; }
```

使用 `//` 运算符可以合并多个 AttrSet。

```bash ://运算符
# AttrSetのマージ
nix-repl> { a = 1; b = 2; } // { c = 3; }
{ a = 1; b = 2; c = 3; }

# 同じattributeがある場合、後者が優先される
nix-repl> { a = 1; b = 2; } // { a = 4; c = 3; }
{ a = 4; b = 2; c = 3; }
```

## 基本语言特性

### let 表达式

```bash :用let-in绑定变量
nix-repl> let a = 1; in a
1
nix-repl> let a = 1; b = 2; in a + b
3
```

用 `let-in` 可以绑定变量。Nix 语言的变量是不可变的，因此不能重新赋值。

Nix 表达式必然是返回一个值的纯表达式，所以归根结底可以写成单个内联表达式。但那样可读性会很差，因此请用 let 表达式把处理步骤划分清楚。

```nix :为可读性而使用let表达式
let
  processed1 = # ステップ1の処理
  processed2 = # ステップ2の処理
  processed3 = # ステップ3の処理
in
processed3 # 結果を返す
```

REPL 整体相当于处在一个 `let-in` 之中，因此可以自由地定义变量。

```bash :在REPL中定义变量
nix-repl> a = 1
nix-repl> a
1

# REPL内でのみシャドーイング可能
nix-repl> a = 2
nix-repl> a
2
```

### inherit

用于 AttrSet 中。
考虑如下的 Nix 表达式：

```nix :Before
let
  a = 1;
in
{
  a = a;
}
```

把原本写成 `a = a` 的部分用 `inherit` 改写。下面的写法与上面的 Nix 表达式等价。

```nix :After
let
  a = 1;
in
{
  inherit a;
}
```

### with 表达式

```nix :with表达式的形式
with <AttrSet>; <式>
```

with 表达式会把给定 AttrSet 的各个 attribute 作为变量引入到 `;` 之后表达式的作用域中。实际用一下会更容易理解。

```nix :Before
let
  set = {
    a = 1;
    b = 2;
  };
in
set.a + set.b # -> 3
```

```nix :After
let
  set = {
    a = 1;
    b = 2;
  };
in
# setのattributeをそのまま変数として使える
with set; a + b # -> 3
```

在把 AttrSet 的 attribute 放进 List 时经常用到。

```nix :with表达式与List
let
  set = {
    a = 1;
    b = 2;
  };
in
with set; [ a b ] # -> [ 1 2 ]
```

> **滥用 with 表达式是危险的。**
> 被展开的 attribute 可能与表达式中定义的变量发生冲突，从而导致不符合预期的行为。而且大多数 Nix 语言的 Language Server 都无法很好地分析使用了 with 表达式的作用域。
> 一旦 with 表达式的影响范围变大，代码的可读性会急剧下降。

### if 表达式

Nix 语言是面向表达式的，所以它不是 if 语句，而是 if **表达式**。

```bash :if表达式
nix-repl> if true then 1 else 2
1

nix-repl> if false then 1 else 2
2
```

## 函数

在函数式语言中最重要的当然是函数。

Nix 语言中的函数按如下方式定义。`:` 之后必须加一个空格。

```nix :函数的定义
<引数>: <式>
```

使用函数时，用空格隔开并传入参数。在函数式语言中，向函数传入参数被称为**应用**（apply）。本书也沿用这一说法。

```nix :函数的应用
<関数> <引数>
```

### 具体示例

```bash :函数
# 1つの引数をとる関数
nix-repl> add_1 = a: a + 1
nix-repl> add_1 1
2

# 2つの引数をとる関数
nix-repl> add_a_b = a: b: a + b
nix-repl> add_a_b 1 2
3

# 無名関数
nix-repl> (a: a + 1) 1
2

# 無名関数（2引数）
nix-repl> (a: b: a + b) 1 2
3
```

### Attribute Set 与函数

Nix 语言中经常使用以 AttrSet 为参数的函数，因此提供了若干便利的语法。

#### 取出 attribute

```nix :Before
# { a = Number; b = Number; } -> Number
set: set.a + set.b
```

```nix :After
# { a = Number; b = Number; } -> Number
{ a, b }: a + b
```

#### 忽略多余的 attribute

```bash :...语法
# 普通に関数を定義
nix-repl> add_a_b = { a, b }: a + b

# 余分なattributeがあるとエラーになる
nix-repl> add_a_b { a = 1; b = 2; c = 3; }
ERROR: attribute 'c' missing

# `...`で余分なattributeを無視
nix-repl> add_a_b = { a, b, ... }: a + b

# エラーにならない！
nix-repl> add_a_b { a = 1; b = 2; c = 3; }
3
```

#### @ 语法

在取出 attribute 的同时，还可以用 `@` 获取整个 AttrSet。

```nix :@语法
args @ { a, b, ... }: a + b + args.c

# 後置でもOK
# { a, b, ... } @ args : a + b + args.c
```

```bash :REPL
nix-repl> add_a_b_c = args @ { a, b, ... }: a + b + args.c

nix-repl> add_a_b_c { a = 1; b = 2; c = 3; }
6
```

#### ? 语法

用 `?` 可以检查是否包含某个特定的 attribute，若不存在则使用默认值。

```nix :?语法
{
  a ? 1,
  b ? 2
}:
a + b
```

```bash :REPL
nix-repl> add_a_b = { a ? 1, b ? 2 }: a + b

nix-repl> add_a_b {}
3
```

### assert 表达式

```:assert的形式
assert <条件式>; <式>
```

可以用 `assert` 进行校验。条件为真时返回 `;` 之后的表达式，为假时抛出异常。

```nix :当第二个参数为零时抛出异常的函数
# Number -> Number -> Number
dividend: divisor:
assert divisor != 0;
dividend / divisor
```

```bash :REPL
nix-repl> divide = dividend: divisor: assert divisor != 0; dividend / divisor

# 正常な計算
nix-repl> divide 9 3
3

# ゼロ除算でエラー
nix-repl> divide 9 0
error: assertion '(divisor != 0)' failed

       at «string»:1:21:

            1|  dividend: divisor: assert divisor != 0; dividend / divisor
             |                     ^
```

## 没有循环吗？

大多数函数式语言都没有 `for`/`while`/`loop` 这类语法，取而代之的是递归函数。下面展示一个计算 5 的阶乘的递归函数。

```nix :factorial5.nix
let
  f = n:
    if n == 0
      then 1
      else n * f (n - 1);
in
f 5
```

```bash :对factorial5.nix求值
$ nix eval --file ./factorial.nix
120
```

从本节之后不会再写递归处理，因此不再深入展开。

有兴趣的读者，推荐阅读这篇文章。

https://blog.ryota-ka.me/posts/2018/12/15/lazy-lists-in-nix-expressions-language#map-%E9%96%A2%E6%95%B0filter-%E9%96%A2%E6%95%B0

## 到底该怎么构建软件包？

到目前为止介绍的语言特性都非常基础，完全谈不上能构建软件包。实际进行构建时要用到以下功能：

- derivation 函数
- Import From Derivation

两者都是与 Nix Store 相互作用的功能。关于它们，将在 [_1.4. Nix 语言与 derivation_](ch01-04-derivation) 中详细讲解。
