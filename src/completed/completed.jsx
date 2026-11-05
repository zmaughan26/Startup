import React, { useState } from "react";
import "./completed.css";

export function Complete () {
    const username = localStorage.getItem("username") || "Guest";
    const [error, setError] = useState("");
    const [completedAssignments, setCompletedAssignments] = useState(() => {
      const savedAssignments = localStorage.getItem("studytrack.completedAssignments");
      return savedAssignments ? JSON.parse(savedAssignments) : [];
    });

    async function reopenAssignment(assignment) {
      try {
        const response = await fetch("/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: assignment.name,
            className: assignment.className,
            dueDate: assignment.dueDate,
          }),
        });
        if (!response.ok) {
          throw new Error("Could not reopen assignment.");
        }

        const remainingAssignments = completedAssignments.filter(
          (completedAssignment) => completedAssignment.id !== assignment.id
        );
        localStorage.setItem(
          "studytrack.completedAssignments",
          JSON.stringify(remainingAssignments)
        );
        setCompletedAssignments(remainingAssignments);
        setError("");
      } catch {
        setError("Could not reopen assignment. Please try again.");
      }
    }

    return (
       <main className="completed-main">
      <div className="users">
        User: <span className="users">{username}</span>
      </div>
      <div className="responsive-table">
      <table className="assignment-table completed-table">
        <caption>Completed Assignments</caption>
        <thead>
          <tr>
            <th scope="col">Status</th>
            <th scope="col">Assignment</th>
            <th scope="col">Class</th>
            <th scope="col">Date</th>
            <th scope="col">Completed</th>
          </tr>
        </thead>
        <tbody>
          {completedAssignments.map((assignment) => (
            <tr key={assignment.id}>
              <td data-label="Status">
                <span className="completed-status">Complete</span>
              </td>
              <td data-label="Assignment">{assignment.name}</td>
              <td data-label="Class">{assignment.className}</td>
              <td data-label="Date">{assignment.completedOn}</td>
              <td className="assignment-checkbox-cell" data-label="Completed">
                <label className="completed-reopen-control">
                  <input
                    className="assignment-checkbox"
                    type="checkbox"
                    checked
                    aria-label={`Move ${assignment.name} back to upcoming assignments`}
                    onChange={() => reopenAssignment(assignment)}
                  />
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {error && <p role="alert">{error}</p>}
      {completedAssignments.length === 0 && <p>No completed assignments yet.</p>}
    </main>
    );
}