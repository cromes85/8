document.addEventListener("DOMContentLoaded", () => {
  const employeeNameInput = document.getElementById("employee-name");
  const dateInput = document.getElementById("date");
  const entryTimeInput = document.getElementById("entry-time");
  const exitTimeInput = document.getElementById("exit-time");
  const commentsInput = document.getElementById("comments");
  const addButton = document.getElementById("add-button");
  const absentButton = document.getElementById("absent-button");
  const filterEmployeeInput = document.getElementById("filter-employee");
  const filterButton = document.getElementById("filter-button");
  const exportButton = document.getElementById("export-button");
  const calendarTableBody = document.querySelector("#calendar-table tbody");
  const monthYearLabel = document.getElementById("month-year");
  const prevMonthButton = document.getElementById("prev-month");
  const nextMonthButton = document.getElementById("next-month");
  const contextMenu = document.getElementById("context-menu");
  const editEventButton = document.getElementById("edit-event");
  const deleteEventButton = document.getElementById("delete-event");

  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let events = JSON.parse(localStorage.getItem("events")) || [];
  let selectedEvent = null;

  addButton.addEventListener("click", () => {
    const name = employeeNameInput.value;
    const date = dateInput.value;
    const entryTime = entryTimeInput.value;
    const exitTime = exitTimeInput.value;
    const comments = commentsInput.value;

    if (name && date) {
      const event = {
        id: Date.now(),
        name: name,
        date: date,
        entryTime: entryTime || null,
        exitTime: exitTime || null,
        comments: comments || null,
        absent: false,
        author: name,
      };

      events.push(event);
      localStorage.setItem("events", JSON.stringify(events));
      renderCalendar(currentMonth, currentYear);
      clearForm();
    } else {
      alert("Veuillez remplir les champs obligatoires (nom et date).");
    }
  });

  absentButton.addEventListener("click", () => {
    const name = employeeNameInput.value;
    const date = dateInput.value;
    const comments = commentsInput.value;

    if (name && date) {
      const event = {
        id: Date.now(),
        name: name,
        date: date,
        entryTime: null,
        exitTime: null,
        comments: comments || null,
        absent: true,
        author: name,
      };

      events.push(event);
      localStorage.setItem("events", JSON.stringify(events));
      renderCalendar(currentMonth, currentYear);
      clearForm();
    } else {
      alert("Veuillez remplir les champs obligatoires (nom et date).");
    }
  });

  filterButton.addEventListener("click", () => {
    renderCalendar(currentMonth, currentYear);
  });

  exportButton.addEventListener("click", () => {
    exportToCSV(events);
  });

  prevMonthButton.addEventListener("click", () => {
    currentMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    currentYear = currentMonth === 11 ? currentYear - 1 : currentYear;
    renderCalendar(currentMonth, currentYear);
  });

  nextMonthButton.addEventListener("click", () => {
    currentMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    currentYear = currentMonth === 0 ? currentYear + 1 : currentYear;
    renderCalendar(currentMonth, currentYear);
  });

  function renderCalendar(month, year) {
    calendarTableBody.innerHTML = "";
    monthYearLabel.textContent = `${new Date(year, month).toLocaleString(
      "default",
      { month: "long" }
    )} ${year}`;

    const firstDay = new Date(year, month).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const filterEmployee = filterEmployeeInput.value.toLowerCase();

    let date = 1;

    for (let i = 0; i < 6; i++) {
      const row = document.createElement("tr");

      for (let j = 0; j < 7; j++) {
        const cell = document.createElement("td");
        cell.classList.add("day");

        if (i === 0 && j < firstDay) {
          cell.textContent = "";
        } else if (date > daysInMonth) {
          break;
        } else {
          cell.textContent = date;
          const cellDate = new Date(year, month, date)
            .toISOString()
            .split("T")[0];

          events.forEach((event) => {
            if (
              event.date === cellDate &&
              (event.name.toLowerCase().includes(filterEmployee) ||
                !filterEmployee)
            ) {
              const eventDiv = document.createElement("div");
              eventDiv.classList.add("event");
              eventDiv.dataset.eventId = event.id;

              if (event.absent) {
                eventDiv.classList.add("absent");
                eventDiv.textContent = `${event.name}: Absent`;
              } else if (event.entryTime && event.exitTime) {
                const entryTime = new Date(`1970-01-01T${event.entryTime}:00`);
                const exitTime = new Date(`1970-01-01T${event.exitTime}:00`);
                const hoursWorked = (
                  (exitTime - entryTime) /
                  1000 /
                  60 /
                  60
                ).toFixed(2);
                eventDiv.textContent = `${event.name}: ${hoursWorked}h`;
              } else {
                eventDiv.textContent = `${event.name}: Temps non spécifié`;
              }

              const eventDetails = document.createElement("div");
              eventDetails.classList.add("event-details");
              eventDetails.textContent = `Nom: ${event.name}\nDate: ${
                event.date
              }\nHeure d'entrée: ${
                event.entryTime || "N/A"
              }\nHeure de sortie: ${event.exitTime || "N/A"}\nCommentaires: ${
                event.comments || "N/A"
              }`;
              eventDiv.appendChild(eventDetails);

              eventDiv.addEventListener("mouseover", (e) => {
                const rect = eventDiv.getBoundingClientRect();
                if (rect.bottom + 200 > window.innerHeight) {
                  eventDetails.style.top = "auto";
                  eventDetails.style.bottom = "0";
                } else {
                  eventDetails.style.top = "0";
                  eventDetails.style.bottom = "auto";
                }
              });

              eventDiv.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                if (event.author === employeeNameInput.value) {
                  selectedEvent = event;
                  contextMenu.style.top = `${e.clientY}px`;
                  contextMenu.style.left = `${e.clientX}px`;
                  contextMenu.style.display = "block";
                }
              });

              cell.appendChild(eventDiv);
            }
          });

          date++;
        }

        row.appendChild(cell);
      }

      calendarTableBody.appendChild(row);
    }
  }

  function clearForm() {
    employeeNameInput.value = "";
    dateInput.value = "";
    entryTimeInput.value = "";
    exitTimeInput.value = "";
    commentsInput.value = "";
  }

  function exportToCSV(events) {
    const headers = [
      "Nom",
      "Date",
      "Heure d'entrée",
      "Heure de sortie",
      "Commentaires",
      "Absent",
    ];
    const rows = events.map((event) => [
      event.name,
      event.date,
      event.entryTime || "",
      event.exitTime || "",
      event.comments || "",
      event.absent ? "Oui" : "Non",
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "heures_de_travail.csv");
    document.body.appendChild(link);
    link.click();
  }

  editEventButton.addEventListener("click", () => {
    if (selectedEvent) {
      employeeNameInput.value = selectedEvent.name;
      dateInput.value = selectedEvent.date;
      entryTimeInput.value = selectedEvent.entryTime;
      exitTimeInput.value = selectedEvent.exitTime;
      commentsInput.value = selectedEvent.comments;
      events = events.filter((event) => event.id !== selectedEvent.id);
      localStorage.setItem("events", JSON.stringify(events));
      renderCalendar(currentMonth, currentYear);
      contextMenu.style.display = "none";
    }
  });

  deleteEventButton.addEventListener("click", () => {
    if (selectedEvent) {
      events = events.filter((event) => event.id !== selectedEvent.id);
      localStorage.setItem("events", JSON.stringify(events));
      renderCalendar(currentMonth, currentYear);
      contextMenu.style.display = "none";
    }
  });

  document.addEventListener("click", () => {
    contextMenu.style.display = "none";
  });

  renderCalendar(currentMonth, currentYear);
});
