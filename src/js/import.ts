import { validateTicketSet } from "./tickets..js";
import { getTickets, replaceTickets } from "./storage.js";
import { renderTickets, setBusy } from "./ui.js";

const importMessage: Element | null = document.querySelector("#importMessage");

let importing: boolean = false;

function setImportMessage(message: string, isError: boolean = false) {
    importMessage!.textContent = message;
    importMessage?.classList.toggle("text-danger", isError);
    importMessage?.classList.toggle("text-success", !isError && Boolean(message));
}

function parseJson(text: string, source: string) {
    try {
        return JSON.parse(text);
    } catch {
        throw new Error(`${source} nie zawiera poprawnego JSON-a.`);
    }
}

function ticketCountLabel(count: number): string {
    if (count === 1) return "1 zgłoszenie";

    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    const isFew = lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14);

    return `${count} ${isFew ? "zgłoszenia" : "zgłoszeń"}`;
}

async function readFromUrl(url: URL) {
    let response;
    try {
        response = await fetch(url, { cache: "no-store" });
    } catch (error: any) {
        throw new Error(`Nie udało się pobrać danych z ${url}: ${error.message}`);
    }

    if (!response.ok) {
        throw new Error(`Serwer odpowiedział HTTP ${response.status} ${response.statusText || "(błąd)"}.`);
    }

    const contentType: string = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("json")) {
        throw new Error("Serwer nie zwrócił JSON-a (otrzymano inny typ treści).");
    }

    return parseJson(await response.text(), "Odpowiedź serwera");
}

async function readFromFile(file: File) {
    let text: string;
    try {
        text = await file.text();
    } catch {
        throw new Error(`Nie udało się odczytać pliku "${file.name}".`);
    }

    return parseJson(text, `Plik "${file.name}"`);
}

export async function importFrom(load: Function) {
    if (importing) return;

    importing = true;

    try {
        const accepted = window.confirm(
            `Import zastąpi obecną listę (${ticketCountLabel(getTickets().length)}). Kontynuować?`
        );

        if (!accepted) {
            setImportMessage("Import anulowany. Poprzednia lista pozostała bez zmian.");
            return;
        }

        setBusy(true);
        setImportMessage("Importowanie danych...");

        const raw = await load();
        const nextTickets = validateTicketSet(raw);

        replaceTickets(nextTickets);
        renderTickets();
        setImportMessage(`Zaimportowano ${ticketCountLabel(nextTickets.length)}.`);
    } catch (error: any) {
        setImportMessage(
            `Import nie powiódł się: ${error.message} Poprzednia lista pozostała bez zmian.`,
            true
        );
    } finally {
        setBusy(false);
        importing = false;
    }
}

export function importFromUrl(url: URL) {
    return importFrom(() => readFromUrl(url));
}

export function importFromFile(file: File) {
    return importFrom(() => readFromFile(file));
}

export const DEFAULT_IMPORT_URL = new URL("./tickets.json", import.meta.url);
