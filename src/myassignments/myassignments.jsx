import React, { useEffect, useState } from "react";
import "./myassignments.css";

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
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: "", className: "", dueDate: "" });

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
      const response = await fetch(`/api/assignments/${assignment.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Please log in to complete assignments."
            : "Could not complete assignment. Please try again."
        );
      }

      const completedAssignments = JSON.parse(
        localStorage.getItem("studytrack.completedAssignments") || "[]"
      );
      const remainingCompletedAssignments = completedAssignments.filter(
        (completedAssignment) => completedAssignment.id !== assignment.id
      );
      localStorage.setItem(
        "studytrack.completedAssignments",
        JSON.stringify([
          ...remainingCompletedAssignments,
          { ...assignment, completed: true, completedOn: new Date().toLocaleDateString() },
        ])
      );
      setAssignments((currentAssignments) =>
        currentAssignments.filter((currentAssignment) => currentAssignment.id !== assignment.id)
      );
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not complete assignment. Please try again.");
    }
  }

  async function deleteAssignment(assignmentId) {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Please log in to delete assignments."
            : "Could not delete assignment. Please try again."
        );
      }

      setAssignments((currentAssignments) =>
        currentAssignments.filter((assignment) => assignment.id !== assignmentId)
      );
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not delete assignment. Please try again.");
    }
  }

  function saveAssignment(assignmentId) {
    const name = editDraft.name.trim();
    const className = editDraft.className.trim();
    if (!name || !className || !editDraft.dueDate) {
      return;
    }

    setAssignments((currentAssignments) =>
      currentAssignments.map((assignment) =>
        assignment.id === assignmentId
          ? { ...assignment, name, className, dueDate: editDraft.dueDate }
          : assignment
      )
    );
    setEditingAssignmentId(null);
  }

  return (
    <main className="assignments-main">
      <div className="users">
        User: <span className="users">{username}</span>
      </div>
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
      <div className="assignment-table-toolbar">
        <h2 id="upcoming-heading">Upcoming Assignments</h2>
        <label className="assignment-filter" htmlFor="assignment-filter">
          Filter
          <input
            id="assignment-filter"
            type="search"
            aria-controls="upcoming-assignment-table"
            placeholder="Assignment, class, or date"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        </label>
      </div>
      <div className="responsive-table">
        <table
          className="assignment-table"
          id="upcoming-assignment-table"
          aria-labelledby="upcoming-heading"
        >
        <thead>
          <tr>
            <th className="assignment-edit-heading" scope="col">Actions</th>
            <th scope="col">Assignment</th>
            <th scope="col">Class</th>
            <th scope="col">Due date</th>
            <th className="assignment-checkbox-heading" scope="col">Done</th>
          </tr>
        </thead>
        <tbody>
          {filteredAssignments.map((assignment) => {
            const dueDateLabel = new Date(`${assignment.dueDate}T00:00:00`).toLocaleDateString(
              "en-US",
              { month: "long", day: "numeric", year: "numeric" }
            );

            return (
              <tr
                key={assignment.id}
                data-assignment-name={assignment.name}
                data-assignment-class={assignment.className}
                data-due-date={assignment.dueDate}
                data-due-date-label={dueDateLabel}
              >
                <td className="assignment-edit-cell">
                  {editingAssignmentId === assignment.id ? (
                    <>
                      <button
                        className="assignment-row-action assignment-row-save"
                        type="button"
                        onClick={() => saveAssignment(assignment.id)}
                      >
                        Save
                      </button>
                      <button
                        className="assignment-row-action assignment-row-cancel"
                        type="button"
                        onClick={() => setEditingAssignmentId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="assignment-icon-button assignment-edit-button"
                        type="button"
                        aria-label={`Edit ${assignment.name}`}
                        title="Edit assignment"
                        onClick={() => {
                          setEditDraft({
                            name: assignment.name,
                            className: assignment.className,
                            dueDate: assignment.dueDate,
                          });
                          setEditingAssignmentId(assignment.id);
                        }}
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button
                        className="assignment-icon-button assignment-delete-button"
                        type="button"
                        aria-label={`Delete ${assignment.name}`}
                        title="Delete assignment"
                        onClick={() => deleteAssignment(assignment.id)}
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24">
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="m19 6-1 14H6L5 6" />
                          <path d="M10 11v5M14 11v5" />
                        </svg>
                      </button>
                    </>
                  )}
                </td>
                <td>
                  {editingAssignmentId === assignment.id ? (
                    <input
                      className="assignment-row-input"
                      aria-label="Edit assignment name"
                      value={editDraft.name}
                      onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })}
                    />
                  ) : assignment.name}
                </td>
                <td>
                  {editingAssignmentId === assignment.id ? (
                    <input
                      className="assignment-row-input"
                      aria-label="Edit assignment class"
                      value={editDraft.className}
                      onChange={(event) => setEditDraft({ ...editDraft, className: event.target.value })}
                    />
                  ) : assignment.className}
                </td>
                <td>
                  {editingAssignmentId === assignment.id ? (
                    <input
                      className="assignment-row-input"
                      type="date"
                      aria-label="Edit assignment due date"
                      value={editDraft.dueDate}
                      onChange={(event) => setEditDraft({ ...editDraft, dueDate: event.target.value })}
                    />
                  ) : dueDateLabel}
                </td>
                <td className="assignment-checkbox-cell">
                  <input
                    className="assignment-checkbox"
                    type="checkbox"
                    checked={assignment.completed}
                    aria-label={`Mark ${assignment.name} complete`}
                    onChange={(event) => {
                      if (event.target.checked) {
                        completeAssignment(assignment);
                      }
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
      <p
        className="assignment-filter-empty"
        id="assignment-filter-empty"
        hidden={!filter.trim() || filteredAssignments.length > 0}
      >
        No assignments match that filter.
      </p>

      {error && <p role="alert">{error}</p>}

      <form className="assignment-actions" onSubmit={addAssignment}>
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
        <button className="assignment-form-submit" type="submit">
          Add Assignment
        </button>
      </form>
    </main>
  );
}