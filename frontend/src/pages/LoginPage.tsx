import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";

import AuthLayout from "../components/layout/AuthLayout";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";
import { loginSchema, type LoginFormValues } from "../utils/authSchemas";

import "../styles/forms.css";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError("");

    try {
      await signIn(values);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setError("root", {
          message: "Invalid email or password.",
        });
        return;
      }

      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    }
  };

  return (
    <AuthLayout
      brandContent={
        <>
          <Link to="/" className="register-brand">
            <span className="register-brand-mark">T</span>
            <span>
              TaskFlow<span className="register-brand-period">.</span>
            </span>
          </Link>

          <div className="register-brand-content">
            <span className="register-eyebrow">YOUR WORKSPACE, IN SYNC</span>

            <h1>
              Good to see
              <br />
              <span>you again.</span>
            </h1>

            <p>
              Pick up where you left off. Keep your projects, tasks, and team
              moving forward.
            </p>

            <div className="register-benefits">
              <div>
                <span aria-hidden="true">✓</span>
                <p>Keep your projects organized</p>
              </div>

              <div>
                <span aria-hidden="true">✓</span>
                <p>Track tasks and team progress</p>
              </div>

              <div>
                <span aria-hidden="true">✓</span>
                <p>Stay focused on what matters</p>
              </div>
            </div>
          </div>

          <p className="register-panel-footer">
            TaskFlow — Your work, moving forward.
          </p>
        </>
      }
    >
      <header className="register-header">
        <span className="register-form-eyebrow">WELCOME BACK</span>

        <h2>Sign in to TaskFlow</h2>

        <p>Enter your credentials to access your workspace.</p>
      </header>

      <form
        className="register-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="register-field">
          <label htmlFor="email">Email address</label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />

          {errors.email && (
            <p id="email-error" className="register-field-error">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="register-field">
          <label htmlFor="password">Password</label>

          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? "Hide" : "Show"}
          </button>

          {errors.password && (
            <p id="password-error" className="register-field-error">
              {errors.password.message}
            </p>
          )}
        </div>

        {errors.root && (
          <p className="register-form-error" role="alert">
            {errors.root.message}
          </p>
        )}

        {serverError && (
          <p className="register-form-error" role="alert">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          className="register-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

        <p className="register-login-prompt">
          Don't have an account? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
