---
title: "垃圾回收"
description: "垃圾回收"
order: 13
---

在 Profiles 中，相当于「卸载」的操作只是构建一个排除了目标符号链接的新 Profile，并不会删除软件包的实体，也就是 Store 对象。而且 Nix Store 的写入权限被 Nix 锁定，用户无法对其进行修改。那么 Store 对象究竟在什么时候才会被删除呢？

Nix 中不存在手动卸载。取而代之的是通过**垃圾回收（GC）**自动识别并删除不再需要的 Store 对象。

Nix Store 使用数据库来管理软件包的依赖关系。垃圾回收器会删除那些没有被任何 Profile 的任何世代所链接的 Store 对象。由于 Nix 掌握着完整的依赖关系树（Closure），因此垃圾回收不会导致依赖关系出现不一致。

我们还可以进行细致的调整，比如把早于某个世代的 Profile 连同其内容一并删除，或者只删除超过一定天数的内容等。

https://nixos.org/manual/nix/stable/package-management/garbage-collection
