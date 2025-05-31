---
layout: post
title:  "Сертіфікований перевіряльник типів"
date:   2024-11-23 11:43:44 +0600
categories: uk lean
comments: true
use_math: false
render_with_liquid: false
---

У цьому прикладі, ми побудуємо сертифікований перевіряльник типів для простої мови виразів яка має лише 2 типа натуральні числа і логічні значення, і лише дві операції додавання і логічне І.

Зауваження: цей приклад базується на прикладі із книги
[Certified Programming with Dependent Types](http://adam.chlipala.net/cpdt/) Адама Чіліпала
і прикладу [із репозіторію Lean4](https://github.com/leanprover/lean4/blob/ba3f2b3ecf8967410f3498e2835b883601f03967/doc/examples/tc.lean).

<!--more-->

Створимо індуктивний тип який описує 4 типа виразів - літерал цілого числа, літерал логічного типа, операція додавання та операція логічного І.

```lean
inductive Expr where
  | nat  : Nat → Expr
  | plus : Expr → Expr → Expr
  | bool : Bool → Expr
  | and  : Expr → Expr → Expr
```

Ми визначаємо просту мову типів використовуючи індуктивний тип даних `Ty`. Тип цілого числа буде визначено як випадок `nat`, тип логічних значень буде визначений  як `bool`. Правила типізації, будуть визначені використовуючи індуктивний предікат `HasType`. Цей тип визначає стверждення про наявність типа у вираза. У нас будуть 4 типа правил - правила типізації цілого числа, правила типізації логічних типів, правила типізації додавання і правила типізації логічного І. Таким чином ми маємо по одному правилу на кожен тип виразу із `Expr`.

```lean
inductive Ty where
  | nat
  | bool
  deriving DecidableEq

inductive HasType : Expr → Ty → Prop
  | nat  : HasType (.nat v) .nat
  | plus : HasType a .nat → HasType b .nat → HasType (.plus a b) .nat
  | bool : HasType (.bool v) .bool
  | and  : HasType a .bool → HasType b .bool → HasType (.and a b) .bool
```

Ми легко можемо показати що якщо `e` має тип `t₁` і тип `t₂`, тоді `t₁` і `t₂` повинні бути однакові
використовуючи тактику `cases`. Ця тактика створює нову підціль для кожного конструктора,
і автоматично відкидає недоступні випадки. Таким чином `cases h₁` створить 4 підцілі, по 
одній на кожне правило типізації. Комбінатор тактик `tac₁ <;> tac₂` застосовує `tac₂` до кожної підцілі створеною `tac₁`. 
Післі `cases h₁ <;> cases h₂` у нас залишаться лише 4 підцілі а не 16, тому що правила типізації для `HasType e _` у `h₁` і тип `h₂` повинні співпадати, через те що `e` це той самий вираз і у обоїх випадках.  Потім, тактика `rfl` використовується для закриття усіх створених цілей використовуючи рефлексівність.

```lean
theorem HasType.det (h₁ : HasType e t₁) (h₂ : HasType e t₂) : t₁ = t₂ := by
  cases h₁ <;> cases h₂ <;> rfl
```

Індуктивний тип `Maybe p` має два конструктора: `found a h` та `unknown`. Перший конструктор містить елемент `a : α` і доказ що `a` задовольняє предікат `p`. Конструктор `unknown` використовується для кодування "помилки". У нашому прикладі, це буде помилка типізації.

```lean
inductive Maybe (p : α → Prop) where
  | found : (a : α) → p a → Maybe p
  | unknown
```

Ми визначаємо нотацію для `Maybe` яка схожа до вбудованої нотації для вбудованого типу Lean `Subtype`.


```lean
notation "{{ " x " | " p " }}" => Maybe (fun x => p)
```


Створимо функцію `Expr.typeCheck e` яка повертає тип `ty` і доказ того що `e` має тип `ty`, або `unknown`. Зауважте що, `def Expr.typeCheck ...` у Lean це нотація до `namespace Expr def typeCheck ... end Expr`. Терм `.found .nat .nat` це сахар до `Maybe.found Ty.nat HasType.nat`. Lean може вивести використовуємий простір імен для очікуваних типів. Нотація `e.typeCheck` це також сахар для виклику `Expr.typeCheck e`. 

```lean
def Expr.typeCheck (e : Expr) : {{ ty | HasType e ty }} :=
  match e with
  | nat ..   => .found .nat .nat
  | bool ..  => .found .bool .bool
  | plus a b =>
    match a.typeCheck, b.typeCheck with
    | .found .nat h₁, .found .nat h₂ => .found .nat (.plus h₁ h₂)
    | _, _ => .unknown
  | and a b =>
    match a.typeCheck, b.typeCheck with
    | .found .bool h₁, .found .bool h₂ => .found .bool (.and h₁ h₂)
    | _, _ => .unknown

theorem Expr.typeCheck_correct (h₁ : HasType e ty) (h₂ : e.typeCheck ≠ .unknown)
        : e.typeCheck = .found ty h := by
  revert h₂
  cases typeCheck e with
  | found ty' h' =>
    intro;
    have := HasType.det h₁ h';
    subst this;
    rfl
  | unknown =>
    intro;
    contradiction
```

Тепер ми докажемо що якщо `Expr.typeCheck e` повертає `Maybe.unknown`, тоді для усіх `ty`, `HasType e ty`
не виконується. Lean може це вивести тому що ми явно сказали що `e` має тип `Expr`. Доказ буде по індукції по `e` і аналізу випадків. Ми кажемо що змінна недоступна якщо вона введена тактикою (наприклад, `cases`) або була затінена іншою змінною variable введеною користувачем. Зверніть увагу що тактика `simp [typeCheck]` застосовується для усіх цілей згенерованих тактикою `induction`, і закриває випадки відповідні до конструкторів `Expr.nat` та `Expr.bool`. Тактика `split` розбиває вираз `match` у цілі на нові підцілі, і ми доводимо їх ітеруя одну за одною за допомогою 'next`.

```lean
theorem Expr.typeCheck_complete {e : Expr} : e.typeCheck = .unknown → ¬ HasType e ty := by
  induction e with simp [typeCheck]
  | plus a b iha ihb =>
    split
    next => intro; contradiction
    next ra rb hnp =>
      -- Зверніть увагу що `hnp` це гіпотеза згенерована тактикою `split`
      -- яка стверждує що попередній випадок не був використаний
      intro h ht
      cases ht with
      | plus h₁ h₂ =>
        exact hnp h₁ h₂ (typeCheck_correct h₁ (iha · h₁)) (typeCheck_correct h₂ (ihb · h₂))
  | and a b iha ihb =>
    split
    next => intro; contradiction
    next ra rb hnp =>
      intro h ht
      cases ht with
      | and h₁ h₂ =>
        exact hnp h₁ h₂ (typeCheck_correct h₁ (iha · h₁)) (typeCheck_correct h₂ (ihb · h₂))
```

Нарешті, ми показуємо що перевірка типа для `e` може бути вирішена використовуючи `Expr.typeCheck`. Для цього ми робимо показуємо екземпляр типу `Decidable  (HasType e t)` і за допомогою раніше доведених функцій `Expr.typeCheck_complete` та `HasType.det` показуємо як доводити вирішеність.

```lean
instance (e : Expr) (t : Ty) : Decidable (HasType e t) :=
  match h' : e.typeCheck with
  | .found t' ht' =>
    if heq : t = t' then
      isTrue (heq ▸ ht')
    else
      isFalse fun ht => heq (HasType.det ht ht')
  | .unknown => isFalse (Expr.typeCheck_complete h')
```

Файл який можна [завантажити](https://gist.github.com/kant2002/533826024893563fbc4d44944a8ac3d2) на Гісті.
