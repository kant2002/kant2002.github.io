---
layout: post
title: 'MagicMapper: The fork of AutoMapper'
date:   2025-04-18 20:02:12 +0500
categories: en programming-languages
comments: true
---

Recent changes in the AutoMapper license, and the waves which this send across .NET chats and subreddits make me think. Why even look for alternatives to AutoMapper? 
I really have erratic feelings about that and it rubs me wrong way. AutoMapper was free and useful software for a long time. Jimmy really do great job maintainig it, and even coming out as guy who want a bit more money was done in very professional way.

## So why not even create a fork given that AutoMapper have MIT license? 

Is across whole .NET community not enough developers who have two things, a bit of free time, and a bit of charitable character to maintain things. Why send ripples across bunch of products and perform meaningless rewrites? If you think about it, if you want replace AutoMapper with Mapperly you somehow should justify it. Prefereably as business developers say, that should have business impact. Some fearmongering that "maybe" something happens is not really a justification, because obviosuly Mapperly after sometime may go out of OSS business. Maybe not, but we don't know. Is rewriting to anything else, not nescessary Mapperly obviously, a reasonable investment, or you can just fork existing working product, with excellent maintainance infrastructure and call it a day.

## But just forking is not maintaining!

Yes, sure. But how often you expect anything new from AutoMapper as was super happy with new release? From what I know Jimmy don't really cooperate much with outsiders. That's his project, cannot blame him on choosing safe way to engage with users. What kind of improvements do you really expect? If you have one, and want spend cycles discussing how you can improve something, let me know. 

Now to maintaining. I really don't see this as high maintainaince project. You can really go very far with allowing people contribute and submit PR + tests. Existing tests very solid. Just adopt policy to never change existing tests and never break them. That's easy. Improving would be harder, but you know, who cares... That's maintainance and we in .NET and not in JavaScript where Mark's Zuckerberg shouting 'Move fast and break everything' from every corner.

## I want improvements!

So do I. My personal wish for AutoMapper is to be able use it in NativeAOT. Honesly given it's very liberal use of reflection, I did not try to do that on my NativeAOT fixing spree. I thinking that Jimmy would not want to re-engeneer library to make it support NativeAOT. Maybe I was wrong, but given that I have perception that it would not answer I do not even try. Probably this is golden opportunity. Maybe that allow me to make NativeAOT more friendly to corporate codebases. I know that NativeAOT is painful, and the more libraries will support it in some fashion, the better for everybody. I never understand some decisions which Microsoft developers did back then, and now I painfully realize that this is proper decisions, even if NativeAOT is not that extreme and agressive as it can be. Kudos for caring about community *THAT* much.

So in short, expect some source generator experiments. I know that support everything would be impossible, but let's try to poke that. That would be in separate branch probably.

## Statement

I create fork, and call it [MagicMapper](https://github.com/kant2002/MagicMapper), it's [on Nuget](https://www.nuget.org/packages/MagicMapper), I do not fully migrate on it my projects, but I will.

I at minimum plan to maintain this fork for an year. Most likely more. I'm much more liberal to transferring ownership to the project to other, so in case I would be missing or unable to, I think it would be possible to continue work on the project for anybody else, without disruption by other.

I do try my best to have spirit of OSS running on this project. I want that fork to be solution for independent developers. For somebody to remember, I hope it can be revitalization of [Alt.Net movement](https://learn.microsoft.com/en-us/archive/msdn-magazine/2008/march/%7b-end-bracket-%7d-what-is-alt-net).

Personally I more dislike AutoMapper then like it. The only reason why I dislike it, is that it breaks tooling and if using without moderatin it's easy to make things worse. That don't reason to abandon library in my opinion, we should preserve too. What I learn during my years in software development is that rewriting is always worst decision then evolution.

## What about other projects?

In addition to AutoMapper there MediatR and MassTransit. Honesly I never think about forking them, but jokes from my friends that I fork everything what can be forked sometimes make sense. I think I have limited time to maintain, and cannot do that alone, so if somebody think that's worth it, I may reconsider my involvement. AutoMapper *can* live on life support, but MediatR is next level, and MassTransit is definitely even more harder.

## Acknoledgment 

I fully aknowledge hard work which [Jimmy Bogard](https://www.jimmybogard.com/) did on AutoMapper. I would like to thank you him! I personally don't envision how my fork can endanger his future business or AutoMapper as commercial thing. I think there can be space for both options in the .NET ecosystem.

## Call for help

I still not done transferring documentation to some other location, and make sure that all links point to proper location, and other housekeeping things. If you want help, go [to Github](https://github.com/kant2002/MagicMapper) and start hacking.
