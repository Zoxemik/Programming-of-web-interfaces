// script.js
"use strict";

const state = {
    lists: [
        { id: 1, name: "Pilne", collapsed: false, tasks: [] },
        { id: 2, name: "Mało pilne", collapsed: false, tasks: [] },
        { id: 3, name: "Na wczoraj", collapsed: false, tasks: [] }
    ],
    nextListId: 4,
    nextTaskId: 1,
    selectedListId: 1,
    lastDeleted: null,
    pendingDelete: null,
    lastFocusedElement: null
};

const taskInput = document.getElementById("taskInput");
const listSelect = document.getElementById("listSelect");
const addTaskButton = document.getElementById("addTaskButton");
const newListInput = document.getElementById("newListInput");
const addListButton = document.getElementById("addListButton");
const searchInput = document.getElementById("searchInput");
const caseInsensitiveToggle = document.getElementById("caseInsensitiveToggle");
const undoButton = document.getElementById("undoButton");
const messageBox = document.getElementById("messageBox");
const listsContainer = document.getElementById("listsContainer");
const modalOverlay = document.getElementById("modalOverlay");
const modal = document.getElementById("confirmDialog");
const modalText = document.getElementById("modalText");
const cancelDeleteButton = document.getElementById("cancelDeleteButton");
const confirmDeleteButton = document.getElementById("confirmDeleteButton");

function setMessage(text) {
    messageBox.textContent = text;
}

function clearMessage() {
    setMessage("");
}

function isModalOpen() {
    return !modalOverlay.classList.contains("hidden");
}

function getListById(listId) {
    return state.lists.find((list) => list.id === listId) || null;
}

function getTaskLocation(taskId) {
    for (const list of state.lists) {
        const taskIndex = list.tasks.findIndex((task) => task.id === taskId);

        if (taskIndex !== -1) {
            return {
                list,
                task: list.tasks[taskIndex],
                taskIndex
            };
        }
    }

    return null;
}

function formatDate(date) {
    return new Intl.DateTimeFormat("pl-PL", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(date);
}

function updateListSelect() {
    const previousValue = state.selectedListId;
    listSelect.innerHTML = "";

    for (const list of state.lists) {
        const option = document.createElement("option");
        option.value = String(list.id);
        option.textContent = list.name;
        listSelect.appendChild(option);
    }

    const selectedExists = state.lists.some((list) => list.id === previousValue);

    if (selectedExists) {
        listSelect.value = String(previousValue);
    } else if (state.lists.length > 0) {
        state.selectedListId = state.lists[0].id;
        listSelect.value = String(state.selectedListId);
    }
}

function matchesSearch(taskText, query, caseInsensitive) {
    if (query === "") {
        return true;
    }

    if (caseInsensitive) {
        return taskText.toLocaleLowerCase().includes(query.toLocaleLowerCase());
    }

    return taskText.includes(query);
}

function renderLists() {
    const query = searchInput.value.trim();
    const useCaseInsensitive = caseInsensitiveToggle.checked;

    listsContainer.innerHTML = "";

    for (const list of state.lists) {
        const visibleTasks = list.tasks.filter((task) =>
            matchesSearch(task.text, query, useCaseInsensitive)
        );

        const card = document.createElement("article");
        card.className = "list-card";

        const header = document.createElement("button");
        header.type = "button";
        header.className = "list-header";
        header.dataset.listId = String(list.id);
        header.setAttribute("aria-expanded", String(!list.collapsed));

        const headerTitle = document.createElement("span");
        headerTitle.textContent = `${list.collapsed ? "▶" : "▼"} ${list.name}`;

        const headerMeta = document.createElement("span");
        headerMeta.className = "list-meta";
        headerMeta.textContent = `widoczne: ${visibleTasks.length} / wszystkie: ${list.tasks.length}`;

        header.appendChild(headerTitle);
        header.appendChild(headerMeta);

        const body = document.createElement("div");
        body.className = "list-body";

        if (list.collapsed) {
            body.classList.add("hidden");
        }

        if (visibleTasks.length === 0) {
            const emptyNote = document.createElement("p");
            emptyNote.className = "empty-note";
            emptyNote.textContent =
                query === ""
                    ? "Brak zadań na tej liście."
                    : "Brak pasujących wyników dla tej listy.";
            body.appendChild(emptyNote);
        } else {
            const taskList = document.createElement("ul");
            taskList.className = "task-list";

            for (const task of visibleTasks) {
                const taskItem = document.createElement("li");
                taskItem.className = "task-item";

                if (task.done) {
                    taskItem.classList.add("done");
                }

                const toggleButton = document.createElement("button");
                toggleButton.type = "button";
                toggleButton.className = "task-toggle";
                toggleButton.dataset.taskId = String(task.id);
                toggleButton.setAttribute("aria-pressed", String(task.done));

                const taskText = document.createElement("span");
                taskText.className = "task-text";
                taskText.textContent = task.text;

                toggleButton.appendChild(taskText);

                if (task.done && task.completedAt !== "") {
                    const taskDate = document.createElement("span");
                    taskDate.className = "task-date";
                    taskDate.textContent = `Wykonano: ${task.completedAt}`;
                    toggleButton.appendChild(taskDate);
                }

                const removeButton = document.createElement("button");
                removeButton.type = "button";
                removeButton.className = "remove-button";
                removeButton.dataset.taskId = String(task.id);
                removeButton.setAttribute("aria-label", `Usuń zadanie: ${task.text}`);
                removeButton.textContent = "X";

                taskItem.appendChild(toggleButton);
                taskItem.appendChild(removeButton);
                taskList.appendChild(taskItem);
            }

            body.appendChild(taskList);
        }

        card.appendChild(header);
        card.appendChild(body);
        listsContainer.appendChild(card);
    }

    undoButton.disabled = state.lastDeleted === null;
}

function render() {
    updateListSelect();
    renderLists();
}

function addTask() {
    if (isModalOpen()) {
        return;
    }

    const text = taskInput.value.trim();
    const listId = Number(listSelect.value);
    const list = getListById(listId);

    if (text === "") {
        setMessage("Treść zadania nie może być pusta.");
        taskInput.focus();
        return;
    }

    if (list === null) {
        setMessage("Nie udało się znaleźć wybranej listy.");
        return;
    }

    list.tasks.push({
        id: state.nextTaskId,
        text,
        done: false,
        completedAt: ""
    });

    state.nextTaskId += 1;

    taskInput.value = "";
    clearMessage();
    render();
    taskInput.focus();
}

function addList() {
    if (isModalOpen()) {
        return;
    }

    const name = newListInput.value.trim();

    if (name === "") {
        setMessage("Nazwa listy nie może być pusta.");
        newListInput.focus();
        return;
    }

    const alreadyExists = state.lists.some(
        (list) => list.name.toLocaleLowerCase() === name.toLocaleLowerCase()
    );

    if (alreadyExists) {
        setMessage("Lista o takiej nazwie już istnieje.");
        newListInput.focus();
        return;
    }

    const newList = {
        id: state.nextListId,
        name,
        collapsed: false,
        tasks: []
    };

    state.lists.push(newList);
    state.nextListId += 1;
    state.selectedListId = newList.id;

    newListInput.value = "";
    clearMessage();
    render();
    newListInput.focus();
}

function toggleTask(taskId) {
    const location = getTaskLocation(taskId);

    if (location === null || isModalOpen()) {
        return;
    }

    location.task.done = !location.task.done;

    if (location.task.done) {
        location.task.completedAt = formatDate(new Date());
    } else {
        location.task.completedAt = "";
    }

    render();
}

function toggleListCollapse(listId) {
    const list = getListById(listId);

    if (list === null || isModalOpen()) {
        return;
    }

    list.collapsed = !list.collapsed;
    render();
}

function getModalFocusableElements() {
    return [cancelDeleteButton, confirmDeleteButton].filter((element) => !element.disabled);
}

function openDeleteModal(taskId) {
    if (isModalOpen()) {
        return;
    }

    const location = getTaskLocation(taskId);

    if (location === null) {
        return;
    }

    state.lastFocusedElement = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    state.pendingDelete = {
        taskId,
        listId: location.list.id,
        taskText: location.task.text
    };

    modalText.textContent =
        `Czy na pewno chcesz usunąć zadanie o treści: "${location.task.text}"?`;

    document.body.classList.add("modal-open");
    modalOverlay.classList.remove("hidden");
    modalOverlay.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
        confirmDeleteButton.focus();
    });
}

function closeDeleteModal(options = {}) {
    const { restoreFocus = true } = options;

    state.pendingDelete = null;
    modalOverlay.classList.add("hidden");
    modalOverlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    const elementToFocus = state.lastFocusedElement;
    state.lastFocusedElement = null;

    if (
        restoreFocus &&
        elementToFocus instanceof HTMLElement &&
        document.contains(elementToFocus) &&
        typeof elementToFocus.focus === "function"
    ) {
        elementToFocus.focus();
    }
}

function confirmDelete() {
    if (state.pendingDelete === null) {
        return;
    }

    const pendingDelete = state.pendingDelete;
    const list = getListById(pendingDelete.listId);

    if (list === null) {
        closeDeleteModal({ restoreFocus: false });
        render();
        return;
    }

    const taskIndex = list.tasks.findIndex((task) => task.id === pendingDelete.taskId);

    if (taskIndex === -1) {
        closeDeleteModal({ restoreFocus: false });
        render();
        return;
    }

    const deletedTask = list.tasks.splice(taskIndex, 1)[0];

    state.lastDeleted = {
        listId: list.id,
        task: deletedTask,
        index: taskIndex
    };

    closeDeleteModal({ restoreFocus: false });
    render();
    undoButton.focus();
}

function undoDelete() {
    if (state.lastDeleted === null || isModalOpen()) {
        return;
    }

    const list = getListById(state.lastDeleted.listId);

    if (list === null) {
        state.lastDeleted = null;
        render();
        return;
    }

    const safeIndex = Math.min(state.lastDeleted.index, list.tasks.length);

    list.tasks.splice(safeIndex, 0, state.lastDeleted.task);
    state.lastDeleted = null;
    render();
}

function handleModalTabNavigation(event) {
    if (!isModalOpen() || event.key !== "Tab") {
        return;
    }

    const focusableElements = getModalFocusableElements();

    if (focusableElements.length === 0) {
        event.preventDefault();
        return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (!modal.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
        return;
    }

    if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
    }

    if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
    }
}

addTaskButton.addEventListener("click", addTask);
addListButton.addEventListener("click", addList);

taskInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        addTask();
    }
});

newListInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        addList();
    }
});

listSelect.addEventListener("change", () => {
    state.selectedListId = Number(listSelect.value);
});

searchInput.addEventListener("input", renderLists);
caseInsensitiveToggle.addEventListener("change", renderLists);
undoButton.addEventListener("click", undoDelete);

cancelDeleteButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeDeleteModal();
});

confirmDeleteButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    confirmDelete();
});

modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) {
        closeDeleteModal();
    }
});

listsContainer.addEventListener("click", (event) => {
    if (isModalOpen() || !(event.target instanceof Element)) {
        return;
    }

    const header = event.target.closest(".list-header");
    if (header !== null) {
        toggleListCollapse(Number(header.dataset.listId));
        return;
    }

    const removeButton = event.target.closest(".remove-button");
    if (removeButton !== null) {
        event.preventDefault();
        event.stopPropagation();
        openDeleteModal(Number(removeButton.dataset.taskId));
        return;
    }

    const toggleButton = event.target.closest(".task-toggle");
    if (toggleButton !== null) {
        toggleTask(Number(toggleButton.dataset.taskId));
    }
});

document.addEventListener("keydown", (event) => {
    if (isModalOpen()) {
        if (event.key === "Escape") {
            event.preventDefault();
            closeDeleteModal();
            return;
        }

        handleModalTabNavigation(event);

        if (event.key === "Enter") {
            const activeElement = document.activeElement;
            const isActionButtonFocused =
                activeElement === cancelDeleteButton || activeElement === confirmDeleteButton;

            if (!isActionButtonFocused) {
                event.preventDefault();
                confirmDelete();
            }
        }

        return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "z") {
        event.preventDefault();
        undoDelete();
    }
});

modalOverlay.setAttribute("aria-hidden", "true");
render();