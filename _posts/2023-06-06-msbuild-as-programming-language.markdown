---
layout: post
title:  "MSBuid як мова програмування!"
date:   2023-06-06 23:45:44 -0500
categories: MSbuild
---

Зі сторони виглядає що багато програмістів побоюються MSBuild і намагаются ніколи його не чіпати. Це на мою думку не дуже продуктивно. Багато цих страхів щодо MSBuild через те що у нього є свою, і досить незвична для програміста, термінологія. Я спробую показати що MSBuild це лише дінамічна мова програмування, досить чудернацька, але лише мова програмування. Можливо це полегшить читачу шлях його вивчення.

# PropertyGroup та ItemGroup

Почнемо із простих речей. теги які декларовані у `PropertyGroup` це будуть наші звичайні змінні.
```
<PropertyGroup>
  <OutputType>Exe</OutputType>
  <TargetFramework>net7.0</TargetFramework>
  <ImplicitUsings>true</ImplicitUsings>
  <Nullable>enable</Nullable>
</PropertyGroup>
```
що можна представити як
```
$OutputType="Exe"
$TargetFramework="net7.0"
$ImplicitUsings=true
$Nullable="enable"
```

як ви бачите, ми маємо лише строки, і як спеціальний випадок `bool` значення. Насправді навіть "true"/"false" значення це строки, але операції порівняння будуть працювати із `true`, або із `"true"` і тому краще важати що це такий спеціальний тип.

Теперь йдемо до `ItemGroup`, вони трішечки складніші, але найближче приближення це масиви анонімних об'єктів.
```
<ItemGroup>
  <PackageReference Include="System.CommandLine" Version="2.0.0-beta4.22272.1" />
</ItemGroup>

<ItemGroup>
  <ProjectReference Include="..\OpenAlexNet\OpenAlexNet.csproj" />
</ItemGroup>

<ItemGroup Label="dotnet pack instructions">
  <Content Include="build\*.targets">
    <Pack>true</Pack>
    <PackagePath>build\</PackagePath>
  </Content>
</ItemGroup>

<ItemGroup>
  <Content Include="$(OutputPath)\*.dll;$(OutputPath)\*.json">
    <Pack>true</Pack>
    <PackagePath>build\</PackagePath>
  </Content>
</ItemGroup>
```

Якщо припустити що `$(OutputPath) == 'some\path'` то це буде виглядати на нашій умовній мові ось так:
```
@PackageReference.include({ "ItemSpec": "System.CommandLine", "Version": "2.0.0-beta4.22272.1" })
@ProjectReference.include({ "ItemSpec": "..\OpenAlexNet\OpenAlexNet.csproj" })

// dotnet pack instructions
@Content.include({ "ItemSpec": "build\mytarget.targets", Pack: true, PackagePath: "build\" })
@Content.include({ "ItemSpec": "build\othertarget.targets", Pack: true, PackagePath: "build\" })

@Content.include({ "ItemSpec": "some\path\myapp.dll", Pack: true, PackagePath: "build\" })
@Content.include({ "ItemSpec": "some\path\mylib.dll", Pack: true, PackagePath: "build\" })
@Content.include({ "ItemSpec": "some\path\myother.dll", Pack: true, PackagePath: "build\" })
@Content.include({ "ItemSpec": "some\path\3rdparty.dll", Pack: true, PackagePath: "build\" })
@Content.include({ "ItemSpec": "some\path\appsettings.json", Pack: true, PackagePath: "build\" })
@Content.include({ "ItemSpec": "some\path\appsettings.Development.json", Pack: true, PackagePath: "build\" })
@Content.include({ "ItemSpec": "some\path\config.json", Pack: true, PackagePath: "build\" })
```

І це усе. Уся магія MSBuild, така як рокриття `*` та змінних буде проходити під час декларування.

# Імпортування інших файлів проектів

MSBuild дозволяє нам імпортувати інші файли де можуть бути задекларовані `PropertyGroup`/`ItemGroup`/`Target` елементи.

```
<Import Project="$(CommonLocation)\General.targets" />
```

це буде майже С-вставкою. Де усе що буде знаходитися у файлі вказанному у Project атрібуті, буде включено.
```
#include <$(CommonLocation)\General.targets>
```

ящо вказати атрібут Sdk то файл проекту буде шукатися у Nuget пакеті

```
<Import Project="General.targets" Sdk="MyNugetSdk" />
```

це аналогічно
```
#include <$(PkgMyNugetSdk)\Sdk\General.targets>
```

де `PkgMyNugetSdk` це шлях де буде лежати розпакований Nuget пакет `MyNugetSdk`. Назва власивості аналогічна назві яку би згенерував MSBuild якщо для пакету була би встановлені метадані `GeneratePathProperty=true`. Трішки більше можна почитати [тут][sdk-project-files]

# Target та Task

Теперь коли ми навчилися більш менш створювати змінні треба якось виконувати код. За це відповідають у MSBuild два поняття `Target` та `Task`. І то і інше можна представляти собі як функції. Якщо ви спитаєте навіщо дві різні концепції? справа у тому що Target потрібен для дуже простих скріптових задач, а Task для більш складних, які пишуться на інших мовах програмування. Можна вважати їх вбудованими функціями. Звісно це не зовсім так, бо можна додавати свої таски, але давайте залишимо це за рамками. Також треба пам'ятати що ви не можете виконувати таски самостійно, лише через описані цілі. Тож почнемо ыз них

```
<Target Name="MyMessage">
  <Message Importance="High" Text="Hello MSBuild!" />
  <Message Text="Project File Name = $(MSBuildProjectFile)" />
  <RemoveDir Directories="$(OutputDirectory);$(DebugDirectory)" />
</Target>
```

що буде приблизно так:
```
void MyMessage()
{
  Message(Text: "Hello MSBuild!", Importance: "High")
  Message(Text: $"Project File Name = {$MSBuildProjectFile}", Importance: "High")
  RemoveDir(@($(OutputDirectory);$(DebugDirectory)))
}
```

# Залежності

Тепер коли ми навчилися робити функції, було би непогано їх викликати одну із другої. І тут MSBuild дуже не звичний, тому що немає можливості викликати іншу ціль із своєї цілі. Це зроблено для того щоб мати можливісь виконувати цілі параллельно друг від друга. Замість явного виклика однієї цілі із іншої використовується механізм залежностей. `DependsOnTargets`, 'AfterTargets' та `BeforeTargets` дозволяють вказати після яких цілей треба викликати нашу ціль, або навпаки  до яких цілей треба викликати нашу ціль.

Умовно кажучи
```
<Project DefaultTargets="Link" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
	<Target Name="Compile">
		<Message Text="Compiling" />
	</Target>
	<Target Name="AfterCompile" AfterTargets="Compile">
		<Message Text="After Compiling" />
	</Target>
	<Target Name="Link" DependsOnTargets="Compile">
		<Message Text="Linking" />
	</Target>
	<Target Name="Optimize" BeforeTargets="Link">
		<Message Text="Optimizing" />
	</Target>
</Project>

```

приблизно ви би написали десь так.

```
CompileIsNotRun = true;
void Compile()
{
  // Compile target
  Message(Text: "Compiling")

  // AfterTargets
  AfterCompile()

  CompileIsNotRun = false;
}

AfterCompileIsNotRun = true;
void AfterCompile()
{
  // AfterCompile target
  Message(Text: "After Compiling")
  AfterCompileIsNotRun = false;
}

LinkIsNotRun = true;
void Link()
{
  if (CompileIsNotRun)
    Compile();

  // BeforeTargets
  Optimize();

  // Link target
  Message(Text: "Linking")
  LinkIsNotRun = false;
}

OptimizeIsNotRun = true;
void Optimize()
{
  // Optimize target
  Message(Text: "Optimizing")
  OptimizeIsNotRun = false;
}
```

і якщо ви виконаєте `dotnet build /v:n`

# Умовне виконання

Це найпростіша із усіх речей. Якщо ми маємо атрібут Condition, то MSBuild перевіряє умову, і якщо вона виконується, то присвоює значення, додає айтем, виконуе задачу або ціль.

```
<PropertyGroup>
  <OutputType>Exe</OutputType>
  <ImplicitUsings>true</ImplicitUsings>
</PropertyGroup>

<ItemGroup>
  <PackageReference Include="System.CommandLine" Version="2.0.0-beta4.22272.1" Condition="$(OutputType) == 'Exe''" />
</ItemGroup>

<ItemGroup>
  <ProjectReference Include="..\OpenAlexNet\OpenAlexNet.csproj" />
</ItemGroup>

<ItemGroup Label="dotnet pack instructions" Condition="$(ImplicitUsings) == true">
  <Content Include="build\*.targets">
    <Pack>true</Pack>
    <PackagePath>build\</PackagePath>
  </Content>
</ItemGroup>

<ItemGroup>
  <Content Include="$(OutputPath)\*.dll;$(OutputPath)\*.json">
    <Pack>true</Pack>
    <PackagePath>build\</PackagePath>
  </Content>
</ItemGroup>

<Target Name="Compile" Condition="$(ImplicitUsings) == true">
  <Message Text="Compiling" />
</Target>
```

буде приблизно так.

```
$OutputType="Exe"
$TargetFramework="net7.0"
$ImplicitUsings=true
$Nullable="enable"

if ($OutputType == 'Exe')
{
  @PackageReference.include({ "ItemSpec": "System.CommandLine", "Version": "2.0.0-beta4.22272.1" })
}
  
@ProjectReference.include({ "ItemSpec": "..\OpenAlexNet\OpenAlexNet.csproj" })

if ($ImplicitUsings == true)
{
  // dotnet pack instructions
  @Content.include({ "ItemSpec": "build\mytarget.targets", Pack: true, PackagePath: "build\" })
  @Content.include({ "ItemSpec": "build\othertarget.targets", Pack: true, PackagePath: "build\" })
}

@Content.include({ "ItemSpec": "some\path\myapp.dll", Pack: true, PackagePath: "build\" })
@Content.include({ "ItemSpec": "some\path\mylib.dll", Pack: true, PackagePath: "build\" })
@Content.include({ "ItemSpec": "some\path\myother.dll", Pack: true, PackagePath: "build\" })
@Content.include({ "ItemSpec": "some\path\3rdparty.dll", Pack: true, PackagePath: "build\" })
@Content.include({ "ItemSpec": "some\path\appsettings.json", Pack: true, PackagePath: "build\" })
@Content.include({ "ItemSpec": "some\path\appsettings.Development.json", Pack: true, PackagePath: "build\" })
@Content.include({ "ItemSpec": "some\path\config.json", Pack: true, PackagePath: "build\" })

CompileIsNotRun = true;
void Compile()
{
  if ($ImplicitUsings == true)
    return;

  // Compile target
  Message(Text: "Compiling")

  CompileIsNotRun = false;
}
```
Быльш про умовні конструкції та підтримувані операціі краще почитати на сайті [Майкрософт].

# Заключення

На мою думку треба не думати як підшаманити MSBuild файл, а краще зрозуміти як воно усе це працюю. До речі якщо щось працює не так, і ви бачите помилку у MSbuild
моя дефолтна порада, це додати до запуску `dotnet build` параметр `/bl` і подивитися що у там коїться у файлі msbuild.binlog через [MSBuildLogViewer][msbuildlogviewer]

[sdk-project-files]: https://learn.microsoft.com/en-us/dotnet/core/project-sdk/overview#project-files
[conditions]: https://learn.microsoft.com/en-us/visualstudio/msbuild/msbuild-conditions?view=vs-2022
[msbuildlogviewer]: https://msbuildlog.com/

<!--

You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. You can rebuild the site in many different ways, but the most common way is to run `jekyll serve`, which launches a web server and auto-regenerates your site when a file is updated.

Jekyll requires blog post files to be named according to the following format:

`YEAR-MONTH-DAY-title.MARKUP`

Where `YEAR` is a four-digit number, `MONTH` and `DAY` are both two-digit numbers, and `MARKUP` is the file extension representing the format used in the file. After that, include the necessary front matter. Take a look at the source for this post to get an idea about how it works.

Jekyll also offers powerful support for code snippets:

{% highlight ruby %}
def print_hi(name)
  puts "Hi, #{name}"
end
print_hi('Tom')
#=> prints 'Hi, Tom' to STDOUT.
{% endhighlight %}

Check out the [Jekyll docs][jekyll-docs] for more info on how to get the most out of Jekyll. File all bugs/feature requests at [Jekyll’s GitHub repo][jekyll-gh]. If you have questions, you can ask them on [Jekyll Talk][jekyll-talk].

[jekyll-docs]: https://jekyllrb.com/docs/home
[jekyll-gh]:   https://github.com/jekyll/jekyll
[jekyll-talk]: https://talk.jekyllrb.com/

--> 

