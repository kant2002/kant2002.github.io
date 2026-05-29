---
layout: post
title:  "Як створити .NET-обфускатор - Частина I"
date:   2026-05-24 19:15:44 +0200
categories: uk obfuscators
comments: true
---

Це буде коротка серія про те, як створювати .NET-обфускатори. Техніки певною мірою схожі для інших мов, але я виберу ту, яку знаю найкраще.

Щоб рухатися далі, я рекомендую трохи знати C#, [ECMA-335 - Partition II: Metadata Definition and Semantics](https://www.ecma-international.org/wp-content/uploads/ECMA-335_6th_edition_june_2012.pdf), і хоча б чути про .NET-бібліотеку для модифікації метаданих - [dnlib](https://github.com/0xd4d/dnlib).

Також варто знати про стекові віртуальні машини та [IL opcodes](https://learn.microsoft.com/en-us/dotnet/api/system.reflection.emit.opcodes?view=net-10.0#fields). Якщо хочете краще зрозуміти семантику кожного opcode, прочитайте ECMA-335.

<!--more-->

# Шпаргалка

Якщо ви зовсім новачок і дуже лінивий, ось коротка шпаргалка.

## Інструкції

Інструкції для завантаження значень у стек
- `ldc.i4.1`-`ldc.i4.8`
- `ldc.i4.s`/`ldc.i8.s`
- `ldarg.s`
- `ldloc.s`
- `ldstr`
- `ldnull`

Інструкції для математичних операцій у стеку
- `add`
- `sub`
- `mul`
- `div`

Інструкція для повернення викликачу значення зі стеку
- `ret`

Інструкції для порівняння та булевої логіки
- `cgt`
- `ceq`
- `clt`

Інструкції для зміни потоку керування
- `br`
- `brtrue`
- `brfalse`
- `bgt`
- `blt`
- `ble`
- `bge`
- `beq`
- `bne`

Інструкції для виклику методів
- `call`
- `calli`
- `callvirt`

## Метадані

Загалом метадані .NET можна розглядати як набір таблиць бази даних. Я навіть написав невеликий інструмент [MetadataDumper](https://github.com/kant2002/metadatadumper), щоб експортувати їх у CSV-файли, бо це найдоступніший формат таблиць.

Список таблиць метаданих .NET
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

Фух, це був довгий список. Я й не усвідомлював, скільки дрібниць потрібно для того щоб краще розуміти метадані .NET.

# Вступ до dnlib

Ви повинні впевнено себе почувати при модифікації збірки, тому швидко пробіжимося по головній бібліотеці яка буде нам в подальшому допомогати із модифікацію .NET метаданих.

```csharp
// Прочитати модуль з файлу
ModuleContext modCtx = ModuleDef.CreateModuleContext();
ModuleDefMD module = ModuleDefMD.Load(assemblyFile, modCtx);
// Зберегти модуль без змін в інший файл
module.Write(targetFile);
```

Після цього можна дослідити `Types` у змінній `module`. Тип цієї змінної має властивості `Methods`, `Fields`, `Properties` та інші. Використовуйте Intellisense, щоб подивитися що ще існує.

# Перейменування

Найпростіша техніка обфускації - перейменування. Це не складніше, ніж змінити значення назви в метаданих і зберегти зміни.

Тож перейменуймо типи. Я просто перейменую класи на Class0, Class1, Class2 і так далі. Більшість професійних обфускаторів сьогодні не використовують нормальні ідентифікатори під час перейменування, бо це дозволяє зробити round-trip збірки через послідовність ildasm/ilasm і легко її модифікувати. Замість цього вони використовують той факт що для рантайму не важливо як зветься тип, метод, поле і через це просто записують в метадані Unicode значення. Для навчальних цілей нас це не хвилює. Можете використати будь-яку стратегію перейменування, яка здається вам цікавою.

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

Як ви могли помітити, ми не перейменовуємо клас `<Module>`. Це стандартний статичний клас, який створюється Common Language Runtime (CLR, CoreCLR або Unity), коли використовується хоч щось зі збірки. Хоча назва насправді рантайм не цікавить і, якщо я не помиляюся, перший тип в метаданих вважається цим статичним ініціалізатором модуля, але я не бачу великої потреби в перейменуванні цього класу, бо його ім'я тривіально відновити. 

Ось і все. Це і є обфускація.

Тепер можна розширити цей процес на `Fields` та `Methods`.

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
        // Пропустити загальновідомі імена
        if (method.Name == ".ctor" || method.Name == ".cctor")
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

Ми можемо хотіти або не хотіти обфускувати публічну інформацію. Наприклад, у застосунку немає сенсу зберігати оригінальні імена, якщо не використовується Reflection. У бібліотеках має сенс залишити публічну поверхню незмінною, але обфускувати всі private та internal методи. Зробімо це.

```csharp
int typeCode = 0;
foreach (var type in module.Types)
{
    if (type.Name == "<Module>")
        continue;
    if (type.IsPublic || type.IsNestedFamily || type.IsNestedFamily || type.IsNestedAssembly)
        continue;
    type.Name = "Class" + typeCode.ToString(CultureInfo.InvariantCulture);
    typeCode++;
    int methodCode = 0;
    foreach (var method in type.Methods)
    {
        // Пропустимо загальновідомі імена
        if (method.Name == ".ctor" || method.Name == ".cctor")
            continue;
        if (method.IsPublic || method.IsFamily)
            continue;
        method.Name = "Method" + methodCode.ToString(CultureInfo.InvariantCulture);
        methodCode++;
    }
    int fieldCode = 0;
    foreach (var field in type.Fields)
    {
        if (field.IsPublic || field.IsFamily)
            continue;
        field.Name = "Field" + fieldCode.ToString(CultureInfo.InvariantCulture);
        fieldCode++;
    }
}
```

Зверніть увагу, що мовою ECMA-335 protected-члени називаються Family. Дивіться `II.23.1.5 Flags for fields [FieldAttributes]`, `II.23.1.10 Flags for methods [MethodAttributes]` і `II.23.1.15 Flags for types [TypeAttributes]`. Це одна з багатьох причин, чому специфікацію треба прочитати повністю. Приємним це точно не буде.

# Видалення властивостей

Це один із найпростіших методів обфускації. Якщо вам цікаво, як щось може бути простішим за перейменування, подивіться на це. Властивості в CLR - це метадані, які об'єднують два методи, getter і setter, в одну віртуальну властивість. Наприклад, якщо я визначаю автоматичну властивість `X`, то в метаданих це буде властивість `X`, метод `get_X` і `set_X`. У коді властивості насправді ніколи не використовуються напряму, лише через рефлексію. Тож якщо рефлексія не потрібна, ми можемо просто повністю викинути метадані властивостей.

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

Так само можна видаляти події. Події в метаданих - це лише поле плюс методи add/remove/fire.

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

# Кодування рядків - brute force

Вище були, очевидно, не дуже корисні, хоч і прості, техніки обфускації. Адже в коді все ще видно багато речей. Наприклад, рядки. Закодуймо їх. Імовірно, вам варто використовувати щось інше, а не Base64, але я почну з цього, щоб спростити приклад.

Розгляньмо такий C#-код.

```csharp
Console.WriteLine("Hello, World!");
```

Він транслюється в такий IL-код.

```il
ldstr "Hello, World!"
call void [System.Console]System.Console::WriteLine(string)
```

Скажімо, ми хочемо змінити всі рядки на виклик `Encoding.UTF8.GetString(Convert.FromBase64String(base64Str))`. Тоді код стане таким.

```il
call class [System.Runtime]System.Text.Encoding [System.Runtime]System.Text.Encoding::get_UTF8()
ldstr "SGVsbG8sIFdvcmxkIQ=="
call uint8[] [System.Runtime]System.Convert::FromBase64String(string)
callvirt instance string [System.Runtime]System.Text.Encoding::GetString(uint8[])
call void [System.Console]System.Console::WriteLine(string)
```

Як бачите, треба замінити початковий `ldstr` на 4 інструкції та замінити початковий `"Hello World!"` на значення, закодоване в base64.

Для цього ми переглянемо інструкції в тіла методу й замінимо кожне входження `ldstr` новим шаблоном.

```csharp
foreach (var method in type.Methods)
{
    // PInvoke-методи не мають тіла.
    // Абстрактні методи також не мають тіла.
    // Тому пропускаємо ці випадки
    if (!method.HasBody)
        continue;
    for (int i = 0; i < method.Body.Instructions.Count; i++)
    {
        var instr = method.Body.Instructions[i];
        // Виявити ldstr
        if (instr.OpCode == OpCodes.Ldstr)
        {
            var str = (string)instr.Operand;
            var encodedStr = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(str));
            instr.Operand = encodedStr;
            // Вставити покладання Encoding.UTF8 у стек перед інструкцією ldstr
            var encoding = new Instruction(
                OpCodes.Call,
                module.Import(typeof(Encoding).GetProperty("UTF8", []).GetGetMethod()));
            method.Body.Instructions.Insert(i, encoding);
            // Вставити покладання Convert.FromBase64String у стек перед інструкцією ldstr
            var fromBase64String = new Instruction(
                OpCodes.Call,
                module.Import(typeof(Convert).GetMethod("FromBase64String", [typeof(string)])));
            method.Body.Instructions.Insert(i + 2, fromBase64String);
            // Вставити покладання Encoding.GetString у стек перед інструкцією ldstr
            var getString = new Instruction(
                OpCodes.Call,
                module.Import(typeof(Encoding).GetMethod("GetString", [typeof(byte[])])));
            method.Body.Instructions.Insert(i + 3, getString);
            i = i + 3; // Пропустити щойно додані інструкції
        }
    }
}
```

Ось і все. Тепер ми замінюємо всі `ldstr` на декодування рядка.

# Runtime обфускації та його ін'єкція

Оскільки це простий випадок кодування/декодування, його було досить легко реалізувати вручну. Але якщо ми хочемо мати складніше кодування рядків, можливо з використанням криптографічно стійких речей чи будь-чого, що вам подобається, ручна ін'єкція шаблону коду стає непрактичною. Зазвичай це розв'язують ін'єкцією runtime-функцій обфускації, які виконують ці дії за вас. Уявімо, що в цільовій збірці буде такий клас.

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

Тоді ми можемо використати цей клас у цільовій збірці напряму, отримавши такий C#-код.

```csharp
Console.WriteLine(Decoder.DecodeString("SGVsbG8sIFdvcmxkIQ=="))
```

який красиво перетворюється на IL.

```il
ldstr "SGVsbG8sIFdvcmxkIQ=="
call string Decoder::DecodeString(string)
call void [System.Console]System.Console::WriteLine(string)
```

Це значно простіше замінювати. Просто кодуємо рядок і вставляємо інструкцію декодування. Але є проблема: цього класу немає всередині цільової збірки. Додамо його.

Додавання шаблонного коду відбувається через runtime support code у спеціальній збірці, з якої ми копіюємо клас у цільову збірку. Для спрощення ми не створюватимемо окрему збірку, а розмістимо шаблонний runtime у самому обфускаторі.

Для цього dnlib надає певну підтримку у вигляді класів `Importer` і `ImportMapper`. `Importer` - це клас, який виконує імпорт типів/методів/полів, а `ImportMapper` - клас, який зберігає контекст імпорту. У нашому випадку він фактично надає відображення між шаблонним типом/методом/полем і цільовим типом/методом/полем. Саме клонування `Importer` не виконує, тому це явно робитиметься в інших функціях.

dnlib робить клас `ImportMapper` абстрактним, бо здебільшого вам знадобиться власне трохи кастомізоване використання. Тож створимо похідний клас.

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

        // Перевірити, чи треба виправити посилання на збірку.
        if (source is TypeRef sourceRef)
        {
            var targetAssemblyRef = TargetModule.GetAssemblyRef(sourceRef.DefinitionAssembly.Name);
            if (!(targetAssemblyRef is null) && !string.Equals(targetAssemblyRef.FullName, source.DefinitionAssembly.FullName, StringComparison.Ordinal))
            {
                // Ми знайшли відповідну збірку за простим іменем, але не за повним іменем.
                // Це означає, що ін'єктований код використовує іншу версію збірки, ніж цільова збірка.
                // Виправимо посилання на збірку, щоб нічого не зламати.
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

Список речей, які треба зробити, щоб ін'єктувати один метод:
- Ін'єктувати тип, що містить метод, у цільову збірку
    - Створити визначення методу
    - Скопіювати сигнатуру методу
    - Скопіювати визначення параметрів методу
    - Скопіювати інформацію про override (якщо є)
    - Скопіювати custom attributes та їхні аргументи
- Скопіювати тіло методу
    - Скопіювати локальні змінні
    - Скопіювати кожну інструкцію з відображенням типів/методів/полів
    - Скопіювати exception handlers
    - Виправити нові адреси для інструкцій потоку виконання

Покажімо, як зробити це в коді.

Ось як знайти dnlib-тип із runtime-збірки. У нашому випадку runtime-збірка - це та сама бібліотека, що й обфускатор, але в production ви, ймовірно, захочете винести це в окрему бібліотеку без залежностей, тож трохи зміните код коли це буде потрібно.

```csharp
// Отримати runtime-тип з наявної збірки.
TypeDef GetRuntimeTemplateType(string typeName)
{
    var runtimeModule = ModuleDefMD.Load(typeof(Program).Assembly.ManifestModule);
    return runtimeModule.Find(typeName, true);
}
```

Ось як ін'єктувати тип.

```csharp
// Ін'єктувати визначення типу в новий тип
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

Populate context - це фактично заповнення мапінгів для `InjectionContext`.

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

А `CopyMethodDef` просто повторює в коді те, що я описав вище.

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

І `CopyMethodBody` теж просто повторює це в коді. Я трохи спрощую речі й опускаю обробку захищених блоків (protected blocks). Щоб подивитися на це детальніше, краще зверніться до вихідного коду [ConfuserEx](https://github.com/kant2002/ConfuserEx/blob/bd980ba730f95c1bb0b8cc136771e4594dd7285f/Confuser.Core/Helpers/InjectHelper.cs#L116).

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

Це підготовка до створення копії методу. Треба додати цей код перед переписуванням збірки.

```csharp
// Створити новий тип у цільовій збірці, який міститиме ін'єктований код
var decoderType = new TypeDefUser("Decoder", targetModule.CorLibTypes.Object.TypeDefOrRef);
targetModule.Types.Add(decoderType);
// Завантажити шаблонний клас
var targetDecoder = GetRuntimeTemplateType(typeof(Decoder).FullName);
// Ін'єктувати вміст шаблонного класу в цільовий тип у цільовій збірці
var context = new InjectContext(targetModule);
var importer = new Importer(targetModule, ImporterOptions.TryToUseTypeDefs, new GenericParamContext(), context);
Inject((TypeDef)targetDecoder, (TypeDef)decoderType, targetModule);
```

Після цього переписування рядка стає дуже простою справою.

```csharp
var str = (string)instr.Operand;
// Закодувати за допомогою runtime обфускації
var encodedStr = Decoder.EncodeString(str);
instr.Operand = encodedStr;
// Вставити розміщення Decoder.DecodeString у стек після інструкції ldstr
var decodeStringSignature = 
    MethodSig.CreateStatic(targetModule.CorLibTypes.String, targetModule.CorLibTypes.String);
var decodeString = new Instruction(
    OpCodes.Call,
    importer.Import(decoderType.FindMethod("DecodeString", decodeStringSignature)));
method.Body.Instructions.Insert(i + 1, decodeString);
i = i + 1; // Пропустити щойно додану інструкцію
```

Ось і все.

Фінальний код можна знайти в [додатковому репозиторії](https://github.com/kant2002/obfuscation-talk).