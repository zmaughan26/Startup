import React from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

export function Login() {
  const navigate = useNavigate();

  return (
    <main>
      <h1>Welcome to StudyTrack</h1>
      <form
        className="login-box"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          localStorage.setItem("username", formData.get("username"));
          localStorage.setItem("password", formData.get("password"));
          navigate("/myassignments");
        }}
      >
        <div>
          <span>@</span>
          <input type="text" name="username" placeholder="Username" required />
        </div>
        <div>
          <span>🔒</span>
          <input type="password" name="password" placeholder="Password" required />
        </div>
        <button className="login-submit" type="submit">
          Login
        </button>
        <button className="rounded-md border border-[#12345a] bg-white px-5 py-2.5" type="button">
          Create
        </button>
      </form>
    </main>
  );
}