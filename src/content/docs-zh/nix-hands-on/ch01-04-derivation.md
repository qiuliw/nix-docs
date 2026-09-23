---
title: "　§4. Nix 语言与 derivation"
description: "　§4. Nix 语言与 derivation"
order: 8
---

终于要触及 Nix 语言的核心了。此前介绍的语言特性都非常基础，完全谈不上能构建软件包。要真正进行构建，就必须与 Nix 的构建系统协同工作。

本节我们来学习 **derivation 函数**和 **IFD**（**Import From Derivation**），理解 Nix 语言是如何与 Nix Store 协作的。

## derivation 函数

derivation 函数是 Nix 语言中最重要的内置函数。该函数接收一个 AttrSet 并返回一个 AttrSet，同时作为副作用在 Nix Store 中生成一个 **store derivation**。

```:derivation的类型
derivation :: AttrSet -> AttrSet
```

---

我们来用一下 derivation 函数。创建下面这个 Nix 文件。

```nix :drv.nix
derivation {
  name = "hello-txt";
  builder = "/bin/sh";
  args = [
    "-c"
    "echo -n Hello > $out"
  ];
  system = builtins.currentSystem;
}
```

`name` 是软件包名，`builder` 是执行构建的可执行文件路径，`args` 是传给 `builder` 的参数。`system` 指定构建目标平台。

本来为了保证可复现性，这些参数必须严格指定，但这次为了让说明简洁，`builder` 直接指定了宿主机 shell 的路径（`/bin/sh`），`system` 则使用了非纯内置函数 `currentSystem`。

---

对 `drv.nix` 求值会输出如下的 AttrSet。

```bash
# 見やすさのために評価結果に改行を入れています
$ nix eval --file ./drv.nix
{
  all = [ «repeated» ];
  args = [ "-c" "echo -n Hello > $out" ];
  builder = "/bin/sh";
  drvAttrs = {
    args = «repeated»;
    builder = "/bin/sh";
    name = "hello-txt";
    system = "x86_64-linux";
  };
  drvPath = "/nix/store/ybkx07yfg2w33mr909bk2g7z0264sy4x-hello-txt.drv";
  name = "hello-txt";
  out = «repeated»;
  outPath = "/nix/store/z4j03hs3qk7a3cbiwglgys2cz61pbi6s-hello-txt";
  outputName = "out";
  system = "x86_64-linux";
  type = "derivation";
}
```

`drvPath` 表示所生成的 store derivation 的 Store 路径。实际确认一下，可以看到 `.drv` 文件确实生成了。

```bash :确认store derivation
$ cat /nix/store/ybkx07yfg2w33mr909bk2g7z0264sy4x-hello-txt.drv
# Store derivationの内容が表示される
```

接下来确认一下 `outPath`。`outPath` 表示构建产物所在的 Store 路径。

```bash :确认outPath
$ cat /nix/store/z4j03hs3qk7a3cbiwglgys2cz61pbi6s-hello-txt
cat: /nix/store/z4j03hs3qk7a3cbiwglgys2cz61pbi6s-hello-txt: No such file or directory
```

看起来文件并不存在。

derivation 函数只负责生成 store derivation。要真正进行构建，还需要对 store derivation 执行 **realise**（实现）。

### Realisation

我们来 realise 刚才生成的那个 store derivation。

```bash :Realise
$ nix-store --realise /nix/store/ybkx07yfg2w33mr909bk2g7z0264sy4x-hello-txt.drv
/nix/store/z4j03hs3qk7a3cbiwglgys2cz61pbi6s-hello-txt

$ cat /nix/store/z4j03hs3qk7a3cbiwglgys2cz61pbi6s-hello-txt
Hello
```

构建成功，`outPath` 处生成了一个写有 `Hello` 字符串的文件。

基本上，仅仅对 Nix 语言求值并不会 realise 软件包（后面要讲的 IFD 除外）。Nix 语言的作用是充当生成 store derivation 的 DSL，而 realise 则由 Nix 的命令（`nix-store --realise`、`nix build` 等）来执行。

<details>
<summary>当 Realisation 的结果不同时</summary>

前面的 `drv.nix` 为了让说明简洁，对本该严格指定的部分打了马虎眼。因此在某些读者的环境下构建结果可能有所不同，直接忽略继续往下读即可。

例如在 macOS 上，输出结果可能会像下面这个 issue 中那样。
https://github.com/asa1984/nix-zenn-articles/issues/14#issuecomment-2322872556

另外，如果使用 Flake，一旦存在会损害可复现性的 Nix 表达式（非纯内置函数、访问未被 Git 管理的文件），在构建前就会报错，因此不会出现这类问题。

</details>

### Instantiation

derivation 函数的关键在于：store derivation 并不是作为函数的返回值输出的，而是**作为副作用被生成**的。这一过程称为 **Instantiation**（实例化）。

Store derivation 可以看作是 Nix 表达式的低层表示。

一提到副作用，似乎与 Nix 语言作为纯函数式语言的性质相矛盾，但通过与 Nix Store 和构建系统的协作，整体上它仍然是一个纯粹的系统。虽然这是一种隐式行为，但并不会损害 Nix 语言求值和软件包构建的确定性。

## Store derivation

我们以 JSON 格式来查看 store derivation 的内容，这里使用 `nix derivation show` 命令。

```bash
$ nix derivation show --file ./drv.nix
{
  "/nix/store/ybkx07yfg2w33mr909bk2g7z0264sy4x-hello-txt.drv": {
    "args": ["-c", "echo -n Hello > $out"],
    "builder": "/bin/sh",
    "env": {
      "builder": "/bin/sh",
      "name": "hello-txt",
      "out": "/nix/store/z4j03hs3qk7a3cbiwglgys2cz61pbi6s-hello-txt",
      "system": "x86_64-linux"
    },
    "inputDrvs": {},
    "inputSrcs": [],
    "name": "hello-txt",
    "outputs": {
      "out": {
        "path": "/nix/store/z4j03hs3qk7a3cbiwglgys2cz61pbi6s-hello-txt"
      }
    },
    "system": "x86_64-linux"
  }
}
```

请注意 `env` 这个键。这里指定的是在 realise 这个 store derivation 时（也就是实际执行构建时）会在构建环境（沙箱）中生效的环境变量。

这个例子中的 store derivation 只设置了最少的参数，因此只有以下 4 个环境变量生效。

| 环境变量名 | 内容                                   |
| ---------- | -------------------------------------- |
| builder    | 执行构建的可执行文件路径 |
| name       | 软件包名                           |
| out        | 放置构建产物的 Store 路径       |
| system     | 构建目标平台     |

其中尤为重要的是 `$out`。要把构建产物放入 Nix Store，就必须在沙箱中把作为构建产物的文件或目录移动或复制到 `$out`。没有被移动到 `$out` 的文件会在 realisation 结束时连同沙箱一起被丢弃。

realise 前面那个 store derivation 时，Nix 会在沙箱内执行 `/bin/sh -c "echo -n Hello > $out"`，从而把 `Hello` 这个字符串写入 `$out`。

## 真实软件包的 store derivation

前面举例的 store derivation 非常简单，真实软件包的情况要复杂得多。下面展示对 Nixpkgs 中收录的 GNU Hello 求值时生成的 store derivation。内容较长，这里折叠起来。

<details>
<summary>GNU Hello 的 store derivation</summary>

```json
{
  "/nix/store/9hxg3racppqcn970nbj5mk3a8qm9kss7-hello-2.12.1.drv": {
    "args": [
      "-e",
      "/nix/store/v6x3cs394jgqfbi0a42pam708flxaphh-default-builder.sh"
    ],
    "builder": "/nix/store/4bj2kxdm1462fzcc2i2s4dn33g2angcc-bash-5.2p32/bin/bash",
    "env": {
      "__structuredAttrs": "",
      "buildInputs": "",
      "builder": "/nix/store/4bj2kxdm1462fzcc2i2s4dn33g2angcc-bash-5.2p32/bin/bash",
      "cmakeFlags": "",
      "configureFlags": "",
      "depsBuildBuild": "",
      "depsBuildBuildPropagated": "",
      "depsBuildTarget": "",
      "depsBuildTargetPropagated": "",
      "depsHostHost": "",
      "depsHostHostPropagated": "",
      "depsTargetTarget": "",
      "depsTargetTargetPropagated": "",
      "doCheck": "1",
      "doInstallCheck": "1",
      "mesonFlags": "",
      "name": "hello-2.12.1",
      "nativeBuildInputs": "/nix/store/cg6y5cyhfdkb6pqiqjvrr7g9gy93by7h-version-check-hook",
      "out": "/nix/store/39z5zpb72qrnxl832nwphcd4ihfhix3j-hello-2.12.1",
      "outputs": "out",
      "patches": "",
      "pname": "hello",
      "postInstallCheck": "stat \"${!outputBin}/bin/hello\"\n",
      "propagatedBuildInputs": "",
      "propagatedNativeBuildInputs": "",
      "src": "/nix/store/pa10z4ngm0g83kx9mssrqzz30s84vq7k-hello-2.12.1.tar.gz",
      "stdenv": "/nix/store/hix7sl0wxajb5aq14afjdvzc3w0i8b14-stdenv-linux",
      "strictDeps": "",
      "system": "x86_64-linux",
      "version": "2.12.1"
    },
    "inputDrvs": {
      "/nix/store/1pmgv5n6qr9b96jvhli7zj0fs6vmaz9p-version-check-hook.drv": {
        "dynamicOutputs": {},
        "outputs": ["out"]
      },
      "/nix/store/2miv8n4k7nram4qnbjfjcg400dzkzcdg-bash-5.2p32.drv": {
        "dynamicOutputs": {},
        "outputs": ["out"]
      },
      "/nix/store/8fpibqm1vvfdgmm7ba13wbanpv6pg4hb-hello-2.12.1.tar.gz.drv": {
        "dynamicOutputs": {},
        "outputs": ["out"]
      },
      "/nix/store/h7lm4p6i89k48q8qqcl02z0g4sqwzh5v-stdenv-linux.drv": {
        "dynamicOutputs": {},
        "outputs": ["out"]
      }
    },
    "inputSrcs": [
      "/nix/store/v6x3cs394jgqfbi0a42pam708flxaphh-default-builder.sh"
    ],
    "name": "hello-2.12.1",
    "outputs": {
      "out": {
        "path": "/nix/store/39z5zpb72qrnxl832nwphcd4ihfhix3j-hello-2.12.1"
      }
    },
    "system": "x86_64-linux"
  }
}
```

</details>

首先，`builder` 中指定的是 bash 的 Store 路径，`args` 中也包含了一个 shell 脚本文件的 Store 路径。而在前面例子中为空的 `inputDrvs`，这里指定了若干 store derivation，它们是构建该软件包时所需的依赖。
另外 `env` 中指定了大量环境变量。特别值得注意的是 `src`，这里指定的是 GNU Hello 源码（tarball）的 Store 路径。

只用 derivation 函数来生成这样复杂的 store derivation 非常吃力，因此在实际的软件包构建中会使用 Nixpkgs 提供的 **stdenv** 这一工具。stdenv 对 derivation 函数做了封装，让你能够更直观地书写构建定义。详情将在 [_3.1. stdenv_](ch03-01-stdenv) 中讲解。

## Import From Derivation

在 Nix 语言中可以创建依赖于 store 对象的值。当通过 `import`、`readFile` 等特定内置函数读取 store 对象时，就会发生 **Import From Derivation**（**IFD**）。

---

我们先把刚才 realise 出来的 store 对象删掉。

```bash :删除store对象
$ nix store delete /nix/store/z4j03hs3qk7a3cbiwglgys2cz61pbi6s-hello-txt
1 store paths deleted, 0.00 MiB freed
```

> `nix store delete` 会执行「安全删除^[为了不引发依赖关系上的不一致，它会判断该路径是否被其他软件包引用。Nix 用数据库来管理软件包之间的依赖关系，当软件包数量庞大时，分析会比较耗时。]」，因此可能需要一些时间。

再创建一个新的 Nix 表达式。

```nix :IFD.nix
let
  drv = import ./drv.nix;
in
builtins.readFile drv.outPath
```

把 `drv.nix` 读入 `drv` 变量。

`drv.outPath` 所指的文件我们刚刚已经删除了，所以即便 derivation 函数生成了 store derivation，只要不 realise，`drv.outPath` 指向的 Store 路径上就不存在文件，`readFile` 理应失败。我们来求值看看。

```bash :对drv.nix求值
$ nix eval --file ./IFD.nix
"Hello"
```

竟然成功了。

这并不是错误行为。在 Nix 表达式求值过程中，一旦遇到需要访问 store 对象的场景，Nix 会自动 realise 相应的 store derivation。这就叫做 **IFD**。

IFD 只在通过以下内置函数访问 Store 路径时才会发生。它们都是会访问文件系统的函数。

- **import**
- **readFile**
- readFileType
- readDir
- pathExists
- filterSource
- path
- hashFile
- scopedImport

发生 IFD 时，Nix 会暂时中断 Nix 表达式的求值，等待目标的 realise（构建执行）完成。
例如，如果 realise 的目标是一个构建时间很长的软件包，那么 Nix 表达式的求值时间也会相应地延长。此外，如果 IFD 过程中 realisation 失败，Nix 表达式的求值也会随之失败。

这个概念稍微有点难，看看官方参考手册中的示意图也许更容易理解。

https://nix.dev/manual/nix/2.20/language/import-from-derivation#illustration

## Derivation 类型

为方便起见，我们把 derivation 函数返回的 AttrSet 称为 Derivation 类型。Derivation 类型不同于普通的 AttrSet，会受到以下特殊待遇：

1. 应用 `toString` 会返回 Store 路径
2. 用 `"${}` 嵌入字符串时，会被转换成 Store 路径字符串
3. 应用以 String 类型为参数的内置函数时，会被当作 Store 路径字符串来应用
4. 应用以 Path 类型为参数的内置函数时，会被当作 Store 路径来应用

Derivation 类型在实际的构建表达式中随处可见，想必正是出于便利性的考虑才设计成这样的行为。

<details>
<summary>严格来说并不是「类型」</summary>

静态类型语言中的「类型」，是根据程序构成要素（变量、函数等）所计算出的值的种类对其进行分类的概念，由类型检查器来验证。

而动态类型语言的「类型」，则是运行时在执行过程中赋予值的标签。Nix 语言确实有判定这类类型的内置函数（例如 `isNumber`/`isFloat`/`isAttrs`），但并不存在 `isDerivation` 函数。严格来说并不存在「Derivation 类型」这种类型，它只是一个带有特定 attribute 的 AttrSet 而已。

这只是本书为了讲解顺畅而自创的权宜叫法，Nix 语言的官方文档中并不会出现「Derivation 类型」这一说法，请注意。

</details>

### 1. toString 与 Derivation 类型

通常对 AttrSet 应用 `toString` 函数时，只要不存在 `__toString` attribute 就会报错；而 Derivation 类型则不会报错，会返回转换成字符串的 `outPath`。

```bash
nix-repl> drv = import ./drv.nix

nix-repl> drv.outPath
"/nix/store/z4j03hs3qk7a3cbiwglgys2cz61pbi6s-hello-txt"

nix-repl> builtins.toString drv
"/nix/store/z4j03hs3qk7a3cbiwglgys2cz61pbi6s-hello-txt"
```

### 2. 字符串嵌入与 Derivation 类型

与 `toString` 一样，嵌入的是转换成字符串的 `outPath`。

```bash
nix-repl> drv = import ./drv.nix

nix-repl> drv.outPath
"/nix/store/z4j03hs3qk7a3cbiwglgys2cz61pbi6s-hello-txt"

nix-repl> "${drv}"
"/nix/store/z4j03hs3qk7a3cbiwglgys2cz61pbi6s-hello-txt"
```

### 3. 以 String 类型为参数的内置函数与 Derivation 类型

`stringLength` 函数接收一个 String 并返回其长度。对 Derivation 类型应用它，返回的是转换成字符串的 `outPath` 的长度。

```bash
nix-repl> drv = import ./drv.nix

nix-repl> builtins.stringLength drv.outPath
53

nix-repl> builtins.stringLength drv
53
```

### 4. 以 Path 类型为参数的内置函数与 Derivation 类型

会直接应用到 `outPath` 上。

```bash
nix-repl> drv = import ./drv.nix

nix-repl> builtins.readFile drv.outPath
"Hello"

nix-repl> builtins.readFile drv
"Hello"
```

## Nix 语言真的「纯粹」吗？

IFD 的存在意味着 Nix 语言的求值依赖于 realisation（构建的执行）。

乍看之下，语言的求值依赖软件包构建似乎有问题，但那是在构建不具备确定性的前提下才成立。Nix 的构建系统是确定性的，必定返回相同的结果。Nix 语言求值的确定性与构建的确定性是一体两面的。

另外，Nix 语言无法直接接触 store derivation，instantiation 和 IFD 这类对 Nix Store 的写入操作都被隐藏在 Nix 语言的接口之外。从 Nix 语言的视角来看，store derivation 和 IFD 属于低层世界的事情；而 Nix 语言这一高层抽象世界，在设计上就是要让它看起来是纯粹的。

## 参考

https://nix.dev/manual/nix/2.22/language/derivations

https://nix.dev/manual/nix/2.22/language/import-from-derivation
