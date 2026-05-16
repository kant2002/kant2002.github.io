---
layout: post
title:  "Analysis of changes in the Bun codebase after the rewrite from Zig to Rust"
date:   2026-05-16 22:17:44 +0200
categories: en llm
comments: true
---

I was a bit carried away by the hype around rewriting Bun in Rust. I decided to see what that means in practice.

I won't draw any conclusions; I'll only highlight points that seem important to me and give numbers for discussion.

The commit where the changes happened is https://github.com/oven-sh/bun/commit/23427dbc12fdcff30c23a96a3d6a66d62fdc091d. To start, I quickly checked what happened with the tests. In the Bun repository I only see integration tests. These integration tests have the following characteristics.

<!--more-->

```
18,610 tests exist. The real number is probably several thousand higher, because I counted with grep, not at runtime.
1,546 files with test suites (i.e., where tests are described)
3,582 test groups (describe).
```

They also run tests from https://github.com/elysiajs/elysia. That is:

```
1,581 additional tests.
130 files with test suites (i.e., where tests are described)
151 test groups (describe).
```

In total `20,191` tests exist.

There were `630,690` lines of Zig (about 100 fewer before the rewrite). It became `899,067` lines of Rust.

This gives test coverage density:
- in Zig there was `1 test per 33 lines` of code
- in Rust it became `1 test per 44 lines` of code

For comparison, in NodeJS:

```
8,015 total tests exist.
1,026 files with test suites (i.e., where tests are described)
3,267 files that are tests themselves.
```

- `138,759` lines of JS
- `108,782` lines of C++

Total `247,541` lines of code.

Test coverage density `1 test per 30 lines`.

It's also necessary to consider that Bun is a runtime. When testing runtime reliability it's not enough to run the tests; it's also important that the runtime behaves correctly across all end products. This usually isn't an issue for application-level projects. For them it's more important to have integration tests only. What matters most is how many lines of code the runtime executes when running the specific tests of end products. The closest corporate example, in my view, is framework and platform teams with a very strict backward-compatibility policy for their products.

I also think that when changing an implementation you need many more tests than for ordinary product evolution, because during evolution you change less, and there's a smaller chance of a large number of unrecorded new behaviors that are unpleasant for end customers than with larger chunks of changes.

Whether this is enough to control 900,000 new lines in this product I leave for you to decide. Be cautious when trying to achieve similar results in your own project.