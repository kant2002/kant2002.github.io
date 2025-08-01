---
layout: post
title:  "Шаблони використання LLM - Шаблон створення сленгу"
date:   2025-02-02 12:58:50 +0500
categories: LLM
comments: true
---

Це перша стаття із серії яка описує шаблони будування запитів до LLM систем.
Інші статті в серії
- [2. Автоматизатор виводу]({% post_url 2025-02-21-output-automater %})
- [3. Перевернута взаємодія]({% post_url 2025-03-06-flipped-interaction %})
- [4. Шаблон персона]({% post_url 2025-03-31-persona-pattern %})
- [5. Шаблон уточнення питання]({% post_url 2025-04-16-question-refinement %})
- [6. Шаблон альтернативні підходи]({% post_url 2025-05-25-alternative-approach %})
- [7. Шаблон когнітивного верифікатора]({% post_url 2025-06-14-cognitive-verifier %})
- [8. Шаблон список фактів для перевірки]({% post_url 2025-06-21-fact-checker-list %})
- [9. Шаблон нескінченної генерації]({% post_url 2025-06-28-infinite-generation %})
- [10. Шаблон генератора візуалізацій]({% post_url 2025-07-07-visualization-generator %})

# Шаблон створення сленгу

## Намір і контекст

Під час спілкування із LLM, користувач може створити запит через альтернативний діалект мови, такий як скорочені текстові позначення для графів, чи опис станів і переходів станів для кінцевої машини, чи набір команд для швидкої автоматизації тощо. Шаблон пояснює семантику цієї альтернативної мови LLM, щоб користувач міг писати майбутні запити, використовуючи цей новий сленг та її семантику.

## Мотивація

Багато проблем, структур або інших ідей, висловлених у запиті, можуть бути виражені більш стисло, однозначно та чітко мовою, відмінною від побутової української (або іншої мови, яка використовується для взаємодії з LLM). Однак, щоб отримати результат на основі іншого професійного сленгу, LLM повинен розуміти його семантику.

<!--more-->

## Структура та ключові ідеї

Основні твердження для контексту:

> Коли я кажу X, я маю на увазі Y (або хочу, щоб ви зробили Y)

Ключова структура цього шаблону передбачає пояснення LLM значення одного або кількох символів, слів або тверджень, щоб він використовував надану семантику для подальшого діалогу. Цей опис може мати форму простого перекладу, наприклад «X» означає «Y». Опис також може приймати складніші форми, які визначають серію команд та їх семантику, наприклад «коли я кажу X, я хочу, щоб ви виконали». У цьому випадку «X» відтепер пов’язано із семантикою «виконати дію».

## Приклад реалізації

Ключем до успішного використання шаблону *Cтворення сленгу* є розробка однозначної нотації або скорочення, як-от:

>  «Відтепер щоразу, коли я вводжу два ідентифікатори, розділені «→», я описую граф. Наприклад, «a → b» описує граф із вузлами «a» і «b» і ребром між ними. Якщо я розділяю ідентифікатори «-[w:2, z:3]→», я додаю властивості ребру, такі як вага або мітка».

У цьому прикладі шаблону *Cтворення сленгу* встановлюється стандартизована нотація для опису графів шляхом визначення конвенції для представлення вузлів і ребер. Щоразу, коли автор вводить два ідентифікатори, розділені символом «→», це вказує на те, що описується граф. Наприклад, якщо автор вводить «a → b», це означає, що граф визначається з вузлами «a» і «b» і що між ними є ребро. Ця конвенція забезпечує чіткий і стислий спосіб повідомити структуру графа в письмовій формі.

Крім того, запит продовжує вказувати, що додаткову інформацію про ребра, таку як вага або мітка, можна надати за допомогою синтаксису «-[w:2, z:3]→». Ця нотація дозволяє специфікувати додаткові властивості поза основною структурою графа. Зазначені властивості пов’язані з ребром між двома вузлами та можуть надати важливий контекст для інтерпретації графа. Ця стандартизована нотація для опису графів може полегшити передачу структур і властивостей графа, які може бути непросто або дуже багатослівно описати як ряд речень.

## Наслідки

Хоча цей шаблон надає потужні засоби для налаштування взаємодії користувача з LLM, він може створити потенціал для плутанини в LLM. Наскільки важливо чітко визначити семантику мови, важливо також переконатися, що сама мова не вносить неоднозначності, що погіршує продуктивність або точність LLM. Наприклад, запит «кожного разу, коли я розділяю дві речі комами, це означає, що перша річ передує другій речі», ймовірно, створить значний потенціал для неоднозначності та створить потенціал для несподіваної семантики, якщо розділові знаки, що містять кому, використовуються в запиті.

Щоб продемонструвати потенційну плутанину, ChatGPT попередить користувача та потенційно не зможе виконати конкретне зіставлення символу чи терміна з новим значенням. Наприклад, якщо в ChatGPT надходить наступне повідомлення

>  “Whenever I say “a”, I am referring to Marie Antoinette.”

LLM відповість, що це запит створює занадто багато плутанини, оскільки «a» є невизначеним артиклем в англійскій мові і дуже часто вживаним, як показано нижче:

> “Referring to Marie Antoinette using “a” could potentially cause confusion, as “a” is an indefinite article commonly used to refer to a noun that has not been mentioned before. It may be more clear to use her name, “Marie Antoinette”, or a pronoun such as “she” or “her” to refer to her. Moreover, using context to establish who you are referring to can also help avoid confusion in conversation.”

Загалом, LLM працюватиме краще з даними, на яких він навчався. Таким чином, коли наявна нотація доступна, але може не бути домінуючим значенням, шаблон *Створення сленгу* може надати контекст для визначення значення символу, щоб покращити точність і корисність результату. Наприклад, символ «→» передає дещо іншу інформацію у графах ніж у пропозиційній логіці. Таким чином, вислів «p → q, q → p» може мати сенс, але лише якщо LLM отримає відповідний контекст через запит створений за допомогую шаблону *Створення сленгу*.

Незважаючи на те, що *Cтворення сленгу* є потужним шаблоном, його слід використовувати обережно, особливо під час опису концепцій, які інакше може бути важко точно чи коротко описати. Таким чином, ці типи запитів найкраще використовувати в абсолютно нових сеансах розмови. Використання однієї мета-мови для сеансу розмови також може бути найкращою практикою, оскільки це дозволяє уникнути конфліктної або неочікуваної семантики, застосованої до розмови з часом.