import { addTicket, nextTicketId } from "./tickets..js";
import { commitTickets, getTickets, loadTickets, StorageError } from "./storage.js";
import { isBusy, renderTickets, setFormMessage } from "./ui.js";
import { DEFAULT_IMPORT_URL, importFromFile, importFromUrl } from "./import.js";
const form = document.querySelector("#ticketForm");
const titleInput = document.querySelector("#title");
const filter = document.querySelector("#statusFilter");
const sort = document.querySelector("#prioritySorter");
const importFileInput = document.querySelector("#importFile");
const importFetchButton = document.querySelector("#importFetch");
form?.addEventListener("submit", event => {
    event.preventDefault();
    if (isBusy())
        return;
    const priority = form.querySelector('input[name="Priorytet"]:checked');
    try {
        const currentTickets = getTickets();
        const nextTickets = addTicket(currentTickets, {
            id: nextTicketId(currentTickets),
            title: titleInput.value,
            priority: priority ? priority.value : "",
            status: "new"
        });
        commitTickets(nextTickets);
        titleInput.value = "";
        titleInput.removeAttribute("aria-invalid");
        setFormMessage("Dodano zgłoszenie.");
    }
    catch (error) {
        if (error instanceof StorageError) {
            const reason = error.message.charAt(0).toLowerCase() + error.message.slice(1);
            titleInput.value = "";
            titleInput.removeAttribute("aria-invalid");
            setFormMessage(`Dodano zgłoszenie, ale ${reason}`, true);
        }
        else {
            setFormMessage(error.message, true);
            if (titleInput.value.trim().length < 3 || titleInput.value.trim().length > 80) {
                titleInput.setAttribute("aria-invalid", "true");
            }
        }
    }
    finally {
        renderTickets();
        titleInput.focus();
    }
});
filter.addEventListener("change", renderTickets);
sort.addEventListener("change", renderTickets);
importFetchButton.addEventListener("click", async () => {
    await importFromUrl(DEFAULT_IMPORT_URL);
});
importFileInput.addEventListener("change", async () => {
    const file = importFileInput.files?.[0];
    if (!file)
        return;
    importFileInput.value = "";
    await importFromFile(file);
});
try {
    loadTickets();
}
catch (error) {
    setFormMessage(error.message, true);
}
renderTickets();
window.addEventListener("pageshow", event => {
    if (event.persisted)
        return;
    filter.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.checked = input.defaultChecked;
    });
    sort.selectedIndex = 0;
    renderTickets();
});
