---
layout: post
title:  "Comment construire un obfuscateur .NET - Partie III"
date:   2026-05-20 12:27:44 +0200
categories: en obfuscators
comments: true
use_mermaid: true
---

Ceci est la suite de la série sur l'écriture d'obfuscateurs. Vous pouvez lire le premier article [ici]({% post_url 2026-04-18-comment-construire-un-obfuscateur-i-partie %}), et le second [ici]({% post_url 2026-05-12-comment-construire-un-obfuscateur-ii-partie %}).

La deuxième partie se termine en montrant la génération basique de conditions et l'injection de code mort. Voyons aujourd'hui comment améliorer la génération de l'expression de bruit.

<!--more-->

La génération des expressions est assez simple. Dans les compilateurs, les expressions sont représentées comme un arbre binaire où chaque nœud a une opération attachée. Plantons un arbre et voyons comment il pousse.

Voici nos nœuds :

```csharp
abstract record Expr;
record ConstInt32(int Value) : Expr;
record AddOperation(Expr Left, Expr Right) : Expr;
record SubOperation(Expr Left, Expr Right) : Expr;
record MulOperation(Expr Left, Expr Right) : Expr;
record DivOperation(Expr Left, Expr Right) : Expr;
record ModOperation(Expr Left, Expr Right) : Expr;
```

Nous avons la classe de base `Expr` qui représente notre expression. Les autres nœuds représentent le type exact de l'expression. `ConstInt32` est l'expression représentant un littéral int, `AddOperation`, `SubOperation`, `MulOperation`, `DivOperation` et `ModOperation` représentent respectivement les opérateurs binaires `+`, `-`, `*`, `/` et `%`.

Définissons notre fonction de génération d'expression avec la signature suivante `(Expr, int) Generator(int fuel)`. Cette fonction accepte un `fuel` qui représente la capacité de la fonction à générer une expression. Ce nom vient du jargon des preuves de terminaison. En pratique, si le fuel est inférieur à 0, le programme est terminé. Je l'utilise ainsi : si le fuel est 0, je génère une expression qui ne nécessite pas de récursion supplémentaire, dans notre cas ce sera `ConstInt32`. Dans tous les autres cas, je génère un nœud aléatoire, et si ces nœuds requièrent des sous-expressions, je les génère avec la fonction de génération en leur donnant moins de fuel. Ce procédé garantit que notre génération se termine toujours. Voyons comment cela se présente en pratique.

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

Voilà. On choisit aléatoirement l'opération à générer, et on demande à la fonction de générer les sous-expressions si nécessaire. Pendant la génération, nous calculons aussi automatiquement la valeur de l'expression générée. C'est nécessaire si l'on veut utiliser l'expression générée pour une comparaison. Si nous voulons générer une comparaison toujours vraie pour une expression générée qui a, par exemple, la valeur 42, alors nous pouvons produire les expressions suivantes : `42 == 42`, `123 > 42`, `123 >= 42`, `13 < 42`, `13 <= 42`, où `123` est un nombre aléatoire supérieur à `42` et `13` un nombre aléatoire inférieur à `42`. Donc on calcule la valeur de l'expression au fur et à mesure, pour éviter de devoir la réévaluer ensuite. D'où le type de retour `(Expr, int)`.

Il est maintenant temps de générer du code IL à partir de notre expression. C'est en fait également très simple, puisque nous avons une machine à pile. Il suffit d'émettre les sous-expressions, puis d'émettre l'opcode IL correspondant à l'opération. C'est aussi simple que ça.

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

Créons une petite application qui invoque cette machinerie, pour voir ce qui est généré.

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

Et voici le résultat. Je formate un peu l'expression pour la rendre plus jolie, car C# ne génère pas de telles représentations ToString des records.

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

et le code IL généré
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

Si vous intégrez cela dans les obfuscateurs précédents, vous remarquerez qu'ILSpy simplifie facilement ces expressions. Ce n'est certainement pas ce que vous voulez. ILSpy utilise une stratégie très simple, nous pouvons donc le contrer d'une manière différente. Générons aussi des appels de fonction. J'utiliserai `Math.Abs` comme appel simple qui suffira à faire chuter ILSpy sur les expressions.

Ajoutez l'expression personnalisée :
```
record AbsOperation(Expr Operand) : Expr;
```

Changez la plage des nombres générés de `var op = Random.Shared.Next(5);` à `var op = Random.Shared.Next(6);`.

Ajoutez le cas de génération pour `AbsOperation` :
```
case 5:
    {
        var (left, leftValue) = Generator(fuel - 1);
        return (new AbsOperation(left), leftValue);
    }
```

et ajoutez la génération IL pour l'expression correspondante :
```
case AbsOperation a:
    GenerateMethodBody(a.Operand, il);
    il.Add(Instruction.Create(OpCodes.Call, module.Import(typeof(Math).GetMethod("Abs", [typeof(int)]))));
    break;
```

Maintenant vous pouvez apprécier un peu de mathématiques dans votre code.

```csharp
if (Math.Abs(20 + 90) * Math.Abs(31 + 92) - (51 * 20 - (56 + 84)) * (56 % 20 - (96 - 15)) != 0)
{
    int num = Math.Abs(Math.Abs(12) + (36 - 17));
}
```

C'est tout pour aujourd'hui. Comme d'habitude, le code final est disponible sur le [répertoire complémentaire](https://github.com/kant2002/obfuscation-talk).