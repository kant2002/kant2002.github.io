---
layout: post
title:  "Побрехенькі про авіацію у які вірять програмісти"
date:   2025-06-15 13:01:00 +0500
categories: domain-driven uk
comments: true
---

> Це переклад [статті](https://flightaware.engineering/falsehoods-programmers-believe-about-aviation/) з 2025 року про неявні припущення які робили програмісти при праці в авіації.


У компанії FlightAware наше програмне забезпечення має коректно обробляти всілякі дивні й непередбачувані ситуації. Хоча нам, інженерам, хотілося б, щоб авіаційні дані були чистими та добре стандартизованими, реальний світ це бардак.

Існує безліч припущень, які можна зробити під час проєктування типів даних і схем для авіаційної інформації - і багато з них виявляються хибними. Ось перелік хибних уявлень, у дусі класичної [статті Патріка Маккензі про імена](https://kant2002.github.io/domain-driven/uk/2025/06/14/falsehoods-programmer-believe-about-names.html), які можна мати про авіацію. Хоча деякі з них - це просто поширені міфи, деякі реально створювали проблеми нашим клієнтам, а інші - роками завдавали труднощів і в наших власних системах.

Усі вони ілюструють ті ситуації, які наша система відстеження рейсів Hyperfeed повинна правильно інтерпретувати, щоб забезпечити чисту та послідовну стрічку даних для нашого сайту, додатків і API.

## Рейси

- Рейси відлітають з виходу на посадку.
- Рейси, що відлітають з виходу, залишають цей вихід [лише один раз](https://www.flightaware.com/live/flight/AFR1/history/20250514/2040Z/KJFK/LFPG?ref=flightaware.engineering).
- Рейси вирушають протягом кількох годин після запланованого часу.
- Рейси вирушають [протягом доби](https://www.flightaware.com/live/flight/PDT5965/history/20250508/2224Z/KCHO/KCLT?ref=flightaware.engineering) після запланованого часу.
- У рейсів є розклад.
- Рейси злітають і приземляються [в аеропортах](https://www.flightaware.com/live/flight/N144NE/history/20250518/1747Z/KPSM/L%2042.98589%20-71.12891?ref=flightaware.engineering).
- Повітряний транспорт (крім гелікоптерів) злітають і приземляються в аеропортах.
- Тривалість рейсу - не більше [дванадцяти годин або щось приблизне](https://www.flightaware.com/live/flight/SIA21/history/20250516/1345Z/KEWR/WSSS?ref=flightaware.engineering).
- Добре, нехай - не більше [кількох діб](https://www.flightaware.com/live/flight/HBAL812/history/20190717/1738Z?ref=flightaware.engineering).
- Рейси ідентифікуються номером, що складається з коду авіакомпанії та кількох цифр, наприклад, UAL1234.
- Рейси [ідентифікуються або](https://www.flightaware.com/live/flight/C6031/history/20250521/1752Z/KBID/KFMH?ref=flightaware.engineering) номером авіакомпанії (наприклад, UAL1234), або реєстраційним номером літака, як-от N12345, B6459 або FHUVL.
- Ідентифікатор рейсу на кшталт B6459 однозначно є або реєстраційним номером ([B–6459](https://www.flightaware.com/live/flight/B6459?ref=flightaware.engineering)), або номером рейсу авіакомпанії ([B6 459](https://www.flightaware.com/live/flight/JBU459?ref=flightaware.engineering)), або чимось іншим.
- У рейсів не буває [кількох номерів рейсу](https://en.wikipedia.org/wiki/Change_of_gauge_(aviation)?ref=flightaware.engineering).
- Якщо у рейсу кілька номерів, то принаймні один з них є однозначно «основним».
- Номер(-и) рейсу конкретної подорожі [ніколи не змінюються](https://web.archive.org/web/20230328124705/https://community.southwest.com/t5/Blog/The-Science-behind-Flight-Numbers/ba-p/42760).
- Номер рейсу, вказаний у вашому квитку, той самий [яким користуються пілоти та авіадиспетчери](https://www.eurocontrol.int/service/call-sign-similarity-service?ref=flightaware.engineering).
- Ідентифікатор рейсу не використовує код якоїсь зовсім не пов’язаної авіакомпанії.
- Жодні рейси не використовують один і той самий номер рейсу протягом дня.
- Ну вже ж точно - не буває, щоб один і той самий номер рейсу використовувався одночасно?
- Добре, гаразд - але ж принаймні два окремі рейси великої пасажирської авіакомпанії, які вилітають із різницею у кілька хвилин один від одного, не будуть [одночасно](https://www.flightaware.com/live/flight/AAL2586/history/20250509/1935Z/TBPB/KCLT?ref=flightaware.engineering) мати [той самий](https://www.flightaware.com/live/flight/AAL2586/history/20250508/1935Z/TBPB/KCLT?ref=flightaware.engineering) номер рейсу, правда ж?..

## Аеропорти

- Аеропорти ніколи [не переїжджають](https://en.wikipedia.org/wiki/Atat%C3%BCrk_Airport?ref=flightaware.engineering#Closure).
- Номери терміналів і виходів на посадку мають послідовну схему найменування.
- Кожна злітно-посадкова смуга [використовується лише одним](https://en.wikipedia.org/wiki/Atat%C3%BCrk_Airport?ref=flightaware.engineering#Closure) аеропортом.
- Кожен аеропорт завжди має два унікальні ідентифікатори: 4-літерний код Міжнародної організації цивільної авіації (ICAO) та 3-літерний код Міжнародної асоціації повітряного транспорту (IATA).
- Кожен аеропорт завжди має три унікальні ідентифікатори: ICAO, IATA і регіональний код розташування.
- Міністерство транспорту США призначає [кожному підпорядкованому](https://www.faa.gov/air_traffic/flight_info/aeronav/aero_data/loc_id_search/Encodes_Decodes/?ref=flightaware.engineering) аеропорту [один канонічний код](https://www.bts.gov/topics/airlines-and-airports/world-airport-codes?ref=flightaware.engineering).
- Жоден аеропорт не має [кількох IATA-кодів](https://en.wikipedia.org/wiki/EuroAirport_Basel_Mulhouse_Freiburg?ref=flightaware.engineering).
- ICAO-коди для аеропортів у США [завжди починаються з літери K](https://www.flightaware.com/live/airport/PANC?ref=flightaware.engineering).
- Для американських аеропортів, чий ICAO-код починається з K, [останні три літери](https://en.wikipedia.org/wiki/McClellan%E2%80%93Palomar_Airport?ref=flightaware.engineering) - це його IATA-код.
- За ICAO-кодом можна визначити, у якому [географічному регіоні](https://www.flightaware.com/live/airport/NZIR?ref=flightaware.engineering) знаходиться аеропорт.
- Усе, що має IATA-код - [це аеропорт](https://en.wikipedia.org/wiki/List_of_IATA-indexed_railway_stations,_bus_stations_and_ferry_terminals?ref=flightaware.engineering).
- Усе, що має ICAO-код, знаходиться [на Землі](https://en.wikipedia.org/wiki/Jezero_(crater)?ref=flightaware.engineering).
- У кожного аеропорту є принаймні один загальновідомий ідентифікатор.

## Авіалінії

- Жодні [дві](https://en.wikipedia.org/wiki/SkyJet_Airlines?ref=flightaware.engineering) авіакомпанії не [використовують](https://en.wikipedia.org/wiki/Euroavia_Airlines?ref=flightaware.engineering) один і той самий [IATA-код](https://en.wikipedia.org/wiki/Airline_codes?ref=flightaware.engineering#IATA_airline_designator).
- Жодна [авіакомпанія](https://en.wikipedia.org/wiki/EasyJet_UK?ref=flightaware.engineering) не використовує [кілька](https://en.wikipedia.org/wiki/EasyJet_Europe?ref=flightaware.engineering) IATA або ICAO [кодів](https://en.wikipedia.org/wiki/EasyJet_Switzerland?ref=flightaware.engineering).
- Можна визначити, [яка авіакомпанія виконує рейс](https://en.wikipedia.org/wiki/Aircraft_lease?ref=flightaware.engineering#Wet_lease), просто подивившись на фізичний літак.
- Авіакомпанії присвоюють номери рейсам для конкретних маршрутів.
- Авіакомпанії присвоюють номери рейсам тільки для [тих рейсів, які вони оперують](https://en.wikipedia.org/wiki/Codeshare_agreement?ref=flightaware.engineering).
- Авіакомпанії присвоюють номери тільки [рейсам](https://www.flyertalk.com/forum/air-france-frequence-plus/1325488-how-fly-mlh-bsl.html?ref=flightaware.engineering).

## Навігація

- Імена точок маршруту (waypoints) є унікальними.
- Існує єдине [загальноприйняте визначення висоти](https://en.wikipedia.org/wiki/Altitude?ref=flightaware.engineering#In_aviation).
- Інформація про рейси від постачальників аеронавігаційних послуг є точною.
- Ну гаразд, *доволі* точною; вони б не вказували, що рейс вирушив, якби це справді не так.
- Якщо зазначено, що план польоту скасовано, то цей рейс точно не відбудеться - це не може бути просто результатом редагування кимось плану польоту.
- Принаймні їхні радарні дані точно ідентифікують кожне повітряне судно.
- Радари з перетинаючима зонами покриття показують однакове місцезнаходження об’єкта, який бачать одночасно.
- Якщо вони надсилають нам план польоту з ICAO-кодом відомого аеропорту як пунктом призначення, це означає, що існує намір туди прибути.
- Якщо літак відхиляється до іншого пункту призначення, він більше не буде [змінювати напрямок повторно](https://www.flightaware.com/live/flight/AAL1372/history/20250516/1410Z/KMIA/KRIC?ref=flightaware.engineering).

## Транспондери та ADS-B

- Повідомлення ADS-B надходять лише від літаків.
- Повідомлення ADS-B надходять лише від літаків та службових транспортних засобів аеропорту.
- Повідомлення ADS-B надходять лише від якогось виду транспортних засобів.
- GPS-координати в ADS-B повідомленнях [є точними](https://en.wikipedia.org/wiki/Dilution_of_precision_(navigation)?ref=flightaware.engineering).
- GPS-координати в ADS-B повідомленнях точні [в межах відомого радіуса](https://en.wikipedia.org/wiki/Spoofing_attack?ref=flightaware.engineering#Global_navigation_satellite_system_spoofing) похибки.
- Повідомлення ADS-B завжди містять правильну ідентифікацію рейсу.
- Транспондери запрограмовані правильно, щоб вказувати тип повітряного судна (гелікоптер, літак, повітряна куля тощо).
- Завжди можна визначити реєстраційний номер літака за його ADS-B повідомленнями.
- Транспондери запрограмовані з правильним адресом режиму S (Mode S).
- Усі транспондери на одному повітряному судні запрограмовані з однаковим адресом режиму S (Mode S).
- Ніхто ніколи не встановить ідентифікатор рейсу на щось дивне накшталт NULL.
- Люди пам’ятають оновити транспондер, коли змінюється реєстрація літака.
- Повідомлення ADS-B завжди приймаються точно в тому вигляді, як були передані.
- Ніхто ніколи не передає фальшиві повідомлення ADS-B.
- Транспондери ніколи не ламаються, і гризуни ніколи не перегризають кабелі.

Дякую моїм колегам, які зробили внесок у цю добірку хибних уявлень або переглянули її: Марк Дуелл, Пол Дюрандт, Каріна Елізондо, Метт Гіггінс, Томас Кянко, Нейтан Рід і Емі Щепанські.

