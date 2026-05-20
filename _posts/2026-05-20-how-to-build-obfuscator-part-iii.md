---
layout: post
title:  "How to build .NET obfuscator - Part III"
date:   2026-05-20 12:27:44 +0200
categories: en obfuscators
comments: true
use_mermaid: true
---

This is continuation of series about writing obfuscators. You can read first article [here]({% post_url 2026-04-02-how-to-build-obfuscator-part-i %}), and second one  [here]({% post_url 2026-05-01-how-to-build-obfuscator-part-ii %}) 


Second part ends with showing basic condition generation and dead code injection. Let's learn how to improve generation of the noise expression today.

<!--more-->

Generation of the expressions are pretty easy. In compilers expressions represented as binary tree where each node have operation attached to it. Let's plant a tree and see how it grows. 

Here our nodes:

```csharp
abstract record Expr;
record ConstInt32(int Value) : Expr;
record AddOperation(Expr Left, Expr Right) : Expr;
record SubOperation(Expr Left, Expr Right) : Expr;
record MulOperation(Expr Left, Expr Right) : Expr;
record DivOperation(Expr Left, Expr Right) : Expr;
record ModOperation(Expr Left, Expr Right) : Expr;
```

We have base class `Expr` which is our expression. And other nodes which represent exact type of expression. `ConstInt32` is expression representing int literal, `AddOperation`, `SubOperation`, `MulOperation`, `DivOperation` and `ModOperation` represents binary operators `+', `-`, `*`, `/` and `%` respectively.

Let's define our expression generation function with following signature `(Expr, int) Generator(int fuel)`. This function accept fuel which represents ability of function to generate expression. That name comes from proof termination parlance. Basically if you have fuel less than 0, the program is terminated. I use it following way, if fuel is 0 I would generate expression which does not requrie additional recursion, in our case it would be generation of `ConstInt32`. For all other cases I would generate random node, and if these nodes require subexpressions, then I will generate them with generation function, but give less fuel to work on. That process makes sure that our generation process is always terminates. Let's see how it looks in practice

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

That's it. Randomly choose which operation to generate, and ask function to generate subexpressions as nescessary. During generation we also automatically calculate the value of the generated expression. That's needed if we want use generated expression for some comparison. If we want to generate always true comparison for generated expression which have, for example, value 42, then we can generate following expressions `42 == 42`, `123 > 42`, `123 >= 42`, `13 < 42`, `13 <= 42`, where `123` is random number greater then `42` and `13` is random number less then `42`. So we just calculate expression value as we go, to remove need to re-eavaluate expression again. Thus `(Expr, int)` type for return values.

Now it's time to generate IL code from our expression. That's actually also very simple, since we have stack machine. We just emit subexpressions, and then emit IL opcode which corresponds to the operation. That's as simple as that.

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
        // ... Other expression types omitted for brevity.
        default:
            throw new InvalidOperationException($"The expression {expr} is not supported");
    }
}
```

Let's create small application which invokes machinery, to see what's generated.

```
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

And the result is following. I format expression a bit, to make it pretty, since C# does not generate such pretty ToString representations of records.

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

and the IL Code generated
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

If you embed this into previous obfuscators, you will notice that ILSpy easiely simplify these expressions. That's definitely not what you want. ILSpy utilize very simple strategy, so we can combat it in different way. Let's generate function calls too. I will use `Math.Abs` as simple call adding which would be enough, to make ILSpy choke on the expressions.

Add custom expression
```
record AbsOperation(Expr Operand) : Expr;
```

Change range of generated numbers from `var op = Random.Shared.Next(5);` to `var op = Random.Shared.Next(6);`.

Add case for `AbsOperation` generation.
```
case 5:
    {
        var (left, leftValue) = Generator(fuel - 1);
        return (new AbsOperation(left), leftValue);
    }
```

and add IL generation for corresponing expression.
```
case AbsOperation a:
    GenerateMethodBody(a.Operand, il);
    il.Add(Instruction.Create(OpCodes.Call, module.Import(typeof(Math).GetMethod("Abs", [typeof(int)]))));
    break;
```

Now you can enjoy a bit of math in you code.

```csharp
if (Math.Abs(20 + 90) * Math.Abs(31 + 92) - (51 * 20 - (56 + 84)) * (56 % 20 - (96 - 15)) != 0)
{
    int num = Math.Abs(Math.Abs(12) + (36 - 17));
}
```

That's it for today. As usual final code can be found at [supplementary repo](https://github.com/kant2002/obfuscation-talk)