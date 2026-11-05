import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

export function Login({ onAuthenticated }) {
  const navigate = useNavigate();
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitCredentials(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        creatingAccount ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.get("username"),
            password: formData.get("password"),
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Authentication failed. Please try again.");
      }

      localStorage.setItem("username", result.username);
      onAuthenticated(result.username);
      navigate("/myassignments");
    } catch (requestError) {
      setError(requestError.message || "Could not connect to the service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Welcome to StudyTrack</h1>
      <form className="login-box" onSubmit={submitCredentials}>
        <div>
          <span>@</span>
          <input
            type="text"
            name="username"
            placeholder="Username"
            minLength="3"
            maxLength="32"
            pattern="[a-zA-Z0-9_]+"
            title="Use 3–32 letters, numbers, or underscores."
            autoComplete="username"
            required
          />
        </div>
        <div>
          <span>🔒</span>
          <input
            type="password"
            name="password"
            placeholder="Password"
            minLength="8"
            autoComplete={creatingAccount ? "new-password" : "current-password"}
            required
          />
        </div>
        {error && <p role="alert">{error}</p>}
        <button className="login-button login-submit" type="submit" disabled={submitting}>
          {submitting ? "Please wait..." : creatingAccount ? "Create account" : "Login"}
        </button>
        <button
          className="login-button login-create"
          type="button"
          onClick={() => {
            setCreatingAccount(!creatingAccount);
            setError("");
          }}
        >
          {creatingAccount ? "Back to login" : "Create"}
        </button>
      </form>
    </main>
  );
}