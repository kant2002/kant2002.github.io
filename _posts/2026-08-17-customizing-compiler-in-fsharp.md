---
layout: post
title:  "Customizing F# compiler"
date:   2026-08-17 17:30:00 +0200
categories: en dotnet fsharp
comments: true
---

Different programming language experts have their own games. Some of them design new esoteric languages, some instead customize existing one to suit their agenda. Let's be the second group and create Ukrainian variant of F# compiler where we can use, since everybody love study programming in language you already know and don't bother with some useless English.

<!--more-->

Most language dialects which support syntax customization usually utilize existing language features, for example ["Іржа"](https://github.com/brokeyourbike/irzha). This dialect define language rewriting rules, and because of that, compiler works as expected.

For F# things woulbe not so easy. Compiler not flexible enough unfortunately out of the box, but it's easiely hackable. If you go do [dotnet/fsharp](https://github.com/dotnet/fsharp), run `./build` on your favorite OS, you will have your own F# compiler, language service, runtime library and IDE integration build. Painless experience, highly recommend.

## Hacking

So since we decide to go *hard* mode, then we should find places where we will apply fix. Most natural way is obviously lexer, where we can change how token is detected. In F# it's [src/Compiler/SyntaxTree/LexHelpers.fs](https://github.com/dotnet/fsharp/blob/main/src/Compiler/SyntaxTree/LexHelpers.fs). If you look closely, it's defined as a map between string, and token identifier. This is super cool, since if we add more token mappings, we can support both Ukrainian and English at the same time, which is neat. So let's to that.

```fsharp
FSHARP, "абстрактний", ABSTRACT
ALWAYS, "та", AND
ALWAYS, "як", AS
ALWAYS, "ствердити", ASSERT
ALWAYS, "база", BASE
ALWAYS, "початок", BEGIN
ALWAYS, "клас", CLASS
FSHARP, "конст", CONST
FSHARP, "замовчання", DEFAULT
FSHARP, "делегат", DELEGATE
ALWAYS, "зробити", DO
ALWAYS, "зроблено", DONE
FSHARP, "інякщо", ELIF
ALWAYS, "інакше", ELSE
ALWAYS, "кінець", END
ALWAYS, "виключення", EXCEPTION
FSHARP, "зовнішній", EXTERN
ALWAYS, "ложь", FALSE
ALWAYS, "востаннє", FINALLY
FSHARP, "фіксовано", FIXED
ALWAYS, "для", FOR
ALWAYS, "фун", FUN
ALWAYS, "функція", FUNCTION
FSHARP, "глобальний", GLOBAL
ALWAYS, "якщо", IF
ALWAYS, "у", IN
ALWAYS, "успадкує", INHERIT
FSHARP, "інлайн", INLINE
FSHARP, "інтерфейс", INTERFACE
FSHARP, "внутрішній", INTERNAL
ALWAYS, "ледачий", LAZY
ALWAYS, "нехай", LET(false)
ALWAYS, "співстав", MATCH
ALWAYS, "відповідає", MATCH
FSHARP, "член", MEMBER
ALWAYS, "мод", INFIX_STAR_DIV_MOD_OP "мод"
ALWAYS, "модуль", MODULE
ALWAYS, "змінливий", MUTABLE
FSHARP, "простір", NAMESPACE
ALWAYS, "новий", NEW
FSHARP, "нуль", NULL
ALWAYS, "з", OF
ALWAYS, "відкрити", OPEN
ALWAYS, "або", OR
FSHARP, "перевизначити", OVERRIDE
ALWAYS, "приватний", PRIVATE
FSHARP, "відкритий", PUBLIC
ALWAYS, "рек", REC
FSHARP, "повернути", YIELD(false)
ALWAYS, "сіг", SIG
FSHARP, "статичний", STATIC
ALWAYS, "структ", STRUCT
ALWAYS, "тоді", THEN
ALWAYS, "до", TO
ALWAYS, "істина", TRUE
ALWAYS, "спробувати", TRY
ALWAYS, "тип", TYPE
FSHARP, "вживати", LET(true)
ALWAYS, "знач", VAL
FSHARP, "пусто", VOID
ALWAYS, "коли", WHEN
ALWAYS, "доки", WHILE
ALWAYS, "із", WITH
FSHARP, "поступатися", YIELD(true)
```

As you may see, it's not even tokens only, but some token defining DSL which is super cool.

So what else? Nothing! That's it. We patch compiler. Now you can build F# product, and replace FSharp.Compiler.Service.dll in your local installation approximately corresponding to current branch. For example if you use .NET 10, apply changes to `release/dev18.0` branch, if you use latest .NET 11 preview, use `main` branch.

## Usage of built products hard way

After you build, you can use your compiler from command line. Just run `artifacts/bin/fsc/Release/net10.0/fsc.exe --help` to see list of options. To immidiately start playing you can run F# interactive using `artifacts/bin/fsi/Release/net10.0/fsi.exe`. Run some script

```fsharp
нехай ім'я = "Андрій"
printfn "Привіт %s" ім'я;;
```

Press ENTER and voila, you see changes applied. It's magic, you are compiler hacker officially.

## Packaging

Obviosuly that's only cool to get started. It's obviously exciting to bend product which you are using in ususual ways, so it's great, but what if you want to brag about your cool project to a friend? Friends do not send friends EXE's! So what we do? Friends create full blown supply chain attack and create nice Nuget packages. Since F# is a product, packaging is part of build, and we only have to tweak things here and there.

To make life easier we want to do two things: change name of the FCS (F# Compiler Service) DLL, and want to change Nuget distribution of the F# compiler product. Reason why I want to change name of the FCS is to avoid confusion when running this variant in Visual Studio, since assemblies have same name, but different version, it would be painful to solve. Renaming is much simpler.

The compiler serivice lives in [src/Compiler/FSharp.Compiler.Service.fsproj](https://github.com/dotnet/fsharp/blob/main/src/Compiler/FSharp.Compiler.Service.fsproj).

Just change `AssemblyName` and `PackageId` to `FSharp.Compiler.Service.Ukrainian`. This is regular MSBuild project, so all customization which you know from boring enterprise life would work here.

The F# project use `.nuspec` files to further customize packaging story, so you should customize template file [src/Compiler/FSharp.Compiler.Service.nuspec](https://github.com/dotnet/fsharp/blob/main/src/Compiler/FSharp.Compiler.Service.nuspec). Just change `FSharp.Compiler.Service\$Configuration$\netstandard2.0\FSharp.Compiler.Service.dll` to `FSharp.Compiler.Service\$Configuration$\netstandard2.0\FSharp.Compiler.Service.Ukrainian.dll`. That's mostly mundane changes, and you need to know what to change, but it's fine.

Second part is change packaging for whole F# compiler suite, with tools, etc. It live in other other set of files. [src/Microsoft.FSharp.Compiler/Microsoft.FSharp.Compiler.fsproj](https://github.com/dotnet/fsharp/blob/main/src/Microsoft.FSharp.Compiler/Microsoft.FSharp.Compiler.fsproj) and [src/Microsoft.FSharp.Compiler/Microsoft.FSharp.Compiler.nuspec](https://github.com/dotnet/fsharp/blob/main/src/Microsoft.FSharp.Compiler/Microsoft.FSharp.Compiler.nuspec) and [setup/Swix/Microsoft.FSharp.Compiler.MSBuild/Microsoft.FSharp.Compiler.MSBuild.csproj](https://github.com/dotnet/fsharp/blob/main/setup/Swix/Microsoft.FSharp.Compiler.MSBuild/Microsoft.FSharp.Compiler.MSBuild.csproj). The only difference here is that you should explicitly add `AssemblyName` property in `src/Microsoft.FSharp.Compiler/Microsoft.FSharp.Compiler.fsproj`. I add using `AndriiKurdiumov.FSharp.Compiler.Ukrainian`. A bit of bragging always helps.

You should be very careful, and change all places, but don't worry to miss something, build will happily break if you forget to rename.

## Usage of built products easy way

We just create new F# Console application using `dotnet new console --lang F#`. That would be the basis for our program.

Let's also add `dotnet new nugetconfig` so we can use locally build package.

Open nuget.config, and add following line

```
<add key="fsharp-uk" value="<FSharpRepo>\artifacts\packages\Release\Dependency\Shipping" />
```

Don't worry and use full path, it would be fine.

After that open fsproj file, and add following blocks

```xml
<PropertyGroup>
    <LangVersion>10</LangVersion>
    <DotnetFsiCompilerPath>$(PkgAndriiKurdiumov_FSharp_Compiler_Ukrainian)/lib/net10.0/fsi.dll</DotnetFsiCompilerPath>
    <DotnetFscCompilerPath>$(PkgAndriiKurdiumov_FSharp_Compiler_Ukrainian)/lib/net10.0/fsc.dll</DotnetFscCompilerPath>
</PropertyGroup>

<ItemGroup>
    <PackageReference Include="AndriiKurdiumov.FSharp.Compiler.Ukrainian" 
        Version="14.0.110-servicing.26417.1" IncludeAssets="all" />
</ItemGroup>
```

LangVersion change is important only if you build from `release/dev18.0` branch, since if you have .NET 11 Preview installed, the compiler from .NET 10 version, did not know about version 11. Otherwise you should be good.

Change content of Program.fs to this program

```
нехай повідомлення = "F#"
printfn "Привіт %s" повідомлення
```

After that, build and run

```shell
dotnet build --packages pkg
dotnet run --no-build
```

## What's next

This is simplest form of hacking, and we can for example create augmentations for FSharp.Core primitives, we can augment whole ASP.NET if we are brave enough. To simplify such hacking, I create [small tool](https://kant2002.github.io/FSharpKeywordTranslator) which present how code can be seen in other languages. Also obviosly lazy and want to try something in their browsers, spinning terminal is so complicates. So you can look at [Fable REPL in Ukrainian](https://kant2002.github.io/fable-repl-uk/). Samples included! If you love IDE, you can install VSIX extension in Visual Studio from file `artifacts\VSSetup\Release\VisualFSharpFull.vsix` and enjoy your best IDE. If you have other best IDE, find me on the Internet, we can figure out something.

## Conclusions

If you have strong will, and hacking spirit nothing would stop you in this world of software. You can rearrange things as you like. Don't be shy to be quirky.