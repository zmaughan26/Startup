import React, { useEffect, useState } from "react";
import "./completed.css";

export function Complete ({ username }) {
    const [error, setError] = useState("");
    const [completedAssignments, setCompletedAssignments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      let ignore = false;

      async function loadCompletedAssignments() {
        try {
          const response = await fetch("/api/assignments?completed=true");
          if (!response.ok) {
            throw new Error(
              response.status === 401
                ? "Please log in to view completed assignments."
                : "Could not load completed assignments."
            );
          }

          const assignments = await response.json();
          if (!ignore) {
            setCompletedAssignments(assignments);
            setError("");
          }
        } catch (requestError) {
          if (!ignore) {
            setError(requestError.message || "Could not load completed assignments.");
          }
        } finally {
          if (!ignore) {
            setIsLoading(false);
          }
        }
      }

      loadCompletedAssignments();
      return () => {
        ignore = true;
      };
    }, []);

    async function reopenAssignment(assignment) {
      try {
        const response = await fetch(`/api/assignments/${assignment.id}/completion`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: false }),
        });
        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Please log in to reopen assignments."
              : "Could not reopen assignment."
          );
        }

        setCompletedAssignments((currentAssignments) =>
          currentAssignments.filter(
            (completedAssignment) => completedAssignment.id !== assignment.id
          )
        );
        setError("");
      } catch (requestError) {
        setError(requestError.message || "Could not reopen assignment. Please try again.");
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
              <td data-label="Date">
                {assignment.completedOn
                  ? new Date(assignment.completedOn).toLocaleDateString()
                  : ""}
              </td>
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
      {!isLoading && !error && completedAssignments.length === 0 && (
        <p>No completed assignments yet.</p>
      )}
    </main>
    );
}