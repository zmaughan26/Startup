import React, { useEffect, useState } from "react";
import "./home.css";

export function Home({ username }) {
  const [assignments, setAssignments] = useState([]);
  const [completedAssignments, setCompletedAssignments] = useState([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: "", className: "", dueDate: "" });

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      try {
        const [upcomingResponse, completedResponse] = await Promise.all([
          fetch("/api/assignments"),
          fetch("/api/assignments?completed=true"),
        ]);

        if (!upcomingResponse.ok || !completedResponse.ok) {
          throw new Error("Could not load your dashboard.");
        }

        const [upcoming, completed] = await Promise.all([
          upcomingResponse.json(),
          completedResponse.json(),
        ]);

        if (!ignore) {
          setAssignments(upcoming);
          setCompletedAssignments(
            completed.map((assignment) => ({ ...assignment, completed: true }))
          );
          setError("");
        }
      } catch (requestError) {
        if (!ignore) {
          setError(requestError.message || "Could not load your dashboard.");
        }
      }
    }

    loadDashboard();
    return () => {
      ignore = true;
    };
  }, []);

  async function addAssignment(event) {
    event.preventDefault();
    if (!name.trim() || !className.trim() || !dueDate) return;

    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), className: className.trim(), dueDate }),
      });
      if (!response.ok) throw new Error("Could not add assignment.");

      const assignment = await response.json();
      setAssignments((current) => [...current, assignment]);
      setName("");
      setClassName("");
      setDueDate("");
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not add assignment.");
    }
  }

  async function completeAssignment(assignment) {
    try {
      const response = await fetch(`/api/assignments/${assignment.id}/completion`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
      if (!response.ok) throw new Error("Could not complete assignment.");

      setAssignments((current) => current.filter((item) => item.id !== assignment.id));
      setCompletedAssignments((current) => [...current, { ...assignment, completed: true }]);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not complete assignment.");
    }
  }

  async function reopenAssignment(assignment) {
    try {
      const response = await fetch(`/api/assignments/${assignment.id}/completion`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: false }),
      });
      if (!response.ok) throw new Error("Could not reopen assignment.");

      setCompletedAssignments((current) =>
        current.filter((item) => item.id !== assignment.id)
      );
      setAssignments((current) => [...current, { ...assignment, completed: false }]);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not reopen assignment.");
    }
  }

  async function saveAssignment(assignment) {
    const updated = {
      name: editDraft.name.trim(),
      className: editDraft.className.trim(),
      dueDate: editDraft.dueDate,
    };
    if (!updated.name || !updated.className || !updated.dueDate) return;

    try {
      const response = await fetch(`/api/assignments/${assignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!response.ok) throw new Error("Could not update assignment.");

      const savedAssignment = await response.json();
      const updateList = (current) =>
        current.map((item) => item.id === assignment.id ? savedAssignment : item);
      setAssignments(updateList);
      setCompletedAssignments(updateList);
      setEditingId(null);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not update assignment.");
    }
  }

  async function deleteAssignment(assignment) {
    try {
      const response = await fetch(`/api/assignments/${assignment.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Could not delete assignment.");

      setAssignments((current) => current.filter((item) => item.id !== assignment.id));
      setCompletedAssignments((current) =>
        current.filter((item) => item.id !== assignment.id)
      );
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not delete assignment.");
    }
  }

  const completedCount = completedAssignments.length;
  const listAssignments =
    filter === "Done"
      ? completedAssignments
      : filter === "To do"
        ? assignments
        : [...assignments, ...completedAssignments];
  const filteredAssignments = listAssignments;

  return (
    <main className="dashboard-shell">
      <section className="dashboard-main">
        <header className="dashboard-page-header">
          <div>
            <p className="dashboard-sync">— &nbsp; YOUR SCHOOL, IN SYNC</p>
            <h1>My assignments.</h1>
            <p>A little more organized, a lot less overwhelming.</p>
          </div>
        </header>

        <div className="dashboard-stats">
          <article>
            <div><span>Total assignments</span><span className="stat-icon">▣</span></div>
            <strong>{assignments.length + completedCount}</strong>
            <p><span /> Everything on your plate</p>
          </article>
          <article>
            <div><span>To do</span><span className="stat-icon todo">◉</span></div>
            <strong>{assignments.length}</strong>
            <p><span /> Ready when you are</p>
          </article>
          <article>
            <div><span>Completed</span><span className="stat-icon done">✓</span></div>
            <strong>{completedCount}</strong>
            <p><span /> {assignments.length + completedCount === 0
              ? "0%"
              : `${Math.round((completedCount / (assignments.length + completedCount)) * 100)}%`} of your list complete</p>
          </article>
        </div>

        {error && <p className="dashboard-error" role="alert">{error}</p>}

        <div className="dashboard-columns">
          <section className="dashboard-list-card">
            <header>
              <div>
                <h2>Your list</h2>
                <p>Keep an eye on what's coming up.</p>
              </div>
              <div className="dashboard-filters" aria-label="Assignment filter">
                {["All", "To do", "Done"].map((option) => (
                  <button
                    type="button"
                    className={filter === option ? "active" : ""}
                    key={option}
                    onClick={() => setFilter(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </header>

            <div className="dashboard-assignment-list">
              {filteredAssignments.length === 0 ? (
                <p className="dashboard-empty">You're caught up. No assignments are listed.</p>
              ) : filteredAssignments.map((assignment) => (
                <article
                  className={`dashboard-assignment${assignment.completed ? " completed" : ""}`}
                  key={assignment.id}
                >
                  {editingId === assignment.id ? (
                    <form
                      className="dashboard-assignment-edit"
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveAssignment(assignment);
                      }}
                    >
                      <input
                        aria-label="Assignment name"
                        value={editDraft.name}
                        onChange={(event) =>
                          setEditDraft({ ...editDraft, name: event.target.value })
                        }
                        required
                      />
                      <input
                        aria-label="Class or subject"
                        value={editDraft.className}
                        onChange={(event) =>
                          setEditDraft({ ...editDraft, className: event.target.value })
                        }
                        required
                      />
                      <input
                        aria-label="Due date"
                        type="date"
                        value={editDraft.dueDate}
                        onChange={(event) =>
                          setEditDraft({ ...editDraft, dueDate: event.target.value })
                        }
                        required
                      />
                      <button type="submit">Save</button>
                      <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                    </form>
                  ) : (
                    <>
                      <input
                        type="checkbox"
                        checked={Boolean(assignment.completed)}
                        aria-label={
                          assignment.completed
                            ? `Move ${assignment.name} back to upcoming assignments`
                            : `Mark ${assignment.name} complete`
                        }
                        onChange={() =>
                          assignment.completed
                            ? reopenAssignment(assignment)
                            : completeAssignment(assignment)
                        }
                      />
                      <div>
                        <strong>{assignment.name}</strong>
                        <span>{assignment.className}</span>
                      </div>
                      <time dateTime={assignment.dueDate}>
                        {new Date(`${assignment.dueDate}T00:00:00`).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                      <div className="dashboard-assignment-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setEditDraft({
                              name: assignment.name,
                              className: assignment.className,
                              dueDate: assignment.dueDate,
                            });
                            setEditingId(assignment.id);
                          }}
                        >
                          Edit
                        </button>
                        <button type="button" onClick={() => deleteAssignment(assignment)}>
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          </section>

          <aside className="dashboard-add-card">
            <h2><span aria-hidden="true">＋</span> Plan ahead</h2>
            <p>Add an assignment to keep it on your radar.</p>
            <form onSubmit={addAssignment}>
              <label htmlFor="dashboard-name">Assignment name *</label>
              <input
                id="dashboard-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Read chapter 4"
                required
              />
              <label htmlFor="dashboard-class">Class or subject *</label>
              <input
                id="dashboard-class"
                value={className}
                onChange={(event) => setClassName(event.target.value)}
                placeholder="e.g. Biology 101"
                required
              />
              <label htmlFor="dashboard-date">Due date *</label>
              <input
                id="dashboard-date"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                required
              />
              <button type="submit">Add to my list <span aria-hidden="true">→</span></button>
            </form>
            <p className="dashboard-motivation"><span>✦</span> I've got this. One small step at a time.</p>
          </aside>
        </div>
        <p className="dashboard-footer">Signed in as {username}</p>
      </section>
    </main>
  );
}
