import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import './app.css';

import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Login } from "./login/login.jsx";
import { Info } from "./about/about.jsx";
import { Complete } from "./completed/completed.jsx";
import { MyAssignments } from "./myassignments/myassignments.jsx";


export default function App() {
  const [username, setUsername] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me");
        if (!ignore && response.ok) {
          const user = await response.json();
          setUsername(user.username);
          localStorage.setItem("username", user.username);
        } else if (!ignore) {
          setUsername("");
          localStorage.removeItem("username");
        }
      } catch {
        if (!ignore) {
          setAuthError("Could not verify your login. Please refresh the page.");
        }
      }
    }

    loadCurrentUser();
    return () => {
      ignore = true;
    };
  }, []);

  async function logout() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Could not log out. Please try again.");
      }
      localStorage.removeItem("username");
      localStorage.removeItem("studytrack.completedAssignments");
      setUsername("");
      setAuthError("");
    } catch (error) {
      setAuthError(error.message);
    }
  }

  return (
    <BrowserRouter>
      <div className="body">
        <header className="site-header">
          <h1>StudyTrack<sup>&reg;</sup></h1>
          <nav className="header-nav" aria-label="Main navigation">
            <ul>
              <li><NavLink to="/login">Login</NavLink></li>
              <li><NavLink to="/myassignments">My Assignments</NavLink></li>
              <li><NavLink to="/completed">Completed Assignments</NavLink></li>
              <li><NavLink to="/about">About</NavLink></li>
              {username && (
                <li>
                  <button className="nav-logout" type="button" onClick={logout}>
                    Log out ({username})
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </header>

        {authError && <p className="auth-alert" role="alert">{authError}</p>}

        <div className="app-content">
          <Routes>
            <Route path="/" element={<Login onAuthenticated={setUsername} />} />
            <Route path="/login" element={<Login onAuthenticated={setUsername} />} />
            <Route path="/about" element={<Info />} />
            <Route path="/completed" element={<Complete />} />
            <Route path="/myassignments" element={<MyAssignments />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

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