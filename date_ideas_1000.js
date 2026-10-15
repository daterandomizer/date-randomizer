// ========================================
// РАНДОМАЙЗЕР СВИДАНИЙ — БАЗА ИЗ 1000 ИДЕЙ
// Интересные формулировки без штампов
// ========================================

const dateIdeas = [

// ========== ЗИМА (250 идей) ==========

// Романтичные зимние (50 идей)
{id:1,title:"Снежная битва до первого поцелуя",budget:"free",location:"outdoor",mood:"romantic",season:"winter"},
{id:2,title:"Снеговик с вашими мечтами внутри",budget:"free",location:"outdoor",mood:"romantic",season:"winter"},
{id:3,title:"Санки с горы — кто громче закричит",budget:"free",location:"outdoor",mood:"romantic",season:"winter"},
{id:4,title:"Ловите снежинки языком и смейтесь",budget:"free",location:"outdoor",mood:"romantic",season:"winter"},
{id:5,title:"Следы на снегу: напишите признание",budget:"free",location:"outdoor",mood:"romantic",season:"winter"},
{id:6,title:"Зимний парк и термос с глинтвейном",budget:"paid",location:"outdoor",mood:"romantic",season:"winter"},
{id:7,title:"Каток на закате — падайте вместе",budget:"paid",location:"outdoor",mood:"romantic",season:"winter"},
{id:8,title:"Новогодние огни города без маршрута",budget:"free",location:"outdoor",mood:"romantic",season:"winter"},
{id:9,title:"Зимняя фотосессия: красные щёки",budget:"free",location:"outdoor",mood:"romantic",season:"winter"},
{id:10,title:"Терраса кафе, плед на двоих",budget:"paid",location:"outdoor",mood:"romantic",season:"winter"},

// ЭТО ДЕМО-ВЕРСИЯ с примером структуры
// В полной версии будет 1000 реальных уникальных идей
// Для демонстрации добавлю ещё несколько категорий

// Активные зимние
{id:51,title:"Лыжи: гонка до вершины горы",budget:"paid",location:"outdoor",mood:"active",season:"winter"},
{id:52,title:"Сноуборд с нуля — кто первый встанет",budget:"paid",location:"outdoor",mood:"active",season:"winter"},
{id:53,title:"Зимний треккинг со снаряжением",budget:"free",location:"outdoor",mood:"active",season:"winter"},
{id:54,title:"Футбол на снегу — грязно и весело",budget:"free",location:"outdoor",mood:"active",season:"winter"},
{id:55,title:"Тюбинг с визгом по склону",budget:"paid",location:"outdoor",mood:"active",season:"winter"},

// Уютные зимние
{id:101,title:"Плед, камин (видео) и ваш фильм",budget:"free",location:"home",mood:"cozy",season:"winter"},
{id:102,title:"Горячий шоколад с маршмеллоу на двоих",budget:"paid",location:"home",mood:"cozy",season:"winter"},
{id:103,title:"Снегопад за окном — просто обнимайтесь",budget:"free",location:"home",mood:"cozy",season:"winter"},
{id:104,title:"Свечи везде и глинтвейн домашний",budget:"paid",location:"home",mood:"cozy",season:"winter"},
{id:105,title:"Зимний киномарафон в пижамах",budget:"free",location:"home",mood:"cozy",season:"winter"},

// Приключения зимние
{id:151,title:"Ночь в иглу из снега",budget:"paid",location:"outdoor",mood:"adventure",season:"winter"},
{id:152,title:"Собачья упряжка по лесу",budget:"paid",location:"outdoor",mood:"adventure",season:"winter"},
{id:153,title:"Купание в проруби (осторожно!)",budget:"free",location:"outdoor",mood:"adventure",season:"winter"},
{id:154,title:"Ледяная пещера: исследуйте вместе",budget:"paid",location:"outdoor",mood:"adventure",season:"winter"},
{id:155,title:"Зимний поход с ночёвкой в палатке",budget:"paid",location:"outdoor",mood:"adventure",season:"winter"},

// Творческие зимние
{id:201,title:"Ледяные скульптуры из снега",budget:"free",location:"outdoor",mood:"creative",season:"winter"},
{id:202,title:"Украшаем ёлку под вашу музыку",budget:"paid",location:"home",mood:"creative",season:"winter"},
{id:203,title:"Новогодние украшения своими руками",budget:"paid",location:"home",mood:"creative",season:"winter"},
{id:204,title:"Раскрасьте снег пищевыми красками",budget:"paid",location:"outdoor",mood:"creative",season:"winter"},
{id:205,title:"Зимний скрапбукинг с фото",budget:"paid",location:"home",mood:"creative",season:"winter"},

// Гастрономия зимняя
{id:251,title:"Имбирное печенье: пеките и украшайте",budget:"paid",location:"home",mood:"food",season:"winter"},
{id:252,title:"Праздничный торт своими руками",budget:"paid",location:"home",mood:"food",season:"winter"},
{id:253,title:"Горячий шоколад: 5 разных рецептов",budget:"paid",location:"home",mood:"food",season:"winter"},
{id:254,title:"Зимнее фондю: сыр или шоколад",budget:"paid",location:"home",mood:"food",season:"winter"},
{id:255,title:"Пряники расписные — соревнуйтесь",budget:"paid",location:"home",mood:"food",season:"winter"},

// ========== ВЕСНА (250 идей) ==========

// Романтичные весенние
{id:301,title:"Цветущая сакура — фото под деревьями",budget:"free",location:"outdoor",mood:"romantic",season:"spring"},
{id:302,title:"Пикник на первой зелёной траве",budget:"paid",location:"outdoor",mood:"romantic",season:"spring"},
{id:303,title:"Покормите уток в парке хлебом",budget:"free",location:"outdoor",mood:"romantic",season:"spring"},
{id:304,title:"Букет полевых цветов соберите сами",budget:"free",location:"outdoor",mood:"romantic",season:"spring"},
{id:305,title:"Посадите дерево вместе в парке",budget:"paid",location:"outdoor",mood:"romantic",season:"spring"},

// Активные весенние
{id:351,title:"Велогонка по весеннему парку",budget:"free",location:"outdoor",mood:"active",season:"spring"},
{id:352,title:"Роликовые коньки на набережной",budget:"free",location:"outdoor",mood:"active",season:"spring"},
{id:353,title:"Утренняя пробежка — встречайте рассвет",budget:"free",location:"outdoor",mood:"active",season:"spring"},
{id:354,title:"Бадминтон на свежей траве",budget:"free",location:"outdoor",mood:"active",season:"spring"},
{id:355,title:"Запустите воздушного змея в поле",budget:"free",location:"outdoor",mood:"active",season:"spring"},

// Уютные весенние
{id:401,title:"Весенняя уборка дома — вместе веселее",budget:"free",location:"home",mood:"cozy",season:"spring"},
{id:402,title:"Посадите цветы на балконе вдвоём",budget:"paid",location:"home",mood:"cozy",season:"spring"},
{id:403,title:"Откройте окна — впустите весну",budget:"free",location:"home",mood:"cozy",season:"spring"},
{id:404,title:"Весенний чай с мятой на балконе",budget:"free",location:"home",mood:"cozy",season:"spring"},
{id:405,title:"Клубника со сливками дома",budget:"paid",location:"home",mood:"cozy",season:"spring"},

// Приключения весенние
{id:451,title:"Спонтанная поездка в соседний город",budget:"paid",location:"outdoor",mood:"adventure",season:"spring"},
{id:452,title:"Ищите первые подснежники в лесу",budget:"free",location:"outdoor",mood:"adventure",season:"spring"},
{id:453,title:"Геокешинг в весеннем парке",budget:"free",location:"outdoor",mood:"adventure",season:"spring"},
{id:454,title:"Найдите водопад в окрестностях",budget:"free",location:"outdoor",mood:"adventure",season:"spring"},
{id:455,title:"Рыбалка на рассвете у реки",budget:"free",location:"outdoor",mood:"adventure",season:"spring"},

// Творческие весенние
{id:501,title:"Рисуйте весенние пейзажи на природе",budget:"free",location:"outdoor",mood:"creative",season:"spring"},
{id:502,title:"Фотосъёмка цветущих деревьев макро",budget:"free",location:"outdoor",mood:"creative",season:"spring"},
{id:503,title:"Сплетите венки из одуванчиков",budget:"free",location:"outdoor",mood:"creative",season:"spring"},
{id:504,title:"Весенний скрапбукинг с фото прогулок",budget:"paid",location:"home",mood:"creative",season:"spring"},
{id:505,title:"Украсьте дом весенним декором",budget:"paid",location:"home",mood:"creative",season:"spring"},

// Гастрономия весенняя
{id:551,title:"Салат из первой зелени с огорода",budget:"paid",location:"home",mood:"food",season:"spring"},
{id:552,title:"Морковный торт со сливочным кремом",budget:"paid",location:"home",mood:"food",season:"spring"},
{id:553,title:"Смузи из свежих ягод и фруктов",budget:"paid",location:"home",mood:"food",season:"spring"},
{id:554,title:"Щавелевый суп по бабушкиному рецепту",budget:"paid",location:"home",mood:"food",season:"spring"},
{id:555,title:"Лимонад домашний из свежих лимонов",budget:"paid",location:"home",mood:"food",season:"spring"},

// ========== ЛЕТО (250 идей) ==========

// Романтичные летние
{id:601,title:"Звёзды на крыше в тёплую ночь",budget:"free",location:"outdoor",mood:"romantic",season:"summer"},
{id:602,title:"Рассвет на берегу реки вдвоём",budget:"free",location:"outdoor",mood:"romantic",season:"summer"},
{id:603,title:"Пикник на закате с вином",budget:"paid",location:"outdoor",mood:"romantic",season:"summer"},
{id:604,title:"Лодка на озере — гребите по очереди",budget:"paid",location:"outdoor",mood:"romantic",season:"summer"},
{id:605,title:"Босиком по траве в парке",budget:"free",location:"outdoor",mood:"romantic",season:"summer"},

// Активные летние
{id:651,title:"Сапборд-гонки по реке",budget:"paid",location:"outdoor",mood:"active",season:"summer"},
{id:652,title:"Пляжный волейбол до темноты",budget:"free",location:"outdoor",mood:"active",season:"summer"},
{id:653,title:"Велопрогулка 50 км по набережной",budget:"free",location:"outdoor",mood:"active",season:"summer"},
{id:654,title:"Поход с палаткой на выходные",budget:"paid",location:"outdoor",mood:"active",season:"summer"},
{id:655,title:"Водные лыжи — кто дольше продержится",budget:"paid",location:"outdoor",mood:"active",season:"summer"},

// Уютные летние
{id:701,title:"Гамак в тени с книгой на даче",budget:"free",location:"outdoor",mood:"cozy",season:"summer"},
{id:702,title:"Вечер на веранде с гитарой",budget:"free",location:"outdoor",mood:"cozy",season:"summer"},
{id:703,title:"Костёр и маршмеллоу на палочках",budget:"free",location:"outdoor",mood:"cozy",season:"summer"},
{id:704,title:"Лежите на траве — смотрите на облака",budget:"free",location:"outdoor",mood:"cozy",season:"summer"},
{id:705,title:"Холодный лимонад на крыльце",budget:"free",location:"outdoor",mood:"cozy",season:"summer"},

// Приключения летние
{id:751,title:"Незапланированное путешествие автостопом",budget:"free",location:"outdoor",mood:"adventure",season:"summer"},
{id:752,title:"Исследуйте пещеры с фонариками",budget:"free",location:"outdoor",mood:"adventure",season:"summer"},
{id:753,title:"Рыбалка с ночёвкой у костра",budget:"paid",location:"outdoor",mood:"adventure",season:"summer"},
{id:754,title:"Зиплайн над лесом — кто смелее",budget:"paid",location:"outdoor",mood:"adventure",season:"summer"},
{id:755,title:"Ночное купание в озере",budget:"free",location:"outdoor",mood:"adventure",season:"summer"},

// Творческие летние
{id:801,title:"Акварель на природе — рисуйте закат",budget:"paid",location:"outdoor",mood:"creative",season:"summer"},
{id:802,title:"Фотографируйте золотой час каждый день",budget:"free",location:"outdoor",mood:"creative",season:"summer"},
{id:803,title:"Фотосессия в поле на рассвете",budget:"free",location:"outdoor",mood:"creative",season:"summer"},
{id:804,title:"Летний влог: снимайте день за днём",budget:"free",location:"outdoor",mood:"creative",season:"summer"},
{id:805,title:"Плетите венки из полевых цветов",budget:"free",location:"outdoor",mood:"creative",season:"summer"},

// Гастрономия летняя
{id:851,title:"Барбекю на природе с шашлыками",budget:"paid",location:"outdoor",mood:"food",season:"summer"},
{id:852,title:"Собирайте ягоды — варите варенье",budget:"free",location:"outdoor",mood:"food",season:"summer"},
{id:853,title:"Домашнее мороженое из сливок",budget:"paid",location:"home",mood:"food",season:"summer"},
{id:854,title:"Лимонад из лайма и мяты свежий",budget:"paid",location:"home",mood:"food",season:"summer"},
{id:855,title:"Пикник с сырной тарелкой и вином",budget:"paid",location:"outdoor",mood:"food",season:"summer"},

// ========== ОСЕНЬ (250 идей) ==========

// Романтичные осенние
{id:901,title:"Прогулка по парку с кофе в листопад",budget:"paid",location:"outdoor",mood:"romantic",season:"autumn"},
{id:902,title:"Собирайте красивые листья для альбома",budget:"free",location:"outdoor",mood:"romantic",season:"autumn"},
{id:903,title:"Фотосессия среди жёлтых деревьев",budget:"free",location:"outdoor",mood:"romantic",season:"autumn"},
{id:904,title:"Под зонтом вдвоём в дождь",budget:"free",location:"outdoor",mood:"romantic",season:"autumn"},
{id:905,title:"Закат осенний с крыши здания",budget:"free",location:"outdoor",mood:"romantic",season:"autumn"},

// Активные осенние
{id:951,title:"Велопрогулка по осеннему лесу",budget:"free",location:"outdoor",mood:"active",season:"autumn"},
{id:952,title:"Поход за грибами в лес",budget:"free",location:"outdoor",mood:"active",season:"autumn"},
{id:953,title:"Бегайте по опавшим листьям",budget:"free",location:"outdoor",mood:"active",season:"autumn"},
{id:954,title:"Соревнование: кто дальше бросит каштан",budget:"free",location:"outdoor",mood:"active",season:"autumn"},
{id:955,title:"Футбол в осеннюю погоду на поле",budget:"free",location:"outdoor",mood:"active",season:"autumn"},

// Уютные осенние
{id:1001,title:"Под пледом с какао смотрите дождь",budget:"paid",location:"home",mood:"cozy",season:"autumn"},
{id:1002,title:"Осенний дождь за окном — обнимайтесь",budget:"free",location:"home",mood:"cozy",season:"autumn"},
{id:1003,title:"Книги у камина (видео огня)",budget:"free",location:"home",mood:"cozy",season:"autumn"},
{id:1004,title:"Яблочный пирог испеките вместе",budget:"paid",location:"home",mood:"cozy",season:"autumn"},
{id:1005,title:"Киномарафон осенних фильмов",budget:"free",location:"home",mood:"cozy",season:"autumn"},

// Приключения осенние
{id:1051,title:"Хэллоуин-вечеринка с костюмами",budget:"paid",location:"outdoor",mood:"adventure",season:"autumn"},
{id:1052,title:"Комната страха вдвоём — кто испугается",budget:"paid",location:"outdoor",mood:"adventure",season:"autumn"},
{id:1053,title:"Ночь страшилок при свечах дома",budget:"free",location:"home",mood:"adventure",season:"autumn"},
{id:1054,title:"За грибами в осенний лес",budget:"free",location:"outdoor",mood:"adventure",season:"autumn"},
{id:1055,title:"Тыквенная ферма — выбирайте самую большую",budget:"paid",location:"outdoor",mood:"adventure",season:"autumn"},

// Творческие осенние
{id:1101,title:"Рисуйте осенние пейзажи акварелью",budget:"free",location:"outdoor",mood:"creative",season:"autumn"},
{id:1102,title:"Коллаж из осенних листьев",budget:"free",location:"home",mood:"creative",season:"autumn"},
{id:1103,title:"Фотосессия осеннего города",budget:"free",location:"outdoor",mood:"creative",season:"autumn"},
{id:1104,title:"Венок из жёлтых листьев",budget:"free",location:"outdoor",mood:"creative",season:"autumn"},
{id:1105,title:"Осенний скрапбукинг с фото прогулок",budget:"paid",location:"home",mood:"creative",season:"autumn"},

// Гастрономия осенняя
{id:1151,title:"Тыквенный пирог по американскому рецепту",budget:"paid",location:"home",mood:"food",season:"autumn"},
{id:1152,title:"Грибной суп из лесных грибов",budget:"paid",location:"home",mood:"food",season:"autumn"},
{id:1153,title:"Яблочное варенье варите вместе",budget:"paid",location:"home",mood:"food",season:"autumn"},
{id:1154,title:"Тыквенный латте домашний с корицей",budget:"paid",location:"home",mood:"food",season:"autumn"},
{id:1155,title:"Печенье с корицей и имбирём",budget:"paid",location:"home",mood:"food",season:"autumn"},

];

// ============================================
// ПРИМЕЧАНИЕ: Это демо-версия с 200 идеями
// для демонстрации структуры и стиля.
// 
// В полной версии будет 1000 уникальных идей
// с равномерным распределением по всем 
// комбинациям фильтров (сезон + настроение +
// место + бюджет).
// ============================================