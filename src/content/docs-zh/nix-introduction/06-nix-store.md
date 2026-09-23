---
title: "Nix Store"
description: "Nix Store"
order: 6
---

**Nix Store（仓库）**与构建系统并驾齐驱，是 Nix 最重要的概念之一。
上一章我们学到，纯函数式的构建系统排除了隐式依赖。而 Nix Store 则把依赖关系以不可变、彼此分离的状态来管理，而不是共享可变状态，从而防止依赖冲突。

Nix Store 是 Nix 的软件包管理机构，其实体就是 `/nix/store` 这个目录。由 Nix 构建出来的一切都会被存放到 Nix Store 中。存放在 Nix Store 中的东西称为 **Store 对象**（**Store Object**）。

本部分将以 `curl` 为例，看看 Nix Store 是如何管理软件包的。

## Store 路径^[[4.3. Store Path - Nix Reference Manual](https://nixos.org/manual/nix/stable/store/store-path)]

笔者环境中的 `curl` 存放在以下路径：

```bash
/nix/store/dzs2chgxcwzpwplcw6wvv8nzkn01yr7y-curl-8.6.0-bin/bin/curl
```

它位于 `/nix/store` 之下这点没什么问题，但这个长长的文件路径究竟意味着什么呢？

Store 对象会被赋予一个以哈希作为标识符的文件路径，即 **Store 路径**（**Store Path**）。

```bash
dzs2chgxcwzpwplcw6wvv8nzkn01yr7y-curl-8.6.0-bin

# 哈希
dzs2chgxcwzpwplcw6wvv8nzkn01yr7y

# 软件包
curl-8.6.0-bin
```

`curl` 的 Store 对象具有如下目录结构：

```
/nix/store/dzs2chgxcwzpwplcw6wvv8nzkn01yr7y-curl-8.6.0-bin/
└── bin/
  └── curl
```

Store 路径中的哈希是根据构建输入生成的。
依赖关系、源代码、环境变量，等等……这些信息哪怕只差一个比特，生成的哈希也会完全不同。

![Nix 的构建与哈希计算](/images/nix-introduction/build-and-hash.png)

### 多个版本共存

通过哈希来区分软件包，是防止依赖冲突的非常有效的手段。下面列出笔者环境中存在的**所有** curl 软件包：

```
/nix/store/0mjq6w6cx1k9907vxm0k5pk7pm1ifib3-curl-8.4.0-bin
/nix/store/c58hy8bh832hd9m4hkslk71zl98g7h7n-curl-8.2.1-bin
/nix/store/dzs2chgxcwzpwplcw6wvv8nzkn01yr7y-curl-8.6.0-bin
/nix/store/j1yhiywlyh13ayzx46lzh7h1y7cq9p9c-curl-8.5.0-bin
/nix/store/vcvcpdn0bspcl722qkwp2s72wws9gw7s-curl-7.72.0-bin
/nix/store/x23aqwc39pp4zx5iiz0mqyh5mnvrz43z-curl-8.6.0-bin
```

`8.6.0`、`8.2.1` 等多个版本的 curl 共存在一起。通常情况下，更新软件包意味着覆盖旧版本。但在 Nix Store 中，只要软件包内容存在差异就会生成不同的 Store 路径，结果软件包会被放到不同的目录里，因此不会发生覆盖。Nix Store 中的软件包在被删除之前会永久地以不可变的方式存在。

等一下！不知为何有两个 `8.6.0` 版本的 curl。这是因为即使版本相同，构建时的选项、所依赖的软件包等这些版本之外用于确定软件包的要素也可能不同。哪怕只有极其微小的差别，Nix 也会把它们严格地当作不同的软件包区分开来。在 Nix 的软件包管理中，版本号只具有「方便人类理解」这种程度的意义。

## 依赖关系的管理

### 构建时依赖

Nix 指定构建输入时用的不是名称、版本这类模糊的东西，而是 Store 路径。由于哈希让软件包的依赖关系唯一确定，构建的可复现性得到了保证。再加上构建系统排除了隐式依赖，一棵完整的依赖关系树就此建立起来。

### 运行时依赖^[[9.3. Runtime dependencies - Nix Pills](https://nixos.org/guides/nix-pills/automatic-runtime-dependencies)]

我们已经知道 Nix Store 解决了软件包的构建时依赖，那么运行时依赖又是怎样的呢？

用 `ldd` 看看动态链接到 `curl` 上的共享库。

```bash
$ ldd $(which curl)
linux-vdso.so.1 (0x00007ffc009f8000)
libcurl.so.4 => /nix/store/wl49n8fs5vd1zcjwfyjvp7z78d9wxbhr-curl-8.6.0/lib/libcurl.so.4 (0x00007fa9a1c35000)
libssl.so.3 => /nix/store/lvdxawlh51yk1jxx5s0k67mxkil4kq35-openssl-3.0.13/lib/libssl.so.3 (0x00007fa9a1b87000)
libcrypto.so.3 => /nix/store/lvdxawlh51yk1jxx5s0k67mxkil4kq35-openssl-3.0.13/lib/libcrypto.so.3 (0x00007fa9a1600000)
libz.so.1 => /nix/store/bqwpsy99nbgp918w3mwn73jygm1i5ck4-zlib-1.3.1/lib/libz.so.1 (0x00007fa9a1b69000)
libc.so.6 => /nix/store/ksk3rnb0ljx8gngzk19jlmbjyvac4hw6-glibc-2.38-44/lib/libc.so.6 (0x00007fa9a1417000)
libnghttp2.so.14 => /nix/store/i5layvdnbjxlbgdb764pafq5rlm1bnfx-nghttp2-1.59.0-lib/lib/libnghttp2.so.14 (0x00007fa9a1b37000)
libidn2.so.0 => /nix/store/krqp9wj3rgalmqv04y0sqw987mxsnddn-libidn2-2.3.7/lib/libidn2.so.0 (0x00007fa9a1b06000)
libssh2.so.1 => /nix/store/kxban1v2m6d5zm3q95ivy7la7sjgj3kl-libssh2-1.11.0/lib/libssh2.so.1 (0x00007fa9a1ac0000)
libpsl.so.5 => /nix/store/vzr75ghvjw89wph6pp9ifipqvcwvdag6-libpsl-0.21.5/lib/libpsl.so.5 (0x00007fa9a1aaa000)
libgssapi_krb5.so.2 => /nix/store/mmccprkxbzn2iqn1rsj3lx32lcrgpg3j-libkrb5-1.21.2/lib/libgssapi_krb5.so.2 (0x00007fa9a13c3000)
libzstd.so.1 => /nix/store/bamq0s7n2hqmsnf7hyspc1xxrpsiy8y9-zstd-1.5.5/lib/libzstd.so.1 (0x00007fa9a12f3000)
libbrotlidec.so.1 => /nix/store/a7scr3ghdq6fh27a2azs417nsny6m50s-brotli-1.1.0-lib/lib/libbrotlidec.so.1 (0x00007fa9a1a9c000)
libdl.so.2 => /nix/store/ksk3rnb0ljx8gngzk19jlmbjyvac4hw6-glibc-2.38-44/lib/libdl.so.2 (0x00007fa9a1a97000)
libpthread.so.0 => /nix/store/ksk3rnb0ljx8gngzk19jlmbjyvac4hw6-glibc-2.38-44/lib/libpthread.so.0 (0x00007fa9a1a90000)
/nix/store/ksk3rnb0ljx8gngzk19jlmbjyvac4hw6-glibc-2.38-44/lib/ld-linux-x86-64.so.2 => /nix/store/cyrrf49i2hm1w7vn2j945ic3rrzgxbqs-glibc-2.38-44/lib64/ld-linux-x86-64.so.2 (0x00007fa9a1cf5000)
libunistring.so.5 => /nix/store/vqvbn2z8wyrjwvayjb2vy5krhh1kis9b-libunistring-1.1/lib/libunistring.so.5 (0x00007fa9a1142000)
libkrb5.so.3 => /nix/store/mmccprkxbzn2iqn1rsj3lx32lcrgpg3j-libkrb5-1.21.2/lib/libkrb5.so.3 (0x00007fa9a106b000)
libk5crypto.so.3 => /nix/store/mmccprkxbzn2iqn1rsj3lx32lcrgpg3j-libkrb5-1.21.2/lib/libk5crypto.so.3 (0x00007fa9a103c000)
libcom_err.so.3 => /nix/store/mmccprkxbzn2iqn1rsj3lx32lcrgpg3j-libkrb5-1.21.2/lib/libcom_err.so.3 (0x00007fa9a1a87000)
libkrb5support.so.0 => /nix/store/mmccprkxbzn2iqn1rsj3lx32lcrgpg3j-libkrb5-1.21.2/lib/libkrb5support.so.0 (0x00007fa9a102e000)
libkeyutils.so.1 => /nix/store/fjb02lzkzribw57bk9a5c89xaznlm5p7-keyutils-1.6.3-lib/lib/libkeyutils.so.1 (0x00007fa9a1a80000)
libresolv.so.2 => /nix/store/ksk3rnb0ljx8gngzk19jlmbjyvac4hw6-glibc-2.38-44/lib/libresolv.so.2 (0x00007fa9a101d000)
libm.so.6 => /nix/store/ksk3rnb0ljx8gngzk19jlmbjyvac4hw6-glibc-2.38-44/lib/libm.so.6 (0x00007fa9a0f3b000)
libbrotlicommon.so.1 => /nix/store/a7scr3ghdq6fh27a2azs417nsny6m50s-brotli-1.1.0-lib/lib/libbrotlicommon.so.1 (0x00007fa9a0f16000)
```

竟然全都指定了 Store 路径。Nix 不会去引用 `/usr/bin`、`/usr/lib` 这类全局文件路径，而是坚持指定各自唯一的 Store 路径。

Nix 的开发方还提供了 [patchelf](https://github.com/NixOS/patchelf) 这个补丁工具，用来修改可执行文件所链接的共享库的引用位置，可见其贯彻程度之彻底。

https://github.com/NixOS/patchelf

## 权衡

由于 Nix Store 会严格区分软件包，存储空间的消耗往往比较大。像这样因依赖关系而挤占存储空间，也被视为依赖地狱的一种表现。

虽然并不能完全解决存储空间的问题，但 Nix 通过**垃圾回收**（GC）这一自动删除不再需要的软件包的机制来应对它。详情将在「垃圾回收」一章中说明。
