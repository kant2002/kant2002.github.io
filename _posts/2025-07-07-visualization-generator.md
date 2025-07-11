---
layout: post
title:  "Шаблони використання LLM - Шаблон генератора візуалізацій"
date:   2025-07-07 07:36:21 +0500
categories: LLM
comments: true
---

Це десята стаття стаття із серії яка описує шаблони будування запитів до LLM систем.
Інші статті в серії
- [1. Шаблон створення сленгу]({% post_url 2025-02-02-llm-patterns %})
- [2. Автоматизатор виводу]({% post_url 2025-02-21-output-automater %})
- [3. Перевернута взаємодія]({% post_url 2025-03-06-flipped-interaction %})
- [4. Шаблон персона]({% post_url 2025-03-31-persona-pattern %})
- [5. Шаблон уточнення питання]({% post_url 2025-05-25-alternative-approach %})
- [6. Шаблон альтернативні підходи]({% post_url 2025-05-25-alternative-approach %})
- [7. Шаблон когнітивного верифікатора]({% post_url 2025-06-14-cognitive-verifier %})
- [8. Шаблон список фактів для перевірки]({% post_url 2025-06-21-fact-checker-list %})
- [9. Шаблон нескінченної генерації]({% post_url 2025-06-28-infinite-generation %})

# Шаблон генератора візуалізацій

## Намір і контекст

Мета цього шаблону полягає у використанні генерації тексту для створення візуалізацій. Багато концепцій легше зрозуміти у форматі діаграми або зображення. Мета цього шаблону полягає у створенні шляху для інструменту для створення зображень, пов'язаних з іншими результатами. Цей шаблон дозволяє створювати візуалізації шляхом створення вхідних даних для інших відомих інструментів візуалізації, які використовують текст як вхідні дані, таких як [Graphviz Dot](https://graphviz.org/) або [DALL-E](https://openai.com/dall-e-3). Цей шаблон може забезпечити більш повний та ефективний спосіб передачі інформації, поєднуючи сильні сторони інструментів генерації тексту та візуалізації.

## Мотивація

LLM зазвичай створюють текст і не можуть створювати зображення. Наприклад, LLM не може намалювати діаграму для опису графіка. Шаблон *Генератор візуалізацій* долає це обмеження, генеруючи текстові дані у правильному форматі для підключення до іншого інструменту, який генерує правильну діаграму. Метою цього шаблону є покращення результату LLM та зробити його візуально привабливішим і легшим для розуміння користувачами. Використовуючи текстові дані для створення візуалізацій, користувачі зможуть швидко зрозуміти складні концепції та взаємозв'язки, які може бути важко осягнути лише за допомогою тексту.

<!--more-->

## Структура та ключові ідеї

Основні твердження для контексту:

> Згенерувати X, який я можу надати інструменту Y для його візуалізації

Мета контекстних тверджень полягає в тому, щоб вказати LLM, що результатом, «X», який він створюватиме, буде зображення. Оскільки LLM не може генерувати зображення, фраза «що я можу надати інструменту Y для його візуалізації» уточнює, що від LLM не очікується генерування зображення, а натомість очікується, що контекстні твердження створять опис зображень, у форматі що використовуються інструментом Y для створення зображення.

Багато інструментів можуть підтримувати різні типи візуалізацій або форматів, і тому сам цільовий інструмент може не містити достатньо інформації для точного створення того, що хоче користувач. Користувачеві може знадобитися вказати точні типи візуалізацій (наприклад, стовпчаста діаграма, орієнтований графік, діаграма класів UML), які слід створити. Наприклад, Graphviz Dot може створювати діаграми як для діаграм класів UML, так і для орієнтованих графів. Крім того, як буде обговорено в наступному прикладі, може бути вигідно вказати список можливих інструментів і форматів і дозволити LLM вибрати відповідну ціль для візуалізації.


## Приклад реалізації

Нижче наведено приклад нескінченної генерації запиту для створення серії URL-адрес:

>  «Щоразу, коли я прошу вас щось візуалізувати, будь ласка, створіть файл Graphviz Dot або запит DALL-E, який я можу використовувати для створення візуалізації. Виберіть відповідні інструменти залежно від того, що потрібно візуалізувати.».

Цей запит поєднує функціональність шаблону *Нескінченна генерація* та шаблону *Шаблон*. Користувач робить запит, щоб LLM безперервно генерував ім'я та посаду, доки не буде чітко наказано «стоп». Згенеровані результати потім форматуються у наданий шаблон, який містить заповнювачі для імені та посади. Використовуючи шаблон *Нескінченна генерація*, користувач отримує кілька результатів без необхідності постійно повторно вводити шаблон. Аналогічно, *Шаблон* застосовується для забезпечення узгодженого формату результатів.

## Наслідки

Цей приклад шаблону додає уточнення, що тип виводу для візуалізації може бути або для Graphviz, або для DALL-E. Цікавим аспектом цього підходу є те, що він дозволяє LLM використовувати своє семантичне розуміння формату виводу для автоматичного вибору цільових інструментів на основі того, що буде відображатися. У цьому випадку Graphviz буде призначений для візуалізації графів з потребою точно визначеної структури. DALL-E буде ефективним для візуалізації реалістичних або художніх зображень, які не мають точно визначеної структури. LLM може вибрати інструмент на основі потреб візуалізації та можливостей кожного інструменту.