---
layout: post
title:  "Reverse Kolesa Survey 2025 dataset"
date:   2026-06-02 12:27:44 +0200
categories: en kazakhstan
comments: true
use_mermaid: true
---

In the chat we discuss that Kolesa company does not pull their weight when speaking about developer community. I agree with that. One community ask (maybe pointless) is to have raw data for yearly survey which they produce and this one of pillars of their public weight. Maybe not strongest, since they do yearly conferences, but still it's visible.

But I believe this is pointeless ask, since Kolesa already made lot of results public by giving detailed results. Let's see what we can deduce from this numbers.

<!--more-->

Here the list of [report](https://kolesa.group/media/posts/issledovaniya/issledovanie-rynka-razrabotchikov-v-kazahstane-trendy-motivaciya-i-zarplatnye-ozhidaniya)

We have total sample size. It's in the report.

```
Опрос проводился среди 643 специалистов разного уровня и направлений — от junior до senior, а также среди IT-руководителей, что позволило получить объективную картину текущих тенденций
```

Let's create variable `total_developers` with value `643`.

Initially let's find statements which give us 100% in total.

```
74% разработчиков работают в казахстанских IT-компаниях, но растёт число специалистов в международных компаниях (14%) и на удалёнке (12%).
```

I will assume that this question `Where you working?` have 3 options
- In Kazakhstan company
- In international company
- Remotely

so what this mean.

```
kazakhstan = 0.74 * total_developers
international_office = 0.14 * total_developers
international_remote = 0.12 * total_developers
```

this is slightly incorrect formula, since if it's true then `kazakhstan = 475.82` which obviosuly not true. Since even 0.99 of person is impossible to have real world. It is human or not as a whole. So let's modify eqations

```
kazakhstan = total_developers * 74 / 100
international_office = total_developers * 14 / 100
international_remote = total_developers * 12 / 100
```

And now we can state that all variables `kazakhstan`, `international_office` and `international_remote` is ℕ.

```
kazakhstan = 475
international_office = 90
international_remote = 77
```

Hmmm. Something does not adds up. It's because somewhere rounding happens. Let's assume that rounding to nearest number happens. Mathematically we can define that like this.

```
kazakhstan = (total_developers * 74 + 50) / 100
international_office = (total_developers * 14 + 50) / 100
international_remote = (total_developers * 12 + 50) / 100
```

The reason for `+50` is essentially we add `.5` to number and then take whole of it. This is how `Math.Round` works mathematically.

```
kazakhstan = 476
international_office = 90
international_remote = 77
```

Now let's look at company profile distribution.

![type](https://photos-cmn.kcdn.kz/internal-projects/kolesa-group/content/f8df0778-bdb1-4fb3-9c81-7db2ab05593e.webp)

If you notice, due to rouding if you addsup all values you will have 101% - great for publicity. So let's modify formula a bit to account for that.

```
product = (total_developers * 38 + 50) / 101
fintech = (total_developers * 29 + 50) / 101
outsource = (total_developers * 13 + 50) / 101
startup = (total_developers * 8 + 50) / 101
other = (total_developers * 5 + 50) / 101
telecom = (total_developers * 5 + 50) / 101
commerce = (total_developers * 3 + 50) / 101
```

Let's solve it.

```
product = 242
fintech = 185
outsource = 83
startup = 51
other = 32
telecom = 32
commerce = 19
```

Hmm. Again, total is 644. We have one additional person. Sigh. Actually if we have statment: Developers with `property` was `a%` out of `total_developers` that means we there roundining that also mean, that somewhere less developers then then strict percentage. 

formula for the range `[property_min, property_max]` approximately following

```
property_min = floor((total_developers * (a - 0.5)) / 100)
property_max = floor((total_developers * (a + 0.5)) / 100)
```
Let's recalculate values


```
kazakhstan = [472, 479]
international_office = [86, 93]
international_remote = [73, 80]
```

and

```
product = [241, 245]
fintech = [181, 187]
outsource = [79, 85]
startup = [47, 54]
other = [28, 35]
telecom = [28, 35]
commerce = [15, 22]
```

## Speciality

Now let's look at the structure by speciality.

![type](https://photos-cmn.kcdn.kz/internal-projects/kolesa-group/content/d73a8230-83f5-407c-b26a-68c57da6bc5c.webp)

This means that we have 

```
backend = [318, 324]
frontend = [118, 125]
android = [93, 99]
ios = [73, 80]
cross_platform = [16, 22] // [22] after subgroup analysis
fullstack = [3, 9] // [4, 8] after subgroup analysis
```

And because of that let's take a look at what how many backend developers by language we have

```
go = [103, 105]
php = [93, 95]
java = [87, 89]
csharp = [27]
```

Now frontend developers

```
javascript = [110, 116]
typescript = [6]
html = [2, 3]
```

and iOS developers

```
swift = [71, 78]
objective_c = [2]
```

and Android developers

```
kotlin = [90, 96]
cpp = [1, 2]
java = [1]
```

cross-platform developers

```
dart = [17]
javascript = [2]
java = [1]
php = [1]
typescript = [1]
```

and full stack developers

```
java = [2, 4]
javascript = [1, 2]
python = [1, 2]
```

## Grades

Now we can analyze grades

```
middle = [241, 247]
senior = [241, 247]
junior = [67, 73]
lead = [67, 73]
director = [3, 9]
intern = [3, 9]
executive = [1, 3]
```

## Work type

If you compare work type from this chart 

![type](https://photos-cmn.kcdn.kz/internal-projects/kolesa-group/content/fb58378d-d907-4d71-ab1e-1fabdfa63a8f.webp)

where remote work is 26% and compare with original chart in the beginning of the report, I see discrepancies between remote international work and whole remote work. So it's likely see presense of Kazakhstan remote work. Let's calculate how remote work and office work distributed in Kazakhstan.

So we can see that 12% is percentage of the remote work in KZ.

```
kazakhstan_office = [392, 406]
kazakhstan_remote = [73, 80]
```

So in combined we will have 

```
kazakhstan_office = [392, 406]
kazakhstan_remote = [73, 80]
international_office = [86, 93]
international_remote = [73, 80]
```

I believe I can reverse a bit of information from salary. But not today probably.