import React from "react";
import { useNavigate } from "react-router-dom";

export function Login() {
  const navigate = useNavigate();

  return (
    <main>
      <h1>Welcome to StudyTrack</h1>
      <form
        className="login-box"
        onSubmit={(event) => {
          event.preventDefault();
          navigate("/myassignments");
        }}
      >
        <div>
          <span>@</span>
          <input type="text" placeholder="Username" />
        </div>
        <div>
          <span>🔒</span>
          <input type="password" placeholder="Password" />
        </div>
        <button className="rounded-md bg-[#12345a] px-5 py-2.5 font-semibold text-white" type="submit">
          Login
        </button>
        <button className="rounded-md border border-[#12345a] bg-white px-5 py-2.5" type="button">
          Create
        </button>
      </form>
    </main>
  );
}