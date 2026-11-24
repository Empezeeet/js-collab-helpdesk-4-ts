// Warstwa localStorage: stan listy i trwały zapis.
import { ticket_t, validateTicketSet } from "./tickets..js";

export const STORAGE_KEY: string = "tickets";

let tickets: Array<ticket_t> = [];

export class StorageError extends Error {
    constructor(message: string, cause: string) {
        super(message);
        this.name = "StorageError";
        this.cause = cause;
    }
}

export function getTickets(): Array<ticket_t> {
    return tickets;
}

function writeTickets(nextTickets: Array<ticket_t>) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTickets));
    } catch (error: any) {
        throw new StorageError(
            "Nie udało się zapisać zgłoszeń w localStorage. Dane pozostają tylko w pamięci.",
            error
        );
    }
}

export function loadTickets(): Array<ticket_t> {
    tickets = [];

    let raw: string | null;
    try {
        raw = localStorage.getItem(STORAGE_KEY);
    } catch (error: any) {
        throw new StorageError("Nie udało się odczytać danych z localStorage.", error);
    }

    if (raw === null) return [];

    let parsed: Array<ticket_t>;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error(
            "Zapisane zgłoszenia są uszkodzone (nieprawidłowy JSON). " +
            "Zapis w localStorage nie został usunięty."
        );
    }

    try {
        tickets = validateTicketSet(parsed);
    } catch (error: any) {
        throw new Error(
            `Zapisane zgłoszenia są nieprawidłowe: ${error.message} ` +
            "Zapis w localStorage nie został usunięty."
        );
    }

    return tickets;
}

export function commitTickets(nextTickets: Array<ticket_t>): Array<ticket_t> {
    const cleanTickets: Array<ticket_t> = validateTicketSet(nextTickets);
    tickets = cleanTickets;
    writeTickets(cleanTickets);
    return cleanTickets;
}

export function replaceTickets(nextTickets: Array<ticket_t>): Array<ticket_t> {
    const cleanTickets: Array<ticket_t> = validateTicketSet(nextTickets);
    writeTickets(cleanTickets);
    tickets = cleanTickets;
    return cleanTickets;
}
