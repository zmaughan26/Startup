import React, { useState } from "react";
import "./completed.css";

export function Complete () {
    const username = localStorage.getItem("username") || "Guest";
    const [completedAssignments, setCompletedAssignments] = useState(() => {
      const savedAssignments = localStorage.getItem("studytrack.completedAssignments");
      return savedAssignments ? JSON.parse(savedAssignments) : [];
    });

    function reopenAssignment(assignment) {
      const upcomingAssignments = JSON.parse(
        localStorage.getItem("studytrack.assignments") || "[]"
      );
      const { completedOn, ...reopenedAssignment } = assignment;
      localStorage.setItem(
        "studytrack.assignments",
        JSON.stringify([
          ...upcomingAssignments,
          { ...reopenedAssignment, completed: false },
        ])
      );

      const remainingAssignments = completedAssignments.filter(
        (completedAssignment) => completedAssignment.id !== assignment.id
      );
      localStorage.setItem(
        "studytrack.completedAssignments",
        JSON.stringify(remainingAssignments)
      );
      setCompletedAssignments(remainingAssignments);
    }

    return (
       <main>
      <div className="users">
        User: <span className="users">{username}</span>
      </div>
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
              <td>Complete</td>
              <td>{assignment.name}</td>
              <td>{assignment.className}</td>
              <td>{assignment.completedOn}</td>
              <td className="assignment-checkbox-cell">
                <input
                  className="assignment-checkbox"
                  type="checkbox"
                  checked
                  aria-label={`Move ${assignment.name} back to upcoming assignments`}
                  onChange={() => reopenAssignment(assignment)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {completedAssignments.length === 0 && <p>No completed assignments yet.</p>}
    </main>
    );
}