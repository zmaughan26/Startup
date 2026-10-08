import React from "react";

export function Complete () {
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
          <tr>
            <td>Complete</td>
            <td>Calc HW 1.7</td>
            <td>Calculus</td>
            <td>May 20, 2023</td>
          </tr>
          <tr>
            <td>Complete</td>
            <td>Read Chapter 4</td>
            <td>History</td>
            <td>June 2, 2023</td>
          </tr>
          <tr>
            <td>Complete</td>
            <td>Write Reflection</td>
            <td>English</td>
            <td>July 3, 2023</td>
          </tr>
        </tbody>
      </table>
    </main>
    );
}