---
layout: post
title:  "Як склонувати Linux на Windows"
date:   2026-09-21 18:10:00 +0200
categories: uk git hacking
comments: true
---


Я не знаю, як я можу знаходити собі такі пригоди, але інколи зламаний софт сам мене знаходить, навіть коли я не шукаю пригод активно. Сьогоднящня пригода про легасі Windows та клонування Linux.

<!--more-->

Ніщо не вказувало на проблеми, я спокійнісінько розбирався із програмою автоматичного символьного перезапису, намагаючись побудувати свій аналог. В цілому нормальний задротський відпочинок. Реверсінг поведніки погано документованих систем це забавно. Навіть коли це прості речі типу функції друкування `prn`.
Після того як я був задоволений своїми знахідками, я зміг зробити тест для поведінки цієї функції, і записав його у файл `prn.ap`. Потім як порядошна людина я вирішив що це доволі гарна праця, тому я вирішив її зберегти. Натикавщи що мені треба в Zed і радісно натиснув кнопку Сommit. Але Zed вирішив що щось не так, написав мені помилку, і зняв галочку із файлу. Тобто він не залишився в індексі.
Як нормальний програміст, я вирішив що треба спробувати знову, і звісно із другого разу все запрацює. Звісно нічого не запрацювало. Це мене дуже спантеличило, тому я пішов в термінал щоб побачити що насправді коїться, бо Zed не дуже хоче показувати нормальні повідомлення про помилки Git. Ось що мені показав термінал.

```shell
git add .\samples\prn.ap -f
error: open("samples/prn.ap"): No such file or directory
error: unable to index file 'samples/prn.ap'
fatal: adding files failed
```

Окей думаю, щось мабуть таки не те, може файл видалився. Пішов в Zed -- там файл інсує, пару раз зберіг, знову спробував додати. Звісно із тим самим результатом. Можна бачити, як я не хочу приймати реальність і намагаюся торгуватися із нею, вважаючи що щось само виправиться.
Потім я перевірив таки чи файл є, `more .\samples\prn.ap`. Таки є, і змісти не пустий. Тоді я вирішив що час для чарівної ШІ-палочки. ШІ-шка мені сказала що мабуть `prn is a reserved Windows device name`. Окей думаю, точно, є така проблема, але ж у мене `prn.ap`, яка зарезервована назва.
Ну коротше я знову поторгувався із всесвітом, і поліз шукати похідний код для Git for Windows. Спеціальні файли для Windows записані в тестах https://github.com/git-for-windows/git/blame/c731bc939fc0ce5b75ddb6766589e7d39f1ba095/t/t0060-path-utils.sh#L591 .
Спочатку мене спантеличило, чому prn.abc в тесті явно перевіряються, але якщо піти в комміт який додав цей тест -- https://github.com/git-for-windows/git/commit/4dc42c6c1867a52e22f1f04a1a247b5a7538b8af , то стає більш менш зрозуміло що проблема [задокументована у Microsoft](https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file#win32-file-namespaces).
Щоб ви не шукали що саме важливе, ось цитата із сайта.

```
Do not use the following reserved names for the name of a file:
CON, PRN, AUX, NUL, COM1, COM2, COM3, COM4, COM5, COM6, COM7, COM8, COM9, COM¹, COM², COM³, LPT1, LPT2, LPT3, LPT4, LPT5, LPT6, LPT7, LPT8, LPT9, LPT¹, LPT², and LPT³. 
Also avoid these names followed immediately by an extension; for example, NUL.txt and NUL.tar.gz are both equivalent to NUL. 
For more information, see Namespaces (https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file#win32-file-namespaces).
```

Окей, із цього зрозуміло що мейнтейнери Git for Windows мають консервативну позицію і перестрахувалися спираючись на слово `avoid`.

# Пошуки правди

В цей час я зрозумів що я нажаль вїхав в проблему Git for Windows. Це звісно мені не сподобалося. Я вирішив як мінімум зарепортити проблему. Ця проблема задокументована тут - https://github.com/git-for-windows/git/issues/4005 . Як можна бачити що 4 роки минуло як люди побачили її і вона почала когось турбувати. Я радісно написав, давайте все нафіг міняти на Windows 11 все працює. Не робіть так! Після того як адреналіновий раш закінчився, я уважно перечитав проблему і побачив що вже раніше люди писали про Windows 11, і майнтейнер прагматично відповів що він підтримує мільйони людей і не може просто так щось поміняти. Це звісно правильна позиція, тому я спробував якось завоювати довіру людини і поспілкуватися про альтернативні можливості для фіксу. Нажаль, мені здалося що поки контакту не виходить, незважаючи що наче накопичується більше свідоцтв що це працює не лише у мене на машині. Типова ситуація у проектах із відкритим кодом, коли незламний рух стикається із нерухомим мейнтейнером. Я думаю ви бачити ролі в цьому спектаклі доволі чітко.
Що в такий ситуації можна зробити. Я вирішив що можна піти до знайомих які працюють в Мікрософт і попитати у них що вони думають, і чи можна якось добратися до кішок команди Windows і щоб якщо не мені відповіли, але хочаб хтось краще задокументував коли стало краще жити, із якої версії вінди. Другий шлях це використати свій статус як MVP і спробувати пошерстити Мікрософт, або таких саме MVP що може вони хочаб порадою допоможуть. Це типові адміністративні речі які часто не працюють, але вони інколи дуже гарно працюють, тому їх завжди треба робити. Матриця допомогає тим хто рухається вперед. Поки ці кволі процеси йдуть, мені залишається лише один варіант. Спробувати подивитися як зробити форк, і пофіксати проблему.

# Як зробити свій Git для Windows

Проект сам по собі дуже гарно готовий для контрібьюту. Якщо ви зайдете на головну сторінку https://gitforwindows.org/ то ви побачити там розділ `Git for Windows SDK : Contributing Code`, просто завантажте звідти Git for Windows SDK. Коли буде потрібно вибирати вибирайте 64-бітний варіант. Чому? Ну мабуть тому що ми в 64-бітному світі живемо. 
Фактично СДК це кастомізована інсталяція MINGW де додани деякі скріпти щоб зручно було білдити проект. Я встановив SDK в папку `c:\git-sdk-64`. Це далі взагалі не принципово. Після встановлення запускайте SDK. При першому старті, SDK ініціалізується автоматично, тому вам потрібен буде стабільний інтернет. Принаймні краще його б мати, бо я не знаю як система себе поведе, якщо щось там недоставиться, і наскільки проблемно вам буде займатися відновленням СДК до робочого стану. Після того як ініціалізація завершилася, вам пропонується почитати справку за допомогою команди `sdk help`.
Рекомендую почитати, там не дуже багато інформації, плюс явно більшості хакерів не потрібно буде виконувати всі ці команди. Ось що написало мені

```
The 'sdk' shell function helps you to get up and running
with the Git for Windows SDK. The available subcommands are:

create-desktop-icon: install a desktop icon that starts the Git for
    Windows SDK Bash.

cd <project>: initialize/update a worktree and cd into it. Known projects:
        git git-extra msys2-runtime installer build-extra
        MINGW-packages MSYS2-packages mingw-w64-busybox mingw-w64-curl
        mingw-w64-cv2pdb mingw-w64-git mingw-w64-git-credential-manager
        mingw-w64-git-lfs mingw-w64-git-sizer mingw-w64-wintoast
        bash curl gawk gnupg heimdal mintty nodejs openssh openssl
        perl perl-HTML-Parser perl-Locale-Gettext perl-Net-SSLeay
        perl-TermReadKey perl-XML-Parser perl-YAML-Syck subversion tig

init <project>: initialize and/or update a worktree. Known projects
    are the same as for the 'cd' command.

build <project>: builds one of the following:
        git-and-installer git git-extra msys2-runtime installer
        mingw-w64-busybox mingw-w64-curl mingw-w64-cv2pdb mingw-w64-git
        mingw-w64-git-credential-manager mingw-w64-git-lfs
        mingw-w64-git-sizer mingw-w64-wintoast bash curl gawk gnupg
        heimdal mintty nodejs openssh openssl perl perl-HTML-Parser
        perl-Locale-Gettext perl-Net-SSLeay perl-TermReadKey
        perl-XML-Parser perl-YAML-Syck subversion tig

edit <file>: edit a well-known file. Well-known files are:
        git-sdk.sh sdk.completion ReleaseNotes.md install.iss

reload: reload the 'sdk' function.
````

Я персонально використовував лише наступні команди `git build git-and-installer`, `git init git` та `git build git`. Друга команда робиться один раз при старті хакінку. Третя команда це більше про більш швидку перевірку компіляції, без збірки інсталятора та тестів.

Я виконав `git init git`, і тепер все готово для хакінгу. Я редагував файлі відкривши їх через Explorer в Notepad++, ви можете звісно робити як вам заманеться. Це не принципово, бо редагувати ви будете в одній програмі, а компілювати через Git for Windows SDK. Як я описав в іщью, я вирішив що бажана поведінка повинна виконуватися лише на Windows 11, і це буде доволі безпечно.
Тому треба додати функцію яка перевіряє, чи я на Windows 11 і використати її в функції яка перевіряє чи файл має назву яку можна використовувати на Windows. Щвикдкий пошук по слову AUX показав мені що функція де я хочу зробити зміну називається `is_valid_win32_path` у файлі `compat/mingw.c`. Це було доволі не очевидно, але SDK клонує ісходники в `C:\git-sdk-64\usr\src\git`. Тому я відкрив на редагування файл `C:\git-sdk-64\usr\src\git\compat\mingw.c`.
В принципі поміняти функцію `is_valid_win32_path` було дуже просто, але ось знайти механізм знайти версію Windows 11 це вже було складно. Стандартні методи типу GetVersion/GetVersionEx будуть давати лише версію Windows 10, і то якщо я маніфест додам до git.exe. Це наспраді цікаво проблема, бо і розробників Windows я розумію, але і мені щось робити треба. Вирішилося хаком, який порекомендував спочатку Bing а потім людина із Rust чатику. Знайти функцію `RtlGetNtVersionNumbers` із `ntdll.dll`, викликати її і подивитися на числа які вона повертає. Як на мене це не дуже правильне рішення, тому якщо ви знаєте якесь інше, яке би працювало в контексті короткоживучих CLI програм як git.exe, то будь-ласка залиште коментарі.
Весь поточний патч можна подивитися в коментарі до проблеми https://github.com/git-for-windows/git/issues/4005#issuecomment-5760570321

Давайте збирати. `sdk build git` пішов бурчати, і видав 

```
    CARGO target/x86_64-pc-windows-gnu/release/libgitcore.a
error[E0463]: can't find crate for `std`
  |
  = note: the `x86_64-pc-windows-gnu` target may not be installed
  = help: consider downloading the target with `rustup target add x86_64-pc-windows-gnu`

For more information about this error, try `rustc --explain E0463`.
```

Дякую панове, я пішов ставити `rustup target add x86_64-pc-windows-gnu`. Після цього в мене ще було кілька приколів із лінтером, так, у цього проекта кльовий автоматичний лінтер який є частина білда. Панове із С також живуть в сучасному світі. Тому не дивіться на людей зверху лише через мову.

Після того як `sdk build git` сказав що я красавчик, можна будувати інсталятор. Звісно шлях відкритого коду, навіть такий простий як із Git for Windows не бувє простим. `git build git-and-installer` починає будувати шарманку, і потім каже 
```
:: Synchronizing package databases...
 git-for-windows-aarch64                                                                  7.1 KiB  31.7 KiB/s 00:00 [####################################################################] 100%
 clangarm64                                                                             558.6 KiB  1181 KiB/s 00:00 [####################################################################] 100%
 git-for-windows-x86_64                                                                  18.8 KiB  32.8 KiB/s 00:01 [####################################################################] 100%
 git-for-windows-mingw32                                                                  8.7 KiB  15.3 KiB/s 00:01 [####################################################################] 100%
 mingw32                                                                                 39.7 KiB  55.8 KiB/s 00:01 [####################################################################] 100%
 mingw64                                                                                407.0 KiB   262 KiB/s 00:02 [####################################################################] 100%
 ucrt64                                                                                 576.3 KiB   137 KiB/s 00:04 [####################################################################] 100%
 clang64                                                                                563.9 KiB   147 KiB/s 00:04 [####################################################################] 100%
 msys                                                                                   481.6 KiB   150 KiB/s 00:03 [####################################################################] 100%
:: Starting core system upgrade...
 there is nothing to do
:: Starting full system upgrade...
error: failed to prepare transaction (package architecture is not valid)
:: package git-extra-1.1.696.db26e322c-1-aarch64 does not have a valid architecture
```

Це звісно дуже погано, бо мені довелося розбиратися де ця проблема, і шукати де реалізована команда sdk в bash. За цю команду відповідає файл `C:\git-sdk-64\etc\profile.d\git-sdk.sh`. Якщо перейдете на рядок 355 то побачите щось накшталт такого

```
git-and-installer)
	sdk build git &&
	echo "============== Running make strip install ==================" && make -C "$src_dir" strip install &&
	#echo "============== Updating MINGW installation ==============" && pacman -Syyu git-extra &&
	sdk init build-extra &&
	"$src_dir"/installer/release.sh "${3:-0-test}"
	;;
```

Гра із echo це моя відладка процесу, закоментований рядок це "фікс", в цілому він не зовсім чесний, бо він означєа що я не оновляю залежності як належить, але для локального дев-лупу я не думаю що це принципово. Якщо вам цікаво, звідки ця проблема виникла, то в `C:\git-sdk-64\etc\pacman.conf` додан розділ 

```
[git-for-windows-aarch64]
Server = https://raw.githubusercontent.com/git-for-windows/pacman-repo/refs/heads/aarch64
```
який скоріш за все означає що білд будується на Windows for ARM64. Це в цілому логічно, бо потрібно підтримувати і цю платформу. Альтернативний фікс для людей на x86_64 це закоментувати цей блок, для локальної праці, і не чіпати git-sdk.sh.

Після цього все збудувалося, і процес написав де він зберіг новий інсталятор. Запускаємо, встановлюємо, і можемо зклонувати Linux на Windows.

# Фінал

Можливо вам вдасться похачити щось більше, і ви якось зробити контрібьют до Лінукса без WSL! Було би дуже кльово.