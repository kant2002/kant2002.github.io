---
layout: post
title:  "Analysis of changes in the Bun codebase after the rewrite from Zig to Rust - Two month after"
date:   2026-07-20 22:19:00 +0200
categories: en llm
comments: true
---

Two month passed since Bun was rewitten to Zig. Last time [I look at Bun]({% post_url 2026-05-16-bun-pr-analysis-en %}) I try to get what's changed in source code. Today I decide to look at how stable Bun builds, and what I found was quite unexpected.

<!--more-->

So I thought I run couple GitHub API calls, extract all workflow runs and done with it. Not so easy. Bun's runs on BuildKite and this service is allergic to transparency. You can see only 4 pages of builds for selected parameters: See for yourself. https://buildkite.com/bun/bun/builds?branch=main

Technically I can filter by day and take date for each day and collect, but that's too much work for what can be described in plain words. If you look at builds on BuildKite, you will notice that Bun did not care about having all builds pass, and cancel a lot of builds for some reasons. Probably they cancel PR if new one lands main, but that's not obvious. Also that completely broke trust in the CI for me. When build fails, there no way to know what commit trigger failure. 

As I said, this looks like questionable practice for me. Why bother have indicator, if you ignore it? Why bother running CI jobs if you will reject them half way? Isn't we as community did that 10-15 years ago, because we want to ship faster, and then we stop doing that, since it's fragile? Does that means that Bun have budget for marketing stunts like rewrite, but don't have money to support new LLM-driven workflow? Isn't it obvious that if you produce more code, you need to run more validation checks, and that cost money? So speed is costly by itself.

Let's compare with Node.JS as last time. Since they run CI on GitHub, I can just call GitHub API and analyse the data. Starting from 1 April 2026, each week ~90% of CI runs succeed. Numbers do not fluctuate that much and sit around average. Clearly somebody doing build engineering for them.

Even if previously I do not have any conclusions, and maybe it is too early to say something about Bun, but what I see is that discipline which organization have around engineering practices is more important then what language project is written. **Bun - you are bad at promoting good engineering practices. Please do better.**