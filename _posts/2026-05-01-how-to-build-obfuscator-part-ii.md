---
layout: post
title:  "How to build .NET obfuscator - Part II"
date:   2026-05-02 17:54:44 +0200
categories: en obfuscators
comments: true
---

<script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, logLevel: 'trace' });
  document.querySelectorAll('pre > code.language-mermaid').forEach((codeBlock) => {
    codeBlock.parentElement.outerHTML = `<pre class="mermaid">${codeBlock.textContent}</pre>`;
  });
</script>


This is continuation of series about writing obfuscators. You can read first article [here](2026-04-02-how-to-build-obfuscator-part-i.md)

We finished with string replacement and primitive obfuscation runtime.
Now it's time to spice things up a bit. Before that we write relatively simple obfuscation techniques, which is quite trivial to undo. In this article I would explain how to transform control flow in such way that make your life a bit harder.

Let's start make control flow harder to follow.

<!--more-->

## Simple condition modifications

Most basic way to confuse control flow, is to inject false logical calculation into exiting conditional branches. For example if we have code like this

```csharp
if (x > 4)
{
    Console.WriteLine("This is under condition");
}
```

can be transformed to
```csharp
if (true && x > 4)
{
    Console.WriteLine("This is under condition");
}
```
or 
```csharp
if (false || x > 4)
{
    Console.WriteLine("This is under condition");
}
```

That looks silly, and if written as it is, it would be, but instead of `true` and `false`, you can inject more complicated expressions, for example `Math.Log10(10.0) == 1.0` for `true` or `Math.Log10(1) == 1.0` for `false`. Or even more complicated expressions. If you clever enough, you can even generate more complicated expression as you go.

So let's try to inject that false conditions which does not affect branching.

Let's look at how IL code looks for the C# code presented earlier.

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

and let's say we want to insert `1.0 == Math.Log(1.0) ||`

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

From the example you can see that we need only inject 4 IL instructions to achieve this goal.

```il
IL_0000: ldc.r8 1
         ldc.r8 1
         call float64 [System.Runtime]System.Math::Log(float64)
         beq.s IL_0039
```

And the injection point would be finding some conditional branch instruction like `ble.s` or `bge.s` which have `ldarg.s` or other variants for example.

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

as you can see, this is a bit tedious, and easy to make wrong, but at the same time, that's simplest things which you can do without involving more complicated machinery which I will show now.

## Dead code insertion

This is pretty simple technique, whole idea is following: insert any valid IL sequence which never borrow anything from stack, except what it placed by itself, and after end of sequence leave stack unchanged, and without any external side-effects. Example of side-effects, is overflow, division by 0, or other runtime exception. We can add additional unused variables and save value to them to get intermediate results, for additional confusion.

Most trivial example would be push constant on the stack, and pop value from there. Again, this is to show obfuscation technique, you can improve that further as you want.

```csharp
var injectionPoint = random.Next(method.Body.Instructions.Count);

var const1 = new Instruction(
    OpCodes.Ldc_R8,
    1.0);
method.Body.Instructions.Insert(injectionPoint, const1);
var pop = new Instruction(OpCodes.Pop);
method.Body.Instructions.Insert(injectionPoint + 1, pop);
```

More interesting example would be insertion of conditional jump to random location using condition which would be constructed in such way to never trigger. That complicates BB analysis of the deobfuscator and make it harder to track logic. In order to implement this properly, we should introduce concept of basic blocks. 

## Basic blocks

Let’s define what basic block is. Basic block is set of instructions which can be entered only via first instruction, and leave only via last instruction.

Basic blocks begin with
- Function entry point
- Instruction which are jump targets
- Begin of protected blocks
- Exception handlers and finally handlers
- Instruction switch

Basic blocks ends with
- End of protected blocks
- Instructions: ret, br, bgt, ble, …, bXXX

Let's see how it will looks like for simple C# function

```csharp
static void Worker(int x)
{
    if (x > 4)
    {
        Console.WriteLine("Hello, Conditions!");
    }
} 
```

Decompiled source code.

```il
IL_0000: ldarg.0
IL_0001: ldc.i4.4
IL_0002: ble.s IL_000e

IL_0004: ldstr "Hello, Conditions!"
IL_0009: call void [System.Console]System.Console::WriteLine(string)

IL_000e: ret
```

and basic blocks for the function would looks like this

<pre class="mermaid">
flowchart TD
    A[IL_0000: ldarg.0
IL_0001: ldc.i4.4
IL_0002: ble.s IL_000e] --> B("IL_0004: ldstr #quot;Hello, Conditions!#quot;
IL_0009:&nbsp;call&nbsp;void&nbsp;[System.Console]System.Console::WriteLine(string)")
    B --> C(IL_000e: ret)
    A -.-> C  
</pre>

For analysis let’s use following classes

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

This is very barebone, but again, this is concepts and not fool proof implementation.

Implementation can be split onto 3 parts
- Finding start of basic blocks using linear scan. Check br/ret/jump targets
- Fill basic blocks with instructions

Finding start of basic blocks using linear scan. Check br/ret/jump targets is that simple. Just walk through list of instructions and record start of bb.

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
            i++; // skip next instruction, since we already add it.
            continue;
        }
    }
}
```

Here the filling basic blocks with instructions. Just use previously collected information and copy from start to start of next bb into current bb.

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

And now we need a way to store our graph, back to method body

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

This is super basic machinery, but you can use it in simple tools now.

Process of fake condition would be following
- Construct BB graph
- Find random BB block as target for injection
- Find random BB block as target for fake jump
- Inject fake basic block

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

As you may see, there no instructions number manipulations, as I did in "simple" condition insertion. 

Now let's insert 

```cs
// was before
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
// added now
flowGraph.BasicBlocks.Insert(randomBB + 1, new BasicBlock()
{
    Instructions =
    {
        new Instruction(OpCodes.Ldc_I4_0),
        new Instruction(OpCodes.Pop),
    }
});

// was before
flowGraph.Save(method);
```

That's it. So basicaly confusing control flow is graph modifications now.

Example of output would be like this

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

That's it for today. Again final code can be found at [supplementary repo](https://github.com/kant2002/obfuscation-talk)