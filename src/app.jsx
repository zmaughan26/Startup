import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import './app.css';

import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Login } from "./login/login.jsx";
import { Info } from "./about/about.jsx";
import { Complete } from "./completed/completed.jsx";
import { MyAssignments } from "./myassignments/myassignments.jsx";


export default function App() {
  return (
    <BrowserRouter>
      <div className="body bg-dark text-light">
        <header className="site-header">
          <h1>StudyTrack<sup>&reg;</sup></h1>
          <nav className="header-nav" aria-label="Main navigation">
            <ul>
              <li><NavLink to="/login">Login</NavLink></li>
              <li><NavLink to="/myassignments">My Assignments</NavLink></li>
              <li><NavLink to="/completed">Completed Assignments</NavLink></li>
              <li><NavLink to="/about">About</NavLink></li>
              <li className="nav-logout"><NavLink to="/"></NavLink></li>
            </ul>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<Info />} />
            <Route path="/completed" element={<Complete />} />
            <Route path="/myassignments" element={<MyAssignments />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <footer>
          <hr />
          <span className="text-reset">Author Name: Zach Maughan</span>
          <br />
          <a href="https://github.com/zmaughan26/studytrack-html">GitHub</a>
        </footer>
      </div>
    </BrowserRouter>
  );
}

function NotFound() {
    return (
        <main className="notfound-container">
            <div> 404: Return to sender. Address not found. </div>
        </main>
    );
}