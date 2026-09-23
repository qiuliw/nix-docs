---
title: "　§3. 用 devShell 搭建开发环境"
description: "　§3. 用 devShell 搭建开发环境"
order: 13
---

终于要学习 Nix 的正经用法了。让我们用**开发 shell（devShell）**来搭建开发环境。

## 试用 devShell

创建 `flake.nix`。这次要用到 outputs 的 `devShells` attribute。

```nix :flake.nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [ pkgs.cowsay ];
        };
      }
    );
}
```

用 `nix develop` 启动它。

```bash :启动devShell
$ cowsay
cowsay: command not found

$ nix develop

[Nixシェル]$ cowsay meow
 ______
< meow >
 ------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||

[Nixシェル]$ exit

$ cowsay
cowsay: command not found
```

会启动一个把 `cowsay` 加入了 PATH 的 bash。

`nix shell` 是在命令行上指定软件包，而 `nix develop` 则是把 `flake.nix` 中描述的软件包引入 Nix shell。也就是说，可以声明式地搭建开发环境。

## mkShell 函数

`pkgs.mkShell` 是用于配置 Nix shell 的函数。

```nix
mkShell {
  packages = <導入したいパッケージのList>;
  shellHook = <シェル起動時に実行したいスクリプト>;
}
```

如果你用的不是 Bash，可以借助 `SHELL` 环境变量来启动自己平时使用的 shell。

```diff nix :摘自flake.nix
devShells.default = pkgs.mkShell {
  packages = with pkgs; [ cowsay ];
+ shellHook = ''
+   $SHELL
+ '';
};
```

另外，mkShell 函数返回的是 Derivation 类型。我们把 `devShells` 换成 `packages` 试着构建一下。

```diff nix :摘自flake.nix
-devShells.default = pkgs.mkShell {
+packages.default = pkgs.mkShell {
   # 省略
 };
```

```bash :构建
$ nix build
$ cat result
# シェルスクリプトが表示される
```

<details>
<summary>`result` 的内容</summary>

```bash
------------------------------------------------------------
 WARNING: the existence of this path is not guaranteed.
 It is an internal implementation detail for pkgs.mkShell.
------------------------------------------------------------

declare -x AR="ar"
declare -x AS="as"
declare -x CC="gcc"
declare -x CONFIG_SHELL="/nix/store/4bj2kxdm1462fzcc2i2s4dn33g2angcc-bash-5.2p32/bin/bash"
declare -x CXX="g++"
declare -x GZIP_NO_TIMESTAMPS="1"
declare -x HOME="/homeless-shelter"
declare -x HOST_PATH="/nix/store/w1iq3315z63558j04gnlzdd2yk1v1hfz-coreutils-9.5/bin:/nix/store/ajymwgc23snyw48wvkapw4qjggsi2vbw-findutils-4.10.0/bin:/nix/store/frx30r9405q0d4jfxnf969mgq4q8rjk2-diffutils-3.10/bin:/nix/store/d58flzaagmfb5pyvmknly4cnws45nc80-gnused-4.9/bin:/nix/store/7adzfq6lz76h928gmws5sn6nkli14ml6-gnugrep-3.11/bin:/nix/store/wab5wlc7rrn58z6ay4ls42av4n8rlqia-gawk-5.2.2/bin:/nix/store/k11rxbj9mvpgfk15rriqjn97by18r2xk-gnutar-1.35/bin:/nix/store/ybpxfq146szbqv8xxlc7ixnj9k6l1y5d-gzip-1.13/bin:/nix/store/07lm36zpghw8i9spwbcgkwzisw22k1kn-bzip2-1.0.8-bin/bin:/nix/store/nkza13k6khbmm7z2j6vj40k7081w6c9q-gnumake-4.4.1/bin:/nix/store/4bj2kxdm1462fzcc2i2s4dn33g2angcc-bash-5.2p32/bin:/nix/store/rr31bwb0jym6mgspqp54wdydr94skqvc-patch-2.7.6/bin:/nix/store/1idcyg3ldcggjzfznb5klr7b2wa1vznf-xz-5.6.2-bin/bin:/nix/store/2cqhdkxl71p1afk02g34hm3mbzwb8h1a-file-5.45/bin"
declare -x LD="ld"
declare -x NIX_BINTOOLS="/nix/store/qrw9mznq4p1135k53aa5g9saz229srf4-binutils-wrapper-2.42"
declare -x NIX_BINTOOLS_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu="1"
declare -x NIX_BUILD_CORES="12"
declare -x NIX_BUILD_TOP="/build"
declare -x NIX_CC="/nix/store/lbk30k56awz9vz9qpid93fkjns0xwlhd-gcc-wrapper-13.3.0"
declare -x NIX_CC_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu="1"
declare -x NIX_CFLAGS_COMPILE=" -frandom-seed=lr31gfg9m5"
declare -x NIX_ENFORCE_NO_NATIVE="1"
declare -x NIX_ENFORCE_PURITY="1"
declare -x NIX_HARDENING_ENABLE="bindnow format fortify fortify3 pic relro stackprotector strictoverflow zerocallusedregs"
declare -x NIX_LDFLAGS="-rpath /nix/store/lr31gfg9m5r8a3xmxwqw4sdv5kyyysl0-nix-shell/lib "
declare -x NIX_LOG_FD="2"
declare -x NIX_SSL_CERT_FILE="/no-cert-file.crt"
declare -x NIX_STORE="/nix/store"
declare -x NM="nm"
declare -x OBJCOPY="objcopy"
declare -x OBJDUMP="objdump"
declare -x OLDPWD
declare -x PATH="/nix/store/5y7yj7x2cfhn1062zimp57m1hyz701yx-cowsay-3.7.0/bin:/nix/store/ywz6s6bzap4x6yhg2lrx3ibqcnv051c7-patchelf-0.15.0/bin:/nix/store/lbk30k56awz9vz9qpid93fkjns0xwlhd-gcc-wrapper-13.3.0/bin:/nix/store/wl7xs26116sswgw18pnc3yw9r5gxr6hx-gcc-13.3.0/bin:/nix/store/mg27y4zq8j0m8dn83azqmq02xvfmsd9i-glibc-2.39-52-bin/bin:/nix/store/w1iq3315z63558j04gnlzdd2yk1v1hfz-coreutils-9.5/bin:/nix/store/qrw9mznq4p1135k53aa5g9saz229srf4-binutils-wrapper-2.42/bin:/nix/store/x7yyxvwy1f9hlx72rzrgx069jyf7hxwr-binutils-2.42/bin:/nix/store/w1iq3315z63558j04gnlzdd2yk1v1hfz-coreutils-9.5/bin:/nix/store/ajymwgc23snyw48wvkapw4qjggsi2vbw-findutils-4.10.0/bin:/nix/store/frx30r9405q0d4jfxnf969mgq4q8rjk2-diffutils-3.10/bin:/nix/store/d58flzaagmfb5pyvmknly4cnws45nc80-gnused-4.9/bin:/nix/store/7adzfq6lz76h928gmws5sn6nkli14ml6-gnugrep-3.11/bin:/nix/store/wab5wlc7rrn58z6ay4ls42av4n8rlqia-gawk-5.2.2/bin:/nix/store/k11rxbj9mvpgfk15rriqjn97by18r2xk-gnutar-1.35/bin:/nix/store/ybpxfq146szbqv8xxlc7ixnj9k6l1y5d-gzip-1.13/bin:/nix/store/07lm36zpghw8i9spwbcgkwzisw22k1kn-bzip2-1.0.8-bin/bin:/nix/store/nkza13k6khbmm7z2j6vj40k7081w6c9q-gnumake-4.4.1/bin:/nix/store/4bj2kxdm1462fzcc2i2s4dn33g2angcc-bash-5.2p32/bin:/nix/store/rr31bwb0jym6mgspqp54wdydr94skqvc-patch-2.7.6/bin:/nix/store/1idcyg3ldcggjzfznb5klr7b2wa1vznf-xz-5.6.2-bin/bin:/nix/store/2cqhdkxl71p1afk02g34hm3mbzwb8h1a-file-5.45/bin"
declare -x PWD="/build"
declare -x RANLIB="ranlib"
declare -x READELF="readelf"
declare -x SHELL="/nix/store/4bj2kxdm1462fzcc2i2s4dn33g2angcc-bash-5.2p32/bin/bash"
declare -x SHLVL="1"
declare -x SIZE="size"
declare -x SOURCE_DATE_EPOCH="315532800"
declare -x SSL_CERT_FILE="/no-cert-file.crt"
declare -x STRINGS="strings"
declare -x STRIP="strip"
declare -x TEMP="/build"
declare -x TEMPDIR="/build"
declare -x TERM="xterm-256color"
declare -x TMP="/build"
declare -x TMPDIR="/build"
declare -x TZ="UTC"
declare -x XDG_DATA_DIRS="/nix/store/5y7yj7x2cfhn1062zimp57m1hyz701yx-cowsay-3.7.0/share:/nix/store/ywz6s6bzap4x6yhg2lrx3ibqcnv051c7-patchelf-0.15.0/share"
declare -x __structuredAttrs=""
declare -x buildInputs=""
declare -x buildPhase=$'{ echo "------------------------------------------------------------";\n  echo " WARNING: the existence of this path is not guaranteed.";\n  echo " It is an internal implementation detail for pkgs.mkShell.";\n  echo "------------------------------------------------------------";\n  echo;\n  # Record all build inputs as runtime dependencies\n  export;\n} >> "$out"\n'
declare -x builder="/nix/store/4bj2kxdm1462fzcc2i2s4dn33g2angcc-bash-5.2p32/bin/bash"
declare -x cmakeFlags=""
declare -x configureFlags=""
declare -x depsBuildBuild=""
declare -x depsBuildBuildPropagated=""
declare -x depsBuildTarget=""
declare -x depsBuildTargetPropagated=""
declare -x depsHostHost=""
declare -x depsHostHostPropagated=""
declare -x depsTargetTarget=""
declare -x depsTargetTargetPropagated=""
declare -x doCheck=""
declare -x doInstallCheck=""
declare -x mesonFlags=""
declare -x name="nix-shell"
declare -x nativeBuildInputs="/nix/store/5y7yj7x2cfhn1062zimp57m1hyz701yx-cowsay-3.7.0"
declare -x out="/nix/store/lr31gfg9m5r8a3xmxwqw4sdv5kyyysl0-nix-shell"
declare -x outputs="out"
declare -x patches=""
declare -x phases="buildPhase"
declare -x preferLocalBuild="1"
declare -x propagatedBuildInputs=""
declare -x propagatedNativeBuildInputs=""
declare -x shell="/nix/store/4bj2kxdm1462fzcc2i2s4dn33g2angcc-bash-5.2p32/bin/bash"
declare -x shellHook=$'$SHELL\n'
declare -x stdenv="/nix/store/hix7sl0wxajb5aq14afjdvzc3w0i8b14-stdenv-linux"
declare -x strictDeps=""
declare -x system="x86_64-linux"
```

</details>

`result` 是一个 shell 脚本。`nix develop` 会启动一个未做任何配置的纯净 bash，并在启动时执行这个 shell 脚本。

## devShell 的优点

### 没有额外开销

devShell 只是启动一个普通的 shell，因此不会产生额外开销。

### 可以继续使用已有的工具

`PATH` 会原样继承 devShell 启动前的内容，因此已经安装的工具可以照常使用——这是 devcontainer 之类方案所不具备的优势。

### 开发环境的可复现性

能够直接享受到 Nix 的可复现性，这也是一大优势。只要连同 `flake.lock` 一起共享，即便多人协作开发，也能保证所用工具完全一致。此外，在 CI 中使用 devShell，还能消除开发环境与 CI 环境之间的差异。

### 运行时环境的版本管理

当你想对运行时环境做版本管理时，通常需要为每种运行时分别使用专用工具；而用 devShell 的话，只靠 Nix 就能全部搞定。下面以 Node.js 的版本管理为例。

```nix :使用Node.js 20
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        packages.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_20
            corepack
          ];
        };
      }
    );
}
```

虽说是版本管理，其实只是在 mkShell 函数中指定想用的版本的软件包而已。由于 Nix Store 中可以同时存在多个版本的软件包，这种事才能如此轻松地实现。

## direnv

使用 [direnv](https://github.com/direnv/direnv) 能获得极佳的开发者体验。

https://github.com/direnv/direnv

direnv 本身是一个与 Nix 无关的工具。它会监视放有 `.envrc` 文件的目录，当你进入该目录时，自动加载 `.envrc` 中写明的环境变量。

```bash :direnv的用法
$ mkdir ~/my-project
$ cd ~/my-project

$ echo 'export FOO=foo' > .envrc
.envrc is not allowed

$ direnv allow
direnv: loading ~/path/to/my-project/.envrc
direnv: export +FOO

$ echo $FOO
foo

$ cd ..
direnv: unloading

$ echo $FOO
# 何も表示されない
```

借助 [nix-direnv](https://github.com/nix-community/nix-direnv) 这个适配器，就可以用 direnv 来管理 devShell。

https://github.com/nix-community/nix-direnv

创建 `.envrc`，并写入 `use flake`。

```bash :nix-direnv的用法
$ echo 'use flake' > .envrc

$ direnv allow
direnv: loading ~/path/to/flake/.envrc
direnv: using flake
direnv: nix-direnv: Renewed cache
direnv: export +AR +AS +CC +CONFIG_SHELL +CXX +HOST_PATH +IN_NIX_SHELL +LD +NIX_BINTOOLS +NIX_BINTOOLS_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu +NIX_BUILD_CORES +NIX_CC +NIX_CC_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu +NIX_CFL
AGS_COMPILE +NIX_ENFORCE_NO_NATIVE +NIX_HARDENING_ENABLE +NIX_LDFLAGS +NIX_STORE +NM +NODE_PATH +OBJCOPY +OBJDUMP +RANLIB +READELF +SIZE +SOURCE_DATE_EPOCH +STRINGS +STRIP +__structuredAttrs +buildInputs +buildPhase +builder +cmakeFla
gs +configureFlags +depsBuildBuild +depsBuildBuildPropagated +depsBuildTarget +depsBuildTargetPropagated +depsHostHost +depsHostHostPropagated +depsTargetTarget +depsTargetTargetPropagated +doCheck +doInstallCheck +dontAddDisableDepTr
ack +mesonFlags +name +nativeBuildInputs +out +outputs +patches +phases +preferLocalBuild +propagatedBuildInputs +propagatedNativeBuildInputs +shell +shellHook +stdenv +strictDeps +system ~PATH ~XDG_DATA_DIRS

[Nixシェル]$ cowsay meow
 ______
< meow >
 ------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||

[Nixシェル]$ cd ..
direnv: unloading

$ cowsay
cowsay: command not found
```

使用 nix-direnv 之后，只要进入目录，devShell 就会自动启动。一旦配置好，就再也不用操心开发环境的切换了，非常方便。
