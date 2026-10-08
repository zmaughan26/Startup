import React from "react";

export function Info () {
    return (
        <main class="about-main">
      <h2>About StudyTrack</h2>
      <section class="about-content" aria-label="About the application">
        <div>
          <p>
            StudyTrack helps students keep upcoming assignments and completed work organized in one place. This project was created at Brigham Young University as a web programming course project.
          </p>
          <p>
            This version is a static HTML prototype. Assignment examples are built into the pages, and login, add, and edit controls are not connected to data storage yet.
          </p>
        </div>
        <figure class="about-figure">
          <img src="Assignmentphoto.jpeg" alt="A pinned note labeled Assignment" />
          <figcaption>Keep your coursework in view.</figcaption>
        </figure>
      </section>
    </main>
    );
}