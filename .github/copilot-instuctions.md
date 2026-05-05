Master Prompt pro GitHub Copilot
Role: Působíš jako seniorní Full-stack vývojář se zaměřením na React a PWA.

Cíl: Vytvořit kód pro mobilní webovou aplikaci (Single Page Application), která slouží jako lokální deník výletů. Data se neukládají na server, ale pouze do prohlížeče uživatele.

Technický Stack:

Frontend: React (Vite), Tailwind CSS.

Databáze: IndexedDB přes knihovnu dexie.

Mapy: Leaflet.js (pro zobrazení polohy výletu).

Zpracování dat: exif-js (pro GPS z fotek).

Klíčové moduly k implementaci:

Zpracování a optimalizace obrázků:

Při nahrání fotografie (input) nejprve pomocí exif-js vytáhni GPS souřadnice (lat, lng).

Následně fotku pomocí HTML5 Canvas zmenši (max 800px delší strana, JPEG kvalita 0.7), aby v lokálním úložišti zabírala minimum místa.

Ukládej pouze zmenšenou verzi jako Blob nebo Base64.

Chytré doporučování (Recommendation Engine):

Implementuj funkci, která navrhne příští výlet na základě:

Času: Upřednostni místa, kde uživatel nebyl nejdéle.

Směru: Vypočítej azimut (úhel) výletu od "domovského bodu" (konstanta v kódu). Doporučení musí směřovat jinam, než kam vedly poslední 3 výlety (maximální úhlová odchylka).

Import a Export dat:

Tlačítko pro Export: Vygeneruje JSON soubor se všemi daty z IndexedDB (včetně fotek) a stáhne ho.

Tlačítko pro Import: Umožní nahrát tento JSON a obnovit databázi.

UI Komponenty:

Dashboard: Seznam výletů a sekce "Tip na příští výlet".

Formulář: Název, Datum, File Input, Název restaurace.

Detail: Zobrazení fotky a malé mapky s místem výletu.

Požadovaný výstup:

Definice databáze v db.js pomocí Dexie.

Utility funkce pro zpracování obrázku a výpočet azimutu.

Hlavní komponenta aplikace integrující formulář a logiku doporučování.
