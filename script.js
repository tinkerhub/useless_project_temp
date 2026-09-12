"use strict";

/*
  Random Access Memories
  Dependency-free memory simulation.

  Features:
  - Reminders can fail.
  - Repeated reminders become more reliable.
  - Failed reminders produce delayed regret notifications.
  - Notes gradually lose detail.
  - Higher-priority notes fade more slowly.
  - Opening a note strengthens it.
  - Lists/tasks forget approximately half their items.
  - Three simulated days without visiting clears everything.
  - Demo time is independent from real time.
*/

const STORAGE_KEY = "random-access-memories-v4";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const REGRET_DELAY = 2 * HOUR;
const NOTE_FORGET_INTERVAL = DAY;
const TASK_FORGET_INTERVAL = DAY;
const INACTIVITY_LIMIT = 3 * DAY;

let state = {
    demoMode: true,
    demoTime: Date.now(),
    lastVisit: Date.now(),

    reminders: [],
    notes: [],
    lists: [],
    eventLog: []
};

const elements = {
    memoryStatus: document.getElementById("memory-status"),
    simulatedDate: document.getElementById("simulated-date"),

    advanceDay: document.getElementById("advance-day"),
    advanceWeek: document.getElementById("advance-week"),
    forceForgetting: document.getElementById("force-forgetting"),
    resetApp: document.getElementById("reset-app"),

    reminderForm: document.getElementById("reminder-form"),
    reminderText: document.getElementById("reminder-text"),
    reminderTime: document.getElementById("reminder-time"),
    remindersContainer: document.getElementById("reminders-container"),

    noteForm: document.getElementById("note-form"),
    noteTitle: document.getElementById("note-title"),
    noteTopic: document.getElementById("note-topic"),
    noteContent: document.getElementById("note-content"),
    notePriority: document.getElementById("note-priority"),
    notesContainer: document.getElementById("notes-container"),

    listForm: document.getElementById("list-form"),
    listTitle: document.getElementById("list-title"),
    listsContainer: document.getElementById("lists-container"),

    eventLog: document.getElementById("event-log")
};

/* --------------------------------------------------
   Utility functions
-------------------------------------------------- */

function now() {
    return state.demoMode ? state.demoTime : Date.now();
}

function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString();
}

function formatRelativeTime(timestamp) {
    const difference = timestamp - now();

    if (difference <= 0) {
        return "now";
    }

    const minutes = Math.ceil(difference / MINUTE);

    if (minutes < 60) {
        return `in ${minutes} minute${minutes === 1 ? "" : "s"}`;
    }

    const hours = Math.ceil(minutes / 60);

    if (hours < 24) {
        return `in ${hours} hour${hours === 1 ? "" : "s"}`;
    }

    const days = Math.ceil(hours / 24);

    return `in ${days} day${days === 1 ? "" : "s"}`;
}

function logEvent(message) {
    state.eventLog.unshift({
        id: createId(),
        timestamp: now(),
        message
    });

    state.eventLog = state.eventLog.slice(0, 100);
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
    const savedState = localStorage.getItem(STORAGE_KEY);

    if (!savedState) {
        return;
    }

    try {
        const parsedState = JSON.parse(savedState);

        state = {
            ...state,
            ...parsedState,
            reminders: Array.isArray(parsedState.reminders)
                ? parsedState.reminders
                : [],
            notes: Array.isArray(parsedState.notes)
                ? parsedState.notes
                : [],
            lists: Array.isArray(parsedState.lists)
                ? parsedState.lists
                : [],
            eventLog: Array.isArray(parsedState.eventLog)
                ? parsedState.eventLog
                : []
        };
    } catch (error) {
        console.error("Could not load saved state:", error);
        localStorage.removeItem(STORAGE_KEY);
    }
}

function priorityToNumber(priority) {
    if (typeof priority === "number") {
        return Math.min(3, Math.max(1, priority));
    }

    switch (String(priority).toLowerCase()) {
        case "high":
            return 3;

        case "medium":
            return 2;

        case "low":
            return 1;

        default:
            return 2;
    }
}

function priorityName(priority) {
    switch (priorityToNumber(priority)) {
        case 3:
            return "High";

        case 2:
            return "Medium";

        default:
            return "Low";
    }
}

/* --------------------------------------------------
   Reminder system
-------------------------------------------------- */

function reminderSuccessChance(reminder) {
    /*
      First attempt: 0%.
      Every repeated attempt increases the chance.
      The chance never exceeds 100%.
    */

    const attempts = Number(reminder.attempts) || 0;

    return Math.min(1, attempts * 0.25);
}

function createReminder(text, timestamp) {
    const reminder = {
        id: createId(),
        text,
        timestamp,
        attempts: 0,
        completed: false,
        failed: false,
        regretShown: false,
        createdAt: now()
    };

    state.reminders.push(reminder);

    logEvent(`Created reminder: "${text}"`);
    saveState();
    renderAll();
}

function attemptReminder(reminder) {
    if (reminder.completed || reminder.failed) {
        return;
    }

    reminder.attempts += 1;

    const chance = reminderSuccessChance(reminder);
    const succeeded = Math.random() < chance;

    if (succeeded) {
        reminder.completed = true;

        logEvent(`Reminder succeeded: "${reminder.text}"`);
    } else {
        reminder.failed = true;
        reminder.regretAt = now() + REGRET_DELAY;

        logEvent(`Reminder failed: "${reminder.text}"`);
    }
}

function processReminders() {
    for (const reminder of state.reminders) {
        if (
            !reminder.completed &&
            !reminder.failed &&
            now() >= reminder.timestamp
        ) {
            attemptReminder(reminder);
        }

        if (
            reminder.failed &&
            !reminder.regretShown &&
            now() >= reminder.regretAt
        ) {
            reminder.regretShown = true;

            const message =
                `I forgot to remind you earlier: "${reminder.text}"`;

            logEvent(message);

            alert(message);
        }
    }
}

function deleteReminder(id) {
    state.reminders = state.reminders.filter(
        reminder => reminder.id !== id
    );

    logEvent("Deleted a reminder.");
    saveState();
    renderAll();
}

/* --------------------------------------------------
   Note system
-------------------------------------------------- */

function getNoteForgetDelay(note) {
    const priority = priorityToNumber(note.priority);

    /*
      High-priority notes wait longer before forgetting.
    */

    if (priority === 3) {
        return NOTE_FORGET_INTERVAL * 2;
    }

    if (priority === 2) {
        return NOTE_FORGET_INTERVAL * 1.5;
    }

    return NOTE_FORGET_INTERVAL;
}

function getNoteForgettingChance(note) {
    const priority = priorityToNumber(note.priority);
    const opens = Number(note.openCount) || 0;

    let chance = 0.45;

    if (priority === 3) {
        chance = 0.2;
    } else if (priority === 2) {
        chance = 0.35;
    }

    /*
      Opening a note reduces its forgetting chance.
    */

    chance -= opens * 0.05;

    return Math.max(0.05, Math.min(1, chance));
}

function createWeakerMemory(note) {
    const content = note.currentContent || note.originalContent;
    const words = content
        .split(/\s+/)
        .map(word => word.trim())
        .filter(Boolean);

    if (words.length <= 4) {
        return "Something has been forgotten.";
    }

    if (note.forgettingStage === 1) {
        const firstPart = words.slice(0, Math.ceil(words.length * 0.6));
        return `${firstPart.join(" ")}...`;
    }

    if (note.forgettingStage === 2) {
        const firstPart = words.slice(0, Math.ceil(words.length * 0.35));
        return `${firstPart.join(" ")}...`;
    }

    if (note.forgettingStage === 3) {
        return "There is something hidden.";
    }

    if (note.forgettingStage >= 4) {
        return "Something has been forgotten.";
    }

    return content;
}

function createNote(title, topic, content, priority) {
    const note = {
        id: createId(),
        title,
        topic,
        originalContent: content,
        currentContent: content,
        priority: priorityToNumber(priority),
        memoryStrength: 1,
        forgettingStage: 0,
        openCount: 0,
        createdAt: now(),
        nextForgetAt: now() + getNoteForgetDelay({
            priority: priorityToNumber(priority)
        })
    };

    state.notes.push(note);

    logEvent(`Created note: "${title}"`);
    saveState();
    renderAll();
}

function openNote(id) {
    const note = state.notes.find(item => item.id === id);

    if (!note) {
        return;
    }

    note.openCount += 1;
    note.memoryStrength = Math.min(1, note.memoryStrength + 0.15);

    /*
      Reopening a note can restore some detail.
    */

    if (note.forgettingStage > 0) {
        note.forgettingStage -= 1;
        note.currentContent = createWeakerMemory(note);
    }

    note.nextForgetAt = now() + getNoteForgetDelay(note);

    logEvent(`Opened note: "${note.title}"`);
    saveState();
    renderAll();
}

function forgetNote(note) {
    const chance = getNoteForgettingChance(note);

    if (Math.random() > chance) {
        note.nextForgetAt = now() + getNoteForgetDelay(note);
        return;
    }

    note.forgettingStage += 1;
    note.memoryStrength = Math.max(
        0,
        note.memoryStrength - 0.2
    );

    if (note.forgettingStage >= 5) {
        const message =
            `I completely forgot the note: "${note.title}"`;

        logEvent(message);
        alert(message);

        state.notes = state.notes.filter(
            item => item.id !== note.id
        );

        return;
    }

    note.currentContent = createWeakerMemory(note);
    note.nextForgetAt = now() + getNoteForgetDelay(note);

    const message =
        `I forgot some details from the note: "${note.title}"`;

    logEvent(message);
    alert(message);
}

function processNotes() {
    for (const note of [...state.notes]) {
        if (now() >= note.nextForgetAt) {
            forgetNote(note);
        }
    }
}

/* --------------------------------------------------
   Lists and tasks
-------------------------------------------------- */

function createList(title) {
    const list = {
        id: createId(),
        title,
        createdAt: now(),
        items: []
    };

    state.lists.push(list);

    logEvent(`Created list: "${title}"`);
    saveState();
    renderAll();
}

function addTask(listId, text) {
    const list = state.lists.find(item => item.id === listId);

    if (!list || !text.trim()) {
        return;
    }

    list.items.push({
        id: createId(),
        text: text.trim(),
        completed: false,
        createdAt: now(),
        lastChecked: now()
    });

    logEvent(`Added task to "${list.title}": "${text}"`);
    saveState();
    renderAll();
}

function toggleTask(listId, taskId) {
    const list = state.lists.find(item => item.id === listId);

    if (!list) {
        return;
    }

    const task = list.items.find(item => item.id === taskId);

    if (!task) {
        return;
    }

    task.completed = !task.completed;
    task.lastChecked = now();

    logEvent(
        `${task.completed ? "Completed" : "Reopened"} task: "${task.text}"`
    );

    saveState();
    renderAll();
}

function deleteList(id) {
    state.lists = state.lists.filter(list => list.id !== id);

    logEvent("Deleted a list.");
    saveState();
    renderAll();
}

function processTasks() {
    for (const list of state.lists) {
        const remainingItems = [];

        for (const task of list.items) {
            if (
                now() - task.lastChecked <
                TASK_FORGET_INTERVAL
            ) {
                remainingItems.push(task);
                continue;
            }

            task.lastChecked = now();

            if (Math.random() < 0.5) {
                const message =
                    `I forgot the task: "${task.text}"`;

                logEvent(message);
                alert(message);
            } else {
                remainingItems.push(task);
            }
        }

        list.items = remainingItems;
    }
}

/* --------------------------------------------------
   Time simulation
-------------------------------------------------- */

function processInactivity() {
    if (now() - state.lastVisit >= INACTIVITY_LIMIT) {
        state.reminders = [];
        state.notes = [];
        state.lists = [];

        logEvent("Three days passed without a visit. Everything was forgotten.");

        state.lastVisit = now();
    }
}

function processTime() {
    processInactivity();
    processReminders();
    processNotes();
    processTasks();

    state.lastVisit = now();

    saveState();
    renderAll();
}

function advanceTime(amount) {
    state.demoTime += amount;

    logEvent(`Time advanced by ${formatDuration(amount)}.`);

    processTime();
}

function formatDuration(milliseconds) {
    const days = Math.floor(milliseconds / DAY);
    const hours = Math.floor((milliseconds % DAY) / HOUR);
    const minutes = Math.floor(
        (milliseconds % HOUR) / MINUTE
    );

    const parts = [];

    if (days > 0) {
        parts.push(`${days} day${days === 1 ? "" : "s"}`);
    }

    if (hours > 0) {
        parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
    }

    if (minutes > 0) {
        parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
    }

    return parts.length > 0 ? parts.join(", ") : "less than a minute";
}

function forceForgetting() {
    for (const note of [...state.notes]) {
        forgetNote(note);
    }

    for (const list of state.lists) {
        const forgottenTasks = [];

        for (const task of list.items) {
            if (Math.random() < 0.5) {
                forgottenTasks.push(task.text);
            }
        }

        list.items = list.items.filter(
            task => !forgottenTasks.includes(task.text)
        );
    }

    logEvent("Forced a forgetting cycle.");

    saveState();
    renderAll();
}

function resetApplication() {
    const confirmed = confirm(
        "Reset all memories, reminders, lists, and simulated time?"
    );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem(STORAGE_KEY);

    state = {
        demoMode: true,
        demoTime: Date.now(),
        lastVisit: Date.now(),
        reminders: [],
        notes: [],
        lists: [],
        eventLog: []
    };

    logEvent("Application reset.");

    saveState();
    renderAll();
}

/* --------------------------------------------------
   Rendering
-------------------------------------------------- */

function renderStatus() {
    if (!elements.memoryStatus) {
        return;
    }

    const totalMemories =
        state.reminders.length +
        state.notes.length +
        state.lists.length;

    elements.memoryStatus.textContent =
        `${totalMemories} memory item${totalMemories === 1 ? "" : "s"} stored`;
}

function renderClock() {
    if (!elements.simulatedDate) {
        return;
    }

    elements.simulatedDate.textContent = formatDate(now());
}

function renderReminders() {
    if (!elements.remindersContainer) {
        return;
    }

    if (state.reminders.length === 0) {
        elements.remindersContainer.innerHTML =
            `<p class="empty-state">No reminders yet.</p>`;
        return;
    }

    elements.remindersContainer.innerHTML = state.reminders
        .map(reminder => {
            let status = "Pending";

            if (reminder.completed) {
                status = "Succeeded";
            } else if (reminder.failed && reminder.regretShown) {
                status = "Forgot to remind you";
            } else if (reminder.failed) {
                status = "Failed";
            }

            return `
                <article class="memory-card reminder-card">
                    <div class="card-header">
                        <h3>${escapeHtml(reminder.text)}</h3>
                        <span class="badge">${status}</span>
                    </div>

                    <p>
                        Scheduled:
                        ${escapeHtml(formatDate(reminder.timestamp))}
                    </p>

                    <p>
                        Attempts:
                        ${reminder.attempts}
                    </p>

                    ${
                        !reminder.completed && !reminder.failed
                            ? `<p>${escapeHtml(
                                  formatRelativeTime(reminder.timestamp)
                              )}</p>`
                            : ""
                    }

                    <button
                        type="button"
                        class="danger delete-reminder"
                        data-id="${reminder.id}"
                    >
                        Delete
                    </button>
                </article>
            `;
        })
        .join("");
}

function renderNotes() {
    if (!elements.notesContainer) {
        return;
    }

    if (state.notes.length === 0) {
        elements.notesContainer.innerHTML =
            `<p class="empty-state">No notes yet.</p>`;
        return;
    }

    elements.notesContainer.innerHTML = state.notes
        .map(note => {
            return `
                <article class="memory-card note-card">
                    <div class="card-header">
                        <h3>${escapeHtml(note.title)}</h3>
                        <span class="badge">
                            ${escapeHtml(priorityName(note.priority))}
                        </span>
                    </div>

                    ${
                        note.topic
                            ? `<p class="topic">${escapeHtml(note.topic)}</p>`
                            : ""
                    }

                    <p>${escapeHtml(note.currentContent)}</p>

                    <p class="muted">
                        Memory strength:
                        ${Math.round(note.memoryStrength * 100)}%
                    </p>

                    <p class="muted">
                        Forgetting stage:
                        ${note.forgettingStage}
                    </p>

                    <button
                        type="button"
                        class="open-note"
                        data-id="${note.id}"
                    >
                        Open note
                    </button>
                </article>
            `;
        })
        .join("");
}

function renderLists() {
    if (!elements.listsContainer) {
        return;
    }

    if (state.lists.length === 0) {
        elements.listsContainer.innerHTML =
            `<p class="empty-state">No lists yet.</p>`;
        return;
    }

    elements.listsContainer.innerHTML = state.lists
        .map(list => {
            return `
                <article class="memory-card list-card">
                    <div class="card-header">
                        <h3>${escapeHtml(list.title)}</h3>

                        <button
                            type="button"
                            class="danger delete-list"
                            data-id="${list.id}"
                        >
                            Delete
                        </button>
                    </div>

                    <form
                        class="task-form"
                        data-list-id="${list.id}"
                    >
                        <input
                            type="text"
                            name="task"
                            placeholder="Add a task"
                            required
                        />

                        <button type="submit">
                            Add
                        </button>
                    </form>

                    ${
                        list.items.length === 0
                            ? `<p class="empty-state">No tasks yet.</p>`
                            : `
                                <ul class="task-list">
                                    ${list.items
                                        .map(task => {
                                            return `
                                                <li>
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            data-list-id="${list.id}"
                                                            data-task-id="${task.id}"
                                                            ${
                                                                task.completed
                                                                    ? "checked"
                                                                    : ""
                                                            }
                                                        />

                                                        <span class="${
                                                            task.completed
                                                                ? "completed"
                                                                : ""
                                                        }">
                                                            ${escapeHtml(
                                                                task.text
                                                            )}
                                                        </span>
                                                    </label>
                                                </li>
                                            `;
                                        })
                                        .join("")}
                                </ul>
                            `
                    }
                </article>
            `;
        })
        .join("");
}

function renderEventLog() {
    if (!elements.eventLog) {
        return;
    }

    if (state.eventLog.length === 0) {
        elements.eventLog.textContent = "No events yet.";
        return;
    }

    elements.eventLog.innerHTML = state.eventLog
        .slice(0, 20)
        .map(event => {
            return `
                <div class="event-entry">
                    <time>${escapeHtml(formatDate(event.timestamp))}</time>
                    <span>${escapeHtml(event.message)}</span>
                </div>
            `;
        })
        .join("");
}

function renderAll() {
    renderStatus();
    renderClock();
    renderReminders();
    renderNotes();
    renderLists();
    renderEventLog();
}

/* --------------------------------------------------
   Event listeners
-------------------------------------------------- */

function setupEventListeners() {
    if (elements.advanceDay) {
        elements.advanceDay.addEventListener("click", () => {
            advanceTime(DAY);
        });
    }

    if (elements.advanceWeek) {
        elements.advanceWeek.addEventListener("click", () => {
            advanceTime(WEEK);
        });
    }

    if (elements.forceForgetting) {
        elements.forceForgetting.addEventListener("click", () => {
            forceForgetting();
        });
    }

    if (elements.resetApp) {
        elements.resetApp.addEventListener("click", () => {
            resetApplication();
        });
    }

    if (elements.reminderForm) {
        elements.reminderForm.addEventListener("submit", event => {
            event.preventDefault();

            const text = elements.reminderText.value.trim();
            const dateTime = elements.reminderTime.value;

            if (!text || !dateTime) {
                return;
            }

            const timestamp = new Date(dateTime).getTime();

            if (Number.isNaN(timestamp)) {
                alert("Please enter a valid reminder time.");
                return;
            }

            createReminder(text, timestamp);

            elements.reminderForm.reset();
        });
    }

    if (elements.noteForm) {
        elements.noteForm.addEventListener("submit", event => {
            event.preventDefault();

            const title = elements.noteTitle.value.trim();
            const topic = elements.noteTopic.value.trim();
            const content = elements.noteContent.value.trim();
            const priority = elements.notePriority.value;

            if (!title || !content) {
                return;
            }

            createNote(title, topic, content, priority);

            elements.noteForm.reset();
        });
    }

    if (elements.listForm) {
        elements.listForm.addEventListener("submit", event => {
            event.preventDefault();

            const title = elements.listTitle.value.trim();

            if (!title) {
                return;
            }

            createList(title);

            elements.listForm.reset();
        });
    }

    if (elements.remindersContainer) {
        elements.remindersContainer.addEventListener("click", event => {
            const button = event.target.closest(".delete-reminder");

            if (!button) {
                return;
            }

            deleteReminder(button.dataset.id);
        });
    }

    if (elements.notesContainer) {
        elements.notesContainer.addEventListener("click", event => {
            const button = event.target.closest(".open-note");

            if (!button) {
                return;
            }

            openNote(button.dataset.id);
        });
    }

    if (elements.listsContainer) {
        elements.listsContainer.addEventListener("submit", event => {
            const form = event.target.closest(".task-form");

            if (!form) {
                return;
            }

            event.preventDefault();

            const input = form.elements.task;
            const text = input.value.trim();
            const listId = form.dataset.listId;

            if (!text) {
                return;
            }

            addTask(listId, text);
        });

        elements.listsContainer.addEventListener("change", event => {
            const checkbox = event.target.closest(
                'input[type="checkbox"][data-task-id]'
            );

            if (!checkbox) {
                return;
            }

            toggleTask(
                checkbox.dataset.listId,
                checkbox.dataset.taskId
            );
        });

        elements.listsContainer.addEventListener("click", event => {
            const button = event.target.closest(".delete-list");

            if (!button) {
                return;
            }

            deleteList(button.dataset.id);
        });
    }
}

/* --------------------------------------------------
   Startup
-------------------------------------------------- */

function initialize() {
    loadState();

    processInactivity();
    processReminders();
    processNotes();
    processTasks();

    state.lastVisit = now();

    setupEventListeners();
    renderAll();
    saveState();

    /*
      Real-time processing while the page remains open.
    */

    setInterval(() => {
        processTime();
    }, MINUTE);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
} else {
    initialize();
}