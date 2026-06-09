---
layout: post
title:  "Як побудувати .NET обфускатор - Частина II"
date:   2026-06-01 17:54:44 +0200
categories: uk обфускатори
comments: true
---

<script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, logLevel: 'trace' });
  document.querySelectorAll('pre > code.language-mermaid').forEach((codeBlock) => {
    codeBlock.parentElement.outerHTML = `<pre class="mermaid">${codeBlock.textContent}</pre>`;
  });
</script>


Це продовження серії про написання обфускаторів. Ви можете прочитати першу статтю [тут]({% post_url 2026-05-24-how-to-build-obfuscator-part-i-uk %})


Ми закінчили з заміною рядків та примітивною середою виконання для обфускації.
Тепер час додати більше цікавого. Раніше ми писали відносно прості техніки обфускації, які досить тривіально скасувати. У цій статті я пояснюю, як трансформувати потік керування таким чином, щоб ускладнити його аналіз.

Почнемо ускладнювати потік керування.

<!--more-->

## Прості модифікації умов

Найбільш базовий спосіб заплутати потік керування - це введення фальшивих логічних обчислень у існуючі умовні гілки. Наприклад, якщо у нас є такий код

```csharp
if (x > 4)
{
    Console.WriteLine("This is under condition");
}
```

можна трансформувати його на
```csharp
if (true && x > 4)
{
    Console.WriteLine("This is under condition");
}
```
або 
```csharp
if (false || x > 4)
{
    Console.WriteLine("This is under condition");
}
```

Це виглядає дурнувато, і якщо написано як є, то було б трівіально, але замість `true` та `false`, ви можете впровадити складніші вирази, наприклад `Math.Log10(10.0) == 1.0` для `true` або `Math.Log10(1) == 1.0` для `false`. Або навіть ще більш складніші вирази. Якщо ви достатньо кмітливі, ви можете навіть генерувати складніші вирази по мірі просування.

Отже, давайте спробуємо впровадити фальшиві умови, які не впливають на гілки виконання.

Давайте розглянемо, як виглядає IL код для представленого раніше C# коду.

```il
// if (x > 4)
IL_0000: ldarg.0
         ldc.i4.4
         ble.s IL_000e

// Console.WriteLine("This is under condition");
         ldstr "This is under condition"
         call void [System.Console]System.Console::WriteLine(string)
IL_000e:
// Some code after if
```

і припустимо, ми хочемо вставити `1.0 == Math.Log(1.0) ||`

```il
// if (1.0 == Math.Log(1.0) || x > 4)
IL_0000: ldc.r8 1
         ldc.r8 1
         call float64 [System.Runtime]System.Math::Log(float64)
         beq.s IL_0039

         ldarg.0
         ldc.i4.4
         ble.s IL_0043

IL_0039:
// Console.WriteLine("This is under condition");
         ldstr "This is under condition"
         call void [System.Console]System.Console::WriteLine(string)
IL_0043:
// Some code after if
```

З прикладу видно, що нам потрібно тільки впровадити 4 IL інструкції, щоб досягти цієї мети.

```il
IL_0000: ldc.r8 1
         ldc.r8 1
         call float64 [System.Runtime]System.Math::Log(float64)
         beq.s IL_0039
```

А точка впровадження буде знаходженням деякої умовної інструкції гілки, такої як `ble.s` або `bge.s`, який мають `ldarg.s` або інші варіанти, наприклад.

```csharp
for (int i = 2; i < method.Body.Instructions.Count; i++)
{
    var instr = method.Body.Instructions[i];
    if (instr.IsConditionalBranch()
        && (method.Body.Instructions[i - 1].IsLdarg() || method.Body.Instructions[i - 1].IsLdloc()
        || method.Body.Instructions[i - 2].IsLdarg() || method.Body.Instructions[i - 2].IsLdloc()))
    {
        var nextInstruction = method.Body.Instructions[i + 1];
        // ldc.r8 1
        var const1 = new Instruction(
            OpCodes.Ldc_R8,
            1.0);
        method.Body.Instructions.Insert(i - 2, const1);
        // ldc.r8 1
        var const1_2 = new Instruction(
            OpCodes.Ldc_R8,
            1.0);
        method.Body.Instructions.Insert(i - 1, const1_2);
        // call Math::Log(double)
        var mathLog = new Instruction(
            OpCodes.Call,
            module.Import(typeof(Math).GetMethod("Log", [typeof(double)])));
        method.Body.Instructions.Insert(i, mathLog);
        // call Math::Log(double)
        var breqNext = new Instruction(
            OpCodes.Beq_S,
            nextInstruction);
        method.Body.Instructions.Insert(i + 1, breqNext);
        i = i + 4; // Skip the instructions we just added
    }
}
```

як видите, це трохи втомливо, і легко зробити неправильно, але в той же час це найпростіша річ, яку ви можете зробити без залучення складнішого машинерію, яку я покажу далі.

## Вставлення мертвого коду

Це дуже проста техніка, вся ідея полягає в наступному: вставити будь-яку дійсну IL послідовність, яка ніколи не позичає що-небудь зі стеку, крім того, що вона сама помістила, і після завершення послідовності залишити стек незміненим, і без будь-яких зовнішніх побічних ефектів. Приклади побічних ефектів - це переповнення, ділення на 0 або інші помилки виконання. Ми можемо додати додаткові невикористовувані змінні та зберегти до них значення для додаткової плутанини.

Найбільш тривіальним прикладом буде відправлення константи на стек та видалення значення звідти. Знову ж таки, це для демонстрації техніки обфускації, ви можете покращити це далі як хочете.

```csharp
var injectionPoint = random.Next(method.Body.Instructions.Count);

var const1 = new Instruction(
    OpCodes.Ldc_R8,
    1.0);
method.Body.Instructions.Insert(injectionPoint, const1);
var pop = new Instruction(OpCodes.Pop);
method.Body.Instructions.Insert(injectionPoint + 1, pop);
```

Більш цікавий приклад буде вставлення умовного переходу на випадкову локацію з використанням умови, яка конструюється таким чином, щоб ніколи не спрацювати. Це ускладнює аналіз базових блоків у деобфускатора і ускладнює відстеження логіки. Щоб правильно це реалізувати, ми повинні ввести концепцію базових блоків. 

## Базові блоки

Давайте визначимо, що таке базовий блок. Базовий блок — це набір інструкцій, який можна ввести тільки через першу інструкцію, і вийти тільки через останню інструкцію.

Базові блоки починаються з
- Точки входу функції
- Інструкцій, які є цілями переходу
- Початку захищених блоків
- Обробників винятків та обробників finally
- Інструкції switch

Базові блоки закінчуються з
- Кінця захищених блоків
- Інструкцій: ret, br, bgt, ble, …, bXXX

Давайте подивимось, як це буде виглядати для простої функції C#

```csharp
static void Worker(int x)
{
    if (x > 4)
    {
        Console.WriteLine("Hello, Conditions!");
    }
} 
```

Декомпільований вихідний код.

```il
IL_0000: ldarg.0
IL_0001: ldc.i4.4
IL_0002: ble.s IL_000e

IL_0004: ldstr "Hello, Conditions!"
IL_0009: call void [System.Console]System.Console::WriteLine(string)

IL_000e: ret
```

і базові блоки для функції виглядатимуть так

<pre class="mermaid">
flowchart TD
    A[IL_0000: ldarg.0
IL_0001: ldc.i4.4
IL_0002: ble.s IL_000e] --> B("IL_0004: ldstr #quot;Hello, Conditions!#quot;
IL_0009:&nbsp;call&nbsp;void&nbsp;[System.Console]System.Console::WriteLine(string)")
    B --> C(IL_000e: ret)
    A -.-> C  
</pre>

Для аналізу давайте використовуватимемо такі класи

```cs
class BasicBlock
{
    public List<Instruction> Instructions { get; set; } 
        = new List<Instruction>();
}

class FlowGraph
{
    public List<BasicBlock> BasicBlocks { get; set; } 
        = new List<BasicBlock>();

    public FlowGraph(MethodDef method)
    {
        // Some magic which I will show below.
    }
}
```

Це дуже мінімальна версія, але знову ж таки, це концепції, а не супер надійна розробка.

Реалізація може бути розділена на наступні частини
- Пошук початку базових блоків за допомогою лінійного сканування. Перевірка br/ret/цілей переходу
- Заповнення базових блоків інструкціями

Пошук початку базових блоків за допомогою лінійного сканування. Перевірка br/ret/цілей переходу дуже проста. Просто пройдіть через список інструкцій і запишіть початок ББ.

```cs
List<int> basicBlocksStart = new() { 0 };
for (int i = 1; i < method.Body.Instructions.Count; i++)
{
    var instr = method.Body.Instructions[i];
    if (instr.IsBr() || instr.IsConditionalBranch() || instr.OpCode == OpCodes.Ret)
    {
        if (instr.IsConditionalBranch())
        {
            var instructionIndex = method.Body.Instructions.IndexOf((Instruction)instr.Operand);
            basicBlocksStart.Add(instructionIndex);
        }

        if (i + 1 < method.Body.Instructions.Count)
        {
            basicBlocksStart.Add(i + 1);
            i++; // пропустіть наступну інструкцію, так як це ми додали її.
            continue;
        }
    }
}
```

Тут заповнення базових блоків інструкціями. Просто використовуйте попередньо зібрану інформацію та скопіюйте від початку до початку наступного ББ у поточний ББ.

```cs
basicBlocksStart = basicBlocksStart.Distinct().ToList();
basicBlocksStart.Sort();
for (int i = 0; i < basicBlocksStart.Count; i++)
{
    var block = new BasicBlock();
    var finish = i == basicBlocksStart.Count - 1 
        ? method.Body.Instructions.Count 
        : basicBlocksStart[i + 1];
    for (int j = basicBlocksStart[i]; j < finish; j++)
    {
        block.Instructions.Add(method.Body.Instructions[j]);
    }

    BasicBlocks.Add(block);
}
```

І тепер нам потрібен спосіб зберегти наш графік назад у тіло методу

```cs
public void Save(MethodDef method)
{
    method.Body.Instructions.Clear();
    foreach (var block in BasicBlocks)
    {
        foreach (var instr in block.Instructions)
        {
            method.Body.Instructions.Add(instr);
        }
    }
}
```

Це супер базова машинерія, але ви можете використовувати її вже зараз у простих інструментах.

Процес фальшивої умови буде таким
- Конструювати BB граф
- Знайти випадковий блок BB як ціль додавання
- Знайти випадковий блок BB як ціль фальшивого переходу
- Додати фальшивий базовий блок

```cs
var flowGraph = new FlowGraph(method);
if (flowGraph.BasicBlocks.Count == 1)
    continue;
// ldc.r8 1
var const1 = new Instruction(
    OpCodes.Ldc_R8,
    1.0);
// ldc.r8 1
var const1_2 = new Instruction(
    OpCodes.Ldc_R8,
    1.0);
// call Math::Log(double)
var mathLog = new Instruction(
    OpCodes.Call,
    module.Import(typeof(Math).GetMethod("Log", [typeof(double)])));
// Beq_S
var randomBB = Random.Shared.Next(flowGraph.BasicBlocks.Count - 1);
var randomTarget = Random.Shared.Next(flowGraph.BasicBlocks.Count - 1);
var fakeInstruction = flowGraph.BasicBlocks[randomTarget].Instructions[0];
var breqNext = new Instruction(
    OpCodes.Beq_S,
    fakeInstruction);
flowGraph.BasicBlocks.Insert(randomBB, new BasicBlock()
{
    Instructions =
    {
        const1,
        const1_2,
        mathLog,
        breqNext
    }
});
flowGraph.Save(method);
```

Як ви можете бачити, маніпулювань номерів інструкцій немає, як я робив у "простому" впровадженні умови. 

Тепер давайте вставимо 

```cs
// було до цього
flowGraph.BasicBlocks.Insert(randomBB, new BasicBlock()
{
    Instructions =
    {
        const1,
        const1_2,
        mathLog,
        breqNext
    }
});
// стало зараз
flowGraph.BasicBlocks.Insert(randomBB + 1, new BasicBlock()
{
    Instructions =
    {
        new Instruction(OpCodes.Ldc_I4_0),
        new Instruction(OpCodes.Pop),
    }
});

// було до цього
flowGraph.Save(method);
```

Ось і все. Отже, в основному, заплутування потоку керування — це модифікації графу.

Приклад результату буде таким

```cs
static void Worker(int x)
{
    if (x > 4)
    {
        if (1.0 != Math.Log(1.0))
        {
            _ = 0;
        }
        Console.WriteLine("Hello, Conditions!");
    }
}
```

На цьому все на сьогодні. Знову ж таки, фінальний код можна знайти на [допоміжному репо](https://github.com/kant2002/obfuscation-talk)