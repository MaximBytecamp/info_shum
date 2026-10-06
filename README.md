# Информационный шум

Занятие для первого курса: презентация и две игры. Всё работает без интернета и без сборки —
обычные HTML, CSS и JS, шрифты системные, картинки лежат рядом.

## Как открыть

Дважды щёлкните `index.html`. С главной открываются презентация, «Своя игра» и «Лента».

Чтобы студенты играли в «Ленту» за своими компьютерами, есть три способа:

- скопировать папку на каждый компьютер или на общий сетевой диск;
- раздать с компьютера преподавателя по локальной сети: `python3 -m http.server 8000` в этой папке,
  студенты открывают `http://<IP преподавателя>:8000`;
- выложить папку на любой статический хостинг.

## Сценарий на 45 минут

| Время | Что | Файл |
|---|---|---|
| 20 мин | Презентация: 22 слайда, четыре интерактивных | `slides.html` |
| 20 мин | «Своя игра» командами с одного экрана | `quiz.html` |
| 5 мин | Итог. «Лента» — на оставшееся время или домой | `feed.html` |

Если времени меньше, «Свою игру» можно закончить в любой момент кнопкой «Итоги».

## Презентация

`→` `←` листают, `F` — полный экран, `N` — заметки преподавателя: в них факты и вопросы к группе,
которых нет на слайде. Кнопка `◐` включает светлую тему — она лучше читается на проекторе
в светлой аудитории.

Интерактивные слайды: 2 (опыт с уведомлениями), 4 (ползунок «сигнал/шум»), 8 (числа открываются
по нажатию), 13 («ИИ или фото?»). На них сначала спросите группу, потом нажимайте.

## «Своя игра»

Пять тем по четыре вопроса и финал со ставками. Команд от двух до пяти: на 15 человек удобно три
по пять. Команды выбирают вопрос по очереди и отвечают с места.

- `пробел` — показать ответ, `1`–`5` — какой команде баллы, `0` — никому, `Esc` — закрыть вопрос.
- Таймер — 30 секунд, щелчок по нему ставит на паузу.
- Счёт можно поправить кнопками `+` и `−` на карточке команды.
- Счёт сохраняется в браузере: после случайного обновления страницы появится «Продолжить прошлую».

После каждого ответа на экране остаётся пояснение. Прочитайте его вслух: в нём то, что студент должен унести с вопроса.

Вопросы лежат в `assets/js/quiz-data.js`: текст, варианты и пояснение меняются прямо там.

## «Лента»

Одиночная игра: три задачи, 27 сообщений. Про каждое студент решает, сигнал это или шум
(`←` `→`, кнопки или свайп), и сразу видит объяснение. На время играть не нужно: скорость даёт
только бонус. В конце показаны счёт, разбор ошибок и четыре правила.

Карточки лежат в `assets/js/feed-data.js`.

## Как добавить свою картинку или мем

Положите файл в `assets/img/` и сошлитесь на него в слайде (`<img src="assets/img/имя.jpg">`)
или в вопросе (`img: 'assets/img/имя.jpg'`). Подписи мема — это текст в `figcaption`, а не часть
картинки, поэтому их можно менять без редактора.

## Откуда цифры

Свежие данные, 2025–2026:

- больше 6 часов в день за экраном, 77% подростков пользуются нейросетями — Mediascope, ПМЭФ, июнь 2026
- 37% россиян регулярно испытывают стресс (в 2022 году 26%) — ВЦИОМ, опрос в октябре 2025
- соцсети и симптомы невнимательности, 8324 ребёнка — Karolinska Institutet, Pediatrics Open Science, декабрь 2025
- больше 53% трафика создают боты — Imperva Bad Bot Report, 2026
- rage bait — слово 2025 года, Oxford University Press; slop — слово 2025 года, Merriam-Webster
- больше 20% роликов для нового пользователя YouTube — нейрослоп: Kapwing, AI Slop Report, 2025
- отчёт Deloitte с выдуманными ссылками — октябрь 2025

Более старые, но новее не нашлось:

- 11% подростков с проблемным использованием соцсетей (в 2018 году 7%) — ВОЗ, 2024, данные 2022 года
- 47 секунд на одном экране, 23 минуты на возврат к задаче — Gloria Mark, Attention Span, 2023
- 237 уведомлений в день — Common Sense Media, 2023 (США, 11–17 лет, медиана)
- brain rot — слово 2024 года, Oxford University Press; клей в пицце — Google AI Overviews, 2024
- ложь расходится в 6 раз быстрее — Vosoughi, Roy, Aral, Science, 2018 (только в квизе)
- «Богатство информации порождает бедность внимания» — Herbert Simon, 1971
- четыре шага проверки — Mike Caulfield, SIFT, 2019

Про СДВГ на слайде 17 сказано осторожно, как у авторов исследования: соцсети связаны
с ростом симптомов невнимательности, но сам диагноз ставит врач, и причин у него несколько.

## Картинки

Все картинки — с Wikimedia Commons: общественное достояние или свободные лицензии Creative Commons.
Комикс xkcd — CC BY-NC 2.5, только для некоммерческого показа.

| Файл | Автор | Лицензия | Источник |
|---|---|---|---|
| `pope.jpg` | Midjourney | общественное достояние | [Commons](https://commons.wikimedia.org/wiki/File:Pope_Francis_in_puffy_winter_jacket.jpg) |
| `aiwoman.jpg` | Benlisquare (Stable Diffusion) | общественное достояние | [Commons](https://commons.wikimedia.org/wiki/File:This_AI-generated_woman_does_not_exist.png) |
| `ganface.jpg` | bod lnga klang (GAN) | общественное достояние | [Commons](https://commons.wikimedia.org/wiki/File:GAN_deepfake_white_girl.jpg) |
| `hollywood.jpg` | автор неизвестен (ИИ) | общественное достояние | [Commons](https://commons.wikimedia.org/wiki/File:AI-generated_deepfake_hoax_image_of_the_Hollywood_sign_during_the_2025_California_wildfires.jpg) |
| `cocacola.jpg` | Silverside AI для Coca-Cola | общественное достояние | [Commons](https://commons.wikimedia.org/wiki/File:Coca-Cola_AI_ad_-_truck_with_misspelled_logo.png) |
| `chaplin.jpg` | Чарли Чаплин, 1922 | общественное достояние | [Commons](https://commons.wikimedia.org/wiki/File:Distracted_Charlie_Chaplin_in_Pay_Day_(1922).jpeg) |
| `thisisfine.jpg` | сгенерировано ИИ | общественное достояние | [Commons](https://commons.wikimedia.org/wiki/File:This_Is_Fine_(meme).png) |
| `tralalero.jpg` | @amoamimandy.1a (ИИ) | общественное достояние | [Commons](https://commons.wikimedia.org/wiki/File:Tralalero_Tralala.webp) |
| `ballerina.jpg` | анонимные авторы (ИИ) | общественное достояние | [Commons](https://commons.wikimedia.org/wiki/File:Ballerina_Cappuccina.png) |
| `twoheadcat.jpg` | ChatGPT | общественное достояние | [Commons](https://commons.wikimedia.org/wiki/File:AI-generated_two-headed_cat.png) |
| `lemur.jpg` | Bing Image Creator | общественное достояние | [Commons](https://commons.wikimedia.org/wiki/File:A_lemur_editing_Wikipedia_08.jpg) |
| `doge.jpg` | likeaduck | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Doge_meme_example.jpg) |
| `grumpy.jpg` | Gage Skidmore | CC BY-SA 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Grumpy_Cat_(14556024763)_(cropped).jpg) |
| `zhdun.jpg` | User:Bic | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Beelden_in_Leiden_2016_04_crop.jpg) |
| `floppa.jpg` | Prozhony | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Big_Floppa_22.jpg) |
| `shoebill.jpg` | Olaf Oliviero Riemer | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Balaeniceps_rex_-_Weltvogelpark_Walsrode_2010-09-18.jpg) |
| `glaucus.jpg` | Taro Taylor | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Glaucus_atlanticus_1_cropped.jpg) |
| `hillier.jpg` | Yodaobione | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Pink_Lake_(Lake_Hillier)_on_Middle_Island_off_the_coast_of_Esperance_Western_Australia.jpg) |
| `socotra.jpg` | Boris Khvostichenko | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Socotra_dragon_tree.JPG) |
| `xkcd386.png` | Randall Munroe | CC BY-NC 2.5 | [xkcd.com/386](https://xkcd.com/386/) |
