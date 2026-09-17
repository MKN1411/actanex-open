// =========================================================================
// BMF AUSLANDSREISEKOSTEN-PAUSCHALEN (Gültig ab 1. Januar 2024 / EStG § 9 Abs. 4a)
// Quelle: BMF-Schreiben vom 21. November 2023 (IV C 5 - S 2353/19/10010 :004)
// Stand: BMF 2024.1 (224 erfasste Staaten und Großstädte)
// =========================================================================

const BMF_FOREIGN_RATES_2024 = [
  {
    "id": "afghanistan",
    "country": "Afghanistan",
    "city": "",
    "label": "Afghanistan",
    "rate_24h": 30,
    "rate_arrival_departure": 20,
    "rate_night": 95
  },
  {
    "id": "aegypten",
    "country": "Ägypten",
    "city": "",
    "label": "Ägypten",
    "rate_24h": 50,
    "rate_arrival_departure": 33,
    "rate_night": 112
  },
  {
    "id": "aethiopien",
    "country": "Äthiopien",
    "city": "",
    "label": "Äthiopien",
    "rate_24h": 39,
    "rate_arrival_departure": 26,
    "rate_night": 130
  },
  {
    "id": "aequatorialguinea",
    "country": "Äquatorialguinea",
    "city": "",
    "label": "Äquatorialguinea",
    "rate_24h": 42,
    "rate_arrival_departure": 28,
    "rate_night": 166
  },
  {
    "id": "albanien",
    "country": "Albanien",
    "city": "",
    "label": "Albanien",
    "rate_24h": 27,
    "rate_arrival_departure": 18,
    "rate_night": 112
  },
  {
    "id": "algerien",
    "country": "Algerien",
    "city": "",
    "label": "Algerien",
    "rate_24h": 47,
    "rate_arrival_departure": 32,
    "rate_night": 120
  },
  {
    "id": "andorra",
    "country": "Andorra",
    "city": "",
    "label": "Andorra",
    "rate_24h": 41,
    "rate_arrival_departure": 28,
    "rate_night": 91
  },
  {
    "id": "angola",
    "country": "Angola",
    "city": "",
    "label": "Angola",
    "rate_24h": 52,
    "rate_arrival_departure": 35,
    "rate_night": 299
  },
  {
    "id": "argentinien",
    "country": "Argentinien",
    "city": "",
    "label": "Argentinien",
    "rate_24h": 35,
    "rate_arrival_departure": 24,
    "rate_night": 113
  },
  {
    "id": "armenien",
    "country": "Armenien",
    "city": "",
    "label": "Armenien",
    "rate_24h": 24,
    "rate_arrival_departure": 16,
    "rate_night": 59
  },
  {
    "id": "aserbaidschan",
    "country": "Aserbaidschan",
    "city": "",
    "label": "Aserbaidschan",
    "rate_24h": 44,
    "rate_arrival_departure": 29,
    "rate_night": 88
  },
  {
    "id": "australien_-_canberra",
    "country": "Australien",
    "city": "Canberra",
    "label": "Australien – Canberra",
    "rate_24h": 74,
    "rate_arrival_departure": 49,
    "rate_night": 186
  },
  {
    "id": "australien_-_sydney",
    "country": "Australien",
    "city": "Sydney",
    "label": "Australien – Sydney",
    "rate_24h": 57,
    "rate_arrival_departure": 38,
    "rate_night": 173
  },
  {
    "id": "australien_-_australien_im_uebrigen",
    "country": "Australien",
    "city": "Australien im Übrigen",
    "label": "Australien – Australien im Übrigen",
    "rate_24h": 57,
    "rate_arrival_departure": 38,
    "rate_night": 173
  },
  {
    "id": "bahrain",
    "country": "Bahrain",
    "city": "",
    "label": "Bahrain",
    "rate_24h": 48,
    "rate_arrival_departure": 32,
    "rate_night": 153
  },
  {
    "id": "bangladesch",
    "country": "Bangladesch",
    "city": "",
    "label": "Bangladesch",
    "rate_24h": 50,
    "rate_arrival_departure": 33,
    "rate_night": 165
  },
  {
    "id": "barbados",
    "country": "Barbados",
    "city": "",
    "label": "Barbados",
    "rate_24h": 54,
    "rate_arrival_departure": 36,
    "rate_night": 206
  },
  {
    "id": "belgien",
    "country": "Belgien",
    "city": "",
    "label": "Belgien",
    "rate_24h": 59,
    "rate_arrival_departure": 40,
    "rate_night": 141
  },
  {
    "id": "benin",
    "country": "Benin",
    "city": "",
    "label": "Benin",
    "rate_24h": 52,
    "rate_arrival_departure": 35,
    "rate_night": 115
  },
  {
    "id": "bolivien",
    "country": "Bolivien",
    "city": "",
    "label": "Bolivien",
    "rate_24h": 46,
    "rate_arrival_departure": 31,
    "rate_night": 108
  },
  {
    "id": "bosnien_und_herzegowina",
    "country": "Bosnien und Herzegowina",
    "city": "",
    "label": "Bosnien und Herzegowina",
    "rate_24h": 23,
    "rate_arrival_departure": 16,
    "rate_night": 75
  },
  {
    "id": "botsuana",
    "country": "Botsuana",
    "city": "",
    "label": "Botsuana",
    "rate_24h": 46,
    "rate_arrival_departure": 31,
    "rate_night": 176
  },
  {
    "id": "brasilien_-_brasilia",
    "country": "Brasilien",
    "city": "Brasilia",
    "label": "Brasilien – Brasilia",
    "rate_24h": 51,
    "rate_arrival_departure": 34,
    "rate_night": 88
  },
  {
    "id": "brasilien_-_rio_de_janeiro",
    "country": "Brasilien",
    "city": "Rio de Janeiro",
    "label": "Brasilien – Rio de Janeiro",
    "rate_24h": 69,
    "rate_arrival_departure": 46,
    "rate_night": 140
  },
  {
    "id": "brasilien_-_sao_paulo",
    "country": "Brasilien",
    "city": "Sao Paulo",
    "label": "Brasilien – Sao Paulo",
    "rate_24h": 46,
    "rate_arrival_departure": 31,
    "rate_night": 151
  },
  {
    "id": "brasilien_-_brasilien_im_uebrigen",
    "country": "Brasilien",
    "city": "Brasilien im Übrigen",
    "label": "Brasilien – Brasilien im Übrigen",
    "rate_24h": 46,
    "rate_arrival_departure": 31,
    "rate_night": 88
  },
  {
    "id": "brunei",
    "country": "Brunei",
    "city": "",
    "label": "Brunei",
    "rate_24h": 52,
    "rate_arrival_departure": 35,
    "rate_night": 106
  },
  {
    "id": "bulgarien",
    "country": "Bulgarien",
    "city": "",
    "label": "Bulgarien",
    "rate_24h": 22,
    "rate_arrival_departure": 15,
    "rate_night": 115
  },
  {
    "id": "burkina_faso",
    "country": "Burkina Faso",
    "city": "",
    "label": "Burkina Faso",
    "rate_24h": 38,
    "rate_arrival_departure": 25,
    "rate_night": 174
  },
  {
    "id": "burundi",
    "country": "Burundi",
    "city": "",
    "label": "Burundi",
    "rate_24h": 36,
    "rate_arrival_departure": 24,
    "rate_night": 138
  },
  {
    "id": "chile",
    "country": "Chile",
    "city": "",
    "label": "Chile",
    "rate_24h": 44,
    "rate_arrival_departure": 29,
    "rate_night": 154
  },
  {
    "id": "china_-_chengdu",
    "country": "China",
    "city": "Chengdu",
    "label": "China – Chengdu",
    "rate_24h": 41,
    "rate_arrival_departure": 28,
    "rate_night": 131
  },
  {
    "id": "china_-_hongkong",
    "country": "China",
    "city": "Hongkong",
    "label": "China – Hongkong",
    "rate_24h": 71,
    "rate_arrival_departure": 48,
    "rate_night": 169
  },
  {
    "id": "china_-_kanton",
    "country": "China",
    "city": "Kanton",
    "label": "China – Kanton",
    "rate_24h": 36,
    "rate_arrival_departure": 24,
    "rate_night": 150
  },
  {
    "id": "china_-_peking",
    "country": "China",
    "city": "Peking",
    "label": "China – Peking",
    "rate_24h": 30,
    "rate_arrival_departure": 20,
    "rate_night": 185
  },
  {
    "id": "china_-_shanghai",
    "country": "China",
    "city": "Shanghai",
    "label": "China – Shanghai",
    "rate_24h": 58,
    "rate_arrival_departure": 39,
    "rate_night": 217
  },
  {
    "id": "china_-_china_im_uebrigen",
    "country": "China",
    "city": "China im Übrigen",
    "label": "China – China im Übrigen",
    "rate_24h": 48,
    "rate_arrival_departure": 32,
    "rate_night": 112
  },
  {
    "id": "costa_rica",
    "country": "Costa Rica",
    "city": "",
    "label": "Costa Rica",
    "rate_24h": 47,
    "rate_arrival_departure": 32,
    "rate_night": 93
  },
  {
    "id": "côte_d’ivoire",
    "country": "Côte d’Ivoire",
    "city": "",
    "label": "Côte d’Ivoire",
    "rate_24h": 59,
    "rate_arrival_departure": 40,
    "rate_night": 166
  },
  {
    "id": "deutschland",
    "country": "Deutschland",
    "city": "",
    "label": "Deutschland",
    "rate_24h": 28,
    "rate_arrival_departure": 14,
    "rate_night": 20
  },
  {
    "id": "daenemark",
    "country": "Dänemark",
    "city": "",
    "label": "Dänemark",
    "rate_24h": 75,
    "rate_arrival_departure": 50,
    "rate_night": 183
  },
  {
    "id": "dominikanische_republik",
    "country": "Dominikanische Republik",
    "city": "",
    "label": "Dominikanische Republik",
    "rate_24h": 50,
    "rate_arrival_departure": 33,
    "rate_night": 167
  },
  {
    "id": "dschibuti",
    "country": "Dschibuti",
    "city": "",
    "label": "Dschibuti",
    "rate_24h": 77,
    "rate_arrival_departure": 52,
    "rate_night": 255
  },
  {
    "id": "ecuador",
    "country": "Ecuador",
    "city": "",
    "label": "Ecuador",
    "rate_24h": 27,
    "rate_arrival_departure": 18,
    "rate_night": 103
  },
  {
    "id": "el_salvador",
    "country": "El Salvador",
    "city": "",
    "label": "El Salvador",
    "rate_24h": 65,
    "rate_arrival_departure": 44,
    "rate_night": 161
  },
  {
    "id": "eritrea",
    "country": "Eritrea",
    "city": "",
    "label": "Eritrea",
    "rate_24h": 50,
    "rate_arrival_departure": 33,
    "rate_night": 91
  },
  {
    "id": "estland",
    "country": "Estland",
    "city": "",
    "label": "Estland",
    "rate_24h": 29,
    "rate_arrival_departure": 20,
    "rate_night": 85
  },
  {
    "id": "fidschi",
    "country": "Fidschi",
    "city": "",
    "label": "Fidschi",
    "rate_24h": 32,
    "rate_arrival_departure": 21,
    "rate_night": 183
  },
  {
    "id": "finnland",
    "country": "Finnland",
    "city": "",
    "label": "Finnland",
    "rate_24h": 54,
    "rate_arrival_departure": 36,
    "rate_night": 171
  },
  {
    "id": "frankreich_-_paris_sowie_die_departments_77,78,_91_bis_95",
    "country": "Frankreich",
    "city": "Paris sowie die Departments 77,78, 91 bis 95",
    "label": "Frankreich – Paris sowie die Departments 77,78, 91 bis 95",
    "rate_24h": 58,
    "rate_arrival_departure": 39,
    "rate_night": 159
  },
  {
    "id": "frankreich_-_frankreich_im_uebrigen",
    "country": "Frankreich",
    "city": "Frankreich im Übrigen",
    "label": "Frankreich – Frankreich im Übrigen",
    "rate_24h": 53,
    "rate_arrival_departure": 36,
    "rate_night": 105
  },
  {
    "id": "gabun",
    "country": "Gabun",
    "city": "",
    "label": "Gabun",
    "rate_24h": 52,
    "rate_arrival_departure": 35,
    "rate_night": 183
  },
  {
    "id": "gambia",
    "country": "Gambia",
    "city": "",
    "label": "Gambia",
    "rate_24h": 40,
    "rate_arrival_departure": 27,
    "rate_night": 161
  },
  {
    "id": "georgien",
    "country": "Georgien",
    "city": "",
    "label": "Georgien",
    "rate_24h": 45,
    "rate_arrival_departure": 30,
    "rate_night": 87
  },
  {
    "id": "ghana",
    "country": "Ghana",
    "city": "",
    "label": "Ghana",
    "rate_24h": 46,
    "rate_arrival_departure": 31,
    "rate_night": 148
  },
  {
    "id": "griechenland_-_athen",
    "country": "Griechenland",
    "city": "Athen",
    "label": "Griechenland – Athen",
    "rate_24h": 40,
    "rate_arrival_departure": 27,
    "rate_night": 139
  },
  {
    "id": "griechenland_-_griechenland_im_uebrigen",
    "country": "Griechenland",
    "city": "Griechenland im Übrigen",
    "label": "Griechenland – Griechenland im Übrigen",
    "rate_24h": 36,
    "rate_arrival_departure": 24,
    "rate_night": 150
  },
  {
    "id": "guatemala",
    "country": "Guatemala",
    "city": "",
    "label": "Guatemala",
    "rate_24h": 34,
    "rate_arrival_departure": 23,
    "rate_night": 90
  },
  {
    "id": "guinea",
    "country": "Guinea",
    "city": "",
    "label": "Guinea",
    "rate_24h": 59,
    "rate_arrival_departure": 40,
    "rate_night": 140
  },
  {
    "id": "guinea-bissau",
    "country": "Guinea-Bissau",
    "city": "",
    "label": "Guinea-Bissau",
    "rate_24h": 32,
    "rate_arrival_departure": 21,
    "rate_night": 113
  },
  {
    "id": "haiti",
    "country": "Haiti",
    "city": "",
    "label": "Haiti",
    "rate_24h": 58,
    "rate_arrival_departure": 39,
    "rate_night": 130
  },
  {
    "id": "honduras",
    "country": "Honduras",
    "city": "",
    "label": "Honduras",
    "rate_24h": 57,
    "rate_arrival_departure": 38,
    "rate_night": 198
  },
  {
    "id": "indien_-_chennai",
    "country": "Indien",
    "city": "Chennai",
    "label": "Indien – Chennai",
    "rate_24h": 32,
    "rate_arrival_departure": 21,
    "rate_night": 85
  },
  {
    "id": "indien_-_kalkutta",
    "country": "Indien",
    "city": "Kalkutta",
    "label": "Indien – Kalkutta",
    "rate_24h": 35,
    "rate_arrival_departure": 24,
    "rate_night": 145
  },
  {
    "id": "indien_-_mumbai",
    "country": "Indien",
    "city": "Mumbai",
    "label": "Indien – Mumbai",
    "rate_24h": 50,
    "rate_arrival_departure": 33,
    "rate_night": 146
  },
  {
    "id": "indien_-_neu_delhi",
    "country": "Indien",
    "city": "Neu Delhi",
    "label": "Indien – Neu Delhi",
    "rate_24h": 38,
    "rate_arrival_departure": 25,
    "rate_night": 185
  },
  {
    "id": "indien_-_indien_im_uebrigen",
    "country": "Indien",
    "city": "Indien im Übrigen",
    "label": "Indien – Indien im Übrigen",
    "rate_24h": 32,
    "rate_arrival_departure": 21,
    "rate_night": 85
  },
  {
    "id": "indonesien",
    "country": "Indonesien",
    "city": "",
    "label": "Indonesien",
    "rate_24h": 36,
    "rate_arrival_departure": 24,
    "rate_night": 134
  },
  {
    "id": "iran",
    "country": "Iran",
    "city": "",
    "label": "Iran",
    "rate_24h": 33,
    "rate_arrival_departure": 22,
    "rate_night": 196
  },
  {
    "id": "irland",
    "country": "Irland",
    "city": "",
    "label": "Irland",
    "rate_24h": 58,
    "rate_arrival_departure": 39,
    "rate_night": 129
  },
  {
    "id": "island",
    "country": "Island",
    "city": "",
    "label": "Island",
    "rate_24h": 62,
    "rate_arrival_departure": 41,
    "rate_night": 187
  },
  {
    "id": "israel",
    "country": "Israel",
    "city": "",
    "label": "Israel",
    "rate_24h": 66,
    "rate_arrival_departure": 44,
    "rate_night": 190
  },
  {
    "id": "italien_-_mailand",
    "country": "Italien",
    "city": "Mailand",
    "label": "Italien – Mailand",
    "rate_24h": 42,
    "rate_arrival_departure": 28,
    "rate_night": 191
  },
  {
    "id": "italien_-_rom",
    "country": "Italien",
    "city": "Rom",
    "label": "Italien – Rom",
    "rate_24h": 48,
    "rate_arrival_departure": 32,
    "rate_night": 150
  },
  {
    "id": "italien_-_italien_im_uebrigen",
    "country": "Italien",
    "city": "Italien im Übrigen",
    "label": "Italien – Italien im Übrigen",
    "rate_24h": 42,
    "rate_arrival_departure": 28,
    "rate_night": 150
  },
  {
    "id": "jamaika",
    "country": "Jamaika",
    "city": "",
    "label": "Jamaika",
    "rate_24h": 39,
    "rate_arrival_departure": 26,
    "rate_night": 171
  },
  {
    "id": "japan_-_tokio",
    "country": "Japan",
    "city": "Tokio",
    "label": "Japan – Tokio",
    "rate_24h": 50,
    "rate_arrival_departure": 33,
    "rate_night": 285
  },
  {
    "id": "japan_-_japan_im_uebrigen",
    "country": "Japan",
    "city": "Japan im Übrigen",
    "label": "Japan – Japan im Übrigen",
    "rate_24h": 52,
    "rate_arrival_departure": 35,
    "rate_night": 190
  },
  {
    "id": "jemen",
    "country": "Jemen",
    "city": "",
    "label": "Jemen",
    "rate_24h": 24,
    "rate_arrival_departure": 16,
    "rate_night": 95
  },
  {
    "id": "jordanien",
    "country": "Jordanien",
    "city": "",
    "label": "Jordanien",
    "rate_24h": 57,
    "rate_arrival_departure": 38,
    "rate_night": 134
  },
  {
    "id": "kambodscha",
    "country": "Kambodscha",
    "city": "",
    "label": "Kambodscha",
    "rate_24h": 38,
    "rate_arrival_departure": 25,
    "rate_night": 94
  },
  {
    "id": "kamerun",
    "country": "Kamerun",
    "city": "",
    "label": "Kamerun",
    "rate_24h": 56,
    "rate_arrival_departure": 37,
    "rate_night": 275
  },
  {
    "id": "kanada_-_ottawa",
    "country": "Kanada",
    "city": "Ottawa",
    "label": "Kanada – Ottawa",
    "rate_24h": 62,
    "rate_arrival_departure": 41,
    "rate_night": 214
  },
  {
    "id": "kanada_-_toronto",
    "country": "Kanada",
    "city": "Toronto",
    "label": "Kanada – Toronto",
    "rate_24h": 54,
    "rate_arrival_departure": 36,
    "rate_night": 392
  },
  {
    "id": "kanada_-_vancouver",
    "country": "Kanada",
    "city": "Vancouver",
    "label": "Kanada – Vancouver",
    "rate_24h": 63,
    "rate_arrival_departure": 42,
    "rate_night": 304
  },
  {
    "id": "kanada_-_kanada_im_uebrigen",
    "country": "Kanada",
    "city": "Kanada im Übrigen",
    "label": "Kanada – Kanada im Übrigen",
    "rate_24h": 54,
    "rate_arrival_departure": 36,
    "rate_night": 214
  },
  {
    "id": "kap_verde",
    "country": "Kap Verde",
    "city": "",
    "label": "Kap Verde",
    "rate_24h": 38,
    "rate_arrival_departure": 25,
    "rate_night": 90
  },
  {
    "id": "kasachstan",
    "country": "Kasachstan",
    "city": "",
    "label": "Kasachstan",
    "rate_24h": 45,
    "rate_arrival_departure": 30,
    "rate_night": 111
  },
  {
    "id": "katar",
    "country": "Katar",
    "city": "",
    "label": "Katar",
    "rate_24h": 56,
    "rate_arrival_departure": 37,
    "rate_night": 149
  },
  {
    "id": "kenia",
    "country": "Kenia",
    "city": "",
    "label": "Kenia",
    "rate_24h": 51,
    "rate_arrival_departure": 34,
    "rate_night": 219
  },
  {
    "id": "kirgisistan",
    "country": "Kirgisistan",
    "city": "",
    "label": "Kirgisistan",
    "rate_24h": 27,
    "rate_arrival_departure": 18,
    "rate_night": 74
  },
  {
    "id": "kolumbien",
    "country": "Kolumbien",
    "city": "",
    "label": "Kolumbien",
    "rate_24h": 46,
    "rate_arrival_departure": 31,
    "rate_night": 115
  },
  {
    "id": "kongo,_republik",
    "country": "Kongo, Republik",
    "city": "",
    "label": "Kongo, Republik",
    "rate_24h": 62,
    "rate_arrival_departure": 41,
    "rate_night": 215
  },
  {
    "id": "kongo,_demokratische_republik",
    "country": "Kongo, Demokratische Republik",
    "city": "",
    "label": "Kongo, Demokratische Republik",
    "rate_24h": 70,
    "rate_arrival_departure": 47,
    "rate_night": 190
  },
  {
    "id": "korea,_demokratische_volksrepublik",
    "country": "Korea, Demokratische Volksrepublik",
    "city": "",
    "label": "Korea, Demokratische Volksrepublik",
    "rate_24h": 28,
    "rate_arrival_departure": 19,
    "rate_night": 92
  },
  {
    "id": "korea,_republik",
    "country": "Korea, Republik",
    "city": "",
    "label": "Korea, Republik",
    "rate_24h": 48,
    "rate_arrival_departure": 32,
    "rate_night": 108
  },
  {
    "id": "kosovo",
    "country": "Kosovo",
    "city": "",
    "label": "Kosovo",
    "rate_24h": 24,
    "rate_arrival_departure": 16,
    "rate_night": 71
  },
  {
    "id": "kroatien",
    "country": "Kroatien",
    "city": "",
    "label": "Kroatien",
    "rate_24h": 35,
    "rate_arrival_departure": 24,
    "rate_night": 107
  },
  {
    "id": "kuba",
    "country": "Kuba",
    "city": "",
    "label": "Kuba",
    "rate_24h": 51,
    "rate_arrival_departure": 34,
    "rate_night": 170
  },
  {
    "id": "kuwait",
    "country": "Kuwait",
    "city": "",
    "label": "Kuwait",
    "rate_24h": 56,
    "rate_arrival_departure": 37,
    "rate_night": 241
  },
  {
    "id": "laos",
    "country": "Laos",
    "city": "",
    "label": "Laos",
    "rate_24h": 35,
    "rate_arrival_departure": 24,
    "rate_night": 71
  },
  {
    "id": "lesotho",
    "country": "Lesotho",
    "city": "",
    "label": "Lesotho",
    "rate_24h": 28,
    "rate_arrival_departure": 19,
    "rate_night": 104
  },
  {
    "id": "lettland",
    "country": "Lettland",
    "city": "",
    "label": "Lettland",
    "rate_24h": 35,
    "rate_arrival_departure": 24,
    "rate_night": 76
  },
  {
    "id": "libanon",
    "country": "Libanon",
    "city": "",
    "label": "Libanon",
    "rate_24h": 69,
    "rate_arrival_departure": 46,
    "rate_night": 146
  },
  {
    "id": "libyen",
    "country": "Libyen",
    "city": "",
    "label": "Libyen",
    "rate_24h": 63,
    "rate_arrival_departure": 42,
    "rate_night": 135
  },
  {
    "id": "liechtenstein",
    "country": "Liechtenstein",
    "city": "",
    "label": "Liechtenstein",
    "rate_24h": 56,
    "rate_arrival_departure": 37,
    "rate_night": 190
  },
  {
    "id": "litauen",
    "country": "Litauen",
    "city": "",
    "label": "Litauen",
    "rate_24h": 26,
    "rate_arrival_departure": 17,
    "rate_night": 109
  },
  {
    "id": "luxemburg",
    "country": "Luxemburg",
    "city": "",
    "label": "Luxemburg",
    "rate_24h": 63,
    "rate_arrival_departure": 42,
    "rate_night": 139
  },
  {
    "id": "madagaskar",
    "country": "Madagaskar",
    "city": "",
    "label": "Madagaskar",
    "rate_24h": 33,
    "rate_arrival_departure": 22,
    "rate_night": 116
  },
  {
    "id": "malawi",
    "country": "Malawi",
    "city": "",
    "label": "Malawi",
    "rate_24h": 41,
    "rate_arrival_departure": 28,
    "rate_night": 109
  },
  {
    "id": "malaysia",
    "country": "Malaysia",
    "city": "",
    "label": "Malaysia",
    "rate_24h": 36,
    "rate_arrival_departure": 24,
    "rate_night": 86
  },
  {
    "id": "malediven",
    "country": "Malediven",
    "city": "",
    "label": "Malediven",
    "rate_24h": 52,
    "rate_arrival_departure": 35,
    "rate_night": 170
  },
  {
    "id": "mali",
    "country": "Mali",
    "city": "",
    "label": "Mali",
    "rate_24h": 38,
    "rate_arrival_departure": 25,
    "rate_night": 120
  },
  {
    "id": "malta",
    "country": "Malta",
    "city": "",
    "label": "Malta",
    "rate_24h": 46,
    "rate_arrival_departure": 31,
    "rate_night": 114
  },
  {
    "id": "marokko",
    "country": "Marokko",
    "city": "",
    "label": "Marokko",
    "rate_24h": 41,
    "rate_arrival_departure": 28,
    "rate_night": 87
  },
  {
    "id": "marshall_inseln",
    "country": "Marshall Inseln",
    "city": "",
    "label": "Marshall Inseln",
    "rate_24h": 63,
    "rate_arrival_departure": 42,
    "rate_night": 102
  },
  {
    "id": "mauretanien",
    "country": "Mauretanien",
    "city": "",
    "label": "Mauretanien",
    "rate_24h": 35,
    "rate_arrival_departure": 24,
    "rate_night": 86
  },
  {
    "id": "mauritius",
    "country": "Mauritius",
    "city": "",
    "label": "Mauritius",
    "rate_24h": 44,
    "rate_arrival_departure": 29,
    "rate_night": 172
  },
  {
    "id": "mexiko",
    "country": "Mexiko",
    "city": "",
    "label": "Mexiko",
    "rate_24h": 48,
    "rate_arrival_departure": 32,
    "rate_night": 177
  },
  {
    "id": "moldau,_republik",
    "country": "Moldau, Republik",
    "city": "",
    "label": "Moldau, Republik",
    "rate_24h": 26,
    "rate_arrival_departure": 17,
    "rate_night": 73
  },
  {
    "id": "monaco",
    "country": "Monaco",
    "city": "",
    "label": "Monaco",
    "rate_24h": 52,
    "rate_arrival_departure": 35,
    "rate_night": 187
  },
  {
    "id": "mongolei",
    "country": "Mongolei",
    "city": "",
    "label": "Mongolei",
    "rate_24h": 23,
    "rate_arrival_departure": 16,
    "rate_night": 92
  },
  {
    "id": "montenegro",
    "country": "Montenegro",
    "city": "",
    "label": "Montenegro",
    "rate_24h": 32,
    "rate_arrival_departure": 21,
    "rate_night": 85
  },
  {
    "id": "mosambik",
    "country": "Mosambik",
    "city": "",
    "label": "Mosambik",
    "rate_24h": 51,
    "rate_arrival_departure": 34,
    "rate_night": 208
  },
  {
    "id": "myanmar",
    "country": "Myanmar",
    "city": "",
    "label": "Myanmar",
    "rate_24h": 35,
    "rate_arrival_departure": 24,
    "rate_night": 155
  },
  {
    "id": "namibia",
    "country": "Namibia",
    "city": "",
    "label": "Namibia",
    "rate_24h": 30,
    "rate_arrival_departure": 20,
    "rate_night": 112
  },
  {
    "id": "nepal",
    "country": "Nepal",
    "city": "",
    "label": "Nepal",
    "rate_24h": 36,
    "rate_arrival_departure": 24,
    "rate_night": 126
  },
  {
    "id": "neuseeland",
    "country": "Neuseeland",
    "city": "",
    "label": "Neuseeland",
    "rate_24h": 58,
    "rate_arrival_departure": 39,
    "rate_night": 148
  },
  {
    "id": "nicaragua",
    "country": "Nicaragua",
    "city": "",
    "label": "Nicaragua",
    "rate_24h": 46,
    "rate_arrival_departure": 31,
    "rate_night": 105
  },
  {
    "id": "niederlande",
    "country": "Niederlande",
    "city": "",
    "label": "Niederlande",
    "rate_24h": 47,
    "rate_arrival_departure": 32,
    "rate_night": 122
  },
  {
    "id": "niger",
    "country": "Niger",
    "city": "",
    "label": "Niger",
    "rate_24h": 42,
    "rate_arrival_departure": 28,
    "rate_night": 131
  },
  {
    "id": "nigeria",
    "country": "Nigeria",
    "city": "",
    "label": "Nigeria",
    "rate_24h": 46,
    "rate_arrival_departure": 31,
    "rate_night": 182
  },
  {
    "id": "nordmazedonien",
    "country": "Nordmazedonien",
    "city": "",
    "label": "Nordmazedonien",
    "rate_24h": 27,
    "rate_arrival_departure": 18,
    "rate_night": 89
  },
  {
    "id": "norwegen",
    "country": "Norwegen",
    "city": "",
    "label": "Norwegen",
    "rate_24h": 75,
    "rate_arrival_departure": 50,
    "rate_night": 139
  },
  {
    "id": "oesterreich",
    "country": "Österreich",
    "city": "",
    "label": "Österreich",
    "rate_24h": 50,
    "rate_arrival_departure": 33,
    "rate_night": 117
  },
  {
    "id": "oman",
    "country": "Oman",
    "city": "",
    "label": "Oman",
    "rate_24h": 64,
    "rate_arrival_departure": 43,
    "rate_night": 141
  },
  {
    "id": "pakistan_-_islamabad",
    "country": "Pakistan",
    "city": "Islamabad",
    "label": "Pakistan – Islamabad",
    "rate_24h": 23,
    "rate_arrival_departure": 16,
    "rate_night": 238
  },
  {
    "id": "pakistan_-_pakistan_im_uebrigen",
    "country": "Pakistan",
    "city": "Pakistan im Übrigen",
    "label": "Pakistan – Pakistan im Übrigen",
    "rate_24h": 34,
    "rate_arrival_departure": 23,
    "rate_night": 122
  },
  {
    "id": "palau",
    "country": "Palau",
    "city": "",
    "label": "Palau",
    "rate_24h": 51,
    "rate_arrival_departure": 34,
    "rate_night": 179
  },
  {
    "id": "panama",
    "country": "Panama",
    "city": "",
    "label": "Panama",
    "rate_24h": 41,
    "rate_arrival_departure": 28,
    "rate_night": 82
  },
  {
    "id": "papua-neuguinea",
    "country": "Papua-Neuguinea",
    "city": "",
    "label": "Papua-Neuguinea",
    "rate_24h": 59,
    "rate_arrival_departure": 40,
    "rate_night": 159
  },
  {
    "id": "paraguay",
    "country": "Paraguay",
    "city": "",
    "label": "Paraguay",
    "rate_24h": 39,
    "rate_arrival_departure": 26,
    "rate_night": 124
  },
  {
    "id": "peru",
    "country": "Peru",
    "city": "",
    "label": "Peru",
    "rate_24h": 34,
    "rate_arrival_departure": 23,
    "rate_night": 143
  },
  {
    "id": "philippinen",
    "country": "Philippinen",
    "city": "",
    "label": "Philippinen",
    "rate_24h": 41,
    "rate_arrival_departure": 28,
    "rate_night": 140
  },
  {
    "id": "polen_-_breslau",
    "country": "Polen",
    "city": "Breslau",
    "label": "Polen – Breslau",
    "rate_24h": 33,
    "rate_arrival_departure": 22,
    "rate_night": 117
  },
  {
    "id": "polen_-_danzig",
    "country": "Polen",
    "city": "Danzig",
    "label": "Polen – Danzig",
    "rate_24h": 30,
    "rate_arrival_departure": 20,
    "rate_night": 84
  },
  {
    "id": "polen_-_krakau",
    "country": "Polen",
    "city": "Krakau",
    "label": "Polen – Krakau",
    "rate_24h": 27,
    "rate_arrival_departure": 18,
    "rate_night": 86
  },
  {
    "id": "polen_-_warschau",
    "country": "Polen",
    "city": "Warschau",
    "label": "Polen – Warschau",
    "rate_24h": 29,
    "rate_arrival_departure": 20,
    "rate_night": 109
  },
  {
    "id": "polen_-_polen_im_uebrigen",
    "country": "Polen",
    "city": "Polen im Übrigen",
    "label": "Polen – Polen im Übrigen",
    "rate_24h": 29,
    "rate_arrival_departure": 20,
    "rate_night": 60
  },
  {
    "id": "portugal",
    "country": "Portugal",
    "city": "",
    "label": "Portugal",
    "rate_24h": 32,
    "rate_arrival_departure": 21,
    "rate_night": 111
  },
  {
    "id": "ruanda",
    "country": "Ruanda",
    "city": "",
    "label": "Ruanda",
    "rate_24h": 44,
    "rate_arrival_departure": 29,
    "rate_night": 117
  },
  {
    "id": "rumaenien_-_bukarest",
    "country": "Rumänien",
    "city": "Bukarest",
    "label": "Rumänien – Bukarest",
    "rate_24h": 32,
    "rate_arrival_departure": 21,
    "rate_night": 92
  },
  {
    "id": "rumaenien_-_rumaenien_im_uebrigen",
    "country": "Rumänien",
    "city": "Rumänien im Übrigen",
    "label": "Rumänien – Rumänien im Übrigen",
    "rate_24h": 27,
    "rate_arrival_departure": 18,
    "rate_night": 89
  },
  {
    "id": "russische_foederation_-_jekatarinburg",
    "country": "Russische Föderation",
    "city": "Jekatarinburg",
    "label": "Russische Föderation – Jekatarinburg",
    "rate_24h": 28,
    "rate_arrival_departure": 19,
    "rate_night": 84
  },
  {
    "id": "russische_foederation_-_moskau",
    "country": "Russische Föderation",
    "city": "Moskau",
    "label": "Russische Föderation – Moskau",
    "rate_24h": 30,
    "rate_arrival_departure": 20,
    "rate_night": 110
  },
  {
    "id": "russische_foederation_-_st_petersburg",
    "country": "Russische Föderation",
    "city": "St. Petersburg",
    "label": "Russische Föderation – St. Petersburg",
    "rate_24h": 26,
    "rate_arrival_departure": 17,
    "rate_night": 114
  },
  {
    "id": "russische_foederation_-_rus_im_uebrigen",
    "country": "Russische Föderation",
    "city": "RUS im Übrigen",
    "label": "Russische Föderation – RUS im Übrigen",
    "rate_24h": 24,
    "rate_arrival_departure": 16,
    "rate_night": 58
  },
  {
    "id": "sambia",
    "country": "Sambia",
    "city": "",
    "label": "Sambia",
    "rate_24h": 38,
    "rate_arrival_departure": 25,
    "rate_night": 105
  },
  {
    "id": "samoa",
    "country": "Samoa",
    "city": "",
    "label": "Samoa",
    "rate_24h": 39,
    "rate_arrival_departure": 26,
    "rate_night": 105
  },
  {
    "id": "san_marino",
    "country": "San Marino",
    "city": "",
    "label": "San Marino",
    "rate_24h": 34,
    "rate_arrival_departure": 23,
    "rate_night": 79
  },
  {
    "id": "são_tomé_-_príncipe",
    "country": "São Tomé – Príncipe",
    "city": "",
    "label": "São Tomé – Príncipe",
    "rate_24h": 47,
    "rate_arrival_departure": 32,
    "rate_night": 80
  },
  {
    "id": "saudi-arabien_-_djidda",
    "country": "Saudi-Arabien",
    "city": "Djidda",
    "label": "Saudi-Arabien – Djidda",
    "rate_24h": 57,
    "rate_arrival_departure": 38,
    "rate_night": 181
  },
  {
    "id": "saudi-arabien_-_riad",
    "country": "Saudi-Arabien",
    "city": "Riad",
    "label": "Saudi-Arabien – Riad",
    "rate_24h": 56,
    "rate_arrival_departure": 37,
    "rate_night": 186
  },
  {
    "id": "saudi-arabien_-_saudi-arabien_im_uebrigen",
    "country": "Saudi-Arabien",
    "city": "Saudi-Arabien im Übrigen",
    "label": "Saudi-Arabien – Saudi-Arabien im Übrigen",
    "rate_24h": 56,
    "rate_arrival_departure": 37,
    "rate_night": 181
  },
  {
    "id": "schweden",
    "country": "Schweden",
    "city": "",
    "label": "Schweden",
    "rate_24h": 66,
    "rate_arrival_departure": 44,
    "rate_night": 140
  },
  {
    "id": "schweiz_-_genf",
    "country": "Schweiz",
    "city": "Genf",
    "label": "Schweiz – Genf",
    "rate_24h": 66,
    "rate_arrival_departure": 44,
    "rate_night": 186
  },
  {
    "id": "schweiz_-_schweiz_im_uebrigen",
    "country": "Schweiz",
    "city": "Schweiz im Übrigen",
    "label": "Schweiz – Schweiz im Übrigen",
    "rate_24h": 64,
    "rate_arrival_departure": 43,
    "rate_night": 180
  },
  {
    "id": "senegal",
    "country": "Senegal",
    "city": "",
    "label": "Senegal",
    "rate_24h": 42,
    "rate_arrival_departure": 28,
    "rate_night": 190
  },
  {
    "id": "serbien",
    "country": "Serbien",
    "city": "",
    "label": "Serbien",
    "rate_24h": 27,
    "rate_arrival_departure": 18,
    "rate_night": 97
  },
  {
    "id": "sierra_leone",
    "country": "Sierra Leone",
    "city": "",
    "label": "Sierra Leone",
    "rate_24h": 57,
    "rate_arrival_departure": 38,
    "rate_night": 145
  },
  {
    "id": "simbabwe",
    "country": "Simbabwe",
    "city": "",
    "label": "Simbabwe",
    "rate_24h": 45,
    "rate_arrival_departure": 30,
    "rate_night": 140
  },
  {
    "id": "singapur",
    "country": "Singapur",
    "city": "",
    "label": "Singapur",
    "rate_24h": 54,
    "rate_arrival_departure": 36,
    "rate_night": 197
  },
  {
    "id": "slowakische_republik",
    "country": "Slowakische Republik",
    "city": "",
    "label": "Slowakische Republik",
    "rate_24h": 33,
    "rate_arrival_departure": 22,
    "rate_night": 121
  },
  {
    "id": "slowenien",
    "country": "Slowenien",
    "city": "",
    "label": "Slowenien",
    "rate_24h": 38,
    "rate_arrival_departure": 25,
    "rate_night": 126
  },
  {
    "id": "spanien_-_barcelona",
    "country": "Spanien",
    "city": "Barcelona",
    "label": "Spanien – Barcelona",
    "rate_24h": 34,
    "rate_arrival_departure": 23,
    "rate_night": 144
  },
  {
    "id": "spanien_-_kanarische_inseln",
    "country": "Spanien",
    "city": "Kanarische Inseln",
    "label": "Spanien – Kanarische Inseln",
    "rate_24h": 36,
    "rate_arrival_departure": 24,
    "rate_night": 103
  },
  {
    "id": "spanien_-_madrid",
    "country": "Spanien",
    "city": "Madrid",
    "label": "Spanien – Madrid",
    "rate_24h": 42,
    "rate_arrival_departure": 28,
    "rate_night": 131
  },
  {
    "id": "spanien_-_palma_de_mallorca",
    "country": "Spanien",
    "city": "Palma de Mallorca",
    "label": "Spanien – Palma de Mallorca",
    "rate_24h": 44,
    "rate_arrival_departure": 29,
    "rate_night": 142
  },
  {
    "id": "spanien_-_spanien_im_uebrigen",
    "country": "Spanien",
    "city": "Spanien im Übrigen",
    "label": "Spanien – Spanien im Übrigen",
    "rate_24h": 34,
    "rate_arrival_departure": 23,
    "rate_night": 103
  },
  {
    "id": "sri_lanka",
    "country": "Sri Lanka",
    "city": "",
    "label": "Sri Lanka",
    "rate_24h": 36,
    "rate_arrival_departure": 24,
    "rate_night": 112
  },
  {
    "id": "sudan",
    "country": "Sudan",
    "city": "",
    "label": "Sudan",
    "rate_24h": 33,
    "rate_arrival_departure": 22,
    "rate_night": 195
  },
  {
    "id": "suedafrika_-_kapstadt",
    "country": "Südafrika",
    "city": "Kapstadt",
    "label": "Südafrika – Kapstadt",
    "rate_24h": 33,
    "rate_arrival_departure": 22,
    "rate_night": 130
  },
  {
    "id": "suedafrika_-_johannesburg",
    "country": "Südafrika",
    "city": "Johannesburg",
    "label": "Südafrika – Johannesburg",
    "rate_24h": 36,
    "rate_arrival_departure": 24,
    "rate_night": 129
  },
  {
    "id": "suedafrika_-_suedafrika_im_uebrigen",
    "country": "Südafrika",
    "city": "Südafrika im Übrigen",
    "label": "Südafrika – Südafrika im Übrigen",
    "rate_24h": 29,
    "rate_arrival_departure": 20,
    "rate_night": 109
  },
  {
    "id": "suedsudan",
    "country": "Südsudan",
    "city": "",
    "label": "Südsudan",
    "rate_24h": 51,
    "rate_arrival_departure": 34,
    "rate_night": 159
  },
  {
    "id": "syrien",
    "country": "Syrien",
    "city": "",
    "label": "Syrien",
    "rate_24h": 38,
    "rate_arrival_departure": 25,
    "rate_night": 140
  },
  {
    "id": "tadschikistan",
    "country": "Tadschikistan",
    "city": "",
    "label": "Tadschikistan",
    "rate_24h": 27,
    "rate_arrival_departure": 18,
    "rate_night": 118
  },
  {
    "id": "taiwan",
    "country": "Taiwan",
    "city": "",
    "label": "Taiwan",
    "rate_24h": 46,
    "rate_arrival_departure": 31,
    "rate_night": 143
  },
  {
    "id": "tansania",
    "country": "Tansania",
    "city": "",
    "label": "Tansania",
    "rate_24h": 44,
    "rate_arrival_departure": 29,
    "rate_night": 97
  },
  {
    "id": "thailand",
    "country": "Thailand",
    "city": "",
    "label": "Thailand",
    "rate_24h": 38,
    "rate_arrival_departure": 25,
    "rate_night": 110
  },
  {
    "id": "togo",
    "country": "Togo",
    "city": "",
    "label": "Togo",
    "rate_24h": 39,
    "rate_arrival_departure": 26,
    "rate_night": 118
  },
  {
    "id": "tonga",
    "country": "Tonga",
    "city": "",
    "label": "Tonga",
    "rate_24h": 39,
    "rate_arrival_departure": 26,
    "rate_night": 94
  },
  {
    "id": "trinidad_und_tobago",
    "country": "Trinidad und Tobago",
    "city": "",
    "label": "Trinidad und Tobago",
    "rate_24h": 66,
    "rate_arrival_departure": 44,
    "rate_night": 203
  },
  {
    "id": "tschad",
    "country": "Tschad",
    "city": "",
    "label": "Tschad",
    "rate_24h": 42,
    "rate_arrival_departure": 28,
    "rate_night": 155
  },
  {
    "id": "tschechische_republik",
    "country": "Tschechische Republik",
    "city": "",
    "label": "Tschechische Republik",
    "rate_24h": 32,
    "rate_arrival_departure": 21,
    "rate_night": 77
  },
  {
    "id": "tuerkei_-_istanbul",
    "country": "Türkei",
    "city": "Istanbul",
    "label": "Türkei – Istanbul",
    "rate_24h": 26,
    "rate_arrival_departure": 17,
    "rate_night": 120
  },
  {
    "id": "tuerkei_-_izmir",
    "country": "Türkei",
    "city": "Izmir",
    "label": "Türkei – Izmir",
    "rate_24h": 29,
    "rate_arrival_departure": 20,
    "rate_night": 55
  },
  {
    "id": "tuerkei_-_tuerkei_im_uebrigen",
    "country": "Türkei",
    "city": "Türkei im Übrigen",
    "label": "Türkei – Türkei im Übrigen",
    "rate_24h": 17,
    "rate_arrival_departure": 12,
    "rate_night": 95
  },
  {
    "id": "tunesien",
    "country": "Tunesien",
    "city": "",
    "label": "Tunesien",
    "rate_24h": 40,
    "rate_arrival_departure": 27,
    "rate_night": 144
  },
  {
    "id": "turkmenistan",
    "country": "Turkmenistan",
    "city": "",
    "label": "Turkmenistan",
    "rate_24h": 33,
    "rate_arrival_departure": 22,
    "rate_night": 108
  },
  {
    "id": "uganda",
    "country": "Uganda",
    "city": "",
    "label": "Uganda",
    "rate_24h": 41,
    "rate_arrival_departure": 28,
    "rate_night": 143
  },
  {
    "id": "ukraine",
    "country": "Ukraine",
    "city": "",
    "label": "Ukraine",
    "rate_24h": 26,
    "rate_arrival_departure": 17,
    "rate_night": 98
  },
  {
    "id": "ungarn",
    "country": "Ungarn",
    "city": "",
    "label": "Ungarn",
    "rate_24h": 32,
    "rate_arrival_departure": 21,
    "rate_night": 85
  },
  {
    "id": "uruguay",
    "country": "Uruguay",
    "city": "",
    "label": "Uruguay",
    "rate_24h": 48,
    "rate_arrival_departure": 32,
    "rate_night": 90
  },
  {
    "id": "usbekistan",
    "country": "Usbekistan",
    "city": "",
    "label": "Usbekistan",
    "rate_24h": 34,
    "rate_arrival_departure": 23,
    "rate_night": 104
  },
  {
    "id": "vatikanstaat",
    "country": "Vatikanstaat",
    "city": "",
    "label": "Vatikanstaat",
    "rate_24h": 48,
    "rate_arrival_departure": 32,
    "rate_night": 150
  },
  {
    "id": "venezuela",
    "country": "Venezuela",
    "city": "",
    "label": "Venezuela",
    "rate_24h": 45,
    "rate_arrival_departure": 30,
    "rate_night": 127
  },
  {
    "id": "vereinigte_arabische_emirate",
    "country": "Vereinigte Arabische Emirate",
    "city": "",
    "label": "Vereinigte Arabische Emirate",
    "rate_24h": 65,
    "rate_arrival_departure": 44,
    "rate_night": 156
  },
  {
    "id": "vereinigte_staaten_von_amerika_(usa)_-_atlanta",
    "country": "Vereinigte Staaten von Amerika (USA)",
    "city": "Atlanta",
    "label": "Vereinigte Staaten von Amerika (USA) – Atlanta",
    "rate_24h": 77,
    "rate_arrival_departure": 52,
    "rate_night": 182
  },
  {
    "id": "vereinigte_staaten_von_amerika_(usa)_-_boston",
    "country": "Vereinigte Staaten von Amerika (USA)",
    "city": "Boston",
    "label": "Vereinigte Staaten von Amerika (USA) – Boston",
    "rate_24h": 63,
    "rate_arrival_departure": 42,
    "rate_night": 333
  },
  {
    "id": "vereinigte_staaten_von_amerika_(usa)_-_chicago",
    "country": "Vereinigte Staaten von Amerika (USA)",
    "city": "Chicago",
    "label": "Vereinigte Staaten von Amerika (USA) – Chicago",
    "rate_24h": 65,
    "rate_arrival_departure": 44,
    "rate_night": 233
  },
  {
    "id": "vereinigte_staaten_von_amerika_(usa)_-_houston",
    "country": "Vereinigte Staaten von Amerika (USA)",
    "city": "Houston",
    "label": "Vereinigte Staaten von Amerika (USA) – Houston",
    "rate_24h": 62,
    "rate_arrival_departure": 41,
    "rate_night": 204
  },
  {
    "id": "vereinigte_staaten_von_amerika_(usa)_-_los_angeles",
    "country": "Vereinigte Staaten von Amerika (USA)",
    "city": "Los Angeles",
    "label": "Vereinigte Staaten von Amerika (USA) – Los Angeles",
    "rate_24h": 64,
    "rate_arrival_departure": 43,
    "rate_night": 262
  },
  {
    "id": "vereinigte_staaten_von_amerika_(usa)_-_miami",
    "country": "Vereinigte Staaten von Amerika (USA)",
    "city": "Miami",
    "label": "Vereinigte Staaten von Amerika (USA) – Miami",
    "rate_24h": 65,
    "rate_arrival_departure": 44,
    "rate_night": 256
  },
  {
    "id": "vereinigte_staaten_von_amerika_(usa)_-_new_york_city",
    "country": "Vereinigte Staaten von Amerika (USA)",
    "city": "New York City",
    "label": "Vereinigte Staaten von Amerika (USA) – New York City",
    "rate_24h": 66,
    "rate_arrival_departure": 44,
    "rate_night": 308
  },
  {
    "id": "vereinigte_staaten_von_amerika_(usa)_-_san_francisco",
    "country": "Vereinigte Staaten von Amerika (USA)",
    "city": "San Francisco",
    "label": "Vereinigte Staaten von Amerika (USA) – San Francisco",
    "rate_24h": 59,
    "rate_arrival_departure": 40,
    "rate_night": 327
  },
  {
    "id": "vereinigte_staaten_von_amerika_(usa)_-_washington,_d_c",
    "country": "Vereinigte Staaten von Amerika (USA)",
    "city": "Washington, D. C.",
    "label": "Vereinigte Staaten von Amerika (USA) – Washington, D. C.",
    "rate_24h": 66,
    "rate_arrival_departure": 44,
    "rate_night": 203
  },
  {
    "id": "vereinigte_staaten_von_amerika_(usa)_-_usa_im_uebrigen",
    "country": "Vereinigte Staaten von Amerika (USA)",
    "city": "USA im Übrigen",
    "label": "Vereinigte Staaten von Amerika (USA) – USA im Übrigen",
    "rate_24h": 59,
    "rate_arrival_departure": 40,
    "rate_night": 182
  },
  {
    "id": "vereinigtes_koenigreich_von_grossbritannien_und_nordirland_-_london",
    "country": "Vereinigtes Königreich von Großbritannien und Nordirland",
    "city": "London",
    "label": "Vereinigtes Königreich von Großbritannien und Nordirland – London",
    "rate_24h": 66,
    "rate_arrival_departure": 44,
    "rate_night": 163
  },
  {
    "id": "vereinigtes_koenigreich_von_grossbritannien_und_nordirland_-_uk_im_uebrigen",
    "country": "Vereinigtes Königreich von Großbritannien und Nordirland",
    "city": "UK im Übrigen",
    "label": "Vereinigtes Königreich von Großbritannien und Nordirland – UK im Übrigen",
    "rate_24h": 52,
    "rate_arrival_departure": 35,
    "rate_night": 99
  },
  {
    "id": "vietnam",
    "country": "Vietnam",
    "city": "",
    "label": "Vietnam",
    "rate_24h": 41,
    "rate_arrival_departure": 28,
    "rate_night": 86
  },
  {
    "id": "weissrussland",
    "country": "Weißrussland",
    "city": "",
    "label": "Weißrussland",
    "rate_24h": 20,
    "rate_arrival_departure": 13,
    "rate_night": 98
  },
  {
    "id": "zentralafrikanische_republik",
    "country": "Zentralafrikanische Republik",
    "city": "",
    "label": "Zentralafrikanische Republik",
    "rate_24h": 53,
    "rate_arrival_departure": 36,
    "rate_night": 210
  },
  {
    "id": "zypern",
    "country": "Zypern",
    "city": "",
    "label": "Zypern",
    "rate_24h": 42,
    "rate_arrival_departure": 28,
    "rate_night": 125
  }
];

// Hilfsfunktion: Effektive Sätze (inkl. Benutzermodifikationen) abrufen
function getEffectiveBmfRates() {
  let customOverrides = {};
  try {
    if (typeof globalSettings !== "undefined" && globalSettings.foreign_rates_custom_json) {
      customOverrides = typeof globalSettings.foreign_rates_custom_json === "string" 
        ? JSON.parse(globalSettings.foreign_rates_custom_json) 
        : globalSettings.foreign_rates_custom_json;
    } else if (typeof localStorage !== "undefined") {
      const local = localStorage.getItem("cfg_foreign_rates_custom");
      if (local) customOverrides = JSON.parse(local);
    }
  } catch (e) {
    console.warn("Fehler beim Laden von custom foreign rates:", e);
  }

  return BMF_FOREIGN_RATES_2024.map(entry => {
    let finalEntry = entry;
    if (customOverrides && customOverrides[entry.id]) {
      finalEntry = { ...entry, ...customOverrides[entry.id], is_custom_modified: true };
    }
    return {
      ...finalEntry,
      rate_8h: finalEntry.rate_arrival_departure !== undefined ? finalEntry.rate_arrival_departure : (finalEntry.rate_8h || 0),
      rate_hotel: finalEntry.rate_night !== undefined ? finalEntry.rate_night : (finalEntry.rate_hotel || 0)
    };
  });
}

function findBmfRateById(id) {
  if (!id) return null;
  const all = getEffectiveBmfRates();
  const cleanId = String(id).toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  let found = all.find(r => r.id === id || r.id === cleanId);
  if (found) return found;
  
  // Try matching by country / label
  const lowQuery = String(id).toLowerCase().trim();
  found = all.find(r => r.label.toLowerCase() === lowQuery || r.country.toLowerCase() === lowQuery);
  if (found) return found;

  // Partial match
  found = all.find(r => lowQuery.includes(r.country.toLowerCase()) && (!r.city || lowQuery.includes(r.city.toLowerCase())));
  return found || null;
}

function searchBmfRates(query) {
  const all = getEffectiveBmfRates();
  if (!query) return all.slice(0, 30);
  const q = query.toLowerCase().trim();
  return all.filter(r => 
    r.label.toLowerCase().includes(q) || 
    r.country.toLowerCase().includes(q) || 
    (r.city && r.city.toLowerCase().includes(q))
  );
}

// BMF-Kürzungssätze gem. § 9 Abs. 4a Satz 8 EStG (immer bezogen auf den vollen 24h-Satz des Ortes!)
function getBmfMealDeduction(rate24h, mealType) {
  const r = parseFloat(rate24h) || 0;
  if (mealType === "breakfast") return Math.round(r * 0.20 * 100) / 100; // 20%
  if (mealType === "lunch") return Math.round(r * 0.40 * 100) / 100;     // 40%
  if (mealType === "dinner") return Math.round(r * 0.40 * 100) / 100;    // 40%
  return 0;
}

// Berechnung: Auslandsreise - Ein Zielort (gemäß Haufe/NWB Excel 435240)
// Unterstützt sowohl Optionen-Objekt als auch positionale Parameter
function calculateForeignVmaSingleLocation(rateEntryOrOpts, startDateStr, startTimeStr, endDateStr, endTimeStr, mealsByDay = {}) {
  let rateEntry = rateEntryOrOpts;
  let sDateStr = startDateStr;
  let sTimeStr = startTimeStr;
  let eDateStr = endDateStr;
  let eTimeStr = endTimeStr;
  let meals = mealsByDay;

  if (rateEntryOrOpts && typeof rateEntryOrOpts === "object" && (rateEntryOrOpts.countryId || rateEntryOrOpts.startDateStr || rateEntryOrOpts.startDate)) {
    const opts = rateEntryOrOpts;
    rateEntry = opts.rateEntry || findBmfRateById(opts.countryId || opts.id || opts.country);
    sDateStr = opts.startDateStr || opts.startDate || opts.tripStartDate;
    eDateStr = opts.endDateStr || opts.endDate || opts.returnDate || sDateStr;
    sTimeStr = opts.depTime || opts.departureTime || opts.startTimeStr || "08:00";
    eTimeStr = opts.arrTime || opts.arrivalTime || opts.endTimeStr || "19:30";
    meals = opts.mealDeductions || opts.mealsByDay || opts.meals || {};
  } else if (typeof rateEntry === "string") {
    rateEntry = findBmfRateById(rateEntry);
  }

  if (!rateEntry && typeof rateEntryOrOpts === "string") {
    rateEntry = findBmfRateById(rateEntryOrOpts);
  }

  if (!rateEntry) {
    rateEntry = findBmfRateById("schweiz") || { id: "schweiz", label: "Schweiz", country: "Schweiz", city: "", rate_24h: 64, rate_arrival_departure: 43, rate_night: 180 };
  }

  if (!sDateStr) {
    return { totalDays: 0, days: [], totalBase: 0, totalDeduction: 0, totalVma: 0, totalBaseVma: 0, totalDeductions: 0, totalVmaNet: 0 };
  }

  const sParts = sDateStr.split("-").map(Number);
  const eParts = (eDateStr || sDateStr).split("-").map(Number);
  const sDate = new Date(sParts[0], sParts[1] - 1, sParts[2], 12, 0, 0);
  const eDate = new Date(eParts[0], eParts[1] - 1, eParts[2], 12, 0, 0);
  
  const totalDays = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const rate24h = parseFloat(rateEntry.rate_24h) || 0;
  const rateArrDep = parseFloat(rateEntry.rate_arrival_departure || rateEntry.rate_8h) || 0;

  const days = [];
  let totalBaseVma = 0;
  let totalDeductions = 0;

  if (totalDays === 1) {
    const dep = sTimeStr || "08:00";
    const arr = eTimeStr || "19:30";
    const [dh, dm] = dep.split(":").map(Number);
    const [ah, am] = arr.split(":").map(Number);
    const hours = (ah + am / 60) - (dh + dm / 60);

    const qualifies = hours > 8;
    const baseRate = qualifies ? rateArrDep : 0;
    const dayMeals = meals[1] || meals[sDateStr] || {};
    let deduction = 0;
    if (qualifies) {
      if (dayMeals.breakfast) deduction += getBmfMealDeduction(rate24h, "breakfast");
      if (dayMeals.lunch) deduction += getBmfMealDeduction(rate24h, "lunch");
      if (dayMeals.dinner) deduction += getBmfMealDeduction(rate24h, "dinner");
      deduction = Math.round(Math.min(baseRate, deduction) * 100) / 100;
    }
    const netRate = Math.round(Math.max(0, baseRate - deduction) * 100) / 100;
    const dateFormatted = sDate.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });

    days.push({
      dayNum: 1,
      dayIndex: 1,
      dateRaw: sDateStr,
      dateFormatted,
      type: "Eintägige Auslandsreise",
      timeInfo: `${dep} - ${arr} Uhr (${hours.toFixed(1)} h)`,
      hours: Math.max(0, Math.round(hours * 10) / 10),
      location: rateEntry.label,
      country: rateEntry.country,
      city: rateEntry.city || "",
      baseRate,
      deduction,
      deductionTotal: deduction,
      hasBreakfast: !!dayMeals.breakfast,
      hasLunch: !!dayMeals.lunch,
      hasDinner: !!dayMeals.dinner,
      netRate,
      meals: dayMeals,
      lawNote: qualifies ? `>8h Abwesenheit gem. BMF-Satz ${rateEntry.label}` : "Unter 8h Abwesenheit (0,00 € gem. § 9 Abs. 4a EStG)"
    });

    totalBaseVma = baseRate;
    totalDeductions = deduction;
  } else {
    for (let i = 1; i <= totalDays; i++) {
      const curDate = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate() + (i - 1), 12, 0, 0);
      const curYear = curDate.getFullYear();
      const curMonth = String(curDate.getMonth() + 1).padStart(2, "0");
      const curDay = String(curDate.getDate()).padStart(2, "0");
      const curDateStr = `${curYear}-${curMonth}-${curDay}`;
      const dateFormatted = curDate.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
      const isFirst = (i === 1);
      const isLast = (i === totalDays);
      const isFullDay = (!isFirst && !isLast);

      const baseRate = isFullDay ? rate24h : rateArrDep;
      const dayMeals = meals[i] || meals[curDateStr] || {};
      let deduction = 0;

      if (dayMeals.breakfast) deduction += getBmfMealDeduction(rate24h, "breakfast");
      if (dayMeals.lunch) deduction += getBmfMealDeduction(rate24h, "lunch");
      if (dayMeals.dinner) deduction += getBmfMealDeduction(rate24h, "dinner");
      deduction = Math.round(Math.min(baseRate, deduction) * 100) / 100;

      const netRate = Math.round(Math.max(0, baseRate - deduction) * 100) / 100;
      const dayType = isFirst ? "Anreisetag" : (isLast ? "Abreisetag" : "Zwischentag 24h");
      const timeInfo = isFirst ? `Abfahrt ${sTimeStr || '08:00'} Uhr` : (isLast ? `Rückkehr ${eTimeStr || '19:30'} Uhr` : "Ganztägig (24 h)");

      days.push({
        dayNum: i,
        dayIndex: i,
        dateRaw: curDateStr,
        dateFormatted,
        type: dayType,
        timeInfo,
        hours: isFullDay ? 24 : (isFirst ? "Anreise" : "Abreise"),
        location: rateEntry.label,
        country: rateEntry.country,
        city: rateEntry.city || "",
        baseRate,
        deduction,
        deductionTotal: deduction,
        hasBreakfast: !!dayMeals.breakfast,
        hasLunch: !!dayMeals.lunch,
        hasDinner: !!dayMeals.dinner,
        netRate,
        meals: dayMeals,
        lawNote: isFullDay ? `24h Auslandspauschale gem. BMF (${rateEntry.label})` : `An-/Abreisetag gem. BMF (${rateEntry.label})`
      });

      totalBaseVma += baseRate;
      totalDeductions += deduction;
    }
  }

  const roundedBase = Math.round(totalBaseVma * 100) / 100;
  const roundedDed = Math.round(totalDeductions * 100) / 100;
  const roundedNet = Math.round(Math.max(0, roundedBase - roundedDed) * 100) / 100;

  return {
    totalDays,
    days,
    rateEntry,
    totalBase: roundedBase,
    totalDeduction: roundedDed,
    totalVma: roundedNet,
    totalBaseVma: roundedBase,
    totalDeductions: roundedDed,
    totalVmaNet: roundedNet
  };
}

// Berechnung: Auslandsreise - Rundreise / Mehrere Orte (gemäß Haufe/NWB Excel 435241)
// Unterstützt sowohl Optionen-Objekt als auch positionale Parameter
function calculateForeignVmaMultiLocation(legsOrOpts = [], mealsByDateParam = {}) {
  let rawLegs = [];
  let mealsByDate = mealsByDateParam;
  let tStartDate = "";
  let tEndDate = "";
  let depTime = "07:30";
  let arrTime = "19:30";

  if (legsOrOpts && typeof legsOrOpts === "object" && !Array.isArray(legsOrOpts)) {
    const opts = legsOrOpts;
    rawLegs = opts.legs || [];
    mealsByDate = opts.mealDeductions || opts.mealsByDate || opts.meals || {};
    tStartDate = opts.tripStartDate || opts.startDateStr || "";
    tEndDate = opts.tripEndDate || opts.endDateStr || "";
    depTime = opts.depTime || opts.departureTime || "07:30";
    arrTime = opts.arrTime || opts.arrivalTime || "19:30";
  } else {
    rawLegs = Array.isArray(legsOrOpts) ? legsOrOpts : [];
  }

  if (!rawLegs || rawLegs.length === 0) {
    return { totalDays: 0, totalCalendarDays: 0, days: [], totalBase: 0, totalDeduction: 0, totalVma: 0, totalBaseVma: 0, totalDeductions: 0, totalVmaNet: 0 };
  }

  const normalizedLegs = rawLegs.map((l, idx) => {
    const dateLeg = l.dateLeg || l.date_leg || l.startDate || l.date || tStartDate;
    return {
      order: l.legOrder || l.leg_order || (idx + 1),
      dateLeg,
      startDate: dateLeg,
      startTime: l.startTime || l.start_time || "08:00",
      startLocation: l.startLocation || l.start_location || "",
      destinationLocation: l.destinationLocation || l.destination_location || l.destination || "",
      countryId: l.countryId || l.country_id || l.country || "",
      destinationCountry: l.destinationCountry || l.country || "",
      isFlightLayover: !!(l.isFlightLayover || l.is_flight_layover || l.transportType === "Flight" && l.layoverHours > 12)
    };
  });

  const sortedLegs = [...normalizedLegs].sort((a, b) => (a.startDate + "T" + (a.startTime || "00:00")).localeCompare(b.startDate + "T" + (b.startTime || "00:00")));
  const firstLeg = sortedLegs[0];
  const lastLeg = sortedLegs[sortedLegs.length - 1];

  const sDateStr = tStartDate || firstLeg.startDate;
  const eDateStr = tEndDate || lastLeg.startDate;
  const sParts = sDateStr.split("-").map(Number);
  const eParts = (eDateStr || sDateStr).split("-").map(Number);
  const sDate = new Date(sParts[0], sParts[1] - 1, sParts[2], 12, 0, 0);
  const eDate = new Date(eParts[0], eParts[1] - 1, eParts[2], 12, 0, 0);
  const totalCalendarDays = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  // Letzten ausländischen Tätigkeitsort finden (für Rückreisetag)
  let lastForeignRate = null;
  for (let l = sortedLegs.length - 1; l >= 0; l--) {
    const leg = sortedLegs[l];
    const r = findBmfRateById(leg.countryId || leg.destinationLocation);
    if (r && r.country.toLowerCase() !== "deutschland") {
      lastForeignRate = r;
      break;
    }
  }

  const days = [];
  let totalBaseVma = 0;
  let totalDeductions = 0;

  for (let i = 1; i <= totalCalendarDays; i++) {
    const curDate = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate() + (i - 1), 12, 0, 0);
    const curYear = curDate.getFullYear();
    const curMonth = String(curDate.getMonth() + 1).padStart(2, "0");
    const curDay = String(curDate.getDate()).padStart(2, "0");
    const curDateStr = `${curYear}-${curMonth}-${curDay}`;
    const dateFormatted = curDate.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
    const isFirst = (i === 1);
    const isLast = (i === totalCalendarDays);
    const isFullDay = (!isFirst && !isLast);

    const activeLegs = sortedLegs.filter(l => l.startDate <= curDateStr);
    
    let targetRate = null;
    let locationLabel = "Ausland";

    if (isLast) {
      // Rückreisetag: Satz des letzten ausländischen Tätigkeitsorts (BMF R 9.6 Abs. 2 LStR)
      targetRate = lastForeignRate || findBmfRateById("oesterreich");
      locationLabel = (targetRate ? targetRate.label : "Letzter Auslandsort") + " (Rückreisetag)";
    } else {
      if (activeLegs.length > 0) {
        const latestLeg = activeLegs[activeLegs.length - 1];
        if (latestLeg.isFlightLayover) {
          targetRate = findBmfRateById("oesterreich") || { rate_24h: 50, rate_arrival_departure: 33, label: "Flug-Zwischentag (BMF-Satz Österreich)" };
          locationLabel = "Flugtag / Zwischenflug (Satz Österreich)";
        } else {
          targetRate = findBmfRateById(latestLeg.countryId || latestLeg.destinationLocation);
          locationLabel = targetRate ? targetRate.label : latestLeg.destinationLocation;
        }
      } else {
        targetRate = lastForeignRate;
        locationLabel = targetRate ? targetRate.label : "Ausland";
      }
    }

    if (!targetRate) {
      targetRate = findBmfRateById("luxemburg") || { rate_24h: 63, rate_arrival_departure: 42, label: "Luxemburg (BMF-Auffangsatz)" };
    }

    const rate24h = parseFloat(targetRate.rate_24h) || 0;
    const rateArrDep = parseFloat(targetRate.rate_arrival_departure || targetRate.rate_8h) || 0;
    const baseRate = isFullDay ? rate24h : rateArrDep;

    const dayMeals = mealsByDate[i] || mealsByDate[curDateStr] || {};
    let deduction = 0;
    if (dayMeals.breakfast) deduction += getBmfMealDeduction(rate24h, "breakfast");
    if (dayMeals.lunch) deduction += getBmfMealDeduction(rate24h, "lunch");
    if (dayMeals.dinner) deduction += getBmfMealDeduction(rate24h, "dinner");
    deduction = Math.round(Math.min(baseRate, deduction) * 100) / 100;

    const netRate = Math.round(Math.max(0, baseRate - deduction) * 100) / 100;
    const dayType = isFirst ? "Anreisetag" : (isLast ? "Abreisetag" : "Zwischentag 24h");
    const timeInfo = isFirst ? `Abfahrt ${depTime}` : (isLast ? `Rückkehr ${arrTime}` : "Ganztägig (24 h)");

    days.push({
      dayNum: i,
      dayIndex: i,
      dateRaw: curDateStr,
      dateFormatted,
      type: dayType,
      timeInfo,
      hours: isFullDay ? 24 : (isFirst ? "Anreise" : "Abreise"),
      location: locationLabel,
      locationLabel,
      countryId: targetRate.id,
      baseRate,
      deduction,
      deductionTotal: deduction,
      hasBreakfast: !!dayMeals.breakfast,
      hasLunch: !!dayMeals.lunch,
      hasDinner: !!dayMeals.dinner,
      netRate,
      meals: dayMeals,
      lawNote: isLast 
        ? `Rückreisetag: Satz des letzten Tätigkeitsorts gem. BMF (${targetRate.label})` 
        : (isFullDay ? `24:00 Uhr Aufenthaltsort gem. BMF (${targetRate.label})` : `Anreisetag (${targetRate.label})`)
    });

    totalBaseVma += baseRate;
    totalDeductions += deduction;
  }

  const roundedBase = Math.round(totalBaseVma * 100) / 100;
  const roundedDed = Math.round(totalDeductions * 100) / 100;
  const roundedNet = Math.round(Math.max(0, roundedBase - roundedDed) * 100) / 100;

  return {
    totalDays: totalCalendarDays,
    totalCalendarDays,
    days,
    totalBase: roundedBase,
    totalDeduction: roundedDed,
    totalVma: roundedNet,
    totalBaseVma: roundedBase,
    totalDeductions: roundedDed,
    totalVmaNet: roundedNet
  };
}


// =========================================================================================
// WELTWEITES WÄHRUNGSVERZEICHNIS (ISO 4217) & BMF-LÄNDER-MAPPING FÜR AUSLANDSREISEN
// =========================================================================================

const BMF_COUNTRY_CURRENCY_MAP = {
  "Afghanistan": "AFN",
  "Ägypten": "EGP",
  "Albanien": "ALL",
  "Algerien": "DZD",
  "Andorra": "EUR",
  "Angola": "AOA",
  "Äquatorialguinea": "XAF",
  "Argentinien": "ARS",
  "Armenien": "AMD",
  "Aserbaidschan": "AZN",
  "Äthiopien": "ETB",
  "Australien": "AUD",
  "Bahamas": "BSD",
  "Bahrain": "BHD",
  "Bangladesch": "BDT",
  "Barbados": "BBD",
  "Belarus": "BYN",
  "Belgien": "EUR",
  "Benin": "XOF",
  "Bermuda": "BMD",
  "Bhutan": "BTN",
  "Bolivien": "BOB",
  "Bosnien und Herzegowina": "BAM",
  "Botsuana": "BWP",
  "Brasilien": "BRL",
  "Brunei": "BND",
  "Bulgarien": "BGN",
  "Burkina Faso": "XOF",
  "Burundi": "BIF",
  "Chile": "CLP",
  "China": "CNY",
  "Cookinseln": "NZD",
  "Costa Rica": "CRC",
  "Côte d’Ivoire": "XOF",
  "Dänemark": "DKK",
  "Deutschland": "EUR",
  "Dominica": "XCD",
  "Dominikanische Republik": "DOP",
  "Dschibuti": "DJF",
  "Ecuador": "USD",
  "El Salvador": "USD",
  "Eritrea": "ERN",
  "Estland": "EUR",
  "Eswatini": "SZL",
  "Fidschi": "FJD",
  "Finnland": "EUR",
  "Frankreich": "EUR",
  "Gabun": "XAF",
  "Gambia": "GMD",
  "Georgien": "GEL",
  "Ghana": "GHS",
  "Grenada": "XCD",
  "Griechenland": "EUR",
  "Guatemala": "GTQ",
  "Guinea": "GNF",
  "Guinea-Bissau": "XOF",
  "Guyana": "GYD",
  "Haiti": "HTG",
  "Honduras": "HNL",
  "Hongkong": "HKD",
  "Indien": "INR",
  "Indonesien": "IDR",
  "Irak": "IQD",
  "Iran": "IRR",
  "Irland": "EUR",
  "Island": "ISK",
  "Israel": "ILS",
  "Italien": "EUR",
  "Jamaika": "JMD",
  "Japan": "JPY",
  "Jemen": "YER",
  "Jordanien": "JOD",
  "Kambodscha": "KHR",
  "Kamerun": "XAF",
  "Kanada": "CAD",
  "Kap Verde": "CVE",
  "Kasachstan": "KZT",
  "Katar": "QAR",
  "Kenia": "KES",
  "Kirgisistan": "KGS",
  "Kiribati": "AUD",
  "Kolumbien": "COP",
  "Komoren": "KMF",
  "Kongo": "CDF",
  "Kongo, Republik": "XAF",
  "Kongo, Demokratische Republik": "CDF",
  "Korea, Demokratische Volksrepublik": "KPW",
  "Korea, Republik": "KRW",
  "Kosovo": "EUR",
  "Kroatien": "EUR",
  "Kuba": "CUP",
  "Kuwait": "KWD",
  "Laos": "LAK",
  "Lesotho": "LSL",
  "Lettland": "EUR",
  "Libanon": "LBP",
  "Liberia": "LRD",
  "Libyen": "LYD",
  "Liechtenstein": "CHF",
  "Litauen": "EUR",
  "Luxemburg": "EUR",
  "Madagaskar": "MGA",
  "Malawi": "MWK",
  "Malaysia": "MYR",
  "Malediven": "MVR",
  "Mali": "XOF",
  "Malta": "EUR",
  "Marokko": "MAD",
  "Marshall Inseln": "USD",
  "Marshallinseln": "USD",
  "Mauretanien": "MRU",
  "Mauritius": "MUR",
  "Mexiko": "MXN",
  "Mikronesien": "USD",
  "Moldau, Republik": "MDL",
  "Moldau": "MDL",
  "Monaco": "EUR",
  "Mongolei": "MNT",
  "Montenegro": "EUR",
  "Mosambik": "MZN",
  "Myanmar": "MMK",
  "Namibia": "NAD",
  "Nauru": "AUD",
  "Nepal": "NPR",
  "Neuseeland": "NZD",
  "Nicaragua": "NIO",
  "Niederlande": "EUR",
  "Niger": "XOF",
  "Nigeria": "NGN",
  "Nordmazedonien": "MKD",
  "Norwegen": "NOK",
  "Oman": "OMR",
  "Österreich": "EUR",
  "Pakistan": "PKR",
  "Palästinensische Gebiete": "ILS",
  "Palau": "USD",
  "Panama": "PAB",
  "Papua-Neuguinea": "PGK",
  "Paraguay": "PYG",
  "Peru": "PEN",
  "Philippinen": "PHP",
  "Polen": "PLN",
  "Portugal": "EUR",
  "Ruanda": "RWF",
  "Rumänien": "RON",
  "Russische Föderation": "RUB",
  "Russland": "RUB",
  "Salomonen": "SBD",
  "Sambia": "ZMW",
  "Samoa": "WST",
  "San Marino": "EUR",
  "São Tomé und Príncipe": "STN",
  "São Tomé – Príncipe": "STN",
  "Saudi-Arabien": "SAR",
  "Schweden": "SEK",
  "Schweiz": "CHF",
  "Senegal": "XOF",
  "Serbien": "RSD",
  "Seychellen": "SCR",
  "Sierra Leone": "SLE",
  "Simbabwe": "ZWL",
  "Singapur": "SGD",
  "Slowakei": "EUR",
  "Slowakische Republik": "EUR",
  "Slowenien": "EUR",
  "Somalia": "SOS",
  "Spanien": "EUR",
  "Sri Lanka": "LKR",
  "Südafrika": "ZAR",
  "Sudan": "SDG",
  "Südsudan": "SSP",
  "Suriname": "SRD",
  "Syrien": "SYP",
  "Tadschikistan": "TJS",
  "Taiwan": "TWD",
  "Tansania": "TZS",
  "Thailand": "THB",
  "Timor-Leste": "USD",
  "Togo": "XOF",
  "Tonga": "TOP",
  "Trinidad und Tobago": "TTD",
  "Tschad": "XAF",
  "Tschechische Republik": "CZK",
  "Tunesien": "TND",
  "Türkei": "TRY",
  "Turkmenistan": "TMT",
  "Tuvalu": "AUD",
  "Uganda": "UGX",
  "Ukraine": "UAH",
  "Ungarn": "HUF",
  "Uruguay": "UYU",
  "Usbekistan": "UZS",
  "Vanuatu": "VUV",
  "Vatikanstadt": "EUR",
  "Vatikanstaat": "EUR",
  "Venezuela": "VES",
  "Vereinigte Arabische Emirate": "AED",
  "Vereinigte Staaten": "USD",
  "USA": "USD",
  "Vereinigtes Königreich": "GBP",
  "Großbritannien": "GBP",
  "Vietnam": "VND",
  "Zentralafrikanische Republik": "XAF",
  "Zypern": "EUR"
};

const WORLD_CURRENCIES = [
  // Haupt- und Nachbarwährungen Europas
  { code: "EUR", symbol: "€", name: "Euro (Deutschland / Eurozone)" },
  { code: "CHF", symbol: "CHF", name: "Schweizer Franken (Schweiz / Liechtenstein)" },
  { code: "USD", symbol: "$", name: "US-Dollar (USA / International)" },
  { code: "GBP", symbol: "£", name: "Britisches Pfund (Großbritannien)" },
  { code: "PLN", symbol: "zł", name: "Polnischer Złoty (Polen)" },
  { code: "CZK", symbol: "Kč", name: "Tschechische Krone (Tschechien)" },
  { code: "DKK", symbol: "kr", name: "Dänische Krone (Dänemark)" },
  { code: "SEK", symbol: "kr", name: "Schwedische Krone (Schweden)" },
  { code: "NOK", symbol: "kr", name: "Norwegische Krone (Norwegen)" },
  { code: "HUF", symbol: "Ft", name: "Ungarischer Forint (Ungarn)" },
  { code: "RON", symbol: "lei", name: "Rumänischer Leu (Rumänien)" },
  { code: "BGN", symbol: "лв", name: "Bulgarischer Lew (Bulgarien)" },
  { code: "ISK", symbol: "kr", name: "Isländische Krone (Island)" },
  { code: "TRY", symbol: "₺", name: "Türkische Lira (Türkei)" },
  { code: "RSD", symbol: "din.", name: "Serbischer Dinar (Serbien)" },
  { code: "BAM", symbol: "KM", name: "Konvertible Mark (Bosnien und Herzegowina)" },
  { code: "ALL", symbol: "Lek", name: "Albanischer Lek (Albanien)" },
  { code: "MKD", symbol: "den", name: "Mazedonischer Denar (Nordmazedonien)" },
  { code: "MDL", symbol: "L", name: "Moldauischer Leu (Moldau)" },
  { code: "UAH", symbol: "₴", name: "Ukrainische Hrywnja (Ukraine)" },
  { code: "GEL", symbol: "₾", name: "Georgischer Lari (Georgien)" },
  { code: "AZN", symbol: "₼", name: "Aserbaidschan-Manat (Aserbaidschan)" },
  { code: "KZT", symbol: "₸", name: "Kasachischer Tenge (Kasachstan)" },
  { code: "UZS", symbol: "soʻm", name: "Usbekischer Soʻm (Usbekistan)" },

  // Amerika & Übersee
  { code: "CAD", symbol: "CA$", name: "Kanadischer Dollar (Kanada)" },
  { code: "AUD", symbol: "AU$", name: "Australischer Dollar (Australien)" },
  { code: "NZD", symbol: "NZ$", name: "Neuseeland-Dollar (Neuseeland)" },
  { code: "BRL", symbol: "R$", name: "Brasilianischer Real (Brasilien)" },
  { code: "MXN", symbol: "Mex$", name: "Mexikanischer Peso (Mexiko)" },
  { code: "CLP", symbol: "CLP$", name: "Chilenischer Peso (Chile)" },
  { code: "COP", symbol: "COL$", name: "Kolumbianischer Peso (Kolumbien)" },
  { code: "PEN", symbol: "S/", name: "Peruanischer Sol (Peru)" },
  { code: "ARS", symbol: "ARS$", name: "Argentinischer Peso (Argentinien)" },

  // Asien & Naher Osten
  { code: "JPY", symbol: "¥", name: "Japanischer Yen (Japan)" },
  { code: "CNY", symbol: "¥", name: "Chinesischer Yuan (China)" },
  { code: "HKD", symbol: "HK$", name: "Hongkong-Dollar (Hongkong)" },
  { code: "SGD", symbol: "SG$", name: "Singapur-Dollar (Singapur)" },
  { code: "INR", symbol: "₹", name: "Indische Rupie (Indien)" },
  { code: "KRW", symbol: "₩", name: "Südkoreanischer Won (Südkorea)" },
  { code: "TWD", symbol: "NT$", name: "Neuer Taiwan-Dollar (Taiwan)" },
  { code: "THB", symbol: "฿", name: "Thailändischer Baht (Thailand)" },
  { code: "MYR", symbol: "RM", name: "Malaysischer Ringgit (Malaysia)" },
  { code: "IDR", symbol: "Rp", name: "Indonesische Rupiah (Indonesien)" },
  { code: "PHP", symbol: "₱", name: "Philippinischer Peso (Philippinen)" },
  { code: "VND", symbol: "₫", name: "Vietnamesischer Dong (Vietnam)" },
  { code: "AED", symbol: "AED", name: "VAE-Dirham (Vereinigte Arabische Emirate)" },
  { code: "SAR", symbol: "SAR", name: "Saudi-Riyal (Saudi-Arabien)" },
  { code: "QAR", symbol: "QAR", name: "Katar-Riyal (Katar)" },
  { code: "KWD", symbol: "KWD", name: "Kuwait-Dinar (Kuwait)" },
  { code: "BHD", symbol: "BHD", name: "Bahrain-Dinar (Bahrain)" },
  { code: "OMR", symbol: "OMR", name: "Omanischer Rial (Oman)" },
  { code: "ILS", symbol: "₪", name: "Neuer Israelischer Schekel (Israel)" },
  { code: "JOD", symbol: "JOD", name: "Jordanischer Dinar (Jordanien)" },

  // Afrika
  { code: "ZAR", symbol: "R", name: "Südafrikanischer Rand (Südafrika)" },
  { code: "EGP", symbol: "E£", name: "Ägyptisches Pfund (Ägypten)" },
  { code: "MAD", symbol: "MAD", name: "Marokkanischer Dirham (Marokko)" },
  { code: "TND", symbol: "DT", name: "Tunesischer Dinar (Tunesien)" },
  { code: "XOF", symbol: "CFA", name: "CFA-Franc BCEAO (Westafrika)" },
  { code: "XAF", symbol: "FCFA", name: "CFA-Franc BEAC (Zentralafrika)" },
  { code: "KES", symbol: "KSh", name: "Kenia-Schilling (Kenia)" },
  { code: "TZS", symbol: "TSh", name: "Tansania-Schilling (Tansania)" },
  { code: "UGX", symbol: "USh", name: "Uganda-Schilling (Uganda)" },
  { code: "GHS", symbol: "GH₵", name: "Ghanaischer Cedi (Ghana)" },
  { code: "NGN", symbol: "₦", name: "Nigerianischer Naira (Nigeria)" },
  { code: "MUR", symbol: "Rs", name: "Mauritius-Rupie (Mauritius)" },
  { code: "SCR", symbol: "SR", name: "Seychellen-Rupie (Seychellen)" }
];

function getCurrencyForCountry(countryName) {
  if (!countryName) return "EUR";
  const trimmed = countryName.trim();
  if (BMF_COUNTRY_CURRENCY_MAP[trimmed]) return BMF_COUNTRY_CURRENCY_MAP[trimmed];
  const lower = trimmed.toLowerCase();
  for (const [k, v] of Object.entries(BMF_COUNTRY_CURRENCY_MAP)) {
    if (lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) {
      return v;
    }
  }
  return "EUR";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    BMF_FOREIGN_RATES_2024,
    BMF_COUNTRY_CURRENCY_MAP,
    WORLD_CURRENCIES,
    getCurrencyForCountry,
    getEffectiveBmfRates,
    findBmfRateById,
    searchBmfRates,
    getBmfMealDeduction,
    calculateForeignVmaSingleLocation,
    calculateForeignVmaMultiLocation
  };
}
