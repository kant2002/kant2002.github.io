---
layout: post
title:  "Генеруя .NET емулятор"
date:   2026-05-13 17:21:44 +0200
categories: uk llm emulator
comments: true
---

<script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, logLevel: 'trace' });
  document.querySelectorAll('pre > code.language-mermaid').forEach((codeBlock) => {
    codeBlock.parentElement.outerHTML = `<pre class="mermaid">${codeBlock.textContent}</pre>`;
  });
</script>

Пани ллмоводи. хочу зробити емулятор IL / .NET VM, наприклад для сендбоксінга малварі. Вирішим ось так зробити, взяти фазінг як процес загального контролю над якістю виконання.

Я бачу наступні процеси напівавтоматичного будування емулятора
- Процес контролю прогресу виконання
- Процес реалізації
- Процес контролю реалізації
- Процес коригування багу
- Процес ручного відновлення

Узагальнено процесс можна побачити таким чином.

<pre class="mermaid">
flowchart TD
    classDef llmTask fill:orange,stroke:#333,stroke-width:4px,color:#333;
    classDef llmGeneratedScript fill:lightGreen,stroke:#333,stroke-width:4px,color:black;
    classDef humanCode fill:green,stroke:#333,stroke-width:4px,color:white;
    START([Початок])
    FINISH([Кінець])

    %% Загальний flow
    START --> Progress
    Progress -->|Реалізувати нову інструкцію| Impl 
    Progress -->|Немає нереалізованих інструкцій| FINISH 
    Impl -->|Успішно| Validation
    Impl -->|Не вийшло реалізувати| RecoveryProcess
    Validation -->|Помилки знайдено| BugFix
    BugFix -->|Успішно| Validation
    BugFix -->|Не вийшло реалізувати| RecoveryProcess
    Validation -->|Успішно| Progress
    Validation -->|Не вийшло реалізувати| RecoveryProcess
</pre>

<!--more-->

Процес контролю прогресу виконання
1. Будую руками, або через простий скрипт сгенерований ЛЛМ список всіх IL інструкцій. Це буде ручний чекліст того що зроблено.
Для кожної інструкції окрім мнемоніки також буде сгенерований опис того що вона робить. Я не планую мати складний опис, тобто не вся спека поведінки інструкції.
2. Якщо всі тести і фаззінг пройшли, я вважаю що інструкція реалізована і відмічаю це в чеклісті.

Процес реалізації
1. На вхід ЛЛМ у вигляді промпта подається інструкція яку треба реалізувати, та опис семантичної поведінки цієї інструкції.
2. Для смоук теста виконання промпта виконується тестові проекти. Якщо все пройшло успішно, чернова реалізація вважається закінченою успішно
3. Після завершення єтапу потрібно записати результати фінансових витрат в файл фін аудіту скриптом.

Процес контролю реалізації
1. Пишу руками фаззер який генерує послідовніть інструкцій із дозволеного списка інструкцій реалізованих, або тих які зараз будуть реалізовуватися.
Фазер перевіряє виконання сгенерованої послідовністі на емуляторі, і на звичайному .Net рантаймі. Якщо щось відрізняється, це провал.
Це рееструється, і із нагенерованої послідовності будується зменшений випадок. Цей зменшений випадок в якійсь мові програмування буде записано в файл.
2. Якщо чернова реалізація має помилки і сгенерований файл із тесткейсом, то цей тесткейс додається в тестовий проект емулятора. Після чого запускається фаза виправлення багу
3. Якщо чернова реалізація не має помилок то вважається що поточна реалізація інструкції сталася успішно, і можна вибирати наступну інструкцію для реалізації
4. Після завершення єтапу потрібно записати результати фінансових витрат в файл фін аудіту скриптом.

Процес коригування багу
1. ЛЛМ інструктується вирішити всі баги які знайдені в результаті запуску тестового проекту емулятора.
2. Процес закінчується або через 10 ітерацій спроб виправити помилки, або коли всі помилки в тестовому проекті було виправлено.
3. Після завершення єтапу потрібно записати результати фінансових витрат в файл фін аудіту скриптом.
4. Після цього треба почати запуск Процесу контроля реалізації

Процес ручного відновлення
1. У випадку, якщо виконання задачі зайняло багато часу, як запобіжник, система повинна припияти роботу
2. Оператор системи (я) повинен буду розібратися і задокументувати в трекері причину проблеми, що пішло не так, звісно якщо це можливо.

Весь процесс можна побачити таким чином.

<pre class="mermaid">
flowchart TD
    classDef llmTask fill:orange,stroke:#333,stroke-width:4px,color:#333;
    classDef llmGeneratedScript fill:lightGreen,stroke:#333,stroke-width:4px,color:black;
    classDef humanCode fill:green,stroke:#333,stroke-width:4px,color:white;
    START([Початок])
    FINISH([Кінець])

    %% Контроль прогресу
    subgraph Progress["Процес контролю прогресу виконання"]
        P1["Згенерувати список всіх IL інструкцій<br/>(вручну або через LLM-скрипт)"]:::llmGeneratedScript
        P2["Для кожної інструкції:<br/>- мнемоніка<br/>- короткий опис поведінки"]:::llmGeneratedScript
        P3{"Всі тести та фаззінг пройшли?"}
        P4["Позначити інструкцію як реалізовану<br/>в чеклісті"]

        P1 --> P2 --> P3
        P3 -->|Так| P4
    end

    %% Реалізація
    subgraph Impl["Процес реалізації"]
        I1["Передати в LLM:<br/>- інструкцію<br/>- опис семантики"]
        I2["Запустити смоук-тести<br/>на тестових проектах"]:::llmTask
        I3{"Смоук-тести успішні?"}
        I4["Чернова реалізація завершена"]
        I5["Записати фінансові витрати<br/>у файл фінансового аудиту"]:::llmGeneratedScript

        I1 --> I2 --> I3
        I3 -->|Так| I4 --> I5
    end

    %% Контроль реалізації
    subgraph Validation["Процес контролю реалізації"]
        V1["Фаззер генерує послідовність IL інструкцій"]:::humanCode
        V2["Порівняти виконання:<br/>- емулятор<br/>- .NET runtime"]:::humanCode
        V3{"Є відмінності?"}
        V4["Зареєструвати помилку"]:::humanCode
        V5["Побудувати minimized testcase"]:::humanCode
        V6["Записати testcase у файл"]:::humanCode
        V7{"Чернова реалізація має помилки?"}
        V8["Додати testcase<br/>в тестовий проект емулятора"]:::llmTask
        V9["Реалізація інструкції успішна"]
        V10["Вибрати наступну інструкцію"]:::llmTask
        V11["Записати фінансові витрати<br/>у файл фінансового аудиту"]:::llmGeneratedScript

        V1 --> V2 --> V3

        V3 -->|Так| V4 --> V5 --> V6 --> V7
        V3 -->|Ні| V7

        V7 -->|Так| V8
        V7 -->|Ні| V9 --> V10 --> V11
    end

    %% Коригування багу
    subgraph BugFix["Процес коригування багу"]
        B1["LLM отримує інструкцію<br/>виправити знайдені баги"]
        B2["Запустити цикл виправлення"]:::llmTask
        B3{"Всі помилки виправлено?"}
        B4{"Досягнуто 10 ітерацій?"}
        B5["Завершити процес виправлення"]
        B6["Записати фінансові витрати<br/>у файл фінансового аудиту"]:::llmGeneratedScript
        B7["Повернутися до процесу<br/>контролю реалізації"]
        B8{"Всі помилки виправлено?"}
        
        B1 --> B2 --> B3
        B3 -->|Так| B5
        B3 -->|Ні| B4
        B4 -->|Ні| B2
        B4 -->|Так| B5

        B5 --> B8 -->|Так| B6 --> B7
        B8 -->|Ні| RecoveryProcess[Процес відновлення]
    end

    %% Загальний flow
    START --> Progress
    Progress -->|Реалізувати нову інструкцію| Impl 
    Progress -->|Немає нереалізованих інструкцій| FINISH 
    Impl -->|Успішно| Validation
    Impl -->|Не вийшло реалізувати| RecoveryProcess
    Validation -->|Помилки знайдено| BugFix
    BugFix -->|Успішно| Validation
    BugFix -->|Не вийшло реалізувати| RecoveryProcess
    Validation -->|Успішно| Progress
    Validation -->|Не вийшло реалізувати| RecoveryProcess
</pre>

[Подивитися в редакторі](https://mermaid.live/edit#pako:eNrNWFtvE0cU_iujrZBActL4nmwrqhoKtQQIQeSHYh4We2Ov8CVar8vFiQQ2UB4iIiHkSEiI3qS-mlwaJ47NX5j9Rz2XXWd2vYao7QNRYu_uzHxzLt_5zmw6WqlZNjVdW6s1H5Sqhu2I1cvFhoCfUs1otS6ba6JWq68arftizarV9KZtNCpmrOXYzfum_lUymfSuFx5YZaeqp9YfxkrNWtOmsW9moa6aDdM2HLN8u2Rb6w6j1qxK1blqm2bjLMj3akbpfhi62q4bjUvgDCNWzgr2oGo5pgd2e_X7W6vn78j3cuL-IgduV07k8d0LPHglfyN_-0cYfev25VgeuC_cLRzj0XPnhHwL08du130C3yN3S8iPdLkHnwfuU7fHM1vtexXbWK-Km3YTrGy17hQ1-R5nui9wnpDHAZxXMzhC7sohz5ID-Bu720XtLqPjz804Qu7IPXlAhj5xe7AC3RkK96n8KIfwCZ4BDsD13ecif02gU3DXpdnH4FxfHn17z_764nmYBc8gIGPceiA_yImAuwM0Rx6Ka9euLwDeMdwOwdLuBbBF1_XZVCsGJtDAN-DcNnv7N9g5cXcijHB3dLJiQcgTdAY-MTh9WDbwBwCBwteFq6E8EjCDfITAweUuLNqnlMHoGWxLdsC21xgYAYgYcIpbVw6E-wzcP5SHhLbn5-XIfSlHcvhdUdtUYFKUVhg-xCxBvIaMM-vhK-FuQzIonAOISR-WoNkDDDj5KHcp4OAAjNLqPiVcTblYWLgIgeWvpOoPPtqQvwPe8QbYxUNmo6xS91dl7wFZtR1ia76-XgszNWAyL9sJMDEf5ygwV_Y9DoI7QBo_r1ER8TPrJxL4hZnHiHSJ-sPgNgkm_AAy0uOE-WQHuiDswmkqOaJjTKf_DKM9hDLwEgqBxnS7z6dsQf1TtiOK_BaBLXB7QOkDJYCkQUrkiRJ_UTDGnOGoCEJJwCXSFiLykkp4EPQ2PfWWKtkr7GfESgwRFvcu0Je8QhkZTP2GCiYSH8nRzAqUGChtmN2DVOHK3vxyUXNMnMsz9fJJNU4B6uVTPCMdycCweEZyK0jJglGzyoZjNRufldDPMrVATP2T6xtDL1T5dN-QlkCcEGGfojX2SnFrnnpy8KZ9Sdkr4WkDzO4T0rZXF2FZn2ofsB-ARzQRlnmPF2_8sCrsdsOx6ub83Yitz1Ds0fQTSjrKLelIkKKFlEctajVvph753YME9QSsHIGTvflbpn3x-4BcUgDqVsOqW4_NsnDMllMyWp-wOxNFc3-ZUJg8HyLbOWPFgbZ4OfbdCwt6YZl71mQqY74pU4kOyAn2IUVOZlJIRR2lLoUV3ChCkCO7Y0BxQkJRiC8h1Gsw5oOvAoK6EYL0wFvs6FH6O8-0ePyLkp4CS0-BpaeQDIwFxafA4lNI81eGv7Kz89-5_Q0aUGkUhFqeHeJVK4waX_K-4_OUjs5Ke1wXXOkCjlUDfBTSuFy7csV6GKVvn8JQWZDDnEG_FXhCokUnJGhz-y6xF6k74CwiaegQA6nbR03E_NJOoTacm9eGX5CujUQAeUTyymfXKLLllINYsDCjcCbBas2lOlytsHwbDAWiY9kJSA342SVFGLBMhxZOm6vfgL0IfFTDP88PBSfzBVTK1Jhsp-MJ8i6LIYVjiMER2M4C7vmHzrP10E01eMv_IWUqY6l-clzWuaTKiUAl5tKzQ1SJuZRKBXUgMTuggKk84M2Xg3NYN3JZ1WcF_pZZav5s2o_g1a4Eb3adTrBquQNzJ5rSxg9gSCV2qMAw3FswD9sJvqIr76l80vfeIfm5f8cWKS1EbeG0_Rzd36BjvohCe8cncOySY-88H3pZoSN01EFow3t39nBpC8L8Q2ldkw3lPBeeCJszg_hdaxLg4qlzMwlgnFNcRnsfZGZA29AO1lxey9dnMled-v8aHNo4mPTw5H-7tRbTKrZV1nTHbpsxrW7adQNvtQ7uU9ScqomnTB0uy-aa0a45Ra3Y2IRl60bjp2az7q-0m-1KVdPXjFoL7trrYJx52TKgn51OAbKb9qUmHF01PZWJJwhE0zvaQ02Pp1KL8CiRSK9ksssrcBXTHsHjpdRiNrucgifpBP5uxrTHtG18MbOUzSQT2ZX4SiodT2eSMc0sW07Tvs7_3KL_cW3-A3sJcJQ)

Цікаво що ще можна додати щоб система все ще залишалася зрозумілою і контрольованою із мінімумов ЛЛМ циклів. Бо я вважаю що навіть так, дуже імовірно що у складних випадках система буде ламатися невідомим чином і буде потребувати ручного коригування.