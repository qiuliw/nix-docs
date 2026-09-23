---
title: "　§2. 内置函数"
description: "　§2. 内置函数"
order: 6
---

## builtins

Nix 语言在全局命名空间中定义了一个名为 `builtins` 的 AttrSet，它汇集了各种内置函数。基本上通过 `builtins.<函数名>` 的形式调用，但有一些内置函数也和 `builtins` 一样，直接在全局命名空间中可用。

本书中出现的 Nix 表达式，除 `import`/`throw`/`derivation` 函数之外，都会显式写成 `builtins.<函数名>` 的形式。

## 重要的内置函数

### import

```:import的类型
import :: Path -> <式>
```

在 Nix 语言中做文件拆分时使用。`import` 函数接收一个 Path，返回该 Path 所指向的 Nix 文件中的 Nix 表达式。

我们试着从 `main.nix` 导入 `add.nix`。

```:目录结构
./
├── add.nix
└── main.nix
```

```nix :add.nix
{ a, b }: a + b
```

```nix :main.nix
let
  add = import ./add.nix;
in
add {
  a = 1;
  b = 2;
}

# 省略して以下の書き方をすることが多い
# import ./add.nix { a = 1; b = 2; }
```

```bash :对拆分后的Nix表达式求值
$ nix eval --file ./main.nix
3
```

有意思的是，文件导入并不是一个特殊的语法，而是作为内置函数提供的（后面的小节会讲到，它在内部其实是个特殊的函数）。

### throw

```:throw的类型
throw :: String -> 虚無
```

`throw` 会抛出异常。参数中的字符串会作为错误信息显示出来。

Nix 语言没有 try-catch 之类的错误处理机制，抛出异常就意味着整个 Nix 语言求值过程的终止。

### derivation

与构建相关的最重要的函数。将在 [_1.4. Nix 语言与 derivation_](ch01-04-derivation) 中详细讲解。

## 常用的内置函数

### readFile

```:readFile的类型
readFile :: Path -> String
```

`readFile` 会把文件内容读取为字符串。

```bash :读取hello.txt
$ echo "Hello, world!" > hello.txt

$ nix repl
nix-repl> builtins.readFile ./hello.txt
"Hello, world!"
```

### toString

```:readFile的类型
toString :: 任意の型 -> string
```

`toString` 是把任意值转换为字符串的函数。

#### 应用于原始类型时……

```bash
# Number: 見た目通り
nix-repl> builtins.toString 1234
"1234"

# String: なにも変わらない
nix-repl> builtins.toString "Hello, world!"
"Hello, world!"

# Path: 絶対パスの文字列に変換
nix-repl> builtins.toString ./path/to/file
"/absolute/path/to/file"

# Boolean: trueなら"1"、falseなら空文字列
nix-repl> builtins.toString true
"1"

nil-repl> builtins.toString false
""

# Null: 空文字列
nix-repl> builtins.toString null
""
```

#### 应用于 List 时……

```bash
# 文字列要素をスペース区切りで連結
nix-repl> builtins.toString ["Hello," "world!"]
"Hello, world!"

# 各要素にtoStringを適用して連結
nix-repl> builtins.toString [1 2 3]
"1 2 3"

# 異なる型の要素でも同じくtoStringを適用して連結
nix-repl> toString [1 true "String" null]
"1 1 String "

# 空リストは空文字列
nix-repl> builtins.toString []
""
```

#### 应用于 AttrSet 时……

一般来说，对 AttrSet 应用 `toString` 会报错；只有当它带有 `__toString` 或 `outPath` 这两个 attribute 之一时，才作为例外可以转换成字符串。

`__toString` 必须是一个函数，其参数为 AttrSet 自身。应用 `toString` 时，`toString` 会把这个 AttrSet 本身作为参数传给 `__toString`，再对其返回值应用 `toString`，并把结果返回。

```nix
let
  attr = {
    someAttr = 1234;

    # toString適用時、selfにはattr自体が渡される
    __toString = self: someAttr;
  };
}
in
builtins.toString attr

# 評価結果: "1234"
```

`outPath` 必须是 Path 类型，应用 `toString` 会把该 Path 转换成字符串。

```nix
builtins.toString {
  outPath = /path/to/something;
}

# 評価結果: "/path/to/something"
```

至于为什么会是这样的行为，将在 [_1.4. Nix 语言与 derivation_](ch01-04-derivation) 中详细讲解。

### 解析 / 序列化类

Nix 内置了若干针对特定数据格式的解析与序列化函数。

- fromJSON
- fromTOML
- toJSON
- toXML

```:类型
# パース
fromJSON :: String -> AttrSet
fromTOML :: String -> AttrSet

# シリアライズ
toJSON :: AttrSet -> string
toXML :: AttrSet -> string
```

## 非纯函数

builtins 中有一些函数并不是纯函数。这些函数带有副作用、不满足引用透明性，会损害 Nix 的可复现性。因此，下一章要讲解的 Nix 语言项目管理功能 Flakes 限制了非纯函数的使用：不显式加上 `--impure` 选项求值就会报错。而在 REPL 或不受 Flakes 管理的 Nix 表达式中，则可以直接使用。

<details>
<summary>「非纯」的定义</summary>

也许有读者会疑惑：「前面提到的 `readFile` 之类不也是非纯的吗？」考虑到一般的纯函数式语言会把所有 I/O 都显式当作副作用来处理，这个疑问很自然。

Nix 语言的纯粹性不仅由语言本身保证，还由 Nix Store 和构建系统共同保证。这一点与 [_1.4. Nix 语言与 derivation_](ch01-04-derivation) 相关，这里不展开细说，总之从全局来看它是「看上去纯粹」的。因此，本书中的「非纯」，或许理解为「可能损害构建的可复现性」这一程度的含义会更合适。

笔者也纠结过这个表达该如何处理，最终决定沿用官方参考手册中的「impure」一词。

</details>

### currentSystem

```:currentSystem的类型
currentSystem :: string
```

```bash :REPL
nix-repl> builtins.currentSystem
"x86_64-linux"
```

以字符串形式返回当前对 Nix 表达式求值的系统架构。

### getEnv

```:getEnv的类型
getEnv :: string -> string
```

```bash :REPL
nix-repl> builtins.getEnv "EDITOR"
"nvim"
```

`getEnv` 用于获取环境变量的值。环境变量不存在时返回空字符串。如果在 Flakes 管理下的 Nix 表达式中使用 `getEnv`，且求值时没有加 `--impure` 选项，则始终返回空字符串。

## Fetcher

在 Nix 语言中，从互联网获取资源的函数被称为 **Fetcher**。乍看之下它似乎也是非纯函数，但 Nix 提供了利用哈希函数在保持幂等性的前提下访问互联网的机制，fetcher 正是利用了这一机制。详情将在 [_3.2. Fetcher_](ch03-02-fetchers) 中讲解。

## 其他内置函数

除此之外还有许多内置函数，涉及字符串操作、列表操作、类型判定等。此后本书每出现新的内置函数，都会随时加以说明。

详情请参考官方参考手册。

https://nix.dev/manual/nix/2.20/language/builtins

## 【闲谈】拿非纯函数玩一玩

有一个叫 `currentTime` 的非纯内置函数，它返回当前的 UNIX 时间。

```:currentTime的类型
currentTime :: integer
```

```bash :REPL
nix-repl> builtins.currentTime
1722052322 # 日本時間で2024/07/27 12:52:02
```

当然，在构建过程中获取当前时刻是绝对不可取的，所以根本不会有机会用到这个函数。

……不过，笔者一时兴起用 `currentTime` 实现了一个函数，有兴趣的话不妨看看。

```:today函数
today :: Number -> { year, month, day }
```

<details>
<summary>today.nix</summary>

这是一个考虑了闰年、把 UNIX 时间转换为年月日的函数。
由于 Nix 语言没有取模运算符，这里自己定义了一个 `can_divide` 函数来判断能否整除。`builtins.elemAt` 是获取 List 中指定索引元素的函数。

```nix :today.nix
# Number -> { year, month, day }
unix_time:
let
  base_year = 1970;
  seconds_in_day = 86400;
  total_days = unix_time / seconds_in_day;

  can_divide = dividend: divisor: (dividend / divisor) * divisor == dividend;

  is_leap_year =
    year:
    if can_divide year 400 then
      true
    else if can_divide year 100 then
      false
    else
      can_divide year 4;

  calc_year =
    { year, days }:
    let
      days_in_year = 365 + (if (is_leap_year year) then 1 else 0);
    in
    if days < days_in_year then
      { inherit year days; }
    else
      calc_year {
        year = year + 1;
        days = days - days_in_year;
      };

  calc_month =
    {
      year,
      month,
      days,
    }:
    let
      days_per_month = [
        31
        (if (is_leap_year year) then 29 else 28)
        31
        30
        31
        30
        31
        31
        30
        31
        30
        31
      ];
      days_in_month = builtins.elemAt days_per_month (month - 1);
    in
    if days < days_in_month then
      {
        inherit year month;
        days = days + 1;
      }
    else
      calc_month {
        inherit year;
        month = month + 1;
        days = days - days_in_month;
      };

  year_and_remaining_days = calc_year {
    year = base_year;
    days = total_days;
  };
  month_and_day = calc_month {
    year = year_and_remaining_days.year;
    month = 1;
    days = year_and_remaining_days.days;
  };
in
{
  year = year_and_remaining_days.year;
  month = month_and_day.month;
  day = month_and_day.days;
}
```

</details>

给 `today` 传入做了 9 小时校正的 UNIX 时间，就会返回当前的年月日。

```bash :REPL
nix-repl> today = import ./today.nix

# 日本時間に直すために9時間分の補正をかける
nix-repl> jst_bias = 9 * 60 * 60

# 2024-08-16に評価した
nix-repl> today (builtins.currentTime + jst_bias)
{ day = 16; month = 8; year = 2024; }
```

在通用语言中这是必备的函数，但在 Nix 语言里它毫无用武之地。

作为这类毫无实用性的 Nix 表达式的进阶案例，还有人用 Nix 语言硬生生实现了一个生成随机数的离谱函数^[[figsoda](https://github.com/figsoda) 先生：他开发了 [fenix](https://github.com/nix-community/fenix)、[nurl](https://github.com/nix-community/nurl) 等非常好用的 Nix 相关工具。]。

https://github.com/figsoda/rand-nix

README 中是这样写的：

> _Impure, unreproducible, and indeterministic_
>
> 「_非纯粹、不可复现、不确定_」

**非纯函数，绝对不行^[这只是为了保证 Nix 构建的可复现性。在通用编程语言中并非如此。]^[下一节要讲的 Flakes 会机械地限制非纯函数。]**
