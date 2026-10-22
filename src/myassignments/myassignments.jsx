import React, { useState } from "react";

export function MyAssignments() {
  const [assignments, setAssignments] = useState([
    { id: 1, name: "CALC HW 2.1", className: "Calculus", dueDate: "2023-05-15", completed: false },
    { id: 2, name: "Read Chapter 5", className: "History", dueDate: "2023-05-20", completed: false },
    { id: 3, name: "Write Reflection", className: "English", dueDate: "2023-05-25", completed: false },
  ]);
  const [newAssignmentName, setNewAssignmentName] = useState("");
  const [newAssignmentDueDate, setNewAssignmentDueDate] = useState("");

  function addAssignment(event) {
    event.preventDefault();
    const name = newAssignmentName.trim();
    if (!name || !newAssignmentDueDate) {
      return;
    }

    setAssignments((currentAssignments) => [
      ...currentAssignments,
      {
        id: Date.now(),
        name,
        className: "Other",
        dueDate: newAssignmentDueDate,
        completed: false,
      },
    ]);
    setNewAssignmentName("");
    setNewAssignmentDueDate("");
  }

  return (
    <main>
      <div className="users">
        User:
        <span className="users">Student Name</span>
      </div>
      <div className="assignment-table-toolbar">
        <h2 id="upcoming-heading">Upcoming Assignments</h2>
        <label className="assignment-filter" htmlFor="assignment-filter">
          Filter
          <input
            id="assignment-filter"
            type="search"
            aria-controls="upcoming-assignment-table"
            placeholder="Assignment, class, or date"
          />
        </label>
      </div>
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
          {assignments.map((assignment) => {
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
                  <button className="assignment-edit-button grid h-8 w-8 place-items-center rounded-md p-0 text-[#12345a] transition hover:bg-[#e8f0f8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#f4b942]" type="button" aria-label={`Edit ${assignment.name}`} title="Edit assignment">
                    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/><path d="m15 5 4 4"/></svg>
                  </button>
                  <button
                    className="assignment-delete-button grid h-8 w-8 place-items-center rounded-md p-0 text-[#a12622] transition hover:bg-[#fbe9e7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#f4b942]"
                    type="button"
                    aria-label={`Delete ${assignment.name}`}
                    title="Delete assignment"
                    onClick={() => {
                      setAssignments((currentAssignments) =>
                        currentAssignments.filter((currentAssignment) => currentAssignment.id !== assignment.id)
                      );
                    }}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="m19 6-1 14H6L5 6" />
                      <path d="M10 11v5M14 11v5" />
                    </svg>
                  </button>
                </td>
                <td>{assignment.name}</td>
                <td>{assignment.className}</td>
                <td>{dueDateLabel}</td>
                <td className="assignment-checkbox-cell">
                  <input
                    className="assignment-checkbox"
                    type="checkbox"
                    checked={assignment.completed}
                    aria-label={`Mark ${assignment.name} complete`}
                    onChange={(event) => {
                      setAssignments((currentAssignments) =>
                        currentAssignments.map((currentAssignment) =>
                          currentAssignment.id === assignment.id
                            ? { ...currentAssignment, completed: event.target.checked }
                            : currentAssignment
                        )
                      );
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="assignment-filter-empty" id="assignment-filter-empty" hidden>
        No assignments match that filter.
      </p>

      <form className="assignment-actions" onSubmit={addAssignment}>
        <button className="assignment-action-button w-full rounded-md bg-[#12345a] px-4 py-3 font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-[#1b4a78] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4b942] sm:w-auto" type="submit">
          Add Assignment
        </button>
        <input
          type="text"
          aria-label="New assignment name"
          placeholder="Assignment name"
          value={newAssignmentName}
          onChange={(event) => setNewAssignmentName(event.target.value)}
          required
        />
        <input
          type="date"
          aria-label="New assignment due date"
          value={newAssignmentDueDate}
          onChange={(event) => setNewAssignmentDueDate(event.target.value)}
          required
        />
      </form>
    </main>
  );
}