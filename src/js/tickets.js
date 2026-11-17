export const priorities = ["low", "normal", "high"];
export const statuses = ["new", "doing", "testing", "done"];
export const priorityLabels = { low: "Niski", normal: "Średni", high: "Wysoki" };
export const statusLabels = { new: "Nowe", doing: "W Realizacji", testing: "W Testach", done: "Ukończone" };

export const MAX_TICKETS = 1000;
const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 80;
const MAX_ID_LENGTH = 100;

function isTicketObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateTicket(ticket, position = 0) {
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
    };
}

export function validateTicketSet(value) {
    if (!Array.isArray(value)) {
        throw new Error("Dane powinny być tablicą zgłoszeń.");
    }

    if (value.length > MAX_TICKETS) {
        throw new Error(`Można przechować maksymalnie ${MAX_TICKETS} zgłoszeń.`);
    }

    const ids = new Set();
    return value.map((ticket, index) => {
        const cleanTicket = validateTicket(ticket, index + 1);

        if (ids.has(cleanTicket.id)) {
            throw new Error(`Zgłoszenie ${index + 1} powtarza identyfikator "${cleanTicket.id}".`);
        }

        ids.add(cleanTicket.id);
        return cleanTicket;
    });
}

export function addTicket(currentTickets, ticket) {
    if (currentTickets.length >= MAX_TICKETS) {
        throw new Error(`Można dodać maksymalnie ${MAX_TICKETS} zgłoszeń.`);
    }

    const candidate = validateTicket(ticket);

    if (candidate.status !== "new") {
        throw new Error('Nowe zgłoszenie musi mieć status "new".');
    }

    if (currentTickets.some(item => item.id === candidate.id)) {
        throw new Error(`Zgłoszenie o identyfikatorze "${candidate.id}" już istnieje.`);
    }

    return [...currentTickets, candidate];
}

export function changeTicket(currentTickets, id, status) {
    if (!statuses.includes(status)) {
        throw new Error("Nieprawidłowy status zgłoszenia.");
    }

    if (!currentTickets.some(ticket => ticket.id === id)) {
        throw new Error("Nie znaleziono zgłoszenia.");
    }

    return currentTickets.map(ticket => ticket.id === id ? { ...ticket, status } : ticket);
}

export function deleteTicket(currentTickets, id) {
    return currentTickets.filter(ticket => ticket.id !== id);
}

export function nextTicketId(currentTickets) {
    const ids = new Set(currentTickets.map(ticket => ticket.id));
    let max = 0;

    for (const id of ids) {
        if (/^\d+$/.test(id)) {
            const value = Number(id);
            if (Number.isSafeInteger(value) && value > max) max = value;
        }
    }

    let candidate = max + 1;
    while (ids.has(String(candidate))) candidate += 1;
    return String(candidate);
}
