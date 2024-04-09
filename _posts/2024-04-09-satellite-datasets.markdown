---
layout: post
title:  "Безкоштовні датасети із супутників!"
date:   2024-04-09 18:57:00 +0600
categories: software-development
comments: true
---

Знайшов класний [тред](https://twitter.com/yohaniddawela/status/1777300378087731378) із супутниковою зйомкою.
Що цікаво, вони усі безкоштовні. Тому якщо вас цікавить сучасна геодезія, або агрономія, або планування інфраструктури, думаю буде цікаво подивитися.

Найбільш часто використовувані безкоштовні багатоспектральні супутникові зображення:

- Sentinel 2
- Landsat-8

Sentinel 2 має роздільну здатність ~10 м (для RGB), а Landsat-8 — ~30 м (для RGB).

<!--more-->

1. Національна програма сільськогосподарських зображень (NAIP)

    Роздільна здатність: 0,6м

    Опис: тут збираються аерофотозйомки зростання сільського господарства в Сполучених Штатах, що охоплюють 9 мільйонів км² щороку.

    Посилання: [https://developers.google.com/earth-engine/datasets/catalog/USDA_NAIP_DOQQ](https://developers.google.com/earth-engine/datasets/catalog/USDA_NAIP_DOQQ)


2. SkySat (через Google Earth Engine)

    Роздільна здатність: 2м

    Опис: вибірка даних, отримана 4 березня 2014 року

    Посилання: [https://developers.google.com/earth-engine/datasets/catalog/SKYSAT_GEN-A_PUBLIC_ORTHO_MULTISPECTRAL](https://developers.google.com/earth-engine/datasets/catalog/SKYSAT_GEN-A_PUBLIC_ORTHO_MULTISPECTRAL)

3. Функціональна карта світу

    Роздільна здатність: різні

    Опис: ~3,5 ТБ даних. Містить понад 1 мільйон зображень із понад 200 країн.	

    Посилання: [https://github.com/fMoW/dataset](https://github.com/fMoW/dataset)

4. Набір даних землекористування UC Merced

    Роздільна здатність: 30 см

    Деталі: 2100 зображень 2010 року для кількох класів (див. зображення нижче)

    Посилання: [http://weegee.vision.ucmerced.edu/datasets/landuse.html](http://weegee.vision.ucmerced.edu/datasets/landuse.html)

5. Spacenet

    Подробиці: охоплює 67 000 км² зображень.

    Роздільна здатність: різні

    Посилання: [https://spacenet.ai/datasets/](https://spacenet.ai/datasets/)

6. Дані AID

    Деталі: складається з 10 000 зображень із Google Earth.

    Роздільна здатність: різні

    Посилання: [https://captain-whu.github.io/AID/](https://captain-whu.github.io/AID/)

7. WorldStrat

    Деталі: це хороший набір даних для навчання моделей із надвисокою роздільною здатністю.

    Він охоплює 10 000 км² і містить тимчасово узгоджені зображення високої та низької роздільної здатності Sentinel-2.

    Роздільна здатність: 1,5м

    Посилання: [https://github.com/worldstrat/worldstrat](https://github.com/worldstrat/worldstrat)

8. WHU-RS19

    Деталі: колекція супутникових зображень із високою роздільною здатністю до 0,5 м із Google Планета Земля, що охоплює 19 класів значущих сцен із приблизно 50 зразками кожна.

    Роздільна здатність: до 0,5 м

    Посилання: [https://paperswithcode.com/dataset/whu-rs19](https://paperswithcode.com/dataset/whu-rs19)

9. Архів SkySat ESA

    Подробиці: ESA зіставляє зразки даних SkySat із Planet.

    Роздільна здатність: 0,5м

    Посилання: [https://earth.esa.int/eogateway/missions/skysat](https://earth.esa.int/eogateway/missions/skysat)