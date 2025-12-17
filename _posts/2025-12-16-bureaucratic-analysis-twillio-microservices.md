---
layout: post
title:  "Bureaucratic analysis of Twilio Microservices journey"
date:   2025-12-16 15:57:44 +0500
categories: en dotnet
comments: true
---

We have a political discussion in our Ukrainian software architecture chat, and it usually tires people, so I bring [this](https://www.twilio.com/en-us/blog/developers/best-practices/goodbye-microservices) article from 2018 to divert attention. It was one of the first articles I found on well-known sources of boredom for software developers, like Hacker News, Lobsters, etc. Surprisingly, it was not very interesting to our taste, and I actually had to read it. Who could have guesses that you should read articles. That led to a good discussion about why microservices were probably not the problem. 

# Bureaucratic perspective

Since I happen to see how government procurement works, and what can cause organizational problems afterwards, the article was full of hints that show other kinds of problems, completely unrelated to those discussed in the article. I just cannot unsee them. These things are obviously not hard truths. Take it with a grain of salt, and use your own judgment. But please discuss how *exactly* organizational decisions affect technical work. I think that's a super important part of software architecture, which is not discussed often. 

<!--more-->

If you want to be a purely technical person, please understand that this article is not for you. It's probably for those who have been burned by organizational mistakes. It's more like tales than hard facts you can't prove unless you have a social sciences degree. I do not have one.

# Guesses

Below would go citations from article, and my interpretation of them. Make sure that you read the whole article to understand the context. Don't assume that I'm a trustworthy person. That's very important when speaking about organizational issues - everybody has *preferences*.

## Decision 1

```
Initially, when the destinations were divided into separate services, all of the code lived in one repo. **A huge point of frustration was that a single broken test caused tests to fail across all destinations.** When we wanted to deploy a change, **we had to spend time fixing the broken test even if the changes had nothing to do with the initial change**. In response to this problem, it was decided to break out the code for each destination into their own repos. All the destinations were already broken out into their own service, so the transition was natural.
```

What I read here is that the tests were fragile and probably depended on external services. So I see the decision was to ignore the reasons why tests were built in such a way, and why tests depend on each other. Obviously, splitting the system into smaller parts makes each part more accountable, but that does not solve the original problem, which is systemic. You just have no way to know about such problems since you don't run tests that affect the whole project—only subsystems are tested and integrated. In my opinion, you should perform root-cause analysis and not be satisfied with simple explanations like "tests fail because they're simply flacky."

If you have such an issue, then it's time to start doing proper build engineering, in my opinion.

## Decision 2

```
However, a new problem began to arise. **Testing and deploying changes to these shared libraries impacted all of our destinations.** It began to require considerable time and effort to maintain. Making changes to improve our libraries, knowing we’d have to test and deploy dozens of services, was a risky proposition. 
```

Okay. Here we go. What can go wrong if you create a shared library and don't want to maintain it as a *product*? God forbid you think that [Semantic Versioning](https://semver.org/) is a sensible way to evolve your system. Okay, I'm sorry for being too emotional, but SemVer can be bad for evolution. If you vendor, you push this onto your users; that's good for you - it cuts your costs and you don't pay for maintaining obscure old decisions. But if you are an end-user of your library, and use SemVer and, God forbid, create a breaking change, then you likely multiply your costs across the org. Instead of paying more into a library department, you pay across all teams that use your library.

So yeah, libraries come at a cost. Backward compatibility is super important for speed. We have C/C++/Java/C# ecosystems to prove that. If you religiously maintain backward compatibility, you need to pay less attention to the problem of `Making changes to improve our libraries, knowing we’d have to test and deploy dozens of services, was a risky proposition.` Obviously most orgs don't have that experience, but eventually you will know how to solve challenges which occurs pursuing backward compatibility. Don't change things on a whim is one strategy.

Look how [Decision 1](#decision-1) shifts money in solving problems from one place to another.
1. Initially there should be some form of investing in test infra or build infra.
2. Invent a library to cut corners (libraries are expensive), don't maintain backward compatibility, and pay dozens of times more for independent testing.
3. How is that different from fragile tests initially?

## Decision 3

```
When pressed for time, engineers would only include the updated versions of these libraries on a single destination’s codebase.
```

That's an easy one. If you have neglected a critical dependency and push people to reach business by any means, and nobody says stop, the system breaks. That may sound normal and part of doing business, but it shouldn't be. Less pressure helps prevent shipping changes in the library too quickly. There are a lot of things which can limit the amount of breakage if you slow things a bit. You can play the drum on your ship, but let people fix things. Rhythm should be steady, but people should not be exhausted. If people cannot allocate a couple of hours to update a dependency and run tests, probably something is off. Are you really into a death march? 

## Decision 4

```
Over time, the versions of these shared libraries began to diverge across the different destination codebases. The great benefit we once had of reduced customization between each destination codebase started to reverse. Eventually, all of them were using different versions of these shared libraries. 
```

That's probably related to [Decision 2](#decision-2) and [Decision 3](#decision-3) and a lack of time.

1. You create a library.
2. You don't have time to update it.
3. Because your library is not backward compatible, you have to pay for each upgrade not only in testing/validation/deployment, but in engineering and learning. Too expensive.

The divergence of versions is a lack of time and, consequently, money invested into the process. Underfunded processes break all the time, like machines without maintenance.

## Organizational structure and time

I would not doubt the final decision, but let's calculate how many team-months were passed between [Decision 2](#decision-2) when there were 50 destinations and [Final Decision](#final-decision) when there were 140 destinations. `The number of destinations continued to grow rapidly, with the team adding three destinations per month on average, which meant more repos, more queues, and more services.`

So we have 90 destinations added, which means 30 team-months. Here are approximations.

| Teams in Twilio | Time |
| - | - |
| 1 | 30 months = 2 year and 6 months |
| 2 | 15 months = 1 year and 3 months |
| 3 | 10 months |
| 4 | 8 months |
| 5 | 6 months |

This is approximate time when you have fire in your house, and pay for it.

## Final decision

```
Recall that the original motivation for separating each destination codebase into its own repo was to isolate test failures. However, it turned out this was a false advantage. Tests that made HTTP requests were still failing with some frequency. 
```

That's praise for Twilio! I do agree that the split was a false premise. It takes guts to say that on a corporate blog! Thank you! Really.

```
With destinations separated into their own repos, there was little motivation to clean up failing tests. This poor hygiene led to a constant source of frustrating technical debt. Often a small change that should have only taken an hour or two would end up requiring a couple of days to a week to complete.
```

I don't disagree; it's not a big deal to maintain things. What is a big deal is that if you have a library:

1. You should support people in periodically doing maintenance of your software.
2. Don't punish them for doing that in their free time.

I may understand that (1) is risky for business and may not always be applicable, but (2) usually happens when a person is tired of being burned and takes initiative. Unless you are an intern or a person who deeply cares, nobody bothers taking such risks. At least don't punish them. Please! It costs you, as you can see: in a minimum of 6 months it will bite you. Worse if it bites you in a year, and you will pay for all these small, almost invisible cuts across the lifetime of the product. 

## Microservices

[Decision 1](#decision-1) was probably made not on technical merits and without assessing risks. That's purely speculation on my part, but any senior person knows that fragile tests aren't fixed by organizational changes. You should fix problems where they are. So in my opinion the decision was made by one of the following situations:

- Leadership override to move fast
- Leadership wanted to be modern and jump on the microservices ship
- Technical management wanted to try microservices because it didn't see how to solve the problem with a monolithic architecture
- People get blinded by the marketing promises of microservices proponents

I'm not for a witch hunt. I use these examples only because they are common, not because I know someone in Twilio. These I think are reasonable guesses, and serve as guesses in our fashion-driven profession. This one decision cost the company some money. That's fine; everybody makes mistakes, but let's discuss how *technical* decisions cost orgs money.

# Conclusions

Obviously there are no conclusions, since I am making guesses. Take a look at these snippets purely from an organizational perspective and tell me where I'm wrong. Obviously I may be wrong somewhere.

But if any, I want to press two problems

- When we speak about software architecture, we don't speak about what kind of business it is. Not brand, but what staff size, what industry, how important that system to business.
- Also when we made technical decisions, money should be always on the table. You cannot be engineer without calculating money in my opinion.

All of that is not super trade secrets, business people speak about it all the time. You obviously should not go into details, but anything better then current "it depends" mindset.