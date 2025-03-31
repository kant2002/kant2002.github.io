---
layout: post
title:  "Reflection on Evaluating Human Factors beyond likes of code."
date:   2024-11-25 16:48:44 +0600
categories: en programming-languages
comments: true
use_math: false
---

I’m very glad that more articles like [this](https://blog.sigplan.org/2024/11/21/evaluating-human-factors-beyond-lines-of-code/) come out of academia. If you haven’t read it yet, please do, as my thoughts are based on this article.

Personally as industry worker I suffered a lot from perceived misinterpretation of some usability and easy-of-use metrics for programming languages. Also blanket ignoring that some of my friends and coworkers have problem with understanding of some PL concepts. Also even if I totally agree with message, my perception is that message of article would pass by intended audience and things become “business as usual”. I writing this post, to probably fuel some discussion.

<!--more-->

After writing this I realize that this is more of dump of thoughts, then really reflection on the problems outlined and solutions outlined. I probably comes from educational, or congnitive easieness perspective on the problem. Anyway, let's continue.

## On usability 

In addition to proposed distinction for target audience I think there one important factor should be added: the level of cognitive ability which user poses. There plenty of developers who even after working decade in the field still may not able to get some advanced concepts. People in academia is smart, and it is sometimes hard for these smart people understand struggle which other people have with some concepts. There people who only do Wordpress development for a living and you cannot say that all of them “just did not find a way out of trap”. Pay is not great even if you live in cheaper country to think that this is best career. So there quite possible natural obstacles why people stay there and not change ecosystem. My personal take, for which I don’t have numeric evidence, is that it’s difficult for developers in this field to acquire the skills needed to move on. 

With this in mind, I’d love to see language features categorized by the minimum level of cognitive ability required for users to understand them.

Take Monads, for example. The history of popularizing Functional Programming shows us that many developers perceive Monads as something complex and unclear in terms of their usage. At the same time, another group of developers is perfectly comfortable using them daily. By "using them," I mean not just employing built-in language concepts but also creating their own abstractions when needed. To me, this is an indirect hint at the minimal cognitive requirements necessary to understand the concept. While I don’t discount the possibility that this is partly an educational problem, I don’t think that’s the only factor.

Okay, okay! It seems I’ve slid too far into rationalizing why I think cognitive requirements for features should be considered as an axis of research.

## Is language independent of ecosystem and community?

How can we evaluate a programming language without considering its ecosystem? Should we? Or should we instead use the ecosystem as a proxy for determining which concepts are easy to implement in that language? This whole "ecosystem" aspect could be a subfield of Social Sciences. For instance, should we consider a language "easy to use" if it doesn’t have a large and friendly community? But what does "friendly" even mean? Friendly to whom?

For example, if I want to learn Functional Programming, which community should I turn to? F#, OCaml, Haskell, Lean4? Should we evaluate the complexity of learning a language only in the context of solo learning? Does solo learning even make sense? I think not, as education is generally more effective with peers. But how can we separate a language’s features from the communities that support teaching them?

I don’t see how we can determine what is “easy to use” without more field studies and user studies. I would really love to see more research focused on human factors. That’s the only way to educate academia on the importance of these factors in programming languages.

When speaking with people adjacent to researchers, it’s not uncommon for my concerns to be dismissed as mere skill issues on the user’s side. And because I don’t have numbers or papers to back up my concerns, the discussion often isn’t productive—it becomes a matter of faith at that point.

What if we see less emphasis on human factors in programming language research not because academia is ignorant of these problems, but because researchers don’t know how to effectively measure social impact and instead focus on what’s easier to quantify? In that case, perhaps more user studies are needed to find better ways of examining human aspects.

Should we start openly discussing which social aspects we want to measure, regardless of the feasibility of conducting a study, and let others think about how to address them? The more ideas circulating about human factors, the better, in my opinion.

Another area to consider is how we determine whether certain language features or patterns are just a matter of preference. It seems that many things are indeed preferences. One example might be the "for" loop versus "map." I’d argue that, broadly speaking, the industry prefers "for." Is this because we’re slow to catch up with academia, or because there aren’t enough practical reasons to convince us that "map" is a better approach? Or perhaps it’s simply a matter of social conformity—we want to write code the same way the great C hackers did? That’s an open question for me.

After reflecting on my thoughts, I think I agree with all the proposals in the article, except that I’d like to see even more user studies. Otherwise, I’m on standby, ready to help promote these ideas if something needs to be done.

## Some other ideas
While writing this article, I came up with a couple of questions that I think could inspire interesting experiments. I’d like to share them as potential points for discussion.

**Experiment 1**
Analyze public package repositories to identify the concepts proposed as packages. By using NLP on package descriptions, we could determine what concepts are emphasized in the ecosystem. This would allow us to assess which programming language and industry concepts are most commonly supported by a given language.

I’m thinking of things like parser generators, compilers, databases, etc., but perhaps more patterns could be uncovered. This could serve as a kind of proxy for assessing a language’s capabilities.

**Experiment 2**
Create a collaborative platform for HCI-related user studies, designed so that the infrastructure can be run as open source. This setup would allow researchers to spend more time planning experiments, while industry experts could contribute insights into what is valuable but requires time to develop. Such a platform could serve as a hub for brainstorming and devising strategies to address the "Citadel of Numbers" challenge.

As a model, I have in mind Terence Tao’s Equational Theories project.

**Experiment 3**
Identify all commits on GitHub containing keywords like “fix” or “bug” and analyze the linguistic constructs associated with those fixes. The focus should probably be limited to linear fixes, as it’s unclear how to assess whether a specific linguistic feature triggers issues.
