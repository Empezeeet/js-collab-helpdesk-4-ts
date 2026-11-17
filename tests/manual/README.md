# Testy ręczne — Helpdesk

Pakiet przygotowany na podstawie `instructions/01_BRIEF.md`, pomocniczo `02_TECH.md`, i odczytu aktualnego `src`. **Testy nie zostały wykonane.** Opisane wyniki są kryteriami do sprawdzenia, nie potwierdzeniem działania. Nie wymaga Node.js ani npm.

## Co jest w kodzie

- `src/index.html` uruchamia moduł `js/main.js`.
- `tickets.js` waliduje tablicę do 1000 rekordów: tekstowe, niepuste ID do 100 znaków; tytuł 3–80 znaków po przycięciu; priorytet `low/normal/high`; status `new/doing/testing/done`. ID muszą być unikalne po przycięciu spacji.
- `storage.js` używa klucza `tickets`. Zwykła edycja zmienia pamięć przed zapisem; import zmienia pamięć dopiero po udanym zapisie.
- `import.js` wspólnie obsługuje potwierdzenie, walidację, blokadę i odblokowanie w `finally` dla pliku oraz HTTP.
- Przycisk „Importuj tickets.json” wskazuje obecnie **`src/js/tickets.json`**, którego nie ma w repozytorium. To obserwacja z plików, nie wynik testu HTTP. Nie korzystaj ze ścieżki `src/data/tickets.json` ze starszego `PLAN.md`.
- Filtry i sortowanie pozostają aktywne w czasie importu; brief wymaga blokady edycji oraz kolejnych importów. Zmiana filtra nie może odblokować przycisków nowych wierszy.

## Przygotowanie stanowiska

1. Otwórz **cały katalog repozytorium** w VS Code. Uruchom `src/index.html` przez Live Server. Adres ma kończyć się `/src/index.html` i używać HTTP.
2. Korzystaj z osobnego profilu przeglądarki do testów. Dane w kluczu `tickets` będą zmieniane. Jeśli profil zawiera potrzebne zgłoszenia, skopiuj ich surową wartość z DevTools → Application → Local Storage przed rozpoczęciem.
3. Nie zmieniaj hosta ani portu pomiędzy krokami: inne origin oznacza inny localStorage. Otwórz jedną kartę aplikacji, DevTools → Console oraz Network.
4. Zaznacz wszystkie cztery filtry statusu, sortowanie ustaw na „Brak”.
5. Wybieraj pliki z `tests/manual/data` przez kontrolkę „Importuj plik JSON”. Pliki z numerami 04–07 i 09 są celowo błędne; 06 ma celowo niepoprawną składnię.
6. Przed **każdym niezależnym wariantem** wczytaj `01-baza.json`, potwierdź i upewnij się, że są cztery zgłoszenia #1–#4. Jeśli import bazowy nie działa, oznacz zależne próby jako BLOKADA, zamiast uznawać je za wykonane.

W konsoli aplikacji przygotuj skróty (po każdym odświeżeniu wklej ponownie):

```js
var qaImport = await import(new URL('./js/import.js', location.href).href);
var qaStorage = await import(new URL('./js/storage.js', location.href).href);
var qaDataUrl = name => new URL('../tests/manual/data/' + name, location.href).href;
var qaBeforeStorage = localStorage.getItem('tickets');
var qaBeforeMemory = JSON.stringify(qaStorage.getTickets());
```

To przygotowanie korzysta z faktycznych modułów aplikacji, bez kopii ich kodu. Dla prób HTTP katalog repozytorium musi być katalogiem głównym Live Server, żeby adres `/tests/manual/data/...` był dostępny.

Przed każdą próbą, która ma zachować listę, ponownie zapamiętaj stan:

```js
qaBeforeStorage = localStorage.getItem('tickets');
qaBeforeMemory = JSON.stringify(qaStorage.getTickets());
```

Po próbie odczytaj poniższe porównania i zapisz wynik; obydwa powinny być `true`, jeśli scenariusz wymaga braku zmian:

```js
localStorage.getItem('tickets') === qaBeforeStorage
JSON.stringify(qaStorage.getTickets()) === qaBeforeMemory
```

Porównaj również widoczne wiersze i licznik. Przed odświeżeniem zapisz obserwacje — odświeżenie usuwa stan istniejący wyłącznie w pamięci.

## Lista z „Do sprawdzenia” w briefie

### T01 — Odczyt po odświeżeniu

1. Wczytaj bazę. Dodaj „Test zapisu po odświeżeniu” z wysokim priorytetem; odśwież.
2. Sprawdź, czy dodane zgłoszenie zachowało tytuł, priorytet i status „Nowe”.
3. Zmień jego status na „W Testach”; odśwież i sprawdź status.
4. Usuń #2; odśwież i sprawdź brak #2.

**Oczekiwane:** po każdym kroku lista i zapis odpowiadają ostatniej zmianie; liczniki odpowiednio 5, 5, 4. Nie wracają usunięte zgłoszenia.

### T02 — Odmowa zapisu podczas zwykłej edycji

Wczytaj bazę, zapamiętaj stan, następnie w konsoli zasymuluj wyjątek zapisu:

```js
var qaOriginalSetItem = Storage.prototype.setItem;
Storage.prototype.setItem = function(key, value) {
  if (this === localStorage && key === 'tickets') {
    throw new DOMException('Symulowana odmowa zapisu', 'QuotaExceededError');
  }
  return qaOriginalSetItem.call(this, key, value);
};
```

1. Dodaj „Niezapisane zgłoszenie”.
2. Sprawdź ostrzeżenie o localStorage i danych wyłącznie w pamięci. Wiersz powinien być widoczny (5 zgłoszeń), ale surowy zapis powinien pozostać bez zmian.
3. Odśwież — niezapisany wiersz znika, zostaje baza (4 zgłoszenia).
4. Powtórz jako dwa osobne warianty z ponownie włączoną symulacją: zmiana statusu #1 oraz usunięcie #1. Zmiana ma być widoczna do odświeżenia, z ostrzeżeniem i niezmienionym zapisem; po odświeżeniu wraca baza.

**Sprzątanie:** odświeżenie usuwa podmianę metody. Bez odświeżenia przywróć ją poleceniem `Storage.prototype.setItem = qaOriginalSetItem`. Nie włączaj podmiany drugi raz bez wcześniejszego przywrócenia.

### T03 — Zły JSON w storage

1. Wczytaj bazę. W konsoli wpisz:

```js
localStorage.setItem('tickets', '{bad');
location.reload();
```

2. Oczekuj błędu uszkodzonego JSON-a, pustej listy i licznika 0/0.
3. Sprawdź `localStorage.getItem('tickets')`: nadal dokładnie `{bad` — aplikacja nie powinna sama go usuwać.
4. Dodaj „Naprawa po złym zapisie”. Sprawdź, że świadoma poprawna zmiana zastąpiła uszkodzony zapis. Odśwież: zostaje jedno zgłoszenie.

**Sprzątanie:** wczytaj bazę.

### T04 — Import pustej tablicy `[]`

1. Wczytaj bazę. Zaimportuj `03-pusta-lista.json` i potwierdź zastąpienie.
2. Oczekuj pustej listy, licznika 0/0 i komunikatu „Zaimportowano 0 zgłoszeń.”.
3. Sprawdź, że `localStorage.getItem('tickets')` zwraca tekst `[]`. Odśwież — lista nadal pusta.

**Ważne:** `[]` to prawidłowy import, nie błąd i nie plik bez treści.

### T05 — Duplikat identyfikatora

1. Wczytaj bazę, zapamiętaj stan. Zaimportuj `04-duplikat.json`, potwierdź.
2. Oczekuj błędu powtórzonego identyfikatora `201` w drugim rekordzie. Lista i zapis bez zmian, bez częściowego importu.
3. Powtórz z `09-duplikat-po-trim.json`: `601` i ` 601 ` także są duplikatem.
4. Po każdym błędzie wybierz poprawny plik, aby sprawdzić odblokowanie importu.

### T06 — Zły ostatni rekord

1. Wczytaj bazę i zapamiętaj stan. Zaimportuj `05-zly-ostatni-rekord.json`, potwierdź.
2. Oczekuj błędu statusu w rekordzie 3 (`closed` nie jest dozwolony).
3. Lista i zapis bez zmian. Żaden rekord #301–#303 nie może pojawić się na liście, również po odświeżeniu.

### T07 — HTTP 404

1. Wczytaj bazę, przygotuj skróty i zapamiętaj stan. W Network wyczyść historię.
2. Uruchom poniższy import i zaakceptuj potwierdzenie:

```js
await qaImport.importFromUrl(qaDataUrl('nie-istnieje-404.json'));
```

3. W Network sprawdź rzeczywisty status odpowiedzi. Oczekiwany jest 404, a komunikat aplikacji powinien zawierać `HTTP 404`.
4. Lista i zapis bez zmian; edycja i import ponownie dostępne.

Jeśli serwer zwraca HTML ze statusem 200, to **nie jest wykonany test 404**. Zanotuj blokadę konfiguracji serwera; HTML sprawdza T08. Dodatkowo odnotuj zachowanie przycisku „Importuj tickets.json” przy brakującym pliku docelowym.

### T08 — HTML zamiast JSON

1. Wczytaj bazę, zapamiętaj stan. W konsoli uruchom i potwierdź:

```js
await qaImport.importFromUrl(qaDataUrl('08-html-zamiast-json.html'));
```

2. W Network potwierdź status **200**, typ treści HTML i treść przygotowanej strony. 404 nie zalicza tego przypadku.
3. Oczekuj komunikatu o innym typie treści zamiast JSON-a; lista i zapis bez zmian, kontrolki odblokowane.

### T09 — Anulowane potwierdzenie

1. Wczytaj bazę, zapamiętaj stan. Wybierz `02-poprawny-import.json`, ale w potwierdzeniu kliknij „Anuluj”.
2. Oczekuj komunikatu anulowania, niezmienionej listy i zapisu, aktywnych kontrolek.
3. Wybierz ponownie **ten sam plik**. Potwierdzenie powinno pojawić się ponownie. Tym razem zaakceptuj: lista ma zostać zastąpiona dwoma rekordami #101 i #102.
4. Powtórz anulowanie dla HTTP poleceniem z T11. Network nie powinien zawierać żądania danych tego importu, bo zgoda poprzedza pobieranie.

### T10 — Podwójne kliknięcie i blokada w czasie importu

Do próby przycisku potrzebny jest plik pod jego faktycznym adresem. **Tester** kopiuje `data/02-poprawny-import.json` do `src/js/tickets.json`. Jeśli plik już istnieje, najpierw zachowuje jego kopię i przywraca ją po próbie. Przygotowanie pakietu nie dodaje tego pliku do aplikacji.

1. Wczytaj bazę. W DevTools → Network włącz Disable cache i wolne połączenie (np. Slow 3G; przy zbyt szybkim pobieraniu ustaw profil z dużym opóźnieniem).
2. Wyczyść Network. Szybko kliknij dwukrotnie „Importuj tickets.json” i zaakceptuj pierwsze potwierdzenie. Jeszcze podczas „Importowanie danych...” spróbuj ponowić kliknięcie.
3. W trakcie pobierania spróbuj: dodać zgłoszenie, zmienić status, usunąć wiersz i wybrać plik importu. Te kontrolki powinny być wyłączone. Zmień filtr/sortowanie — nowo wyrenderowane wiersze także mają mieć wyłączoną edycję.
4. Oczekuj jednego potwierdzenia i jednego żądania `tickets.json` dla nakładających się prób. Po zakończeniu zostają tylko #101 i #102, zgodny zapis i aktywne kontrolki.
5. Powtórz wolny import z błędnym plikiem `05-zly-ostatni-rekord.json` skopiowanym pod `src/js/tickets.json`: blokada trwa do błędu, po błędzie znika, poprzednia lista i zapis pozostają.

**Uwaga:** kliknięcie już po zakończeniu importu jest nowym dozwolonym importem; nie świadczy o błędzie blokady. Jeśli nie udało się trafić w trwające pobieranie, powtórz próbę z większym opóźnieniem.

**Sprzątanie:** przywróć pierwotny plik albo usuń tylko testową kopię `src/js/tickets.json`, jeśli wcześniej go nie było. Wyłącz spowolnienie sieci i Disable cache.

## Dodatkowe przypadki wynikające z wymagań

### T11 — Poprawny import z pliku i przez fetch

Wykonaj osobno dla obu dróg, każdorazowo zaczynając od bazy:

- Plik: wybierz `02-poprawny-import.json` w kontrolce.
- HTTP: po przygotowaniu skrótów uruchom:

```js
await qaImport.importFromUrl(qaDataUrl('02-poprawny-import.json'));
```

Zaakceptuj potwierdzenie. Oczekuj **zastąpienia**, nie dopisania: dokładnie #101 i #102, licznik 2/2, komunikat sukcesu, zgodny localStorage. Po odświeżeniu oba pozostają. Przy HTTP odnotuj 200 oraz typ treści JSON. Ten przypadek potwierdza ścieżkę HTTP przez moduł; działanie przycisku jest osobno w T10.

### T12 — Odmowa zapisu podczas importu

Wczytaj bazę, zapamiętaj stan i włącz symulację zapisu z T02. Wybierz `02-poprawny-import.json` i zaakceptuj. Oczekuj błędu importu, starej listy w pamięci **i** starego zapisu (obydwa porównania `true`), odblokowanych kontrolek. Inaczej niż przy zwykłej edycji, import nie może pozostać tylko w pamięci. Przywróć metodę zapisu, ponów ten sam plik — import powinien być dostępny. Powtórz wariant przez HTTP z T11.

### T13 — Błędna składnia JSON

Z bazy zaimportuj `06-zla-skladnia.json`, zaakceptuj. Oczekuj błędu poprawności JSON-a, bez zmiany pamięci i zapisu. Powtórz przez `qaImport.importFromUrl(qaDataUrl('06-zla-skladnia.json'))`, aby sprawdzić błąd parsowania odpowiedzi HTTP z typem JSON. Po błędzie poprawny import powinien być możliwy.

### T14 — Poprawny JSON o złej strukturze

Z bazy zaimportuj `07-obiekt-zamiast-tablicy.json`, zaakceptuj. Oczekuj błędu „Dane powinny być tablicą zgłoszeń.”, bez zmiany pamięci i zapisu. Jest to błąd modelu danych, nie składni JSON.

### T15 — Awaria sieci

Wczytaj bazę i przygotuj skróty, zanim wyłączysz sieć. W Network ustaw Offline. Uruchom HTTP z T11 i zaakceptuj. Oczekuj błędu pobierania, zachowania pamięci i zapisu oraz zwolnienia blokady. Przywróć No throttling i ponów import — powinien być dostępny. Nie odświeżaj strony w trybie Offline.

### T16 — Start bez klucza i ładowanie modułów

Po zabezpieczeniu potrzebnych danych wykonaj `localStorage.removeItem('tickets')`, a następnie odśwież przez HTTP. Oczekuj pustej listy bez błędu storage. W Network sprawdź ładowanie `main.js`, `tickets.js`, `storage.js`, `ui.js`, `import.js` bez błędów HTTP; w Console brak błędów modułów. Dodaj poprawne zgłoszenie i odśwież — ma zostać odczytane. Nie usuwaj całego localStorage.

## Zapis wyników i zakończenie

Uzupełniaj `WYNIKI.md`: osobno warianty plik/HTTP oraz dodawanie/status/usuwanie. Statusy: **NIEWYKONANY, OK, BŁĄD, BLOKADA**. Błąd powinien mieć kroki, oczekiwany i rzeczywisty wynik, komunikat, zrzut ekranu, stan pamięci/zapisu oraz status HTTP, jeśli dotyczy.

Po pracy przywróć sieć, usuń podmiany metod przez odświeżenie, posprzątaj kopię `src/js/tickets.json` z T10 i przywróć wcześniej zabezpieczony klucz `tickets` (albo usuń tylko ten klucz w osobnym profilu testowym). Testy błędów muszą sprawdzać zarówno widoczną listę, jak i zapis; sam komunikat nie wystarcza.
