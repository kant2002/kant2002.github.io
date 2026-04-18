---
layout: post
title:  "Comment construire un obfuscateur .NET - Partie I"
date:   2026-04-18 12:19:44 +0200
categories: fr obfuscators
comments: true
---

Ce sera une courte série sur la façon de construire des obfuscateurs .NET. Les techniques sont quelque peu similaires pour d'autres langages, mais je choisirai celui que je connais le mieux.

Pour suivre, je vous recommande de connaître un peu de C#, [ECMA-335 - Partition II : Définition des métadonnées et sémantique](https://www.ecma-international.org/wp-content/uploads/ECMA-335_6th_edition_june_2012.pdf), et au moins d'avoir entendu parler de la bibliothèque .NET pour la modification des métadonnées - [dnlib](https://github.com/0xd4d/dnlib)

Vous devriez également connaître les machines virtuelles à pile, et les [opcodes IL](https://learn.microsoft.com/en-us/dotnet/api/system.reflection.emit.opcodes?view=net-10.0#fields). Si vous souhaitez mieux comprendre la sémantique de chaque opcode, veuillez lire ECMA-335.

<!--more-->

# Aide-mémoire

Si vous êtes complètement novice et très paresseux, voici un court aide-mémoire.

## Instructions

Instructions pour charger des valeurs sur la pile
- `ldc.i4.1`-`ldc.i4.8`
- `ldc.i4.s`/`ldc.i8.s`
- `ldarg.s`
- `ldloc.s`
- `ldstr`
- `ldnull`

Instructions pour les opérations mathématiques sur la pile
- `add`
- `sub`
- `mul`
- `div`

Instruction pour retourner une valeur de la pile à l'appelant
- ret

Instructions pour la comparaison et la logique booléenne
- `cgt`
- `ceq`
- `clt`

Instructions pour les modifications de flux de contrôle
- `br`
- `brtrue`
- `brfalse`
- `bgt`
- `blt`
- `ble`
- `bge`
- `beq`
- `bne`

Instructions pour appeler des méthodes
- `call`
- `calli`
- `callvirt`

## Métadonnées

Fondamentalement, les métadonnées .NET peuvent être vues comme une collection de tables de base de données. J'ai même écrit un petit outil appelé [MetadataDumper](https://github.com/kant2002/metadatadumper) pour les exporter vers des fichiers CSV, car ce sont les tables les plus accessibles.

Liste des tables de métadonnées .NET
- Assembly
- AssemblyRef
- ClassLayout
- Constant
- EventMap
- Event
- ExportedType
- Field
- FieldLayout
- FieldMarshal
- FieldRVA
- GenericParam
- GenericParamConstraint 
- ImplMap
- InterfaceImpl 
- ManifestResource
- MemberRef 
- MethodDef
- MethodImpl
- MethodSpec
- Module
- ModuleRef
- NestedClass
- Param
- Property
- PropertyMap
- StandAloneSig
- TypeDef
- TypeRef
- TypeSpec

Ouf, c'était une longue liste. Je n'avais pas réalisé qu'il y avait autant de petites choses nécessaires.

# Introduction à Dnlib

Vous devez être à l'aise pour commencer les modifications d'assemblage. Faisons donc un aller-retour

```csharp
// Lire le module depuis un fichier
ModuleContext modCtx = ModuleDef.CreateModuleContext();
ModuleDefMD module = ModuleDefMD.Load(assemblyFile, modCtx);
// Sauvegarder le module sans modification dans un autre fichier
module.Write(targetFile);
```

Après cela, vous pouvez inspecter les `Types` sur la variable `module`. Ces types ont des `Methods`, `Fields`, `Properties` et d'autres propriétés qui ont du sens. Utilisez Intellisense pour la découverte.

# Renommage

La technique la plus simple en matière d'obfuscation est le renommage. Il ne s'agit de rien de plus compliqué que de changer des valeurs dans les métadonnées et de sauvegarder les modifications.

Renommons donc les types. Je renommerai simplement les classes en Class0, Class1, Class2, etc. La plupart des obfuscateurs professionnels n'utilisent pas d'identificateurs normaux dans le cadre du renommage, car cela vous permet de faire un aller-retour de l'assemblage en utilisant la séquence ildasm/ilasm et de modifier facilement. Nous ne nous en soucions pas pour des raisons pédagogiques. Vous pouvez utiliser n'importe quelle stratégie de renommage qui vous semble intéressante.

```csharp
int typeCode = 0;
foreach (var type in module.Types)
{
    if (type.Name == "<Module>")
        continue;
    type.Name = "Class" + typeCode.ToString(CultureInfo.InvariantCulture);
    typeCode++;
}
```

Comme vous pouvez le remarquer - nous ne renommons pas la classe `<Module>`. C'est la classe statique standard qui est instanciée par le Common Language Runtime (CLR ou CoreCLR ou Unity) lorsque quelque chose de l'assemblage est utilisé.

C'est tout. C'est l'obfuscation pour vous.

Maintenant, nous pouvons étendre ce processus aux `Fields` et `Methods`

```csharp
int typeCode = 0;
foreach (var type in module.Types)
{
    if (type.Name == "<Module>")
        continue;
    type.Name = "Class" + typeCode.ToString(CultureInfo.InvariantCulture);
    typeCode++;
    int methodCode = 0;
    foreach (var method in type.Methods)
    {
        // Ignorer les noms bien connus
        if (type.Name == ".ctor" || type.Name == ".cctor")
            continue;
        method.Name = "Method" + methodCode.ToString(CultureInfo.InvariantCulture);
        methodCode++;
    }
    int fieldCode = 0;
    foreach (var field in type.Fields)
    {
        field.Name = "Field" + fieldCode.ToString(CultureInfo.InvariantCulture);
        fieldCode++;
    }
}
```

Nous pouvons vouloir, ou ne pas vouloir, obfusquer les informations publiques. Par exemple, dans une application, il n'est pas logique de conserver les noms originaux sauf si la Réflexion est utilisée. Dans les bibliothèques, il est logique de garder la surface publique intacte, mais d'obfusquer toutes les méthodes privées et internes. Faisons cela

```csharp
int typeCode = 0;
foreach (var type in module.Types)
{
    if (type.Name == "<Module>")
        continue;
    type.Name = "Class" + typeCode.ToString(CultureInfo.InvariantCulture);
    typeCode++;
    int methodCode = 0;
    foreach (var method in type.Methods)
    {
        // Ignorer les noms bien connus
        if (type.Name == ".ctor" || type.Name == ".cctor")
            continue;
        method.Name = "Method" + methodCode.ToString(CultureInfo.InvariantCulture);
        methodCode++;
    }
    int fieldCode = 0;
    foreach (var field in type.Fields)
    {
        field.Name = "Field" + fieldCode.ToString(CultureInfo.InvariantCulture);
        fieldCode++;
    }
}
```

Notez que dans le jargon ECMA-335, les membres protégés sont appelés Family. Voir `II.23.1.5 Flags for fields [FieldAttributes]`, `II.23.1.10 Flags for methods [MethodAttributes]` et `II.23.1.15 Flags for types [TypeAttributes]`. C'est l'une des nombreuses raisons pour lesquelles vous devez lire la spécification en entier. Ce sera certainement peu agréable.

# Suppression des propriétés

C'est l'une des méthodes d'obfuscation les plus faciles. Si vous vous demandez comment quelque chose peut être plus facile que le renommage, regardez ça. Les propriétés dans le CLR sont ces métadonnées qui combinent jusqu'à 2 méthodes getter et setter en une propriété virtuelle. Par exemple, si je définis une propriété automatique `X`, dans les métadonnées ce sera - propriété `X`, méthode `get_X` et `set_X`. Dans le code, les propriétés ne sont jamais utilisées, sauf via la Réflexion, donc si la réflexion n'est pas une option, nous pouvons simplement supprimer complètement les métadonnées des propriétés.

```csharp
foreach (var type in module.Types)
{
    if (type.Name == "<Module>")
        continue;
    type.Name = "Class" + typeCode.ToString(CultureInfo.InvariantCulture);
    type.Properties.Clear();
    typeCode++;
}
```

Il en serait de même pour la suppression des événements. Les événements construits dans les métadonnées ne sont qu'un champ + des méthodes add/remove/fire.

```csharp
foreach (var type in module.Types)
{
    if (type.Name == "<Module>")
        continue;
    type.Name = "Class" + typeCode.ToString(CultureInfo.InvariantCulture);
    type.Properties.Clear();
    type.Events.Clear();
    typeCode++;
}
```

# Encodage de chaînes - force brute

Ce n'est évidemment pas très utile même si c'est une technique d'obfuscation facile. Car vous voyez encore beaucoup de choses dans le code. Par exemple les chaînes. Encodons-les. Vous devriez probablement utiliser autre chose que Base64, mais je vais commencer par cela pour simplifier l'exemple.

Considérons ce code C#

```csharp
Console.WriteLine("Hello, World!");
```

Il est traduit en code IL suivant

```il
ldstr "Hello, World!"
call void [System.Console]System.Console::WriteLine(string)
```

Disons que nous voulons modifier toutes les chaînes pour appeler `Encoding.UTF8.GetString(Convert.FromBase64String(base64Str))`. Cela donnera le code suivant

```il
call class [System.Runtime]System.Text.Encoding [System.Runtime]System.Text.Encoding::get_UTF8()
ldstr "SGVsbG8sIFdvcmxkIQ=="
call uint8[] [System.Runtime]System.Convert::FromBase64String(string)
callvirt instance string [System.Runtime]System.Text.Encoding::GetString(uint8[])
call void [System.Console]System.Console::WriteLine(string)
```

Comme vous pouvez le voir, nous devons remplacer le ldstr original par 4 instructions et remplacer le `"Hello World!"` original par la valeur encodée en base64.

Pour cela, nous inspecterons les instructions du corps de la méthode et remplacerons chaque occurrence de `ldstr` par un nouveau motif

```csharp
foreach (var method in type.Methods)
{
    // Les méthodes PInvoke n'ont pas de corps. 
    // Les méthodes abstraites n'ont pas non plus de corps.
    // Nous ignorons donc ces cas
    if (!method.HasBody)
        continue;
    for (int i = 0; i < method.Body.Instructions.Count; i++)
    {
        var instr = method.Body.Instructions[i];
        // Détecter ldstr
        if (instr.OpCode == OpCodes.Ldstr)
        {
            var str = (string)instr.Operand;
            var encodedStr = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(str));
            instr.Operand = encodedStr;
            // Insérer le placement de Encoding.UTF8 sur la pile avant l'instruction ldstr
            var encoding = new Instruction(
                OpCodes.Call,
                module.Import(typeof(Encoding).GetProperty("UTF8", []).GetGetMethod()));
            method.Body.Instructions.Insert(i, encoding);
            // Insérer le placement de Convert.FromBase64String sur la pile avant l'instruction ldstr
            var fromBase64String = new Instruction(
                OpCodes.Call,
                module.Import(typeof(Convert).GetMethod("FromBase64String", [typeof(string)])));
            method.Body.Instructions.Insert(i + 2, fromBase64String);
            // Insérer le placement de Encoding.GetString sur la pile avant l'instruction ldstr
            var getString = new Instruction(
                OpCodes.Call,
                module.Import(typeof(Encoding).GetMethod("GetString", [typeof(byte[])])));
            method.Body.Instructions.Insert(i + 3, getString);
            i = i + 3; // Ignorer les instructions que nous venons d'ajouter
        }
    }
}
```

Et voilà. Maintenant nous remplaçons tous les `ldstr` par le décodage de chaîne.

# Le runtime d'obfuscation et son injection

Comme il s'agit d'un cas simple d'encodage/décodage, il était assez facile à implémenter manuellement. Mais si nous voulons un encodage plus sophistiqué de la chaîne. Peut-être en utilisant des choses cryptographiquement sécurisées, peu importe ce que vous préférez. Alors l'injection manuelle de motifs devient infaisable. Cela est généralement résolu par l'injection de fonctions de runtime d'obfuscation qui effectuent ces fonctions pour vous. Imaginons que nous aurons la classe suivante dans l'assemblage cible

```csharp
static class Decoder
{
    public static string DecodeString(string str)
    {
        return Encoding.UTF8.GetString(Convert.FromBase64String(str));
    }
    public static string EncodeString(string str)
    {
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(str));
    }
}
```

Ensuite, nous pouvons utiliser cette classe dans l'assemblage cible directement en produisant le code C# suivant

```csharp
Console.WriteLine(Decoder.DecodeString("SGVsbG8sIFdvcmxkIQ=="))
```

qui est bien converti en IL

```il
ldstr "SGVsbG8sIFdvcmxkIQ=="
call string Decoder::DecodeString(string)
call void [System.Console]System.Console::WriteLine(string)
```

C'est beaucoup plus simple à remplacer. Il suffit d'encoder la chaîne et d'insérer l'instruction de décodage. Mais nous avons un problème, nous n'avons pas cette classe dans l'assemblage cible. Plaçons-la.

Le placement du code standard se fait en ayant le code de support du runtime dans un assemblage spécial depuis lequel nous copierons la classe dans l'assemblage cible. Pour simplifier, nous ne créerons pas d'assemblage séparé, et placerons le runtime modèle dans l'obfuscateur lui-même.

Pour cela, dnlib fournit un peu de support sous forme des classes `Importer` et `ImportMapper`. `Importer` est la classe qui effectue l'importation des types/méthodes/champs, mais `ImportMapper` est la classe qui maintient le contexte pour l'importation. Elle fournit essentiellement la correspondance entre le type/méthode/champ modèle et le type/méthode/champ cible dans notre cas. Le clonage réel n'est pas géré par l'`Importer`, il sera donc effectué explicitement dans d'autres fonctions.

dnlib rend la classe `ImportMapper` abstraite, car la plupart du temps vous aurez besoin de votre propre usage légèrement personnalisé. Créons donc une classe dérivée

```csharp
class InjectContext : ImportMapper
{
    public readonly Dictionary<IMemberRef, IMemberRef> DefMap = new Dictionary<IMemberRef, IMemberRef>();

    public readonly ModuleDef TargetModule;

    public InjectContext(ModuleDef target)
    {
        TargetModule = target;
        Importer = new Importer(target, ImporterOptions.TryToUseTypeDefs, new GenericParamContext(), this);
    }

    public Importer Importer { get; }

    /// <inheritdoc />
    public override ITypeDefOrRef? Map(ITypeDefOrRef source)
    {
        if (DefMap.TryGetValue(source, out var mappedRef))
            return mappedRef as ITypeDefOrRef;

        // Vérifier si la référence d'assemblage doit être corrigée.
        if (source is TypeRef sourceRef)
        {
            var targetAssemblyRef = TargetModule.GetAssemblyRef(sourceRef.DefinitionAssembly.Name);
            if (!(targetAssemblyRef is null) && !string.Equals(targetAssemblyRef.FullName, source.DefinitionAssembly.FullName, StringComparison.Ordinal))
            {
                // Nous avons trouvé un assemblage correspondant par le nom simple, mais pas par le nom complet.
                // Cela signifie que le code injecté utilise une version d'assemblage différente de l'assemblage cible.
                // Nous allons corriger la référence d'assemblage pour éviter de casser quoi que ce soit.
                var fixedTypeRef = new TypeRefUser(sourceRef.Module, sourceRef.Namespace, sourceRef.Name, targetAssemblyRef);
                return Importer.Import(fixedTypeRef);
            }
        }
        return null;
    }

    /// <inheritdoc />
    public override IMethod? Map(MethodDef source)
    {
        if (DefMap.TryGetValue(source, out var mappedRef))
            return mappedRef as IMethod;
        return null;
    }

    /// <inheritdoc />
    public override IField? Map(FieldDef source)
    {
        if (DefMap.TryGetValue(source, out var mappedRef))
            return mappedRef as IField;
        return null;
    }

    public override MemberRef? Map(MemberRef source)
    {
        if (DefMap.TryGetValue(source, out var mappedRef))
            return mappedRef as MemberRef;
        return null;
    }
}
```

Liste des choses à faire pour injecter une seule méthode :
- Injecter le type contenant la méthode dans l'assemblage cible
    - Créer la définition de méthode
    - Copier la signature de méthode
    - Copier les définitions de paramètres pour la méthode
    - Copier les informations de substitution (le cas échéant)
    - Copier les attributs personnalisés et leurs arguments
- Copier le corps de la méthode
    - Copier les variables locales
    - Copier chaque instruction avec remappage des types/méthodes/champs
    - Copier les gestionnaires d'exceptions
    - Corriger les nouvelles emplacements pour les instructions de flux de contrôle

Voyons comment faire cela en code.

Voici comment trouver le type dnlib depuis l'assemblage runtime. Dans notre cas, l'assemblage runtime est le même que la bibliothèque obfuscateur, mais en production vous voudrez le placer dans une bibliothèque séparée sans aucune dépendance, vous modifierez donc le code légèrement.

```csharp
// Obtenir le type runtime depuis l'assemblage existant.
TypeDef GetRuntimeTemplateType(string typeName)
{
    var runtimeModule = ModuleDefMD.Load(typeof(Program).Assembly.ManifestModule);
    return runtimeModule.Find(typeName, true);
}
```

Voici comment injecter un type.

```csharp
// Injecter la définition de type dans un nouveau type
static IEnumerable<IDnlibDef> Inject(TypeDef typeDef, TypeDef newType, ModuleDef target)
{
    var ctx = new InjectContext(target);
    ctx.DefMap[typeDef] = newType;
    PopulateContext(typeDef, ctx);
    foreach (MethodDef method in typeDef.Methods)
        CopyMethodDef(method, ctx);
    return ctx.DefMap.Values.Except(new[] { newType }).OfType<IDnlibDef>();
}
```

Populate context est en fait le remplissage des mappages pour `InjectionContext`.

```csharp
static TypeDef PopulateContext(TypeDef typeDef, InjectContext ctx)
{
    var ret = ctx.Map(typeDef)?.ResolveTypeDef();
    if (ret is null)
    {
        ret = new TypeDefUser(typeDef.Namespace, typeDef.Name);
        ctx.DefMap[typeDef] = ret;
    }

    foreach (MethodDef method in typeDef.Methods)
    {
        var newMethodDef = new MethodDefUser(method.Name, null, method.ImplAttributes, method.Attributes);
        ctx.DefMap[method] = newMethodDef;
        ret.Methods.Add(newMethodDef);
    }

    return ret;
}
```

Et `CopyMethodDef` reformule simplement ce que j'ai dit plus tôt en code

```csharp
static void CopyMethodDef(MethodDef methodDef, InjectContext ctx)
{
    var newMethodDef = ctx.Map(methodDef)?.ResolveMethodDefThrow();

    newMethodDef.Signature = ctx.Importer.Import(methodDef.Signature);
    newMethodDef.Parameters.UpdateParameterTypes();

    foreach (var paramDef in methodDef.ParamDefs)
        newMethodDef.ParamDefs.Add(new ParamDefUser(paramDef.Name, paramDef.Sequence, paramDef.Attributes));

    if (methodDef.ImplMap != null)
        newMethodDef.ImplMap = new ImplMapUser(new ModuleRefUser(ctx.TargetModule, methodDef.ImplMap.Module.Name), methodDef.ImplMap.Name, methodDef.ImplMap.Attributes);

    foreach (CustomAttribute ca in methodDef.CustomAttributes)
    {
        var newCa = new CustomAttribute((ICustomAttributeType)ctx.Importer.Import(ca.Constructor));
        foreach (var arg in ca.ConstructorArguments)
        {
            if (arg.Value is IType type)
                newCa.ConstructorArguments.Add(new CAArgument((TypeSig)ctx.Importer.Import(type)));
            else
                newCa.ConstructorArguments.Add(arg);
        }

        newMethodDef.CustomAttributes.Add(newCa);
    }

    if (methodDef.HasBody)
        CopyMethodBody(methodDef, ctx, newMethodDef);
}
```

et `CopyMethodBody` reformule aussi simplement. Je simplifie un peu les choses, et j'omets la gestion des blocs protégés. Pour cela, il vaut mieux consulter le code source de [ConfuserEx](https://github.com/kant2002/ConfuserEx/blob/bd980ba730f95c1bb0b8cc136771e4594dd7285f/Confuser.Core/Helpers/InjectHelper.cs#L116)

```csharp
static void CopyMethodBody(MethodDef methodDef, InjectContext ctx, MethodDef newMethodDef)
{
    newMethodDef.Body = new CilBody(methodDef.Body.InitLocals, new List<Instruction>(),
        new List<ExceptionHandler>(), new List<Local>())
    { MaxStack = methodDef.Body.MaxStack };

    var bodyMap = new Dictionary<object, object>();
    foreach (Local local in methodDef.Body.Variables)
    {
        var newLocal = new Local(ctx.Importer.Import(local.Type)) { Name = local.Name };
        newMethodDef.Body.Variables.Add(newLocal);
        bodyMap[local] = newLocal;
    }

    foreach (Instruction instr in methodDef.Body.Instructions)
    {
        var newInstr = new Instruction(instr.OpCode, instr.Operand);
        switch (newInstr.Operand)
        {
            case IType type:
                newInstr.Operand = ctx.Importer.Import(type);
                break;
            case IMethod method:
                newInstr.Operand = ctx.Importer.Import(method);
                break;
            case IField field:
                newInstr.Operand = ctx.Importer.Import(field);
                break;
        }

        newMethodDef.Body.Instructions.Add(newInstr);
        bodyMap[instr] = newInstr;
    }

    foreach (Instruction instr in newMethodDef.Body.Instructions)
    {
        if (instr.Operand != null && bodyMap.ContainsKey(instr.Operand))
            instr.Operand = bodyMap[instr.Operand];
    }

    newMethodDef.Body.SimplifyMacros(newMethodDef.Parameters);
}
```

Voilà donc les préparatifs pour faire une copie de la méthode. Nous devons ajouter ce code avant la réécriture de l'assemblage.

```csharp
// Créer un nouveau type dans l'assemblage cible pour contenir le code injecté
var decoderType = new TypeDefUser("Decoder", targetModule.CorLibTypes.Object.TypeDefOrRef);
targetModule.Types.Add(decoderType);
// Charger la classe modèle
var targetDecoder = GetRuntimeTemplateType(typeof(Decoder).FullName);
// Injecter le contenu de la classe modèle dans le type cible dans l'assemblage cible
var context = new InjectContext(targetModule);
var importer = new Importer(targetModule, ImporterOptions.TryToUseTypeDefs, new GenericParamContext(), context);
Inject((TypeDef)targetDecoder, (TypeDef)decoderType, targetModule);
```

Après cela, la réécriture des chaînes devient une affaire très simple

```csharp
var str = (string)instr.Operand;
// Encoder en utilisant le runtime d'obfuscation
var encodedStr = Decoder.EncodeString(str);
instr.Operand = encodedStr;
// Insérer le placement de Decoder.DecodeString sur la pile après l'instruction ldstr
var decodeStringSignature = 
    MethodSig.CreateStatic(targetModule.CorLibTypes.String, targetModule.CorLibTypes.String);
var decodeString = new Instruction(
    OpCodes.Call,
    importer.Import(decoderType.FindMethod("DecodeString", decodeStringSignature)));
method.Body.Instructions.Insert(i + 1, decodeString);
i = i + 1; // Ignorer l'instruction que nous venons d'ajouter
```

Et voilà.

Le code final peut être trouvé dans le [dépôt supplémentaire](https://github.com/kant2002/obfuscation-talk)
