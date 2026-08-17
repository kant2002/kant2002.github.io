---
layout: post
title:  "Кастомізуя компілятор F#"
date:   2026-08-17 17:30:00 +0200
categories: uk dotnet fsharp
comments: true
---

У кожного експерта з мов програмування свої розваги. Одні розробляють нові езотеричні мови, інші натомість підлаштовують уже наявну мову під власні потреби. Зробимо вигляд що ми із другого табору й створімо українську варіацію компілятора F#, якою можна користуватися, адже всі люблять вивчати програмування мовою, яку вже знають, і не морочитися з якоюсь непотрібною англійською.

<!--more-->

Більшість діалектів мов, що підтримують кастомізацію синтаксису, зазвичай спираються на наявні можливості мови, наприклад ["Іржа"](https://github.com/brokeyourbike/irzha). Цей діалект визначає правила переписування мови, і завдяки цьому компілятор працює як належить після опису правил нового сінтаксиса.

Для F# усе було б не так просто. На жаль, компілятор недостатньо гнучкий "з коробки", проте його легко хакнути. Якщо піти на [dotnet/fsharp](https://github.com/dotnet/fsharp) і запустити `./build` на вашій улюбленій ОС, ви отримаєте власноруч зібраний компілятор F#, мовну службу, бібліотеку часу виконання та інтеграцію з IDE. Безболісний досвід, дуже рекомендую.

## Хакінг

Отже, оскільки ми вирішили піти *хардкорним* шляхом, треба знайти місця, де ми застосуємо правку. Найприродніший спосіб — це, очевидно, лексер, де ми можемо змінити те, як розпізнається токен. У F# це [src/Compiler/SyntaxTree/LexHelpers.fs](https://github.com/dotnet/fsharp/blob/main/src/Compiler/SyntaxTree/LexHelpers.fs). Якщо придивитися, він визначений як відображення (map) між рядком та ідентифікатором токена. Це супер круто, бо якщо ми додамо більше відображень токенів, то зможемо підтримувати водночас і українську, і англійську, що дуже зручно. Тож зробімо це.

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

Як бачите, це навіть не лише токени, а якась DSL для визначення токенів, що супер круто.

То що ще? Нічого! От і все. Ми пропатчили компілятор. Тепер можна зібрати продукт F# і замінити FSharp.Compiler.Service.dll у вашій локальній інсталяції, що приблизно відповідає поточній гілці. Наприклад, якщо ви користуєтеся .NET 10, застосовуйте зміни до гілки `release/dev18.0`, а якщо ви користуєтеся найновішим прев'ю .NET 11 — використовуйте гілку `main`.

## Використання зібраних продуктів складним шляхом

Після збірки ви можете користуватися своїм компілятором з командного рядка. Просто запустіть `artifacts/bin/fsc/Release/net10.0/fsc.exe --help`, щоб побачити перелік опцій. Також, щоб одразу почати гратися, ви можете запустити F# interactive командою `artifacts/bin/fsi/Release/net10.0/fsi.exe`. Запустіть якийсь скрипт

```fsharp
нехай ім'я = "Андрій"
printfn "Привіт %s" ім'я;;
```

Натисніть ENTER — і вуаля, ви бачите застосовані зміни. Це магія, ви офіційно хакер компілятора.

## Пакування

Очевидно, це круто лише для того, щоб почати. Звісно, захопливо вигинати продукт, яким ви користуєтеся, у незвичний спосіб, і це чудово, але що, якщо ви хочете похизуватися своїм крутим проєктом перед другом? Друзі не надсилають друзям EXE! Тож що ми робимо? Друзі влаштовують повноцінну атаку на ланцюг постачання і створюють гарненькі Nuget-пакети. Оскільки F# — це продукт, пакування є частиною збірки, і нам лишається тільки підкрутити дещо тут і там.

Щоб полегшити собі життя, ми хочемо зробити дві речі: змінити ім'я DLL для FCS (F# Compiler Service) і змінити Nuget-дистрибуцію продукту-компілятора F#. Причина, з якої я хочу змінити ім'я FCS, — уникнути плутанини під час запуску цієї варіації у Visual Studio, адже збірки мають однакове ім'я, але різну версію, і це було б болісно розв'язувати. Перейменування набагато простіше.

Служба компілятора живе у [src/Compiler/FSharp.Compiler.Service.fsproj](https://github.com/dotnet/fsharp/blob/main/src/Compiler/FSharp.Compiler.Service.fsproj).

Просто змініть `AssemblyName` і `PackageId` на `FSharp.Compiler.Service.Ukrainian`. Це звичайний проєкт MSBuild, тож уся кастомізація, яку ви знаєте з нудного корпоративного життя, тут спрацює.

Проєкт F# використовує файли `.nuspec` для подальшої кастомізації процесу пакування, тож вам слід підправити файл-шаблон [src/Compiler/FSharp.Compiler.Service.nuspec](https://github.com/dotnet/fsharp/blob/main/src/Compiler/FSharp.Compiler.Service.nuspec). Просто змініть `FSharp.Compiler.Service\$Configuration$\netstandard2.0\FSharp.Compiler.Service.dll` на `FSharp.Compiler.Service\$Configuration$\netstandard2.0\FSharp.Compiler.Service.Ukrainian.dll`. Це переважно рутинні зміни, і вам треба знати, що саме змінювати, але це нормально.

Друга частина — зміна пакування для всього набору компілятора F# разом з інструментами тощо. Він живе в іншому наборі файлів. [src/Microsoft.FSharp.Compiler/Microsoft.FSharp.Compiler.fsproj](https://github.com/dotnet/fsharp/blob/main/src/Microsoft.FSharp.Compiler/Microsoft.FSharp.Compiler.fsproj), [src/Microsoft.FSharp.Compiler/Microsoft.FSharp.Compiler.nuspec](https://github.com/dotnet/fsharp/blob/main/src/Microsoft.FSharp.Compiler/Microsoft.FSharp.Compiler.nuspec) та [setup/Swix/Microsoft.FSharp.Compiler.MSBuild/Microsoft.FSharp.Compiler.MSBuild.csproj](https://github.com/dotnet/fsharp/blob/main/setup/Swix/Microsoft.FSharp.Compiler.MSBuild/Microsoft.FSharp.Compiler.MSBuild.csproj). Єдина відмінність тут у тому, що вам слід явно додати властивість `AssemblyName` у `src/Microsoft.FSharp.Compiler/Microsoft.FSharp.Compiler.fsproj`. Я додаю з іменем `AndriiKurdiumov.FSharp.Compiler.Ukrainian`. Трохи хвастощів завжди допомагає.

Будьте дуже уважні й змініть усі місця, але не бійтеся щось пропустити — збірка радо зламається, якщо ви забудете перейменувати.

## Використання зібраних продуктів легким шляхом

Ми просто створюємо новий консольний застосунок F# командою `dotnet new console --lang F#`. Це буде основою для нашої програми.

Додаймо також `dotnet new nugetconfig`, щоб можна було використовувати локально зібраний пакет.

Відкрийте nuget.config і додайте такий рядок

```
<add key="fsharp-uk" value="<FSharpRepo>\artifacts\packages\Release\Dependency\Shipping" />
```

Не хвилюйтеся й використовуйте повний шлях, усе буде добре.

Після цього відкрийте файл fsproj і додайте такі блоки

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

Зміна LangVersion важлива лише якщо ви збираєте з гілки `release/dev18.0`, оскільки якщо у вас встановлено .NET 11 Preview, компілятор з версії .NET 10 не знав про версію 11. В іншому разі все має бути гаразд.

Змініть вміст Program.fs на цю програму

```
нехай повідомлення = "F#"
printfn "Привіт %s" повідомлення
```

Після цього зберіть і запустіть

```shell
dotnet build --packages pkg
dotnet run --no-build
```

## Що далі

Це найпростіша форма хакінгу, і ми можемо, наприклад, створювати доповнення до примітивів FSharp.Core, а можемо доповнити весь ASP.NET, якщо стане сміливості. Щоб спростити такий хакінг, я створив [невеликий інструмент](https://kant2002.github.io/FSharpKeywordTranslator), який показує, як код можна побачити іншими мовами. Також, очевидно, є ліниві, які хочуть спробувати щось у своєму браузері, бо запускати термінал так складно. Тож ви можете глянути на [Fable REPL українською](https://kant2002.github.io/fable-repl-uk/). Приклади додаються! Якщо ви любите IDE, ви можете встановити VSIX розширення в студію із файла `artifacts\VSSetup\Release\VisualFSharpFull.vsix` і насолоджуватися любимою IDE. Якщо у вас інша любима IDE, знайдіть мене в інтернеті, щось придумаємо.

## Висновки

Якщо у вас сильна воля та хакерський дух, ніщо не зупинить вас у цьому світі програмного забезпечення. Ви можете переставляти речі як вам заманеться. Не соромтеся бути дивакуватими.
