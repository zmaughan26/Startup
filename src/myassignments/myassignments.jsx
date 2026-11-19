import React, { useEffect, useState } from "react";
import "./myassignments.css";

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function nthWeekday(year, month, weekday, occurrence) {
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month, 1 + offset + (occurrence - 1) * 7);
}

function lastWeekday(year, month, weekday) {
  const last = new Date(year, month + 1, 0);
  return new Date(year, month, last.getDate() - ((last.getDay() - weekday + 7) % 7));
}

function observedHoliday(year, month, day) {
  const date = new Date(year, month, day);
  if (date.getDay() === 6) date.setDate(date.getDate() - 1);
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return date;
}

function getHolidays(year) {
  const holidays = [
    ["New Year's Day", observedHoliday(year, 0, 1)],
    ["Martin Luther King Jr. Day", nthWeekday(year, 0, 1, 3)],
    ["Presidents' Day", nthWeekday(year, 1, 1, 3)],
    ["Memorial Day", lastWeekday(year, 4, 1)],
    ["Juneteenth", observedHoliday(year, 5, 19)],
    ["Independence Day", observedHoliday(year, 6, 4)],
    ["Labor Day", nthWeekday(year, 8, 1, 1)],
    ["Columbus Day", nthWeekday(year, 9, 1, 2)],
    ["Veterans Day", observedHoliday(year, 10, 11)],
    ["Thanksgiving", nthWeekday(year, 10, 4, 4)],
    ["Christmas Day", observedHoliday(year, 11, 25)],
  ];

  return holidays.reduce((result, [name, date]) => {
    const key = dateKey(date.getFullYear(), date.getMonth(), date.getDate());
    result[key] = [...(result[key] || []), name];
    return result;
  }, {});
}

export function MyAssignments() {
  const username = localStorage.getItem("username") || "Guest";
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [newAssignmentName, setNewAssignmentName] = useState("");
  const [newAssignmentClass, setNewAssignmentClass] = useState("");
  const [newAssignmentDueDate, setNewAssignmentDueDate] = useState("");
  const [filter, setFilter] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    let ignore = false;

    async function loadAssignments() {
      try {
        const response = await fetch("/api/assignments");
        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Please log in to view your assignments."
              : "Could not load assignments. Please try again."
          );
        }
        const loadedAssignments = await response.json();
        if (!ignore) {
          setAssignments(loadedAssignments);
          setError("");
        }
      } catch (requestError) {
        if (!ignore) {
          setError(requestError.message || "Could not load assignments. Please try again.");
        }
      }
    }

    loadAssignments();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadQuote() {
      try {
        const response = await fetch("https://dummyjson.com/quotes/random");
        if (!response.ok) {
          throw new Error("Quote request failed.");
        }

        const result = await response.json();
        if (typeof result.quote !== "string" || typeof result.author !== "string") {
          throw new Error("Quote response was invalid.");
        }

        if (!ignore) {
          setQuote(result);
        }
      } catch {
        if (!ignore) {
          setQuoteError("Could not load a quote right now.");
        }
      }
    }

    loadQuote();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredAssignments = assignments.filter((assignment) => {
    const searchText = `${assignment.name} ${assignment.className} ${assignment.dueDate}`.toLowerCase();
    return searchText.includes(filter.trim().toLowerCase());
  });

  async function addAssignment(event) {
    event.preventDefault();
    const name = newAssignmentName.trim();
    const className = newAssignmentClass.trim();
    if (!name || !className || !newAssignmentDueDate) {
      return;
    }

    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, className, dueDate: newAssignmentDueDate }),
      });
      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Please log in to add assignments."
            : "Could not save assignment. Please try again."
        );
      }

      const savedAssignment = await response.json();
      setAssignments((currentAssignments) => [...currentAssignments, savedAssignment]);
      setNewAssignmentName("");
      setNewAssignmentClass("");
      setNewAssignmentDueDate("");
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not save assignment. Please try again.");
    }
  }

  async function completeAssignment(assignment) {
    try {
      const response = await fetch(`/api/assignments/${assignment.id}/completion`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Please log in to complete assignments."
            : "Could not complete assignment. Please try again."
        );
      }

      setAssignments((currentAssignments) =>
        currentAssignments.filter((currentAssignment) => currentAssignment.id !== assignment.id)
      );
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not complete assignment. Please try again.");
    }
  }

  const visibleYear = visibleMonth.getFullYear();
  const visibleMonthIndex = visibleMonth.getMonth();
  const monthStart = new Date(visibleYear, visibleMonthIndex, 1);
  const gridStart = new Date(visibleYear, visibleMonthIndex, 1 - monthStart.getDay());
  const holidays = getHolidays(visibleYear);
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  function changeMonth(offset) {
    setVisibleMonth((current) =>
      new Date(current.getFullYear(), current.getMonth() + offset, 1)
    );
  }

  return (
    <main className="assignments-main calendar-main">
      <header className="calendar-header">
        <div>
          <p className="calendar-eyebrow">CALENDAR</p>
          <h1>
            {visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h1>
        </div>
        <div className="calendar-controls">
          <button type="button" onClick={() => {
            const today = new Date();
            setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
          }}>Today</button>
          <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)}>‹</button>
          <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}>›</button>
        </div>
      </header>

      <div className="calendar-toolbar">
        <label htmlFor="assignment-filter">
          Filter assignments
          <input
            id="assignment-filter"
            type="search"
            placeholder="Name, class, or date"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        </label>
        <span className="calendar-user">User: {username}</span>
      </div>

      <section className="calendar-grid" aria-label={`${visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })} assignment calendar`}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div className="calendar-weekday" key={day}>{day}</div>
        ))}
        {calendarDays.map((date) => {
          const key = dateKey(date.getFullYear(), date.getMonth(), date.getDate());
          const inVisibleMonth = date.getMonth() === visibleMonthIndex;
          const dayAssignments = filteredAssignments.filter(
            (assignment) => assignment.dueDate === key
          );
          const dayHolidays = holidays[key] || [];
          const isToday = key === dateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

          return (
            <article
              className={`calendar-day${inVisibleMonth ? "" : " outside-month"}${isToday ? " today" : ""}`}
              key={key}
            >
              <div className="calendar-date">{date.getDate()}</div>
              {dayHolidays.map((holiday) => (
                <div className="calendar-holiday" key={holiday}>{holiday}</div>
              ))}
              {dayAssignments.map((assignment) => (
                <div className="calendar-assignment" key={assignment.id}>
                  <label className="calendar-assignment-label">
                    <input
                      type="checkbox"
                      checked={assignment.completed}
                      aria-label={`Mark ${assignment.name} complete`}
                      onChange={(event) => event.target.checked && completeAssignment(assignment)}
                    />
                    <span>
                      <strong>{assignment.name}</strong>
                      <small>{assignment.className}</small>
                    </span>
                  </label>
                </div>
              ))}
            </article>
          );
        })}
      </section>

      {error && <p className="calendar-error" role="alert">{error}</p>}

      <form className="calendar-add-form" onSubmit={addAssignment}>
        <h2>Add assignment</h2>
        <input
          type="text"
          aria-label="New assignment name"
          placeholder="Assignment name"
          value={newAssignmentName}
          onChange={(event) => setNewAssignmentName(event.target.value)}
          required
        />
        <input
          type="text"
          aria-label="New assignment class"
          placeholder="Class"
          value={newAssignmentClass}
          onChange={(event) => setNewAssignmentClass(event.target.value)}
          required
        />
        <input
          type="date"
          aria-label="New assignment due date"
          value={newAssignmentDueDate}
          onChange={(event) => setNewAssignmentDueDate(event.target.value)}
          required
        />
        <button type="submit">Add Assignment</button>
      </form>

      <section className="daily-quote" aria-label="Quote of the day">
        <h2>Study inspiration</h2>
        {quote ? (
          <blockquote>
            <p>“{quote.quote}”</p>
            <cite>— {quote.author}</cite>
          </blockquote>
        ) : (
          <p role={quoteError ? "alert" : undefined}>
            {quoteError || "Loading an inspirational quote..."}
          </p>
        )}
      </section>
    </main>
  );
}