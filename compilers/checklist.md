---
layout: page
title: Контрольний список мови програмування
permalink: /compilers/checklist
---

Контрольний список мови програмування
від [Коліна МакМілена](https://www.mcmillen.dev/), [Джейсона Ріда](http://jcreed.org/) та [Елі Фонг-Джонс](https://elly.town/), 2011-10-10, Переклав українською [Андрій Курдюмов](http://kant2002.github.io/) 2025-06-13. Орігінал можна знайти [тут](https://www.mcmillen.dev/language_checklist.html)

```
Виглядає що ви відстоюєте нову:
[ ] функціональну  [ ] імперативну  [ ] об'єктно-оріентовуну  [ ] процедурну [ ] стекову
[ ] "мульті-парадігмену"  [ ] ліниву  [ ] ретельні(eager)  [ ] статично типізовану  [ ] дінамічно типізовану
[ ] чисту  [ ] не-чисту  [ ] негігієнічну  [ ] візуальну  [ ] дружню до початківців
[ ] дружню для не програмістів  [ ] цілком незрозумілу
мову програмування.  Ваша мова не буде працювати.  Ось чому вона не буде працювати.

Виглядає що ви вважаєте що:
[ ] Сінтаксіс це те щщо робить програмування складним
[ ] Збірка мусора безкоштовна                [ ] Компьютери мають нескінченну пам'ять
[ ] Ніхто взагалі не потребує
    [ ] конкурентність  [ ] REPL  [ ] підтримка відладчика [ ] підтримка IDE  [ ] I/O
    [ ] взаємодіяти із кодом написаним не на вашій мові
[ ] Цілий світ розмовляє 7-bit ASCII
[ ] Масштабування до великих програмних проектів буде легким
[ ] Переконувати програмістів спробувати нову мову буде легко
[ ] Переконувати програмістів адоптувати специфічне для мови IDE буде легко
[ ] Програмісти люблять писати багато типового коду
[ ] Вказати що поведінка "невизначена" означає що програмісти не будуть покладатися на неї
[ ] "Дія привідів на відстані" робить програмування більш веселішим

Нажаль, у вашій мові (є/відсутнє):
[ ] зрозумілий сінтаксис  [ ] крапка із комою  [ ] значущі пробіли [ ] макроси
[ ] неявні конверсії типів [ ] явна конвертація  [ ] вивід типів
[ ] goto  [ ] виключення  [ ] замикання  [ ] хвостова рекурсія  [ ] корутіни
[ ] рефлексія  [ ] підтипізація  [ ] множинне успадкування  [ ] перевантаження операторів
[ ] алгебраічні типи даних [ ] рекурсивні типи  [ ] поліморфічні типи
[ ] коваріантна типізація масивів  [ ] монади  [ ] залежні типи
[ ] інфіксні оператори  [ ] вкладені коментарі  [ ] багаторядкові рядки  [ ] регулярки
[ ] виклик-по-значенню  [ ] виклик-по-імені  [ ] виклик-по-посиланню  [ ] call-cc

Наступні філософські запаречення можна застосувати:
[ ] Програмісти не повинні мати потребу в розумінні теорії категорій щоб написти "Привіт, світ!"
[ ] Програмісти не повинні напрацювати собі тунельний сіндром від написання "Hello, World!"
[ ] Найільш важлива програма написани на вашій мові це її власний компілятор
[ ] Найільш важлива програма написани на вашій мові це навіть не її власний компілятор
[ ] Відсутня спеціфікація мови
[ ] "Реалізація, цє специфікація"
   [ ] Реалізація у закритому коді  [ ] захищена патентами  [ ] якими ви не володієте
[ ] Ваша система типів ненадійна  [ ] Ваша мова не може бути однозначна розібрана
   [ ] доказ цього прикладено
   [ ] виклик цього доказу ламає компілятор
[ ] Ім'я вашої мови робить неможливим знайти її в Google
[ ] інтерпретовані мови ніколи не будуть настільки швидкі як і 
[ ] Компільовані мови ніколи не будуть "розширюваними"
[ ] Написати компілятор який розуміє англійську є AI-повною задачою
[ ] Ваша мова покладається на оптимізації які ніколи не були показани можливими
[ ] Існує менше ніж 100 програмістів на Землі достатньо розумних щоб використовувати вашу мову
[ ] ____________________________ займає експоніненційний час
[ ] ____________________________ відомо що є алгорітмічно нерозв'язною задачою

У вашій реалізації є такі недоліки:
[ ] Процесори так не працюють
[ ] Оперативна пам’ять так не працює
[ ] Віртуальні машини так не працюють
[ ] Компілятори так не працюють
[ ] Компілятори не можуть так працювати
[ ] Конфлікти зсуву-редукції при синтаксичному аналізі, схоже, вирішуються за допомогою rand()
[ ] Ви вимагаєте наявності компілятора в рантаймі
[ ] Ви вимагаєте наявності середовища виконання мови під час компіляції
[ ] Повідомлення про помилки компілятора абсолютно незбагненні
[ ] Небезпечна поведінка це лише застереження
[ ] Компілятор крашиться, якщо косо на нєї дивитися
[ ] Віртуальна машина крашиться, якщо косо на неї дивитися
[ ] Ви, здається, не розумієте базових технік оптимізації
[ ] Ви, здається, не розумієте основ системного програмування
[ ] Ви, здається, не розумієте, як працюють вказівники
[ ] Ви, здається, не розумієте, як працюють функції

Крім того, ваш маркетинг має такі проблеми:
[ ] Безпідставні заяви про підвищення продуктивності
[ ] Безпідставні заяви про "простоту використання"
[ ] Очевидно підроблені бенчмарки
   [ ] Графічні, симуляційні або криптографічні-бенчмарки, де ваш код просто викликає
       написаний вручну асемблер через FFI
   [ ] Тестування обробки рядків, де ви просто викликаєте PCRE
   [ ] Тестування матричних обчислень, де ви просто викликаєте BLAS
[ ] Ніхто насправді не вірить, що ваша мова швидша за:
    [ ] асемблер  [ ] C  [ ] FORTRAN  [ ] Java  [ ] Ruby  [ ] Prolog
[ ] Відмова від ортодоксальної теорії мов програмування без обґрунтування
[ ] Відмова від класичних підходів до системного програмування без обґрунтування
[ ] Відмова від основ алгоритмічної теорії без обґрунтування
[ ] Відмова від базової інформатики без обґрунтування

З урахуванням ширшої екосистеми, я хотів би зазначити:
[ ] Ваш складний приклад можна було б записати в один рядок на: _______________________
[ ] У нас уже є небезпечна імперативна мова
[ ] У нас уже є безпечна імперативна ОО мова
[ ] У нас уже є безпечна статично типізована функціональна ретельна-мова(eager)
[ ] Ви винайшли Lisp, але гірший
[ ] Ви винайшли Javascript, але гірший
[ ] Ви винайшли Java, але гіршу
[ ] Ви винайшли C++, але гірший
[ ] Ви винайшли PHP, але гірший
[ ] Ви винайшли Brainfuck, але без супутньої іронії

На завершення, ось що я про вас думаю:
[ ] У вас є кілька цікавих ідей, але це не спрацює.
[ ] Це погана мова, і вам має бути соромно, що ви її придумали.
[ ] Програмування цією мовою - це адекватне покарання за її створення
```
