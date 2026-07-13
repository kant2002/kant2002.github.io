---
layout: post
title:  "Інтеграція .NET GC у ваш C++ застосунок"
date:   2026-07-13 22:35:44 +0500
categories: uk dotnet open-source
comments: true
use_math: true
---

Коли читаєш палкі баталії навколо мов програмування, мене дратує, що коли .NET порівнюють з Go, то магічним чином спливають аргументи про GC, ніби якийсь GC магічно кращий за інші. Я вважаю це настільки ірраціональним, що вирішив хоч щось із цим зробити.

Моя проблема з порівнянням між різними GC у тому, що вони очевидно розмиті, їх не можна довести, і зазвичай припускають, що GC завжди йде в комплекті з рантаймом. І я не думаю, що це справедливо — називати це GC, а не середовищем виконання CLR/JVM/Go. Тож, щоб підлити олії у безглузді дебати, і тому що це весело, я думаю, що можу вирізати .NET GC із репозиторію [dotnet/runtime](https://github.com/dotnet/runtime) і запакувати його в окремий застосунок, який можна використовувати для ілюстративних цілей.

<!--more-->

За основу я візьму приховану перлину в теці [src/coreclr/gc/samples](https://github.com/dotnet/runtime/tree/main/src/coreclr/gc/sample). Технічно ви можете просто взяти dotnet репозиторій, склонувати його та зібрати за допомогою `./build.cmd -s clr`, і тоді десь у теці `artifacts` з'явиться файл `gcsample.exe`. Це, мабуть, простий шлях, але не дуже зручний, якщо якийсь гарячоголовий вирішить, що ця стаття його надихає на подальші експерименти, і захоче більше від GC. Тому я вирішив відокремити збірку прикладу інтеграції GC від усієї збірки .NET. Поточна робота в [репозиторії на Codeberg](https://codeberg.org/kant2002/gcsample). До речі, переносьте свої проєкти з GitHub на інші форджі.

## Налаштування

Для збирання прикладу використання GC потрібно мати теку мого репозиторію у `gcsample`, а dotnet/runtime у теці `runtime` поряд із текою `gcsample`, де відбувається власне робота. Я вирішив, що так легше *для мене*, оскільки я не люблю мати кілька клонованих варіантів рантайму. Ви можете легко налаштувати це на використання підмодулів Git, якщо ви з тих, кому таке до вподоби.

## Як інтегрувати GC у ваш застосунок

GC сам по собі не працює ізольовано — йому потрібна базова підтримка від оточення. Він має дві важливі абстракції: інтерфейс PAL/OS та підтримку рантайму (або виконавчого рушія). PAL/OS інтерфейс люб'язно надає сам CoreCLR. А от інтерфейс до виконавчого рушія (EE) ми маємо забезпечити самі, бо наша програма це і буде "виконавчий рушій". Для цього потрібно реалізувати такі класи:

- `GCToEEInterface` — це інтерфейс до виконавчого рушія
- `Thread` — це абстракція потоку. Це не обов'язково OS-потік, це може бути зелений потік, якщо рантайм це реалізує.

Також ми реалізуємо вспоміжний клас `ThreadStore`, який буде абстракцією для роботи з потоками в рантаймі.

GC не вимагає багато від API класу `Thread`. Ми хочемо отримувати контекст виділення пам'яті (alloc_context), і цього буде достатньо для мінімального GC у нашому випадку. Чим більше функцій ми додаємо до нашого рантайму, тим більше речей ми додамо до цього класу та іншої обв'язки. *Примітка:* `Thread` за задумом архітектури .NET є віртуальним потоком, який не обов'язково повинен відповідати 1-до-1 абстракції OS-потоку. Це частково видно через наявність методаі `GCToEEInterface::GetThreadOSThreadId`, але на практиці це нам сьогодні не сподобається.

```cpp
class Thread
{
    uintptr_t m_alloc_context[16]; // Резервуємо достатньо місця для контексту виділення

    friend class ThreadStore;
    Thread * m_pNext;

public:
    Thread()
    {
    }

    alloc_context* GetAllocContext()
    {
        return (alloc_context *)&m_alloc_context;
    }
};
```

ThreadStore також буде дуже простим класом із простим інтерфейсом.

```cpp
class ThreadStore
{
public:
    // Отримати список потоків, починаючи з поточного.
    static Thread * GetThreadList(Thread * pThread);

    // Зареєструвати поточний OS-потік для використання GC на ньому.
    static void AttachCurrentThread();
};
```

Нам не так багато потрібно від інтерфейсу EE. Нам точно потрібен інтерфейс для потоків. Погляньмо на API, який покриває абсолютний мінімум:

```cpp
// Отримати абстракцію Thread для поточного потоку.
Thread* GCToEEInterface::GetThread();
```

Пізніше GC використовує клас `Thread` для доступу до контексту виділення пам'яті та всієї магії.

Додаткові функції, пов'язані з потоками:

```cpp
// Отримати контекст виділення для поточного потоку.
gc_alloc_context* GCToEEInterface::GetAllocContext();

// Виконати функцію на всіх контекстах виділення із заданим параметром.
void GCToEEInterface::GcEnumAllocContexts (enum_alloc_context_func* fn, void* param);

// Отримати ID OS-потоку, на якому виконується віртуальний потік.
uint64_t GCToEEInterface::GetThreadOSThreadId(Thread* thread)

// Запустити фоновий GC-потік
bool GCToEEInterface::CreateThread(void (*threadStart)(void*), void* arg, bool is_suspendable, const char* name)
```

Є інші важливі частини інтерфейсу GC до виконавчого рушія — це призупинення та відновлення EE.

```cpp
// Попросити виконавчий рушій призупинити роботу з певної причини.
void GCToEEInterface::SuspendEE(SUSPEND_REASON reason);

// Попросити виконавчий рушій відновити роботу.
void GCToEEInterface::RestartEE(bool /*_bFinishedGC*/);
```

Є два значення для `SUSPEND_REASON`:
- `SUSPEND_FOR_GC` — для власне збирання сміття
- `SUSPEND_FOR_GC_PREP` — для запуску GC, коли почалося фонове збирання або коли змінюється кількість куп у фоновому GC.

Я також закоментував параметр `bFinishedGC`, оскільки він насправді ніде не використовується в поточному GC.

Наша реалізація буде простою: ми просто викликаємо глобальну GC-купу `g_theGCHeap` і повідомляємо, що ми зробили.

```cpp
void GCToEEInterface::SuspendEE(SUSPEND_REASON reason)
{
    // TODO: Реалізувати призупинення EE, якщо в нас дійсно є EE.
    g_theGCHeap->SetGCInProgress(true);
}

void GCToEEInterface::RestartEE(bool bFinishedGC)
{
    // TODO: Реалізувати відновлення EE, якщо в нас дійсно є EE.
    g_theGCHeap->SetGCInProgress(false);
}
```

`g_theGCHeap` має тип `IGCHeapInternal` — це внутрішній інтерфейс GC, який використовується виконавчим рушієм, щоб попросити GC виконати певну роботу. Цей інтерфейс походить від `IGCHeap`. Це [досить великий інтерфейс](https://github.com/dotnet/runtime/blob/main/src/coreclr/gc/gcinterface.h#L657-L1077), але ми можемо вивчати його лише тоді, коли це потрібно.

Остання частина, необхідна для мінімального хостингу GC — це надання таблиці методів для вільного об'єкта. Це вказівник на таблицю методів, який показує, що ця область пам'яті вільна. 

```cpp
MethodTable* GCToEEInterface::GetFreeObjectMethodTable();
```

Поточна реалізація GC використовує таблицю методів, подібну до масиву, для позначення вільних блоків. Ми просто використовуємо наявний для цього механізм.

```cpp
static MethodTable freeObjectMT;

MethodTable* GCToEEInterface::GetFreeObjectMethodTable()
{
    freeObjectMT.InitializeFreeObject();
    return &freeObjectMT;
}
```

Після цього всі інші методи `GCToEEInterface` можна реалізувати як пустишки.

## Заповнення метаданих рантайму

Давайте перетворимо простий C# застосунок на C++ застосунок.

```csharp
// Один клас
class My
{
    public My m_pOther1;
    public int dummy_inbetween;
    public My m_pOther2;
}

// Власне застосунок
My pObj = new My();
for (int i = 0; i < 1000000; i++)
{
    var pBefore = pObj.m_pOther1;
    var p = new My();
    var pAfter = pObj.m_pOther1;
    pObj.m_pOther1 = p;
}

var ohWeak = WeakReference.Create(pObj);
pObj = null;
GC.Collect();
Debug.Assert(ohWeak.IsAlive == false);
```

Клас C# `My` виглядатиме в C++ ось так.

```cpp
class My : public Object {
public:
    Object* m_pOther1;
    int dummy_inbetween;
    Object* m_pOther2;
};
```

Замість `Object*` можна було би використовувати `My*`, але це зробить трішки незручною реалізацію нашого рантайму, а із точки зору рантайма це буде приблизно одне і те саме.

Тепер нам потрібно визначити таблицю методів для цього класу.

```cpp
struct My_MethodTable
{
    // Дескріптор GC
    CGCDescSeries m_series[2 /* Кількість керованих полів */];
    size_t m_numSeries; // Буде 2, щоб позначити розмір m_series

    // Власне таблиця методів
    MethodTable m_MT;
};
```

GC очікує, що перед `MethodTable` буде інформація про:
- кількість серій керованих об'єктів у GC;
- масив дескрипторів для серій керованих об'єктів у GC. Хитрість у тому, щоб покажчики виглядали як звичайні C++ покажчики, використовується від'ємне зміщення для доступу до `m_numSeries` і `m_series` з покажчика `MethodTable*`.

Заповнімо структуру `My_MethodTable`. Нам потрібно три речі:
- розмір керованого об'єкта
- позначити об'єкт як не-масив
- позначити об'єкт як такий, що має керовані вказівники.

Давайте це реалізуємо.

Обчислення розміру керованого об'єкта дуже просте. Це звичайний C++ розмір об'єкта + розмір `ObjHeader`. Також розмір не може бути меншим за `MIN_OBJECT_SIZE`, який зараз дорівнює розміру 2 вказівників + розмір `ObjHeader`.

У C++ це виглядатиме так.

```cpp
// 'My' містить MethodTable*
uint32_t baseSize = sizeof(My);
// GC очікує, що розмір ObjHeader (додатковий void*) включено в розмір.
baseSize = baseSize + sizeof(ObjHeader);
// Додаємо вирівнювання за потреби. GC вимагає, щоб розмір об'єкта був щонайменше MIN_OBJECT_SIZE.
My_MethodTable.m_MT.m_baseSize = max(baseSize, (uint32_t)MIN_OBJECT_SIZE);

My_MethodTable.m_MT.m_componentSize = 0;    // Розмір компонента масиву
My_MethodTable.m_MT.m_flags = MTFlag_ContainsGCPointers;
```

`CGCDescSeries` — це дескриптор послідовності керованих вказівників усередині об'єкта. Він містить зміщення послідовності керованих вказівників та скоригований розмір послідовності. Коригування зроблено так, щоб внутрішні механізми могли однаково обробляти звичайний вказівник на об'єкт і вказівник на масив керованих об'єктів.

```cpp
My_MethodTable.m_numSeries = 2;

// GC обходить послідовності в зворотному порядку. Він очікує, що зміщення відсортовані за спаданням.
My_MethodTable.m_series[0].SetSeriesOffset(offsetof(My, m_pOther2)); // Вказуємо зміщення всередині класу My.
My_MethodTable.m_series[0].SetSeriesCount(1); // Вказуємо кількість керованих вказівників у послідовності.
My_MethodTable.m_series[0].seriessize -= My_MethodTable.m_MT.m_baseSize; // Виконуємо коригування (так працюють внутрішні механізми).

My_MethodTable.m_series[1].SetSeriesOffset(offsetof(My, m_pOther1));
My_MethodTable.m_series[1].SetSeriesCount(1);
My_MethodTable.m_series[1].seriessize -= My_MethodTable.m_MT.m_baseSize;
```

Як ви могли помітити, об'єкти `GCDescSeries` розташовані в пам'яті в іншому порядку, оскільки ми використовуємо від'ємне зміщення, тому `m_series[0]` — це інформація про останній керований вказівник у класі — `m_pOther2`. Інтуітивно це можна пояснити так - індекс 0 це найдальший індекс від m_MT, тому там збережена інформація про найдальше поле. Детальніше можна прочитати у [файлі GCDesc.h](https://github.com/dotnet/runtime/blob/c9265d78e03e96c00b7ec062f2dbf2465bbb86d6/src/coreclr/gc/gcdesc.h#L23-L49)

Після заповнення цієї структури ми можемо отримати вказівник на `MethodTable*`, який використовується для виділення об'єктів, ось так.

```cpp
MethodTable* pMyMethodTable = &My_MethodTable.m_MT;
```

Саме це значення використовується далі, і в середині рантайму, але GC знає, що `pMyMethodTable[-1]` — це `m_numSeries`, і, проходячи звідти далі, можна отримати вміст `m_series`.

## Ініціалізація нашого виконавчого рушія

Тепер нам потрібно ініціалізувати виконавчий рушій (EE) та GC. Процес такий:

- Ініціалізувати інтерфейс GC до EE
- Попросити GC почати ініціалізацію та надати нам внутрішні компоненти
- Ініціалізувати частини GC, необхідні для нас
- Ініціалізувати потоки
- Ініціалізувати таблиці методів

Виглядатиме це ось так:

```cpp
// Ініціалізація системної інформації
if (!GCToOSInterface::Initialize())
{
    return -1;
}

// Ініціалізація GC-купи
GcDacVars dacVars;
IGCHeap *pGCHeap;
IGCHandleManager *pGCHandleManager;
if (GC_Initialize(nullptr, &pGCHeap, &pGCHandleManager, &dacVars) != S_OK)
{
    return -1;
}

if (FAILED(pGCHeap->Initialize()))
    return -1;

// Ініціалізація менеджера хендлів
if (!pGCHandleManager->Initialize())
    return -1;

// Ініціалізація поточного потоку
ThreadStore::AttachCurrentThread();

InitMethodTables();
MethodTable * pMyMethodTable = &My_MethodTable.m_MT;
```

Половину речей нам надає команда .NET, іншу половину я пояснив, тож, сподіваюся, усе зрозуміло.

## Виділення об'єктів

Процес виділення об'єкта концептуально відносно простий.
- Беремо контекст виділення з потоку,
- отримуємо розмір об'єкта з таблиці методів,
- потім просимо GC виділити простір,
- призначаємо таблицю методів для вказівника.

Це можна реалізувати ось так.

```cpp
// Швидкі шляхи для виділення об'єктів і write-бар'єрів критичні для продуктивності.
// Їх часто пишуть вручну на асемблері тощо.
// Те, що ви бачите тут — це дуже повільна реалізація для освітніх цілей.
Object * AllocateObject(MethodTable * pMT)
{
    alloc_context * acontext = GetThread()->GetAllocContext();

    size_t size = pMT->GetBaseSize();
    Object * pObject = g_theGCHeap->Alloc(acontext, size, 0);
    if (pObject == NULL)
        return NULL;

    pObject->RawSetMethodTable(pMT);

    return pObject;
}
```

Але в реальному виконавчому рушії ця реалізація надто повільна, і вам потрібен швидкий шлях, який дублює швидкий шлях GC.

Одну оптимізацію на C++ можна написати так.

```cpp
Object * AllocateObject(MethodTable * pMT)
{
    alloc_context * acontext = GetThread()->GetAllocContext();
    Object * pObject;

    size_t size = pMT->GetBaseSize();

    uint8_t* result = acontext->alloc_ptr;
    uint8_t* advance = result + size;
    if (advance <= acontext->alloc_limit)
    {
        acontext->alloc_ptr = advance;
        pObject = (Object *)result;
    }
    else
    {
        pObject = g_theGCHeap->Alloc(acontext, size, 0);
        if (pObject == NULL)
            return NULL;
    }

    pObject->RawSetMethodTable(pMT);

    return pObject;
}
```

Я переніс збільшення поточного вказівника виділення в контексті для простих випадків. Саме так працює `gc_heap::allocate`, але ви не спускаєтеся нижче по абстракціях, щоб виконати цей кусок коді і таким чином скорочуєте шлях виконання. Крім того, практично писати цей код на асемблері, щоб контролювати точний вихід машинного коду та отримати більше продуктивності.

## Write-бар'єр

Останньою частиною пазла для нашого виконавчого середовища буде write-бар'єр, де наш примітивний EE допомагає GC, повідомляючи, що ми змінили деякі частини даних. GC використовує карткову таблицю (card table) для відстеження кожних 256 байтів керованої купи. Такий блок у 256 байтів називається карткою. Карткова таблиця — це набір байтів, де кожен байт представляє 256 байтів керованої купи. Якщо значення байта в картковій таблиці дорівнює 0xFF, то картка брудна, і GC знає, що слід уважніше подивитися на ці об'єкти, щоб зрозуміти, що зберігати, а що викинути.

Отже, write-бар'єр — це просто:
- запис нового значення в керований об'єкт
- оновлення карткової таблиці.

```cpp
#if defined(HOST_64BIT)
// Зсув для карткового байта відрізняється на 64-бітній архітектурі.
#define card_byte_shift     11
#else
#define card_byte_shift     10
#endif

#define card_byte(addr) (((size_t)(addr)) >> card_byte_shift)

inline void ErectWriteBarrier(Object ** dst, Object * ref)
{
    // якщо dst знаходиться за межами купи (розпаковані типи значень), то
    // просто виходимо
    if (((uint8_t*)dst < g_gc_lowest_address) || ((uint8_t*)dst >= g_gc_highest_address))
        return;

    // volatile використовується, щоб запобігти переупорядкуванню читання g_card_table
    // з перевіркою g_lowest/highest_address вище. Див. коментарі в StompWriteBarrier
    uint8_t* pCardByte = (uint8_t *)*(volatile uint8_t **)(&g_gc_card_table) + card_byte((uint8_t *)dst);
    if(*pCardByte != 0xFF)
        *pCardByte = 0xFF;
}

// Ось наша функція, яку ми будемо використовувати в нашому C++ застосунку з керованою пам'яттю.
void WriteBarrier(Object ** dst, Object * ref)
{
    *dst = ref;
    ErectWriteBarrier(dst, ref);
}
```

## Перетворення програми

Тепер настав час перетворити програму, представлену раніше.

```cpp
// Виділяємо екземпляр MyObject
Object * pObj = AllocateObject(pMyMethodTable);
if (pObj == NULL)
    return -1;

// Створюємо сильний дескріптор і зберігаємо в нього об'єкт
// Нам потрібен сильний дескріптор, інакше значення буде видалено під час GC десь посередині.
OBJECTHANDLE oh = HndCreateHandle(g_HandleTableMap.pBuckets[0]->pTable[GetCurrentThreadHomeHeapNumber()], HNDTYPE_DEFAULT, pObj);
if (oh == NULL)
    return -1;

for (int i = 0; i < 1000000; i++)
{
    My * pBefore = ((My *)HndFetchHandle(oh))->m_pOther1;

    // Виділяємо більше екземплярів того самого об'єкта
    Object * p = AllocateObject(pMyMethodTable);
    if (p == NULL)
        return -1;

    My * pAfter = ((My *)HndFetchHandle(oh))->m_pOther1;

    // Спостерігаємо, як GC, запущений всередині AllocateObject, переміщує об'єкти
    if (pBefore != pAfter)
        printf("GC перемістив об'єкт із %p у %p на ітерації %d\n", pBefore, pAfter, i);

    // Зберігаємо щойно виділений об'єкт у поле за допомогою WriteBarrier
    WriteBarrier((Object **)&(((My *)HndFetchHandle(oh))->m_pOther1), p);
}

// Створюємо слабкий дескріптор, що вказує на наш об'єкт
OBJECTHANDLE ohWeak = HndCreateHandle(g_HandleTableMap.pBuckets[0]->pTable[GetCurrentThreadHomeHeapNumber()], HNDTYPE_WEAK_DEFAULT, HndFetchHandle(oh));
if (ohWeak == NULL)
    return -1;

// Знищуємо сильний дескріптор, щоб ніщо не тримало наш об'єкт живим
HndDestroyHandle(HndGetHandleTable(oh), HNDTYPE_DEFAULT, oh);

// Явно запускаємо повне збирання GC
pGCHeap->GarbageCollect();

// Перевіряємо, що слабкий дескріптор було очищено GC
assert(HndFetchHandle(ohWeak) == NULL);
printf("Слабкий дескріптор очищено GC\n");

printf("Готово\n");
```

Якщо хочете побачити весь вихідний код одним файлом і погратися з ним — переходьте до [репозиторію на Codeberg](https://codeberg.org/kant2002/gcsample). Гарного кодування!
