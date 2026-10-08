import React from "react";

export function MyAssignments() {
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
            <th className="assignment-edit-heading" scope="col">Edit</th>
            <th scope="col">Assignment</th>
            <th scope="col">Class</th>
            <th scope="col">Due date</th>
            <th className="assignment-checkbox-heading" scope="col">Done</th>
          </tr>
        </thead>
        <tbody>
          <tr data-assignment-name="CALC HW 2.1" data-assignment-class="Calculus" data-due-date="2023-05-15" data-due-date-label="May 15, 2023">
            <td className="assignment-edit-cell"><button className="assignment-edit-button grid h-8 w-8 place-items-center rounded-md p-0 text-[#12345a] transition hover:bg-[#e8f0f8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#f4b942]" type="button" aria-label="Edit CALC HW 2.1" title="Edit assignment"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/><path d="m15 5 4 4"/></svg></button></td>
            <td>CALC HW 2.1</td>
            <td>Calculus</td>
            <td>May 15, 2023</td>
            <td className="assignment-checkbox-cell"><input className="assignment-checkbox" type="checkbox" aria-label="Mark CALC HW 2.1 complete" /></td>
          </tr>
          <tr data-assignment-name="Read Chapter 5" data-assignment-class="History" data-due-date="2023-05-20" data-due-date-label="May 20, 2023">
            <td className="assignment-edit-cell"><button className="assignment-edit-button grid h-8 w-8 place-items-center rounded-md p-0 text-[#12345a] transition hover:bg-[#e8f0f8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#f4b942]" type="button" aria-label="Edit Read Chapter 5" title="Edit assignment"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/><path d="m15 5 4 4"/></svg></button></td>
            <td>Read Chapter 5</td>
            <td>History</td>
            <td>May 20, 2023</td>
            <td className="assignment-checkbox-cell"><input className="assignment-checkbox" type="checkbox" aria-label="Mark Read Chapter 5 complete" /></td>
          </tr>
          <tr data-assignment-name="Write Reflection" data-assignment-class="English" data-due-date="2023-05-25" data-due-date-label="May 25, 2023">
            <td className="assignment-edit-cell"><button className="assignment-edit-button grid h-8 w-8 place-items-center rounded-md p-0 text-[#12345a] transition hover:bg-[#e8f0f8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#f4b942]" type="button" aria-label="Edit Write Reflection" title="Edit assignment"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/><path d="m15 5 4 4"/></svg></button></td>
            <td>Write Reflection</td>
            <td>English</td>
            <td>May 25, 2023</td>
            <td className="assignment-checkbox-cell"><input className="assignment-checkbox" type="checkbox" aria-label="Mark Write Reflection complete" /></td>
          </tr>
        </tbody>
      </table>
      <p className="assignment-filter-empty" id="assignment-filter-empty" hidden>
        No assignments match that filter.
      </p>

      <div className="assignment-actions">
        <button className="assignment-action-button w-full rounded-md bg-[#12345a] px-4 py-3 font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-[#1b4a78] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4b942] sm:w-auto" type="submit">
          Add Assignment
        </button>
        <input type="text" aria-label="New assignment name" placeholder="Assignment name" />
        <input type="date" aria-label="New assignment due date" />
      </div>
    </main>
  );
}