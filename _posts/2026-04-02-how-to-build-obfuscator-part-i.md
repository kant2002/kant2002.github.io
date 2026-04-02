---
layout: post
title:  "How to build .NET obfuscator - Part I"
date:   2026-04-02 21:34:44 +0100
categories: en obfuscators
comments: true
---

This would be short series on how to build .NET obfuscators. The techniques is somewhat similar for other languages, but I will choose that one which I know the best.

For the following along, I would recommend to know a bit of C#, [ECMA-335 - Partition II: Metadata Definition and Semantics](https://www.ecma-international.org/wp-content/uploads/ECMA-335_6th_edition_june_2012.pdf), and at least hear about .ENT library for metadata modification - [dnlib](https://github.com/0xd4d/dnlib)

You also should know about stack virtual machines, and [IL opcodes](https://learn.microsoft.com/en-us/dotnet/api/system.reflection.emit.opcodes?view=net-10.0#fields). If you want to know better semantics of each opcode, please read ECMA-335.

<!--more-->

# Cheat sheet

If you are completely new and super lazy, here short cheatsheet.

## Instructions

Instructions for loading values onto stack
- `ldc.i4.1`-`ldc.i4.8`
- `ldc.i4.s`/`ldc.i8.s`
- `ldarg.s`
- `ldloc.s`
- `ldstr`
- `ldnull`

Instructions for math operations on the stack
- `add`
- `sub`
- `mul`
- `div`

Instruction for returning value from stack to caller
- ret

Instructions for comparison and boolean logic
- `cgt`
- `ceq`
- `clt`

Instructions for control flow modifications
- `br`
- `brtrue`
- `brfalse`
- `bgt`
- `blt`
- `ble`
- `bge`
- `beq`
- `bne`

Instructions for calling methods
- `call`
- `calli`
- `callvirt`

## Metadata

Basically the .NET metadata can be viewed as collection of database tables. I even wrote small tool called [MetadataDumper](https://github.com/kant2002/metadatadumper) to export them to CSV files since that's most accessible tables.

List of .NET metadata tables
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

Phew, that was a long list. I never realize that there lot of small things needed.

# Dnlib introduction

You need to be comfortable to get started with assembly modifications. So let's do round-trip

```csharp
// Read module from one file
ModuleContext modCtx = ModuleDef.CreateModuleContext();
ModuleDefMD module = ModuleDefMD.Load(assemblyFile, modCtx);
// Save module without modification to another file
module.Write(targetFile);
```

After that you may inspect `Types` on the `module` variable. These types have `Methods`, `Fields`, `Properties` and other properties that make sense. Use Intellisense for discovery.

# Renaming

Most simple technique in the obfuscation is renaming. That's noting more complicated then changing values in the metadata and saving changes.

So let's rename types. I would just rename classes to Class0, Class1, Class2 and so on. Most professional obfuscators nowadays don't use normal identifiers as part of renaming, since that allow you round-trip assembly using ildasm/ilasm sequence and easiely modify. We don't care about that for pedagogical reasons. You can use any renaming strategy which you think interesting to you.

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

As you may notice - we don't rename `<Module`> class. This is standard static class which is instantiated by the Common Language Runtime (CLR or CoreCLR or Unity) when something from assembly is used.

That's it. This is obfuscation for you.

Now we can expand that process to `Fields` and `Methods`

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
        // Skip well known names
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

We may want, or don't want obfuscate public information. For example in the application it does not make sense to keep original names unless Reflection used. In the libraries it make sense keep public surface intact, but obfuscate all private and internal methods. Let's do that

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
        // Skip well known names
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

Notice that in ECMA-335 parle the protected members called Family. See `II.23.1.5 Flags for fields [FieldAttributes]`, `II.23.1.10 Flags for methods [MethodAttributes]` and `II.23.1.15 Flags for types [TypeAttributes] `. Thats one of many reasons why you need read specification wholly. It would be unpleasant for sure.

# Properties removal

That's one of easiest obfuscation methods. If you guess how can something can be easier then renaming, so look at it. The properties in the CLR is that metadata which combine up to 2 methods getter and setter into one virtual property. For example if I define automatic property `X` then in the metdata it would be - property `X`, method `get_X` and `set_X`. In the code, properties actually never used, only via Reflection, so if reflection is not an option, we can just drop properties metadata altogether.

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

Same would be events removal. Events build in the metadata is just field + add/remove/fire methods.

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

# String encoding - brute force

That obviosuly not very helpful even if easy obfuscation techniques. Since you still see a lot of things from the code. For example strings. Let's do encoding them. Probably you should use something else, and not Base64, but I will start from this, to simplify example.

Let's consider this C# code

```csharp
Console.WriteLine("Hello, World!");
```

It translated to following IL code

```il
ldstr "Hello, World!"
call void [System.Console]System.Console::WriteLine(string)
```

Let's say we want modify all string to call to `Encoding.UTF8.GetString(Convert.FromBase64String(base64Str))`. That will make code following

```il
call class [System.Runtime]System.Text.Encoding [System.Runtime]System.Text.Encoding::get_UTF8()
ldstr "SGVsbG8sIFdvcmxkIQ=="
call uint8[] [System.Runtime]System.Convert::FromBase64String(string)
callvirt instance string [System.Runtime]System.Text.Encoding::GetString(uint8[])
call void [System.Console]System.Console::WriteLine(string)
```

As you can see we should replace original ldstr with 4 instructions and replace original `"Hello World!"` with base64 encoded value.

For that we will inspect method body instructions and replace each occurence of `ldstr` with new pattern

```csharp
foreach (var method in type.Methods)
{
    // PInvoke methods does not have body. 
    // Abstract methods too does not have body.
    // So we skip these cases
    if (!method.HasBody)
        continue;
    for (int i = 0; i < method.Body.Instructions.Count; i++)
    {
        var instr = method.Body.Instructions[i];
        // Detect ldstr
        if (instr.OpCode == OpCodes.Ldstr)
        {
            var str = (string)instr.Operand;
            var encodedStr = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(str));
            instr.Operand = encodedStr;
            // Insert placing Encoding.UTF8 on the stack before the ldstr instruction
            var encoding = new Instruction(
                OpCodes.Call,
                module.Import(typeof(Encoding).GetProperty("UTF8", []).GetGetMethod()));
            method.Body.Instructions.Insert(i, encoding);
            // Insert placing Convert.FromBase64String on the stack before the ldstr instruction
            var fromBase64String = new Instruction(
                OpCodes.Call,
                module.Import(typeof(Convert).GetMethod("FromBase64String", [typeof(string)])));
            method.Body.Instructions.Insert(i + 2, fromBase64String);
            // Insert placing Encoding.GetString on the stack before the ldstr instruction
            var getString = new Instruction(
                OpCodes.Call,
                module.Import(typeof(Encoding).GetMethod("GetString", [typeof(byte[])])));
            method.Body.Instructions.Insert(i + 3, getString);
            i = i + 3; // Skip the instructions we just added
        }
    }
}
```

So that's it. Now we replace all `ldstr` with string decoding. 

# Obfuscation runtime and it's injection

Since this is simple case of encoding/decoding it was fairly easy to implement manually. But if we want to have more sophisticated encoding of the string. Maybe using crypto secure things, whatever you like. Then manual pattern injection become unfeasible. Usually that's solved by injection of obfuscation runtime functions which perform these functions for you. Imaging we will have following class in the target assembly

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

Then we can use that class in the target assembly directly by producing following C# code

```csharp
Console.WriteLine(Decoder.DecodeString("SGVsbG8sIFdvcmxkIQ=="))
```

which nicely converted to IL

```il
ldstr "SGVsbG8sIFdvcmxkIQ=="
call string Decoder::DecodeString(string)
call void [System.Console]System.Console::WriteLine(string)
```

It's much simpler to replace. Just encode string and insert decoding instruction. But we have an problem, we don't have this class inside target assembly. Let's place it.

Placing boiler plate code happens by having runtime support code in special assembly from which we will copy class into target assembly. For simplification we would not create separate assembly, and place template runtime in the obfuscator itself.

For that dnlib provide a bit of support in form of the classes `Importer` and `ImportMapper`. `Importer` is the class which perform import of the types/methods/fields, but `ImportMapper` is class which hold context for importing. Basically provide mapping between template type/method/field and target type/method/field in our case. Actual cloning does not handled by the `Importer`, so it would be done explicitly in other functions.

The dnlib make `ImportMapper` class as abstract one, since most of the time you will need you own slightly custom usage. So we create derived class

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

        // check if the assembly reference needs to be fixed.
        if (source is TypeRef sourceRef)
        {
            var targetAssemblyRef = TargetModule.GetAssemblyRef(sourceRef.DefinitionAssembly.Name);
            if (!(targetAssemblyRef is null) && !string.Equals(targetAssemblyRef.FullName, source.DefinitionAssembly.FullName, StringComparison.Ordinal))
            {
                // We got a matching assembly by the simple name, but not by the full name.
                // This means the injected code uses a different assembly version than the target assembly.
                // We'll fix the assembly reference, to avoid breaking anything.
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

List of things to do to inject single method:
- Inject type containing method into target assembly
    - Create method definition
    - Copy method signature
    - Copy parameter definitions for method
    - Copy override information (if any)
    - Copy custom attributes and their arguments
- Copy method body
    - Copy local variables
    - Copy each instruction with remapping of types/methods/fields.
    - Copy exception handlers
    - Fix new locations for control flow instructions

Let's show how to do that in code.

Here is how to find dnlib type from runtime assembly. In our case runtime assembly it's the same as obfuscator library, but in production you would want place that into separate library without any dependencies, so you would modify code slightly.

```csharp
// Get runtime type from existing assembly.
TypeDef GetRuntimeTemplateType(string typeName)
{
    var runtimeModule = ModuleDefMD.Load(typeof(Program).Assembly.ManifestModule);
    return runtimeModule.Find(typeName, true);
}
```

That's how to inject type.

```csharp
// Inject type definition into new type
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

Populate context is actually population of mappings for `InjectionContext`.

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

And `CopyMethodDef` is simply restating what I told earlier using code

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

and `CopyMethodBody` also simple restating. I simplify things a bit, and omit protected blocks handling. For looking into that, better consult [ConfuserEx](https://github.com/kant2002/ConfuserEx/blob/bd980ba730f95c1bb0b8cc136771e4594dd7285f/Confuser.Core/Helpers/InjectHelper.cs#L116) source code

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

So that's preparations for making copy of the method. We should add this code before assembly rewriting.

```csharp
// Create a new type in the target assembly to hold the injected code
var decoderType = new TypeDefUser("Decoder", targetModule.CorLibTypes.Object.TypeDefOrRef);
targetModule.Types.Add(decoderType);
// Load template class
var targetDecoder = GetRuntimeTemplateType(typeof(Decoder).FullName);
// Inject template class content into target type in target assembly
var context = new InjectContext(targetModule);
var importer = new Importer(targetModule, ImporterOptions.TryToUseTypeDefs, new GenericParamContext(), context);
Inject((TypeDef)targetDecoder, (TypeDef)decoderType, targetModule);
```

After that, rewriting of string become very simple business

```csharp
var str = (string)instr.Operand;
// Encode using obfuscation runtime
var encodedStr = Decoder.EncodeString(str);
instr.Operand = encodedStr;
// Insert placing Decoder.DecodeString on the stack after the ldstr instruction
var decodeStringSignature = 
    MethodSig.CreateStatic(targetModule.CorLibTypes.String, targetModule.CorLibTypes.String);
var decodeString = new Instruction(
    OpCodes.Call,
    importer.Import(decoderType.FindMethod("DecodeString", decodeStringSignature)));
method.Body.Instructions.Insert(i + 1, decodeString);
i = i + 1; // Skip the instruction we just added
```

So that's it.

Final code can be found at [supplementary repo](https://github.com/kant2002/obfuscation-talk)