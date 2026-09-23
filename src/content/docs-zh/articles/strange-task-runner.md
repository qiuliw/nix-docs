---
title: "Vite+ 的异常任务运行器：vite-task 是如何消除缓存的手动依赖管理的"
description: "linux / rust / vite / viteplus"
order: 4
---

原标题《_Vite+ 的异常任务运行器 或：vite-task 是如何学会停止手动管理缓存依赖、转而自动捕获文件访问的_》^[本想取一个《奇爱博士》的戏仿标题，结果撞上了 Zenn 的文章标题字数限制。不甘心。]

---

前些日子，Vite+ 的 alpha 版终于发布了。在 oxc 生态的全面支持下，一整套高速的原生实现工具链集结完毕，开发者社区也为之沸腾。
我也在本地把工作中负责的项目替换成了 Vite+，结果就是 **_vp 快得离谱！干脆把那些慢吞吞的家伙全都换成 Vite+ 吧！_** 这种心情。

在这样的 Vite+ 中，混在 Rolldown、oxlint、oxfmt 之间，还藏着一个做法相当有意思的工具，那就是 **vite-task**。

## vite-task：从缓存的手动依赖管理中解放出来

[vite-task](https://github.com/voidzero-dev/vite-task) 属于 [Turborepo](https://turborepo.dev/)、[Wireit](https://github.com/google/wireit) 这类面向 monorepo 的任务运行器。

https://github.com/voidzero-dev/vite-task

vite-task 最大的特点在于，与既有的任务运行器不同，它不需要手动管理作为缓存键的文件。

这是什么意思呢？像 Turborepo 这类以大规模项目使用为前提设计的任务运行器，为了高效地对项目进行静态检查和构建，都内置了缓存机制。对于 monorepo 中多个包里没有发生变更的那些，跳过静态检查和构建，复用缓存中保存的上次执行结果，以此节省时间。

不过，这类缓存机制在运维上有一个难点：任务执行结果的可复现性必须由开发者自己正确地来保证。例如在 Turborepo 或 Wireit 中，需要把会左右该任务执行结果的文件（源代码、静态资源以及其他）写进配置文件^[当然，也并非事无巨细都得由开发者显式指定，它们在一定程度上会隐式地捕获作为缓存依赖的文件。]。如果写漏了，就会用到错误的缓存；反之指定得过于宽泛，缓存命中率又会下降。

vite-task 用「自动捕获由 vite-task 启动的进程所读取的文件，并将其用作缓存键」这一方式解决了该问题。

## fspy

vite-task 和 Vite+ 工具链的其他成员一样，也是 Rust 实现。追踪进程所访问文件的机制被拆分到了名为 [fspy](https://github.com/voidzero-dev/vite-task/tree/main/crates/fspy) 的 crate 中。fspy 带有用于验证行为的 CLI，我们把 vite-task 克隆下来运行看看。

> 为了简化讨论，以下若无特别说明，均以 Linux 为前提展开。命令示例使用下面的 Dockerfile，在 aarch64-darwin 的 Docker 上执行。
> 
> <details>
> <summary>Dockerfile</summary>
> 
> ```Dockerfile
> FROM debian:bookworm-slim
> 
> RUN apt-get update && apt-get install -y \
>   curl \
>   git \
>   build-essential \
>   pkg-config \
>   libssl-dev \
>   ca-certificates \
>   musl-tools \
>   && rm -rf /var/lib/apt/lists/*
> 
> # Install rustup (nightly version is picked up from rust-toolchain.toml in the repo)
> RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain none
> ENV PATH="/root/.cargo/bin:$PATH"
> 
> WORKDIR /workspace
> 
> RUN git clone https://github.com/voidzero-dev/vite-task .
> 
> # Install the toolchain specified in rust-toolchain.toml
> RUN rustup show active-toolchain || rustup toolchain install
> 
> # Add musl target matching the host arch (required by fspy's artifact dependency on fspy_test_bin)
> RUN case "$(uname -m)" in \
>       aarch64) rustup target add aarch64-unknown-linux-musl ;; \
>       x86_64)  rustup target add x86_64-unknown-linux-musl ;; \
>     esac
> 
> # .cargo/config.toml uses zigcc wrappers intended for non-Linux hosts.
> # On native Linux, musl-gcc can link musl targets directly, so replace them.
> RUN printf '#!/bin/sh\nexec musl-gcc -fno-sanitize=all "$@"\n' \
>       > .cargo/zigcc-aarch64-unknown-linux-musl \
>     && printf '#!/bin/sh\nexec musl-gcc -fno-sanitize=all "$@"\n' \
>       > .cargo/zigcc-x86_64-unknown-linux-musl \
>     && chmod +x .cargo/zigcc-aarch64-unknown-linux-musl .cargo/zigcc-x86_64-unknown-linux-musl
> 
> # Pre-fetch dependencies to make subsequent builds faster
> RUN cargo fetch
> 
> CMD ["bash"]
> ```
> 
> </details>
> 
> 先从追踪 `cat` 开始。
> 
> ```bash
> # 用 fspy 追踪 `cat ./package.json`
> cargo run -p fspy --example cli -- -o - cat ./package.json
> ```
> 
> 上半部分是 `cat` 的正常输出，下半部分是 fspy 捕获到的文件列表。可以看到对 `package.json` 的读取被捕获了。
> 
> ```:输出结果
> # cat 的输出结果省略
> """/workspace/./package.json""",AccessMode(READ)
> """/usr/bin/cat""",AccessMode(READ)
> """/usr/bin/cat""",AccessMode(READ)
> ```
> 
> 再看看如果从被追踪对象进一步启动子进程会怎么样。
> 
> ```bash
> # 用 fspy 追踪 `bash -c 'cat ./package.json'`
> cargo run -p fspy --example cli -- -o - bash -c 'cat ./package.json'
> ```
> 
> 从 `"""/workspace/./package.json""",AccessMode(READ)` 可以看出，这次同样捕获到了对 `package.json` 的读取。
> 
> ```:输出结果
> # cat 的输出结果省略
> """/workspace""",AccessMode(READ)
> """/workspace/.""",AccessMode(READ)
> """/workspace""",AccessMode(READ)
> """/workspace/.""",AccessMode(READ)
> """/root/.cargo/bin/cat""",AccessMode(READ)
> """/usr/local/sbin/cat""",AccessMode(READ)
> """/usr/local/bin/cat""",AccessMode(READ)
> """/usr/sbin/cat""",AccessMode(READ)
> """/usr/bin/cat""",AccessMode(READ)
> """/usr/bin/cat""",AccessMode(READ)
> """/usr/bin/cat""",AccessMode(READ)
> """/usr/bin/cat""",AccessMode(READ)
> """/usr/bin/cat""",AccessMode(READ)
> """/usr/bin/cat""",AccessMode(READ)
> """/usr/bin/cat""",AccessMode(READ)
> """/workspace/./package.json""",AccessMode(READ)
> """/usr/bin/bash""",AccessMode(READ)
> """/usr/bin/bash""",AccessMode(READ)
> ```
> 
> ## fspy 的机制该如何实现
> 
> 看起来只要能监视进程、捕获与文件访问相关的系统调用就可以了。
> 
> ### ptrace(2)
> 
> https://man7.org/linux/man-pages/man2/ptrace.2.html
> 
> ptrace 是一个系统调用，用于让某个进程（"tracer"）监视被追踪的进程（"tracee"），追踪其系统调用等行为。
> 学习系统调用时，会以 `strace` 命令的形式实际用到的就是它。
> 
> 这应该是最朴素的方法，但由于每次系统调用都要经历
> 
> 1. 暂停 tracee 进程
> 2. 上下文切换到 tracer 进程
> 3. 处理完成后，恢复 tracee 进程
> 
> 这几个步骤，会产生致命的开销。一用就变慢的任务运行器，那连缓存都谈不上了，所以这个方案在本例中似乎并不合适。
> 
> ### seccomp(2)
> 
> https://man7.org/linux/man-pages/man2/seccomp.2.html
> 
> 既然 ptrace 是因为监视所有系统调用才慢得要死，那只监视自己关心的系统调用不就好了嘛——能实现这一点的就是 seccomp 系统调用。
> 
> seccomp（Secure Computing Mode）是 Linux 内核的安全功能之一，可以限制某个进程发起的系统调用。它作为沙箱化机制，被用在容器运行时等场景中。
> 
> seccomp 有一个叫 `SECCOMP_RET_USER_NOTIF` 的模式。在该模式下，当指定的系统调用被发起时，会暂停目标进程并通知事先指定的用户空间监视进程，在那里决定是否允许该系统调用。也就是说，用它就能实现类似「只针对特定系统调用的 ptrace」。虽然仍存在与 ptrace 同构的开销，但由于只在部分系统调用上产生，尚且可以接受。
> 
> 当后面要讲的主力方案不可用时，fspy 就会辅助性地使用 seccomp 来捕获系统调用。与 seccomp 的绑定被拆分到了名为 `fspy_seccomp_unotify` 的 crate 中。
> 
> https://github.com/voidzero-dev/vite-task/tree/main/crates/fspy_seccomp_unotify
> 
> #### 闲话：eBPF
> 
> seccomp 的过滤器是以 Berkeley Packet Filter（BPF）的形式编写的。而对 BPF 进行功能扩展、使其能编写更灵活程序的，就是 eBPF（extended Berkeley Packet Filter）。
> 
> 作为外行我曾想：用 eBPF 的话不就能把各种处理都闭合在内核空间、从而减少上下文切换了吗？但执行 eBPF 需要特权，因此在本例中并不合适（这不是废话嘛）。另外，eBPF 基本上是只读的，而后述手法需要拦截 `execve` 并向子进程注入 `LD_PRELOAD` 环境变量，所以即便采用了 eBPF，看来也需要一套混合方案。
> 
> ## vite-task 的解法：hook libc
> 
> 前述手法的思路都是「直接拦截系统调用」。但那样总归会产生开销。
> 
> 于是 vite-task 采取的做法是「拦截 libc 的函数调用」。
> 世上大多数软件都是经由 libc 发起系统调用的。因此其策略是：在用户空间内拦截这一层，从而在没有 seccomp 方式那种开销的前提下实现文件访问的追踪。
> 
> ### 通过 LD_PRELOAD 加载共享库
> 
> `LD_PRELOAD` 是 Linux 动态链接器使用的环境变量，它会让进程启动时优先于其他库加载该环境变量所指定的共享库。
> vite-task 中有一个名为 `fspy_preload_unix` 的 crate，实现了面向 Linux 和 macOS 的共享库，其中定义了与待追踪的 libc 函数同名的函数。由于链接器优先使用先加载的库，这样就能截获对 libc 的调用。
> 
> https://github.com/voidzero-dev/vite-task/blob/main/crates/fspy_preload_unix
> 
> 我们以 `open()` 函数为例看一下。`open()` 是调用 [open(2)](https://man7.org/linux/man-pages/man2/open.2.html) 系统调用来打开文件（获取文件描述符）的函数。
> 
> https://github.com/voidzero-dev/vite-task/blob/63f07330e8037b0504f830367eadf80a05026877/crates/fspy_preload_unix/src/interceptions/open.rs#L28-L41
> 
> 最终它还是会调用原本的 libc 函数（`open::original()`）。这个共享库的目的终究只是透明地进行追踪。
> 
> 在这种方式下，fspy 会把「某个任务的进程以何种模式（`READ`、`WRITE`、`READ_DIR`）访问了哪个路径」的日志（[定义](https://github.com/voidzero-dev/vite-task/blob/63f07330e8037b0504f830367eadf80a05026877/crates/fspy_shared/src/ipc/mod.rs#L37-L42)）在进程内写入共享内存，任务完成后再一次性读取。这套机制不需要运行时的协作，因此不会像 seccomp 方式那样阻塞进程，也不会发生上下文切换。
> 
> ### 子进程的追踪
> 
> 对于任务运行器直接执行的进程似乎没有问题，但如果从该进程又启动了子进程会怎么样呢？
> 
> fspy 同样会拦截 libc 的 exec 系列函数。例如 `execve()` 函数（对应 [execve(2)](https://man7.org/linux/man-pages/man2/execve.2.html) 系统调用）会调用 `handle_exec()`。
> 
> https://github.com/voidzero-dev/vite-task/blob/63f07330e8037b0504f830367eadf80a05026877/crates/fspy_preload_unix/src/interceptions/spawn/exec/mod.rs#L56-L67
> 
> 顺着往下看会发现，这里和任务运行器最开始启动进程的地方一样，也进行了 `LD_PRELOAD` 的设置。因此，fspy 能够递归地追踪整棵进程树。
> 
> ### 静态链接的情况
> 
> 理所当然地，这一手法对不动态链接 libc 的静态链接二进制（例如 Go 编译出的二进制）是不适用的。当 execve 了一个未动态链接 libc 的二进制时，就会使用 seccomp 作为兜底方案。
> 
> https://github.com/voidzero-dev/vite-task/blob/63f07330e8037b0504f830367eadf80a05026877/crates/fspy_shared_unix/src/spawn/linux/mod.rs#L35-L46
> 
> ## 小结
> 
> 兴趣关注点从高层逐渐转向底层，这是软件工程师常有的事；而最近 JS 生态中原生实现的工具链越来越多，从 Web 前端直接跳进那些领域的机会也随之增加了。挺有意思的。
> 
> 尤其是 vite-task，它的内容与 JS 相关工具链中常见的解析器、编译器话题不同，主要是更贴近 OS 的技术领域，让我相当兴奋（~~不过这跟 Web 没啥关系吧？~~）。
> 
> 另外，笔者并非特别具备 OS 或底层知识，本文基本上是以教科书级别的 OS 知识为基础一路查证写成的，若有谬误还请指正。
> 
> vite-task 的这套机制运转在相当厉害的原理之上，实际使用时确实也有让人心里发怵的地方；但个人认为，只要能从缓存依赖的手动管理中解放出来，那就完全 welcome，所以今后也会持续关注它的动向以及实际运用中的经验（完）
> 
> ---
> 
> 通宵到凌晨五点左右时，我一时冲动喊着「vite-task 太有意思了！」就开始写这篇文章，幸好敝司是全弹性工作制，得救了。敝司正在积极招募「一时冲动就写技术文章」的人。
> 
> https://herp.careers/v1/herpinc/9tYFbxcUPSEP?utm_source=zenn&utm_medium=article&utm_content=0btjuys30w
> 
> https://herp.careers/v1/herpinc/-Z20OVrOz6m8?utm_source=zenn&utm_medium=article&utm_content=0btjuys30w
> 
> 还有，我擅自换成 Vite+ 拿来玩的那个产品在这里。
> 
> https://lp.herp.cloud/ai-recruiter
