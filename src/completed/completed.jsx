import React, { useState } from "react";

export function Complete () {
    const [completedAssignments] = useState(() => {
      const savedAssignments = localStorage.getItem("studytrack.completedAssignments");
      return savedAssignments ? JSON.parse(savedAssignments) : [];
    });

    return (
       <main>
      <table className="assignment-table completed-table">
        <caption>Completed Assignments</caption>
        <thead>
          <tr>
            <th scope="col">Status</th>
            <th scope="col">Assignment</th>
            <th scope="col">Class</th>
            <th scope="col">Completed on</th>
          </tr>
        </thead>
        <tbody>
          {completedAssignments.map((assignment) => (
            <tr key={assignment.id}>
              <td>Complete</td>
              <td>{assignment.name}</td>
              <td>{assignment.className}</td>
              <td>{assignment.completedOn}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {completedAssignments.length === 0 && <p>No completed assignments yet.</p>}
    </main>
    );
}