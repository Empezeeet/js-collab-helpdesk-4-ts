import { changeTicket, deleteTicket, priorities, priorityLabels, statuses, statusLabels } from "./tickets..js";
import { commitTickets, getTickets } from "./storage.js";
const form = document.querySelector("#ticketForm");
const formMessage = document.querySelector("#formMessage");
const filter = document.querySelector("#statusFilter");
const sort = document.querySelector("#prioritySorter");
const list = document.querySelector("#ticketList");
const counter = document.querySelector("#ticketCounter");
const emptyMessage = document.querySelector("#emptyMessage");
let busy = false;
export function isBusy() {
    return busy;
}
export function setBusy(locked) {
    busy = locked;
    form.querySelectorAll("input, select, button, textarea").forEach(control => {
        control.disabled = locked;
    });
    list.querySelectorAll("input, select, button, textarea").forEach(control => {
        control.disabled = locked;
    });
    document.querySelectorAll("[data-import]").forEach(control => {
        control.disabled = locked;
    });
    document.querySelector("main")?.setAttribute("aria-busy", String(locked));
}
export function setFormMessage(message, isError = false) {
    formMessage.textContent = message;
    formMessage.classList.toggle("text-danger", isError);
    formMessage.classList.toggle("text-success", !isError && Boolean(message));
}
export function renderTickets() {
    const tickets = getTickets();
    const selectedStatuses = new Set([...filter.querySelectorAll("input:checked")].map(input => input.value));
    const visible = tickets
        .filter(ticket => selectedStatuses.has(ticket.status))
        .sort((a, b) => {
        if (sort.value === "htl") {
            return priorities.indexOf(b.priority) - priorities.indexOf(a.priority);
        }
        if (sort.value === "lth") {
            return priorities.indexOf(a.priority) - priorities.indexOf(b.priority);
        }
        return String(a.id).localeCompare(String(b.id), "pl", { numeric: true });
    });
    list.replaceChildren(...visible.map(createTicketRow));
    counter.textContent = `Widoczne: ${visible.length} / Wszystkie: ${tickets.length}`;
    emptyMessage.textContent = visible.length ? "" : "Brak zgłoszeń dla wybranego filtra.";
}
export function createTicketRow(ticket) {
    const row = document.createElement("li");
    row.className = "list-group-item";
    const header = document.createElement("div");
    header.className = "d-flex justify-content-between align-items-center gap-3 mb-2";
    const description = document.createElement("span");
    description.className = "text-break";
    description.textContent = `#${ticket.id} — ${ticket.title} | Priorytet: ${priorityLabels[ticket.priority]}`;
    const delbtn = document.createElement("button");
    delbtn.type = "button";
    delbtn.className = "btn btn-danger flex-shrink-0";
    delbtn.textContent = "Usuń";
    delbtn.disabled = busy;
    delbtn.addEventListener("click", () => {
        if (busy)
            return;
        try {
            commitTickets(deleteTicket(getTickets(), ticket.id));
            setFormMessage(`Usunięto zgłoszenie #${ticket.id}.`);
        }
        catch (error) {
            setFormMessage(error.message, true);
        }
        renderTickets();
    });
    header.append(description, delbtn);
    const label = document.createElement("label");
    label.className = "d-block";
    label.textContent = "Status: ";
    const select = document.createElement("select");
    select.className = "form-select form-select-sm mt-1";
    select.setAttribute("aria-label", `Status zgłoszenia ${ticket.id}: ${ticket.title}`);
    select.disabled = busy;
    for (const status of statuses) {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = statusLabels[status];
        select.append(option);
    }
    select.value = ticket.status;
    select.addEventListener("change", () => {
        if (busy)
            return;
        try {
            commitTickets(changeTicket(getTickets(), ticket.id, select.value));
            setFormMessage(`Zmieniono status zgłoszenia #${ticket.id}.`);
        }
        catch (error) {
            setFormMessage(error.message, true);
        }
        renderTickets();
        filter.querySelector("input")?.focus();
    });
    label.append(select);
    row.append(header, label);
    return row;
}
