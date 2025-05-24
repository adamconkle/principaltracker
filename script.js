const categories = {
  Category: "gray",
  Email: "blue",
  Convo: "purple",
  "Create document": "green",
  "Site visit": "orange",
  Presentation: "red",
  "Get supplies": "teal",
  Purchase: "gold",
};

let todos = JSON.parse(localStorage.getItem("todos")) || [];
let currentView = "all";

function renderTodos() {
  const list = document.getElementById("todo-list");
  list.innerHTML = "";

  const filtered = todos.filter(todo => {
  if (currentView === "archived") return todo.archived;
  if (currentView === "completed") return todo.completed && !todo.archived;
  // Default "To-Do" view: only not completed and not archived
  return !todo.archived && !todo.completed;
});


  filtered.forEach((todo, i) => {
    const li = document.createElement("li");
    li.setAttribute("draggable", "true");
    li.dataset.index = todos.indexOf(todo);
    li.style.borderLeftColor = categories[todo.category] || "gray";
    if (todo.completed) li.style.textDecoration = "line-through";

    li.innerHTML = `
  <div style="flex: 1;">
    <span onclick="openModal(${li.dataset.index})" style="display: block; word-wrap: break-word;">${todo.text}</span>
    ${todo.dueDate ? `<div style="font-size: 0.85em; color: #777;">Due: ${todo.dueDate}</div>` : ""}
    ${todo.completed && todo.completedDate ? `<div style="font-size: 0.85em; color: #555;">Completed: ${todo.completedDate}</div>` : ""}
  </div>
  <div style="display: flex; align-items: center; gap: 12px;">
    <select onchange="changeCategory(${li.dataset.index}, this.value)">
      ${Object.keys(categories).map(
        cat => `<option value="${cat}" ${todo.category === cat ? "selected" : ""}>${cat}</option>`
      ).join("")}
    </select>
    <button class="complete-btn" onclick="completeItem(${li.dataset.index})">✔</button>
    <button class="archive-btn" onclick="archiveItem(${li.dataset.index})">🗄</button>

  </div>
`;



    li.addEventListener("dragstart", () => li.classList.add("dragging"));
    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      saveTodos();
    });

    list.appendChild(li);
  });

  enableDragAndDrop();
  saveTodos();
}

function addItem() {
  todos.push({ text: "New Task", category: "Category", archived: false, completed: false });
  renderTodos();
}

function changeCategory(index, category) {
  todos[index].category = category;
  renderTodos();
}

let editIndex = null;
function openModal(index) {
  editIndex = index;
  document.getElementById("edit-text").value = todos[index].text;
  const catSelect = document.getElementById("edit-category");
  catSelect.innerHTML = Object.keys(categories).map(
    c => `<option value="${c}" ${todos[index].category === c ? "selected" : ""}>${c}</option>`
  ).join("");
  document.getElementById("edit-due-date").value = todos[index].dueDate || "";
  document.getElementById("edit-modal").classList.remove("hidden");
}
function saveEdit() {
  todos[editIndex].text = document.getElementById("edit-text").value;
  todos[editIndex].category = document.getElementById("edit-category").value;
  todos[editIndex].dueDate = document.getElementById("edit-due-date").value;
  closeModal();
  renderTodos();
}
function closeModal() {
  document.getElementById("edit-modal").classList.add("hidden");
}

function completeItem(index) {
  const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  if (!todos[index].completed) {
    todos[index].completed = true;
    todos[index].completedDate = now;
  } else {
    todos[index].completed = false;
    delete todos[index].completedDate;
  }
  renderTodos();
}

function archiveItem(index) {
  todos[index].archived = !todos[index].archived;
  renderTodos();
}

function showSection(section) {
  currentView = section;
  renderTodos();
}

//NOT mobile friendly
/*
function enableDragAndDrop() {
  const list = document.getElementById("todo-list");
  list.addEventListener("dragover", e => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    const after = [...list.children].find(li => {
      return e.clientY < li.getBoundingClientRect().top + li.offsetHeight / 2;
    });
    if (after) {
      list.insertBefore(dragging, after);
    } else {
      list.appendChild(dragging);
    }
  });

  list.addEventListener("drop", () => {
    todos = [...list.children].map(li => todos[+li.dataset.index]);
    renderTodos();
  });
}
*/

//mobile-friendly drag and drop
function enableDragAndDrop() {
  const list = document.getElementById("todo-list");
  let draggedEl = null;
  let touchStartY = 0;
  let moved = false;

  [...list.children].forEach(item => {
    item.ontouchstart = (e) => {
      draggedEl = item;
      touchStartY = e.touches[0].clientY;
      moved = false;
      item.classList.add("dragging");
    };

    item.ontouchmove = (e) => {
      e.preventDefault(); // Prevent scroll
      const moveY = e.touches[0].clientY;
      const delta = moveY - touchStartY;
      if (Math.abs(delta) > 5) moved = true;

      draggedEl.style.transform = `translateY(${delta}px)`;
      const siblings = [...list.children].filter(el => el !== draggedEl);
      for (const sibling of siblings) {
        const rect = sibling.getBoundingClientRect();
        if (moveY < rect.top + rect.height / 2) {
          list.insertBefore(draggedEl, sibling);
          break;
        }
      }
    };
    item.ontouchend = (e) => {
  draggedEl.classList.remove("dragging");
  draggedEl.style.transform = "";

  if (!moved) {
    const touchedElement = document.elementFromPoint(
      e.changedTouches[0].clientX,
      e.changedTouches[0].clientY
    );

    // Only open modal if the touch was NOT on a button or select
    if (
      touchedElement.tagName !== "BUTTON" &&
      touchedElement.tagName !== "SELECT"
    ) {
      const index = draggedEl.dataset.index;
      openModal(index);
    }
  } else {
    // treat as drag
    todos = [...list.children].map(li => todos[+li.dataset.index]);
    renderTodos();
  }

  draggedEl = null;
};

    /*item.ontouchend = (e) => {
      draggedEl.classList.remove("dragging");
      draggedEl.style.transform = "";

      if (!moved) {
        // treat as tap
        const index = draggedEl.dataset.index;
        openModal(index);
      } else {
        // treat as drag
        todos = [...list.children].map(li => todos[+li.dataset.index]);
        renderTodos();
      }

      draggedEl = null;
    };*/
  });
}



function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

renderTodos();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("Service Worker registered:", reg))
      .catch(err => console.error("Service Worker failed:", err));
  });
}

