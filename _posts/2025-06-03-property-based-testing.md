---
layout: post
title:  "Simple use case for property based testing"
date:   2025-06-02 09:53:23 -0500
categories: testing
comments: true
---

Here we go property-based testing. It's usually topic which does not have too much discussion on the Internet, and when it is discussed there not much practical aspects to it. It's relatively well known that you should wrote your invariants and test agains them. This is all fine, but does not give you idea about what exactly these *properties* of *your models* are.

So here our problem. The path normalization. This is art of conversion of paths `road/path/../to/hell/` to `road/to/hell`, or `skip/me/./if/you/can` to `skip/me/if/you/can`, or `../../../only/forward/no/backwards`. Basically simplification of paths. That can be very tricky business. For example, `././test` is just `test`, or `/../some/` is really wrong path, but we have to leave it as is because it appear as absolute path. 

Whole excercise would be performed over [TruePath](https://github.com/ForNeVeR/TruePath) which is library for static typing when working with paths.

# FsCheck

For this demonstation I would use [FsCheck](https://fscheck.github.io/FsCheck/) which is library written in F#, but for this article I would use C#, since that's language which TruePath is written in. Since TruePath uses XUnit for the testing, I would use `FsCheck.Xunit` integration package, which simplifies writing FsCheck tests for Xunit.

When testing using FsCheck, your most important thing would be write generators for our test data. In that sense property based testing is very similar to fuzzing, with only difference is that we have a bit more statements abour our code then simple *It does not crash*.

## Model

Let's start with our example. I decide that it would be beneficial to model paths as list of following tokens:
- Volume marker (optional)
- Path part consisting from letters or numbers
- Current directory block `.`
- Parent directory block `..`
- Three dots block `...` to spice things for the library a bit
- Directory separate and alternative directory separators as specified in [Path.DirectorySeparatorChar](https://learn.microsoft.com/en-us/dotnet/api/system.io.path.directoryseparatorchar) or [Path.AltDirectorySeparatorChar](https://learn.microsoft.com/en-us/dotnet/api/system.io.path.altdirectoryseparatorchar)

Because it's C# with lack of expressivity, I decide that I can model these tokens as simple `List<string>`, in the F# probably I would go with array of unions, or so. But it's 2025 and we still waiting for [unions](https://github.com/dotnet/csharplang/blob/main/proposals/TypeUnions.md) in C#.

## Generation

Let's start generating our tokens. Let's add namespaces which we need in C#.

```csharp
using FsCheck;
using FsCheck.Fluent;
```

and start with simplest generators, which always generate constants.

```csharp
var baseDir = Gen.Constant("..");
var currentDir = Gen.Constant(".");
var threeDots = Gen.Constant("...");
```

Obviosly we don't want generate constant, so let's combine these generators into one which randomly generate either of them.

```csharp
var dots = Gen.OneOf([baseDir, currentDir, threeDots]);
```

Now let's generate path separators.
```csharp
var directorySeparatorChar = Gen.Constant(Path.DirectorySeparatorChar).Select(c => c.ToString());
var altDirectorySeparatorChar = Gen.Constant(Path.AltDirectorySeparatorChar).Select(c => c.ToString());
```

It's same call to `Gen.Constant` but since `Path.DirectorySeparatorChar` and `Path.AltDirectorySeparatorChar` both have type `char`, but we want our tokens we map then to string type using `Select` method.

Now let's generate path parts. We want generate non-empty sequence of the lowercase characters, or uppercase characters or digits. Let's express that. Start with generation of lower-case charaters, that would be using [Gen.Choose](https://fscheck.github.io/FsCheck/reference/fscheck-fluent-gen.html#Choose) method like this `Gen.Choose('a', 'z')`. Similar for upper case characters would be `Gen.Choose('A', 'Z')` and for digits would be `Gen.Choose('0', '9')`. Now we can chain these generator declarations then using [.Or](https://fscheck.github.io/FsCheck/reference/fscheck-fluent-gen.html#Or) method. So characters which would be parts of the path would be represented like this.
```csharp
Gen.Choose('a', 'z')
    .Or(Gen.Choose('A', 'Z'))
    .Or(Gen.Choose('0', '9'))
```

In order to generate non-empty sequence we have to use [Gen.NonEmptyListOf](https://fscheck.github.io/FsCheck/reference/fscheck-fluent-gen.html#NonEmptyListOf).

```csharp
var textPath = Gen.NonEmptyListOf(Gen.Choose('a', 'z').Or(Gen.Choose('A', 'Z')).Or(Gen.Choose('0', '9'))).Select(l => string.Join("", l.Select(c => (char)c)));
```

Attentive reader would notice that we have some tail with conversion. It's a bit of inconvenence, but `Gen.Choose` produce only ints within range, so the call to `Gen.NonEmptyListOf` would produce `Gen<List<int>>` but we really want produce `Gen<string>` so we have to map resulting type to `string` using `Select` method.

Now we known everything to produce list of token. Let's do that
```csharp
var pathGenerator = Gen.NonEmptyListOf(Gen.OneOf([dots, directorySeparatorChar, altDirectorySeparatorChar, textPath]))
```

That's seems to be what we need, and there no way to guess that initiall, but that a bit invonvinient generator for pracical work. When we build this simple model, we want to operate on tokens, plus we want simple way to build path out of it. For example just by concatenation of strings. And naive generator would not work, since we can have following sequence `['..', '.']` and combining it, would change meaning of the tokens. So to simplify future post processing during writing test I will filter out combination where consequetive tokens have `.` in them. I use `Where` method for this.

```csharp
var pathGenerator = Gen.NonEmptyListOf(Gen.OneOf([dots, directorySeparatorChar, altDirectorySeparatorChar, textPath]))
    .Where(l =>
    {
        for (int i = 0; i < l.Count - 1; i++)
        {
            // Avoid consecutive dots like "..../.."
            if (l[i][0] == '.' && l[i + 1][0] == '.') return false;
        }

        return true;
    })
```

Now we have everything to build Linux path generator. So let's see how it looks when combined together.

```csharp
using FsCheck;
using FsCheck.Fluent;

//....

internal static class PathGenerators
{
    public static Gen<List<string>> LinuxPathItemsGenerator()
    {
        var baseDir = Gen.Constant("..");
        var currentDir = Gen.Constant(".");
        var threeDots = Gen.Constant("...");
        var dots = Gen.OneOf([baseDir, currentDir, threeDots]);
        var textPath = Gen.NonEmptyListOf(Gen.Choose('a', 'z').Or(Gen.Choose('A', 'Z')).Or(Gen.Choose('0', '9'))).Select(l => string.Join("", l.Select(c => (char)c)));

        var directorySeparatorChar = Gen.Constant(Path.DirectorySeparatorChar).Select(c => c.ToString());
        var altDirectorySeparatorChar = Gen.Constant(Path.AltDirectorySeparatorChar).Select(c => c.ToString());
        return Gen.NonEmptyListOf(Gen.OneOf([dots, directorySeparatorChar, altDirectorySeparatorChar, textPath]))
            .Where(l =>
            {
                for (int i = 0; i < l.Count - 1; i++)
                {
                    // Avoid consecutive dots like "..../.."
                    if (l[i][0] == '.' && l[i + 1][0] == '.') return false;
                }

                return true;
            });
    }
}
```

Now we can. based on this generator build Windows path generator

```csharp
public static Gen<List<string>> WindowsPathItemsGenerator()
{
    var driveLetter = Gen.Choose('a', 'z').Or(Gen.Choose('A', 'Z')).Select(c => (char)c + ":");
    var directorySeparatorChar = Gen.Constant(Path.DirectorySeparatorChar).Select(c => c.ToString());
    var altDirectorySeparatorChar = Gen.Constant(Path.AltDirectorySeparatorChar).Select(c => c.ToString());
    var separator = Gen.OneOf([directorySeparatorChar, altDirectorySeparatorChar]);
    var drivePrefix = Gen.Zip(driveLetter, separator).Select(static t =>
    {
        var (driveLetter, separator) = t;
        return driveLetter + separator;
    });
    return Gen.Zip(drivePrefix, LinuxPathItemsGenerator()).Select(static t =>
    {
        var (prefix, items) = t;
        items.Insert(0, prefix);
        return items;
    });
}
```

The only new thing here is [Gen.Zip](https://fscheck.github.io/FsCheck/reference/fscheck-fluent-gen.html#Zip) which takes two generator and create generator of tuples. We use that to concat output of generators for drive name and directory separators.

## Arbitraries (or domain models)

Myabe I'm wrong, but currently I look at types which provide `Arbitrary<T>` static functions as types which decribe domain concepts, and each function represent different variants of this concept. It's usually described as combination of generator + shrinker (another not need for now concept), and that's technically true, but I think that's does not help learning. So please trust me for now, and if down the road, you will think that I'm wrong, come back and let me know to not teach people wrong things.

For this test I will use very simple arbitraty class definition

```csharp
public class AnyOsPath
{
    public static Arbitrary<List<string>> Paths()
    {
        return Arb.From(Gen.Or(PathGenerators.LinuxPathItemsGenerator(), PathGenerators.WindowsPathItemsGenerator()));
    }
}
```

I create `Arbitrary` from generator which either have Linux or Windows path. I do not combine them, since eventually I need this difference, but not in this article. I don't use anything else when define `Arbitrary` because I rely on fact that `List` and `string` already have their suppport machinery and FsCheck will do things properly for this small model.

## Invariants

Okay, here the juice. Our invariants. I manage to create some invariants which path normalization in this specific library hold. It make sense from general perspective too. Here them:

- Normalized path never ends with `DirectorySeparatorChar`.
- Normalized path never contains `AltDirectorySeparatorChar`.
- Normalized path does not have two consequetive path separators
- Relative depth of the path preserved after normalization.

Let me explain a bit. First one rule is very simple, If I have absolute or relative paths then normalized path, never have `DirectorySeparatorChar` at the end. For example `/test/` would be normalized to `/test`. Second is simple as well, whenether I have path with `AltDirectorySeparatorChar`, these charaters replaced with `DirectorySeparatorChar`, for example, `c:/test` would be normalized into `c:\test`. Next one also simple. We collapse all directory separator into single separator, for example, `/test//subfolder` is really `/test/subfolder`. Last one a bit tricky. I want make sure that if relative depth of path was pointed to N levels depth it would be preserved in the normalized paths. For example, `some/path` has relative depth 2, `some/../path` have relative depth 1, and after nomalization become simply `path` which also have relative depth 1. So here the idea.

Let's show how I wrote test for invariants. I will start with second invariant, since it's most simple

```csharp
[Property(Arbitrary = new[] { typeof(AnyOsPath) })]
public void NormalizedPathDoesContainAltDirSeparator(List<string> pathParts)
{
    var sourcePath = string.Join("", pathParts);

    // Act
    var normalizedPath = PathStrings.Normalize(sourcePath);

    Assert.True(!normalizedPath.Contains(Path.AltDirectorySeparatorChar));
}
```

Here I define test using `Property` attribute, and specify that parameters to the methods would use `Arbitrary` methods from type `AnyOsPath`. All magic in the `Property` attribute, and the body of the test is trivial once you come up with invariant simple enough.

Now let's back to first invariants.

```csharp
[Property(Arbitrary = new[] { typeof(AnyOsPath) })]
public void NormalizedPathDoesNotEndWithDirSeparator(List<string> pathParts)
{
    var sourcePath = string.Join("", pathParts);

    // Act
    var normalizedPath = PathStrings.Normalize(sourcePath);

    Assert.True(normalizedPath == ""
        || normalizedPath == Path.DirectorySeparatorChar.ToString()
        || (normalizedPath.Length == 3 && normalizedPath[1] == ':')
        || normalizedPath[^1] != Path.DirectorySeparatorChar);
}
```

As can be seen, invariant not so simple and have couple exclusion from rules. For example root path is perfectly normalized path `/`, but it has `DirectorySeparatorChar` at the end. Same for the Windows paths `C:\`. But that's basically it.

Third invariant similarly simple as second one, so I omit it here. So let's see the last one.

```csharp
[Property(Arbitrary = new[] { typeof(AnyOsPath) })]
public void DepthPreserverd(List<string> pathParts)
{
    var sourcePath = string.Join("", pathParts);

    // Act
    var normalizedPath = PathStrings.Normalize(sourcePath);

    // Simplified normalization logic over our model.
    var collapsedBlock = CollapseSameBlocks(pathParts);

    var expectedDepth = CountDepth(collapsedBlock);
    var actualDepth = CountDepth([.. normalizedPath.Split(Path.DirectorySeparatorChar, StringSplitOptions.RemoveEmptyEntries)]);
    Assert.Equal(expectedDepth, actualDepth);

    // Function which count relative depth of the base
    static int CountDepth(List<string> pathParts)
    {
        int depth = 0;
        foreach (var part in pathParts)
        {
            if (part == Path.DirectorySeparatorChar.ToString() || part == Path.AltDirectorySeparatorChar.ToString())
            {
                continue;
            }

            // Skip home drive which does not affect depth.
            if (part.Contains(':'))
            {
                continue;
            }

            if (part == "..")
            {
                if (depth > 0)
                {
                    depth--;
                }
            }
            else if (part != ".")
            {
                depth++;
            }
        }
        return depth;
    }
}
```

So what I did here. First I simplify generated model
```csharp
// Simplified normalization logic over our model.
var collapsedBlock = CollapseSameBlocks(pathParts);
```
That's important part why we create model in itself, to be able create simpler rules. Also that's why I remove consequetive `..` and `.` tokens from the list. To be able write this `CollapseSameBlocks` function without overly complicated logic. If you interested in the logic in this function, you can take a look at the [implementation in the PR](https://github.com/ForNeVeR/TruePath/pull/139/files#diff-82b235a879a45be8a26f8e971bcbfe966717a9c4ea11edcf0f57dfad32d4c005R86).

Then I create local function for calculation local depth `static int CountDepth(List<string> pathParts)`, and after that test become trivial.
Tha's the gusto, find proper simple model which can represent your complicated domain. In our case list of tokens was good enough.

# Summary

Hopefully this was interesting and practical enough example of property based testing. You can take a look at the code in the [PR](https://github.com/ForNeVeR/TruePath/pull/139). Some invariants explained in this article submitted as [separate PR](https://github.com/ForNeVeR/TruePath/pull/140), but that should not hinder you.
