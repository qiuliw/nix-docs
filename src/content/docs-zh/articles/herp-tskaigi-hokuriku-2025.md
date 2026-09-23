---
title: "TSKaigi Hokuriku 2025 现场参会报告"
description: "活动报告 / TypeScript / TSKaigi"
order: 1
---

大家好，我是 asa1984，在 [HERP](https://herp.co.jp/) 靠成天折腾 TypeScript 谋生。

前些日子，我作为赞助商参加了无人不晓的 TypeScript 大会 TSKaigi 的地方版：[TSKaigi Hokuriku 2025](https://hokuriku.tskaigi.org/)。

![蓝色粗边框内是白色背景的长方形卡片。左上角是 TSKaigi Hokuriku 2025 的标志，中央是 HERP 的标志，中央下方第一行写着株式会社HERP，第二行写着 Silver，右下角排列着三个蛋形的吉祥物。](/images/herp-tskaigi-hokuriku-2025/sponsor-herp.jpeg)

这是一场相当不错的大会，所以我想一边介绍几场有意思的演讲，一边报告一下现场的情况。

## 演讲介绍

下面凭个人主观偏好，挑选几场在现场听到的演讲来介绍。

### TypeScript 6.0 中将废弃的那些选项

https://speakerdeck.com/uhyo/typescript-6-dot-0defei-tui-jiang-hua-sareruopusiyontati

这是 [uhyo](https://zenn.dev/uhyo) 的主题演讲。
TypeScript 为了迎接 7.0（tsgo）的发布，从 5.0 起就推进着废弃旧选项的运动，而本次演讲的内容，就是那些终于将在 6.0 中被移除的选项。

说到底 TypeScript 的选项本就繁多，浏览器与 Node.js 之间的鸿沟、TypeScript 草创期的自有规范等混沌的历史背景，又与向后兼容性的保障复杂地交织在一起；而这场演讲结合 TypeScript 今后的方向性，把这些都梳理讲解了一遍，实在是令人感激。

我是个被 ESM/CommonJS 折磨得够呛的人，而 6.0 中废弃了若干与模块相关的选项，其中竟然还有连 ESM/CommonJS 都算不上、我听都没听过的模块系统（`amd`、`umd`、`systemjs`），原来还有我不知道的混沌历史啊——这让我笑得不行。

另一方面，作为光明未来的消息，推进 ESM 的潮流似乎也来到了 TypeScript。`esModuleInterop` 选项被废弃并默认启用；此外（这是另一场演讲《追踪 `tsc --init` 设计思想的变化及其背景——从“教育性”取向转向重视实用性》^[这也是一场很有意思的演讲。]的内容）`tsc --init` 生成的 `tsconfig.json` 的默认设置，似乎也会改成以 ESM 为前提^[这项变更从 TS 5.9 起生效。]。
我个人是 [Move on to ESM-only](https://antfu.me/posts/move-on-to-esm-only) 的拥护者，所以对这个趋势喜闻乐见。

### 前端架构设计方法论：Feature-Sliced Design 介绍

https://speakerdeck.com/motikoma/tskaigi-hokuriku-2025-hurontoentoakitekutiyanoshe-ji-fang-fa-lun-feature-sliced-designnoshao-jie

这是 ASCEND 的赞助商 LT，内容是他们把前端架构迁移到了 **Feature-Sliced Design**（就是坊间常被称作 "features 目录"、按领域提高内聚度的那一套）。

最近敝司正在推进把 Cycle.js 这个 UI 框架迁移到 React，而我们正好感受到了同样的问题（Container 组件的膨胀）。听完这场 LT，我觉得 Cycle.js 向 React 的迁移，实质上也可以说是向 Feature-Sliced Design 的迁移。因为 Cycle.js 在其设计思想上，强制把状态管理和逻辑集中到相当于 Container 组件、靠近程序入口的那一部分。相比之下，React 志在分散治理式的设计^[这一点可以从 Meta 在组件设计中重视就近放置（colocation）看出来，比如 GraphQL 的 colocation、RSC 的 fetch 去重。]，因此比起 Cycle.js 自然而然地更接近 Feature-Sliced Design。

我目前参与开发的产品正是 React 加 Feature-Sliced Design，所以既有参考价值，又让我点头点到脖子快掉了。大家也一起用起来吧，Feature-Sliced Design。

### 「TS API 类型安全」的代价由谁来付？用混合策略终结不公平的 Schema 驱动

https://speakerdeck.com/hal_spidernight/tsnoapixing-an-quan-nodui-jia-hashui-kafu-u-bu-gong-ping-nasukimaqu-dong-nizhong-zhi-fu-woda-tuhaihuritutozhan-lue

这场演讲从「现在是否是该采用它的开发阶段？」「维护成本会怎样？」「开发流程要怎么做？」等视角切入，剖析了 schema 驱动开发。

我自己作为一个技术爱好者，看到关于技术选型与战略的分享时，往往容易只盯着手法本身；但真要落实到实际工作中，理解为何会采用该手法的上下文才更为重要。在这一点上，这场演讲从开发的利益相关者、目的与所需达成的共识、随阶段变化的权衡等角度梳理了 schema 驱动开发，内容非常实用且有参考价值。

我在交流会上和讲者聊过，据说幻灯片中出现的开发成本曲线，是真的基于故事点^[敏捷开发中用于估算用户故事等任务相对规模的单位。]计算出来的（厉害）。

### Building AI Agents with TypeScript

https://speakerdeck.com/izumin5210/building-ai-agents-with-typescript

这场演讲介绍了如何使用 [Vercel AI SDK](https://ai-sdk.dev/) 在 TypeScript 中构建 AI Agent。

敝司也在使用 AI SDK^[正活跃于 [HERP AI 招聘官](https://lp.herp.cloud/ai-recruiter)中。]，正如幻灯片所介绍的那样，它是一个非常方便的库，简单的聊天工具之类很快就能搭起来。

另一方面，演讲中也谈到：要实现多步执行的工作流或 agentic 的行为，并真正在生产环境中提供服务，就需要一套执行基础设施，使得即便把本身生成耗时又不稳定的 LLM、以及 LLM 调用的外部 API 组合在一起，也能把任务执行到底。这一点真的说到点子上了，敝司的产品 [HERP AI 招聘官](https://lp.herp.cloud/ai-recruiter) 也面临着同样的课题。

这场演讲介绍了 [vercel/workflow](https://vercel.com/docs/workflow)，作为一套 durable（中途崩溃也能重试扛住）且 resumable（可在任意时刻暂停并在之后恢复）的执行基础设施。

vercel/workflow 利用 Vercel 那套熟悉的 `use` 指令，让原本需要一边妥善处理任务队列一边实现的容错工作流，可以直接写成 TypeScript 函数。原理上和 Next.js 的 `"use client"`、`"use server"` 相同：打包器会对被标注的函数特殊对待，将其转换为可重试、可暂停的代码，再让它跑在能够持久化任务的执行基础设施^[vercel/workflow 把这套基础设施称为 `world`。这命名也太狂妄了！]之上。
虽然还是 beta 版，但作为一个思路有趣的库，我想今后继续关注它的走向。

顺带一提，敝司用来运行 AI 工作流的 durable 执行基础设施，用的是 [BullMQ](https://bullmq.io/) 这个库。

## 交流会

地方举办的好处在于，能和平时生活圈里很难有交集的人交谈，以及饭很好吃^[巨爽。]。能和金泽工业大学的学生，以及活跃在北陆、关西的各位聊天，非常开心。在众多技术活动都集中于东京的当下，这类地方举办的活动很是难得，我希望地方版的 TSKaigi 今后也能一直办下去。

另外，这虽然不算交流会，但大型大会在活动前一天或第二天，有时会在会场附近举办周边活动。这次我参加了 Findy 主办的 Drinkup，很推荐。

https://x.com/pika_findy/status/1992201633959391369

## 纯粹的其他

难得来一趟金泽，当然要观光一下，于是我去了 21 世纪美术馆。当时正在举办的展览很不错，推荐（据说会持续到 2026-03-15）。

https://www.kanazawa21.jp/data_list.php?g=65&d=1828

我一手拎着 TSKaigi Hokuriku 的周边帆布袋，在金泽市区闲逛了一圈。很多地方的内饰和建筑都做得很考究，让人感觉街景相当高级。仿佛在东京变得粗粝的心灵得到了净化。

![混凝土制的纪念碑。背景是楼房与蓝天。](/images/herp-tskaigi-hokuriku-2025/yuyo.jpg)
_金泽市建市百周年纪念事业纪念碑。有种共产主义国家会有的感觉。_

## 最后

总的来说是一场非常棒的大会。也非常希望大家都能来参加。

顺带一提，TSKaigi 2026 的举办似乎也已经定下来了（太好啦～！）

![写着「TSKaigi 2026 开办决定！！2026/5/22-23（两天） BELLESALLE 羽田机场」的幻灯片。](/images/herp-tskaigi-hokuriku-2025/tskaigi-hokuriku-2026.jpg)

---

**宣传环节**

最近，HERP 做出了把公司内部标准技术栈以 TypeScript 为中心的[决策](https://taketo957.hatenablog.com/entry/2025/09/02/125043)。例如我也参与开发的 [HERP AI 招聘官](https://lp.herp.cloud/ai-recruiter)，就是用 Bun + React + Hono RPC + Prisma 这套现代全栈 TypeScript 技术栈开发的。
为了今后能作为一家「认真搞 TypeScript」的公司持续活动下去，我们也希望积极参加这类大会来跟进技术，并为社区做出贡献。

进而，我们正在热烈招募「想认真搞 TypeScript」的人才，以及「我也想用公司的钱去参加 TSKaigi！」的人。请一定来看看！！！（也有[实习岗位](https://herp.careers/v1/herpinc/-Z20OVrOz6m8)哦）

https://herp.careers/v1/herpinc/9tYFbxcUPSEP?utm_source=zenn&utm_medium=article&utm_content=6xr7ti42z4

https://herp.careers/v1/herpinc/G5kBv3sKYPye?utm_source=zenn&utm_medium=article&utm_content=6xr7ti42z4
