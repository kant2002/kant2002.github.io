---
layout: post
title:  "Comment construire un obfuscateur .NET - Partie II"
date:   2026-05-12 16:54:44 +0200
categories: fr obfuscators
comments: true
---

<script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, logLevel: 'trace' });
  document.querySelectorAll('pre > code.language-mermaid').forEach((codeBlock) => {
    codeBlock.parentElement.outerHTML = `<pre class="mermaid">${codeBlock.textContent}</pre>`;
  });
</script>


Ceci est la continuation de la série sur l'écriture d'obfuscateurs. Vous pouvez lire le premier article [ici]({% post_url 2026-04-18-comment-construire-un-obfuscateur-i-partie %})


Nous avons terminé avec le remplacement de chaînes et l'obfuscation primitive du runtime.
Il est maintenant temps de compliquer les choses un peu. Jusqu'à présent, nous avons écrit des techniques d'obfuscation relativement simples, qui sont assez triviales à défaire. Dans cet article, je vais expliquer comment transformer le flux de contrôle de manière à rendre la vie un peu plus difficile.

Commençons par rendre le flux de contrôle plus difficile à suivre.

<!--more-->

## Modifications simples de conditions

Le moyen le plus basique de confondre le flux de contrôle est d'injecter des calculs logiques faux dans les branches conditionnelles existantes. Par exemple, si nous avons un code comme ceci

```csharp
if (x > 4)
{
    Console.WriteLine("This is under condition");
}
```

peut être transformé en
```csharp
if (true && x > 4)
{
    Console.WriteLine("This is under condition");
}
```
ou 
```csharp
if (false || x > 4)
{
    Console.WriteLine("This is under condition");
}
```

Cela semble bête, et si c'était écrit ainsi, ce serait le cas, mais au lieu de `true` et `false`, vous pouvez injecter des expressions plus compliquées, par exemple `Math.Log10(10.0) == 1.0` pour `true` ou `Math.Log10(1) == 1.0` pour `false`. Ou même des expressions encore plus compliquées. Si vous êtes assez malin, vous pouvez même générer des expressions plus compliquées au fur et à mesure.

Essayons donc d'injecter des conditions fausses qui n'affectent pas le branchement.

Regardons comment le code IL ressemble pour le code C# présenté précédemment.

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

et supposons que nous voulons insérer `1.0 == Math.Log(1.0) ||`

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

À partir de l'exemple, vous pouvez voir que nous avons besoin d'injecter seulement 4 instructions IL pour atteindre cet objectif.

```il
IL_0000: ldc.r8 1
         ldc.r8 1
         call float64 [System.Runtime]System.Math::Log(float64)
         beq.s IL_0039
```

Et le point d'injection serait de trouver une instruction de branchement conditionnel comme `ble.s` ou `bge.s` qui ont `ldarg.s` ou d'autres variantes par exemple.

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
        // appel Math::Log(double)
        var mathLog = new Instruction(
            OpCodes.Call,
            module.Import(typeof(Math).GetMethod("Log", [typeof(double)])));
        method.Body.Instructions.Insert(i, mathLog);
        // appel Math::Log(double)
        var breqNext = new Instruction(
            OpCodes.Beq_S,
            nextInstruction);
        method.Body.Instructions.Insert(i + 1, breqNext);
        i = i + 4; // Ignorer les instructions que nous venons d'ajouter
    }
}
```

Comme vous pouvez le voir, c'est un peu fastidieux et facile à mal faire, mais en même temps, c'est la chose la plus simple que vous puissiez faire sans impliquer des machines plus compliquées que je vais montrer maintenant.

## Insertion de code mort

C'est une technique assez simple, l'idée générale est la suivante : insérer une séquence IL valide quelconque qui n'emprunte rien à la pile, sauf ce qu'elle place elle-même, et après la fin de la séquence laisse la pile inchangée, et sans aucun effet secondaire externe. Un exemple d'effets secondaires est un débordement, une division par 0, ou d'autres exceptions runtime. Nous pouvons ajouter des variables inutilisées supplémentaires et sauvegarder des valeurs dans celles-ci pour obtenir des résultats intermédiaires, pour une confusion supplémentaire.

L'exemple le plus trivial serait de pousser une constante sur la pile et d'en pop une valeur de là. Encore une fois, c'est pour montrer la technique d'obfuscation, vous pouvez l'améliorer davantage comme vous le souhaitez.

```csharp
var injectionPoint = random.Next(method.Body.Instructions.Count);

var const1 = new Instruction(
    OpCodes.Ldc_R8,
    1.0);
method.Body.Instructions.Insert(injectionPoint, const1);
var pop = new Instruction(OpCodes.Pop);
method.Body.Instructions.Insert(injectionPoint + 1, pop);
```

Un exemple plus intéressant serait l'insertion d'un saut conditionnel vers un emplacement aléatoire en utilisant une condition qui serait construite de manière à ne jamais se déclencher. Cela complique l'analyse BB du déobfuscateur et rend plus difficile le suivi de la logique. Pour implémenter cela correctement, nous devrions introduire le concept de blocs de base. 

## Blocs de base

Définissons ce qu’est un bloc de base. Un bloc de base est un ensemble d’instructions qui ne peuvent être entrées que via la première instruction, et quitter que via la dernière instruction.

Les blocs de base commencent par
- Point d’entrée de la fonction
- Les instructions qui sont des cibles de saut
- Début des blocs protégés
- Gestionnaires d’exceptions et gestionnaires finally
- Instruction switch

Les blocs de base se terminent par
- Fin des blocs protégés
- Instructions : ret, br, bgt, ble, …, bXXX

Voyons comment cela ressemblera pour une simple fonction C#

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

et les blocs de base pour la fonction ressembleraient à ceci

<pre class="mermaid">
flowchart TD
    A[IL_0000: ldarg.0
IL_0001: ldc.i4.4
IL_0002: ble.s IL_000e] --> B("IL_0004: ldstr #quot;Hello, Conditions!#quot;
IL_0009:&nbsp;call&nbsp;void&nbsp;[System.Console]System.Console::WriteLine(string)")
    B --> C(IL_000e: ret)
    A -.-> C  
</pre>

Pour l’analyse, utilisons les classes suivantes

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
        // Un peu de magie que je vais montrer ci-dessous.
    }
}
```

C'est très minimaliste, mais encore une fois, c'est des concepts et non une implémentation infaillible.

L'implémentation peut être divisée en 3 parties
- Trouver le début des blocs de base en utilisant une analyse linéaire. Vérifier br/ret/cibles de saut
- Remplir les blocs de base avec les instructions

Trouver le début des blocs de base en utilisant une analyse linéaire. Vérifier br/ret/cibles de saut est très simple. Il suffit de parcourir la liste des instructions et d'enregistrer le début de bb.

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
            i++; // ignorer l'instruction suivante, car nous l'avons déjà ajoutée.
            continue;
        }
    }
}
```

Voici le remplissage des blocs de base avec les instructions. Utilisez simplement les informations précédemment collectées et copiez du début au début du prochain bb dans le bb actuel.

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

Et maintenant, nous avons besoin d'un moyen de stocker notre graphe, revenir au corps de la méthode

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

C'est une machinerie super basique, mais vous pouvez l'utiliser dans des outils simples maintenant.

Le processus de fausse condition serait le suivant
- Construire un graphe BB
- Trouver un bloc BB aléatoire comme cible d'injection
- Trouver un bloc BB aléatoire comme cible de saut faux
- Injecter un bloc de base faux

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
// appel Math::Log(double)
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

Comme vous pouvez le voir, il n'y a pas de manipulations de numéros d'instructions, comme je l'ai fait dans l'insertion de condition "simple". 

Maintenant, insérons

```cs
// avant
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
// ajouté maintenant
flowGraph.BasicBlocks.Insert(randomBB + 1, new BasicBlock()
{
    Instructions =
    {
        new Instruction(OpCodes.Ldc_I4_0),
        new Instruction(OpCodes.Pop),
    }
});

// avant
flowGraph.Save(method);
```

C'est tout. Donc fondamentalement, confondre le flux de contrôle est maintenant des modifications de graphe.

Un exemple de sortie ressemblerait à ceci

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

C'est tout pour aujourd'hui. Encore une fois, le code final peut être trouvé dans le [dépôt supplémentaire](https://github.com/kant2002/obfuscation-talk)