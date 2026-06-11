---
layout: post
title:  "Як побудувати .NET обфускатор - Частина III"
date:   2026-06-11 12:27:44 +0200
categories: uk обфускатори
comments: true
use_mermaid: true
---

Це продовження серії про написання обфускаторів. Ви можете прочитати першу статтю [тут]({% post_url 2026-05-24-how-to-build-obfuscator-part-i-uk %}), а другу [тут]({% post_url 2026-06-01-how-to-build-obfuscator-part-ii-uk %}).

Друга частина завершилася демонстрацією базової генерації умов та впровадження мертвого коду. Сьогодні розглянемо, як покращити генерацію шумового виразу.

<!--more-->

Генерація виразів досить проста. У компіляторах вирази представлені у вигляді бінарного дерева, де до кожного вузла прикріплена операція. Посадімо дерево й подивімося, як воно росте.

Ось наші вузли:

```csharp
abstract record Expr;
record ConstInt32(int Value) : Expr;
record AddOperation(Expr Left, Expr Right) : Expr;
record SubOperation(Expr Left, Expr Right) : Expr;
record MulOperation(Expr Left, Expr Right) : Expr;
record DivOperation(Expr Left, Expr Right) : Expr;
record ModOperation(Expr Left, Expr Right) : Expr;
```

Маємо базовий клас `Expr`, який представляє наш вираз як абстрактну концепцію. Інші вузли представляють точний тип виразу. `ConstInt32` — це вираз, що представляє літерал int, а `AddOperation`, `SubOperation`, `MulOperation`, `DivOperation` та `ModOperation` представляють відповідно бінарні оператори `+`, `-`, `*`, `/` та `%`.

Визначмо нашу функцію генерації виразу з такою сигнатурою: `(Expr, int) Generator(int fuel)`. Ця функція приймає `fuel`, який представляє здатність функції згенерувати вираз. Ця назва походить із жаргону доведення завершуваності функцій. На практиці, якщо fuel менший за 0, програма завершується. Я використовую його так: якщо fuel дорівнює 0, я генерую вираз, який не потребує додаткової рекурсії, у нашому випадку це буде `ConstInt32`. У всіх інших випадках я генерую випадковий вузол, і якщо ці вузли потребують підвиразів, я генерую їх функцією генерації, передаючи їм менше fuel. Цей підхід гарантує, що наша генерація завжди завершується. Подивімося, як це виглядає на практиці.

```csharp
(Expr, int) Generator(int fuel)
{
    if (fuel == 0)
    {
        var value = Random.Shared.Next(100);
        return (new ConstInt32(value), value);
    }
    var op = Random.Shared.Next(5);
    var (left, leftValue) = Generator(fuel - 1);
    var (right, rightValue) = Generator(fuel - 1);
    switch (op)
    {
        case 0:
            return (new AddOperation(left, right), leftValue + rightValue);
        case 1:
            return (new SubOperation(left, right), leftValue - rightValue);
        case 2:
            return (new MulOperation(left, right), leftValue * rightValue);
        case 3:
            if (rightValue == 0)
                return Generator(fuel - 1);
            return (new DivOperation(left, right), leftValue / rightValue);
        case 4:
            if (rightValue == 0)
                return Generator(fuel - 1);
            return (new ModOperation(left, right), leftValue % rightValue);
    }
    return (new AddOperation(left, right), rightValue);
}
```

Ось і все. Ми випадковим чином обираємо операцію для генерації та просимо функцію згенерувати підвирази, якщо це необхідно. Під час генерації ми також автоматично обчислюємо значення згенерованого виразу. Це потрібно, якщо ми хочемо використати згенерований вираз для порівняння. Якщо ми хочемо згенерувати завжди істинне порівняння для згенерованого виразу, який має, наприклад, значення 42, то ми можемо отримати такі вирази: `42 == 42`, `123 > 42`, `123 >= 42`, `13 < 42`, `13 <= 42`, де `123` — це випадкове число, більше за `42`, а `13` — випадкове число, менше за `42`. Тож ми обчислюємо значення виразу поступово, щоб уникнути необхідності повторно його обчислювати потім. Звідси й тип повернення `(Expr, int)`.

Тепер настав час згенерувати IL-код з нашого виразу. Насправді це теж дуже просто, оскільки в нас є стекова машина. Достатньо сгенерувати підвирази, а потім сгенерувати IL-опкод, що відповідає операції. Так, це настільки просто.

```csharp
void GenerateMethodBody(Expr expr, IList<Instruction> il)
{
    switch (expr)
    {
        case ConstInt32 c:
            il.Add(Instruction.Create(OpCodes.Ldc_I4, c.Value));
            break;
        case AddOperation a:
            GenerateMethodBody(a.Left, il);
            GenerateMethodBody(a.Right, il);
            il.Add(Instruction.Create(OpCodes.Add));
            break;
        // ... Інші типи виразів пропущені для ясності.
        default:
            throw new InvalidOperationException($"The expression {expr} is not supported");
    }
}
```

Створімо невеликий застосунок, який викликає цю машинерію, щоб побачити, що генерується.

```csharp
using dnlib.DotNet.Emit;

var (expr, value) = Generator(3);
var body = new CilBody();
GenerateMethodBody(expr, body.Instructions);

Console.WriteLine("Expression");
Console.WriteLine("{0}", expr);
Console.WriteLine("Value");
Console.WriteLine("{0}", value);

Console.WriteLine("IL Code\n{0}", body);
for (var i = 0; i < body.Instructions.Count; i++)
{
    Console.WriteLine("{0}", body.Instructions[i]);
}
```

А ось і результат. Я трохи відформатую вираз, щоб зробити його кращім, бо C# не генерує таких представлень ToString для records.

```
Expression
DivOperation { 
    Left = MulOperation { 
        Left = SubOperation { 
            Left = ConstInt32 { Value = 4 }, 
            Right = ConstInt32 { Value = 9 } 
        }, 
        Right = SubOperation { 
            Left = ConstInt32 { Value = 73 }, 
            Right = ConstInt32 { Value = 9 } 
        } 
    }, 
    Right = DivOperation { 
        Left = MulOperation { 
            Left = ConstInt32 { Value = 34 },
            Right = ConstInt32 { Value = 13 }
        }, 
        Right = AddOperation { 
            Left = ConstInt32 { Value = 6 }, 
            Right = ConstInt32 { Value = 5 } 
        } 
    } 
}
Value
-8
```

та згенерований IL-код
```il
dnlib.DotNet.Emit.CilBody
IL_0000: ldc.i4 4
IL_0000: ldc.i4 9
IL_0000: sub
IL_0000: ldc.i4 73
IL_0000: ldc.i4 9
IL_0000: sub
IL_0000: mul
IL_0000: ldc.i4 34
IL_0000: ldc.i4 13
IL_0000: mul
IL_0000: ldc.i4 6
IL_0000: ldc.i4 5
IL_0000: add
IL_0000: div
IL_0000: div
```

Якщо ви інтегруєте це в попередні обфускатори, ви помітите, що ILSpy легко спрощує ці вирази. Це точно не те, чого ви хочете. ILSpy використовує дуже просту стратегію, тому ми можемо протидіяти йому в інший спосіб. Згенеруймо також виклики функцій. Я використаю `Math.Abs` як простий виклик, якого буде достатньо, щоб збити ILSpy зі шляху на виразах.

Додайте власний вираз:

```csharp
record AbsOperation(Expr Operand) : Expr;
```

Змініть діапазон згенерованих чисел з `var op = Random.Shared.Next(5);` на `var op = Random.Shared.Next(6);`.

Додайте випадок генерації для `AbsOperation`:

```csharp
case 5:
    {
        var (left, leftValue) = Generator(fuel - 1);
        return (new AbsOperation(left), leftValue);
    }
```

та додайте генерацію IL для відповідного виразу:
```
case AbsOperation a:
    GenerateMethodBody(a.Operand, il);
    il.Add(Instruction.Create(OpCodes.Call, module.Import(typeof(Math).GetMethod("Abs", [typeof(int)]))));
    break;
```

Тепер ви можете насолодитися математикою у своєму коді.

```csharp
if (Math.Abs(20 + 90) * Math.Abs(31 + 92) - (51 * 20 - (56 + 84)) * (56 % 20 - (96 - 15)) != 0)
{
    int num = Math.Abs(Math.Abs(12) + (36 - 17));
}
```

На сьогодні це все. Як завжди, фінальний код доступний у [супровідному репозиторії](https://github.com/kant2002/obfuscation-talk).
