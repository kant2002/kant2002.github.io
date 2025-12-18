---
layout: post
title:  "Bureaucratic view of SemVer"
date:   2025-12-18 10:48:44 +0100
categories: en engineering
comments: true
---

[Semantic Versioning](https://semver.org/) always rub me wrong way, as reckless policy. Why? 

<!--more-->

Reason for that is in my opinion that's policy which assume that it's wielded rightfully, and if not then it's the user to blame. I have strong position, that civilization build tools and processes which prevent abuse of the individuals when applied. So discarding these issues without mitigations is pointless. So if you are for SemVer + some additional policies, I'm fine, but I would like to know about exact policies which mitigate organizational issues with semver.

# Too strict to follow

For me whole SemVer optimized for working either with very disciplined team who follow to the letter or for very undisciplined who don't care about external consequences.

Take first statement `Software using Semantic Versioning MUST declare a public API.`. That's obviously not how people in general think about their software. Lot of communications about versions is about 
- Versions as presented to the market
- Versions as presented by logical progression of event.

Public API stability religiously taken only in very mature organizations/teams. I do agree that this is right thing to care, but you cannot by wish start to care about stability.

- `Version 1.0.0 defines the public API.` This is again too strict, since we have evidence that lot of really caring folks, who treat this stability as priority, cannot have golden stability and never release 1.0.0. You may say this is fine, it's not me, but this is consequences of too strict policies. Have something too strict and strange outlier start happens. Obviously there other interesting outlier - irresponsible person, who forever stay on 0 and break everything, hey, it's not `public API` yet, even product is here. Maybe this can be solved by cultural changes, but since SemVer already long time with us, and I stil see this consequences, maybe we should do something.

# Not clear in major version

Let's read statement 8.
`Major version X (X.y.z | X > 0) MUST be incremented if any backward incompatible changes are introduced to the public API. It MAY also include minor and patch level changes. Patch and minor versions MUST be reset to 0 when major version is incremented.`

This is wierdly written. Usually I see that it's interpreted that only breaking change requre version, and any version bump justified to sneak breaking changes. Again, that's not fault of spec, but the user, but you know, nobody care if you have to update your product because dependency dragging you forward. I even have to fork `jszip` to maintain sync version, because it was used as dependency in the library which I maintain, or I have to introduce breaking change for my users.

I don't like rules which encourage reckless behaviour. And this rule definitely done enough damage in endless updates for lots and lots of people.

Also we have lot of OSS software which don't bump major version, since it's not deserve breakign changes and somebody *would* think, that software *may* have them, and they *would not* upgrade. That's not funny in my opinion. Lot of potential to market product and it's new features are lost. I know, OSS folk don't like doing business, but still, it's IMO important.

## In business context

Business context for SemVer is usually following,

- Overworked team
- Lack of senior people who maintain processes

How is SemVer help them? I think it only confuse lot of people, and SemVer used by each team how they see fit. That erodes trust in the technique. That should be countered. This is policy problem, not technical one. 

## Technicalities aside

What semantic versioning not captured, is that you usually look for libraries which are

- team are responsible with documenting large changes
- large changes really rare
- cruft is keep for a long time to give users time to migrate

Usually library is you outsourcing work to others. In business, if you change providers too often, you have organizational drag, and it cost you money. Everybody looking for reliable partners.

Semver does not help with that in any way. But based on evidence of usage in the wild, it have externalities which I don't want to see. Maybe it's hijacked by wrong guys, I don't know, but while they are visible, and produce well known damage, I will stay away from speaking about SemVer as sensible policy.

For release management I think stability of previous API is super improtant, and you should train your team for that. SemVer does not capture it. It indirectly kill all release management discussion, since it looks like we have proper versions, and life is rosy. It's not.

If you think SemVer is right way to move forward, I would love to see more of Semver + something else articles and guidance. Policy need to be updated. 

# Thanks your for reading!