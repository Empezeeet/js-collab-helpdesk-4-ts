export const priorities: Array<String> = ["low", "normal", "high"];
export const statuses: Array<String> = ["new", "doing", "testing", "done"];
export const priorityLabels: object = { low: "Niski", normal: "Średni", high: "Wysoki" };
export const statusLabels: object = { new: "Nowe", doing: "W Realizacji", testing: "W Testach", done: "Ukończone" };


export type ticket_t = {
    id : string,
    title: string,
    priority: string,
    status: string
} 


export const MAX_TICKETS: number = 1000;
const MIN_TITLE_LENGTH: number = 3;
const MAX_TITLE_LENGTH: number = 80;
const MAX_ID_LENGTH: number = 100;

function isTicketObject(value: object): boolean {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateTicket(ticket: ticket_t, position: number = 0): ticket_t {
    const where = position ? ` (rekord ${position})` : "";

    if (!isTicketObject(ticket)) {
        throw new Error(`Zgłoszenie${where} nie jest obiektem.`);
    }

    if (typeof ticket.id !== "string" || !ticket.id.trim() || ticket.id.trim().length > MAX_ID_LENGTH) {
        throw new Error(`Zgłoszenie${where} ma nieprawidłowy identyfikator.`);
    }

    const title = typeof ticket.title === "string" ? ticket.title.trim() : "";
    if (title.length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH) {
        throw new Error(`Zgłoszenie${where} ma tytuł spoza zakresu ${MIN_TITLE_LENGTH}-${MAX_TITLE_LENGTH} znaków.`);
    }

    if (!priorities.includes(ticket.priority)) {
        throw new Error(`Zgłoszenie${where} ma nieprawidłowy priorytet.`);
    }

    if (!statuses.includes(ticket.status)) {
        throw new Error(`Zgłoszenie${where} ma nieprawidłowy status.`);
    }

    return {
        id: ticket.id.trim(),
        title,
        priority: ticket.priority,
        status: ticket.status
    } as ticket_t;
}

export function validateTicketSet(value: Array<ticket_t>): Array<ticket_t> {
    if (!Array.isArray(value)) {
        throw new Error("Dane powinny być tablicą zgłoszeń.");
    }

    if (value.length > MAX_TICKETS) {
        throw new Error(`Można przechować maksymalnie ${MAX_TICKETS} zgłoszeń.`);
    }

    const ids: Set<String> = new Set();
    return value.map((ticket: ticket_t, index: number) => {
        const cleanTicket = validateTicket(ticket, index + 1);

        if (ids.has(cleanTicket.id)) {
            throw new Error(`Zgłoszenie ${index + 1} powtarza identyfikator "${cleanTicket.id}".`);
        }

        ids.add(cleanTicket.id);
        return cleanTicket;
    });
}

export function addTicket(currentTickets: Array<ticket_t>, ticket: ticket_t): Array<ticket_t> {
    if (currentTickets.length >= MAX_TICKETS) {
        throw new Error(`Można dodać maksymalnie ${MAX_TICKETS} zgłoszeń.`);
    }

    const candidate: ticket_t = validateTicket(ticket);

    if (candidate.status !== "new") {
        throw new Error('Nowe zgłoszenie musi mieć status "new".');
    }

    if (currentTickets.some(item => item.id === candidate.id)) {
        throw new Error(`Zgłoszenie o identyfikatorze "${candidate.id}" już istnieje.`);
    }

    return [...currentTickets, candidate];
}

export function changeTicket(currentTickets: Array<ticket_t>, id: string, status: string): Array<ticket_t> {
    if (!statuses.includes(status)) {
        throw new Error("Nieprawidłowy status zgłoszenia.");
    }

    if (!currentTickets.some(ticket => ticket.id === id)) {
        throw new Error("Nie znaleziono zgłoszenia.");
    }

    return currentTickets.map(ticket => ticket.id === id ? { ...ticket, status } : ticket);
}

export function deleteTicket(currentTickets: Array<ticket_t>, id: String): Array<ticket_t> {
    return currentTickets.filter(ticket => ticket.id !== id);
}

export function nextTicketId(currentTickets: Array<ticket_t>): string {
    const ids: Set<string> = new Set(currentTickets.map(ticket => ticket.id));
    let max: number = 0;

    for (const id of ids) {
        if (/^\d+$/.test(id)) {
            const value = Number(id);
            if (Number.isSafeInteger(value) && value > max) max = value;
        }
    }

    let candidate: number = max + 1;
    while (ids.has(String(candidate))) candidate += 1;
    return String(candidate);
}
