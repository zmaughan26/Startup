import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import './app.css';

export default function App() {
    return <div className= 'body bg-dark text-light'><head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>StudyTrack</title>
    <link rel="icon" href="studytrack-favicon.svg" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="syle.css" />
  </head>
    <header class="site-header">
      <h1>StudyTrack<sup>&reg;</sup></h1>

      <nav class="header-nav" aria-label="Main navigation">
        <ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="myassignments.html">My Assignments</a></li>
          <li><a href="completed.html">Completed Assignments</a></li>
          <li><a href="about.html">About</a></li>
          <li className="nav-logout"><a href="index.html">Log out</a></li>
        </ul>
      </nav>

    </header>
    <main>
        <h2>App Components go here</h2>
    </main>
     <footer>
      <hr />
      <span class="text-reset">Author Name: Zach Maughan</span>
      <br />
      <a href="https://github.com/zmaughan26/studytrack-html"
      >GitHub</a>
    </footer>   </div>;
}