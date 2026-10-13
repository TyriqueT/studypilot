
const STORAGE_KEY = "studypilot-assignments-v1";

const form = document.getElementById("assignment-form");
const titleInput = document.getElementById("assignment-title");
const subjectInput = document.getElementById("assignment-subject");
const dueInput = document.getElementById("assignment-due");
const hoursInput = document.getElementById("assignment-hours");
const difficultyInput = document.getElementById("assignment-difficulty");
const filterInput = document.getElementById("task-filter");
const assignmentList = document.getElementById("assignment-list");
const priorityList = document.getElementById("priority-list");
const formMessage = document.getElementById("form-message");

let assignments = loadAssignments();

function loadAssignments() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) return [];
    return parsed.filter(task =>
      task &&
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.subject === "string" &&
      typeof task.dueDate === "string"
    );
  } catch (error) {
    console.warn("Could not load saved assignments.", error);
    return [];
  }
}

function saveAssignments() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
    return true;
  } catch (error) {
    console.error("Could not save assignments.", error);
    formMessage.textContent =
      "Your browser could not save changes. Check your browser storage settings.";
    return false;
  }
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(date.getTime())) return "Date not set";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function daysUntil(dateString) {
  const today = new Date(`${getToday()}T00:00:00`);
  const due = new Date(`${dateString}T00:00:00`);
  return Math.round((due - today) / 86400000);
}

function getPriority(task) {
  const days = daysUntil(task.dueDate);
  let score = 0;

  if (days < 0) score += 100;
  else if (days === 0) score += 80;
  else if (days === 1) score += 65;
  else if (days <= 3) score += 45;
  else if (days <= 7) score += 25;
  else score += 10;

  if (task.difficulty === "hard") score += 20;
  else if (task.difficulty === "medium") score += 10;

  if (Number(task.hours) >= 3) score += 10;
  else if (Number(task.hours) >= 2) score += 5;

  if (score >= 75) {
    return {
      label: "High",
      className: "priority-high",
      reason: days < 0
        ? "This assignment is overdue."
        : days === 0
          ? "This assignment is due today."
          : "A close deadline or challenging workload makes this a priority."
    };
  }

  if (score >= 45) {
    return {
      label: "Medium",
      className: "priority-medium",
      reason: "Plan time for this task soon so you don't fall behind."
    };
  }

  return {
    label: "Low",
    className: "priority-low",
    reason: "You have more time, but starting early can help."
  };
}

function renderStats() {
  const total = assignments.length;
  const completed = assignments.filter(task => task.completed).length;
  const remaining = total - completed;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("total-count").textContent = total;
  document.getElementById("completed-count").textContent = completed;
  document.getElementById("remaining-count").textContent = remaining;
  document.getElementById("progress-number").textContent = `${progress}%`;
  document.getElementById("progress-bar").style.width = `${progress}%`;
  document.getElementById("progress-bar").setAttribute("role", "progressbar");
  document.getElementById("progress-bar").setAttribute("aria-valuenow", progress);
  document.getElementById("progress-bar").setAttribute("aria-valuemin", "0");
  document.getElementById("progress-bar").setAttribute("aria-valuemax", "100");
  document.getElementById("list-count").textContent =
    `${total} ${total === 1 ? "task" : "tasks"}`;
}

function renderAssignments() {
  assignmentList.replaceChildren();

  const filter = filterInput.value;
  let visible = assignments.filter(task => {const body = makeElement("div", "task-body");
body.append(
  makeElement("p", "task-title", task.title),
  makeElement(
    "div",
    "task-meta",
    `${task.subject} · Due ${formatDate(task.dueDate)} · ${task.hours} hr`
  )
);
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  visible.sort((a, b) => {
    if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
    return getPriority(b).label.localeCompare(getPriority(a).label) ||
      a.dueDate.localeCompare(b.dueDate);
  });

  if (visible.length === 0) {
    const empty = makeElement("div", "empty-state");
    empty.append(
      makeElement("span", "empty-icon", "✧"),
      makeElement("h3", "", filter === "completed"
        ? "Nothing completed just yet"
        : filter === "active"
          ? "You're all caught up!"
          : "Your study journey starts here"),
      makeElement("p", "", filter === "all"
        ? "Add your first assignment using the form above."
        : "Try another filter or add a new assignment.")
    );
    assignmentList.append(empty);
    return;
  }

  visible.forEach(task => {
    const card = makeElement(
      "article",
      `task-card${task.completed ? " is-complete" : ""}`
    );

    const checkbox = makeElement("input", "task-check");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Mark ${task.title} as complete`);
    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      saveAssignments();
      renderAll();
    });

   
const body = makeElement("div", "task-body");
const meta = makeElement(
  "div",
  "task-meta",
  `${task.subject} · Due ${formatDate(task.dueDate)} · ${task.hours} hr`
);

body.append(
  makeElement("p", "task-title", task.title),
  meta
);

if (!task.completed) {
  const days = daysUntil(task.dueDate);
  let label;
  let className;

  if (days < 0) {
    label = `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
    className = "deadline-overdue";
  } else if (days === 0) {
    label = "Due today";
    className = "deadline-today";
  } else if (days === 1) {
    label = "Due tomorrow";
    className = "deadline-soon";
  } else if (days <= 3) {
    label = `Due in ${days} days`;
    className = "deadline-soon";
  } else {
    label = "Plenty of time";
    className = "deadline-later";
  }

  body.append(makeElement("span", `deadline-label ${className}`, label));
}


    const actions = makeElement("div", "task-actions");
    const priority = getPriority(task);
    const badge = makeElement("span", `priority-badge ${priority.className}`, priority.label);
    actions.append(badge);

    const removeButton = makeElement("button", "delete-button", "×");
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Delete ${task.title}`);
    removeButton.title = "Delete assignment";
    removeButton.addEventListener("click", () => {
      const confirmed = window.confirm(`Delete "${task.title}"?`);
      if (!confirmed) return;

      assignments = assignments.filter(item => item.id !== task.id);
      saveAssignments();
      renderAll();
    });

    actions.append(removeButton);
    card.append(checkbox, body, actions);
    assignmentList.append(card);
  });
}

function renderPriorities() {
  priorityList.replaceChildren();

  const upcoming = assignments
    .filter(task => !task.completed)
    .sort((a, b) => {
      const priorityDifference =
        ["High", "Medium", "Low"].indexOf(getPriority(b).label) -
        ["High", "Medium", "Low"].indexOf(getPriority(a).label);

      return priorityDifference || a.dueDate.localeCompare(b.dueDate);
    })
    .slice(0, 4);

  if (upcoming.length === 0) {
    priorityList.append(
      makeElement("p", "muted",
        assignments.length
          ? "Great work! You have no unfinished assignments."
          : "Add an assignment to see your recommended priorities.")
    );
    return;
  }

  upcoming.forEach(task => {
    const priority = getPriority(task);
    const card = makeElement("article", "priority-item");
    const top = makeElement("div", "priority-item-top");
    const details = makeElement("div");
    details.append(
      makeElement("h3", "", task.title),
      makeElement("p", "", `${task.subject} · Due ${formatDate(task.dueDate)}`)
    );

    top.append(details, makeElement(
      "span",
      `priority-badge ${priority.className}`,
      priority.label
    ));

    card.append(top, makeElement("p", "priority-reason", priority.reason));
    priorityList.append(card);
  });
}

function renderAll() {
  renderStats();
  renderAssignments();
  renderPriorities();
}

form.addEventListener("submit", event => {
  event.preventDefault();
  formMessage.textContent = "";

  const title = titleInput.value.trim();
  const subject = subjectInput.value.trim();
  const dueDate = dueInput.value;

  if (!title || !subject || !dueDate) {
    formMessage.textContent = "Please fill in all required fields.";
    return;
  }

  if (dueDate < getToday()) {
    formMessage.textContent =
      "That due date is in the past. Choose today or a future date.";
    return;
  }

  const task = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title,
    subject,
    dueDate,
    hours: Number(hoursInput.value),
    difficulty: difficultyInput.value,
    completed: false
  };

  assignments.push(task);

  if (!saveAssignments()) {
    assignments = assignments.filter(item => item.id !== task.id);
    renderAll();
    return;
  }

  form.reset();
  hoursInput.value = "1";
  difficultyInput.value = "medium";
  dueInput.value = "";
  formMessage.textContent = "Assignment added! Keep up the great work.";
  filterInput.value = "all";
  renderAll();
});

filterInput.addEventListener("change", renderAssignments);

renderAll();


/* Focus timer: 25-minute study sessions */
const timerDisplay = document.getElementById("timer-display");
const timerStatus = document.getElementById("timer-status");
const timerStart = document.getElementById("timer-start");
const timerReset = document.getElementById("timer-reset");

const FOCUS_SECONDS = 25 * 60;
let secondsRemaining = FOCUS_SECONDS;
let timerInterval = null;

function updateTimerDisplay() {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeText =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  timerDisplay.textContent = timeText;
  timerDisplay.setAttribute("aria-label", `${minutes} minutes ${seconds} seconds remaining`);
  document.title = timerInterval
    ? `${timeText} · StudyPilot`
    : "StudyPilot | Your Learning, On Course";
}

function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerStart.textContent = "Start focus";
}

function startTimer() {
  if (timerInterval !== null) {
    stopTimer();
    timerStatus.textContent = "Paused. Resume when you're ready.";
    updateTimerDisplay();
    return;
  }

  if (secondsRemaining <= 0) {
    timerStatus.textContent = "Session complete! Reset for another round.";
    return;
  }

  timerStart.textContent = "Pause";
  timerStatus.textContent = "You're doing great. Keep your focus.";

  timerInterval = setInterval(() => {
    secondsRemaining -= 1;
    updateTimerDisplay();

    if (secondsRemaining <= 0) {
      stopTimer();
      secondsRemaining = 0;
      updateTimerDisplay();
      timerStatus.textContent = "Focus session complete! Take a short break.";
      timerStart.textContent = "Completed";
      timerStart.disabled = true;
    }
  }, 1000);
}

timerStart.addEventListener("click", startTimer);

timerReset.addEventListener("click", () => {
  stopTimer();
  secondsRemaining = FOCUS_SECONDS;
  timerStart.disabled = false;
  timerStatus.textContent = "Ready when you are.";
  updateTimerDisplay();
});

updateTimerDisplay();
