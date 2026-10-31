import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";

import AuthLayout from "../components/layout/AuthLayout";
import { ApiError } from "../services/apiClient";
import { register as registerAccount } from "../services/authService";
import { registerSchema, type RegisterFormValues } from "../utils/authSchemas";

import "../styles/forms.css";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError("");

    try {
      await registerAccount({
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email.trim(),
        password: values.password,
        password2: values.confirmPassword,
      });

      await navigate("/login", {
        replace: true,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setServerError("");

        const details = error.data;

        if (details && typeof details === "object") {
          const fieldNames = [
            "email",
            "password",
            "password2",
            "first_name",
            "last_name",
          ] as const;

          let hasFieldError = false;

          for (const field of fieldNames) {
            const messages = (details as Record<string, unknown>)[field];

            if (Array.isArray(messages) && typeof messages[0] === "string") {
              const formField =
                field === "password2" ? "confirmPassword" : field;

              setError(formField as keyof RegisterFormValues, {
                type: "server",
                message: messages[0],
              });

              hasFieldError = true;
            }
          }

          if (hasFieldError) {
            return;
          }
        }

        setServerError(
          "We couldn't create your account. Check your details or try another email address.",
        );

        return;
      }

      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to create your account. Please try again.",
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
              taskflow<span className="register-brand-period">.</span>
            </span>
          </Link>

          <div className="register-brand-content">
            <span className="register-eyebrow">A CLEARER WAY TO WORK</span>

            <h1>
              Turn your plans
              <br />
              into <span>progress.</span>
            </h1>

            <p>
              Bring your projects, tasks, and team together in one organized
              workspace.
            </p>

            <div className="register-benefits">
              <div>
                <span className="register-benefit-icon">✓</span>
                Organize projects and tasks
              </div>

              <div>
                <span className="register-benefit-icon">✓</span>
                Collaborate with your team
              </div>

              <div>
                <span className="register-benefit-icon">✓</span>
                Keep track of your progress
              </div>
            </div>
          </div>

          <p className="register-panel-footer">
            Less busywork. More meaningful progress.
          </p>
        </>
      }
    >
      <header className="register-header">
        <span className="register-form-eyebrow">GET STARTED FOR FREE</span>

        <h2>Create your account</h2>

        <p>Set up your workspace and start making progress.</p>
      </header>

      <form
        className="register-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="register-name-row">
          <div className="register-field">
            <label htmlFor="first_name">First name</label>

            <input
              id="first_name"
              type="text"
              autoComplete="given-name"
              placeholder="Alex"
              aria-invalid={Boolean(errors.first_name)}
              aria-describedby={
                errors.first_name ? "first-name-error" : undefined
              }
              {...register("first_name")}
            />

            {errors.first_name && (
              <p id="first-name-error" className="register-field-error">
                {errors.first_name.message}
              </p>
            )}
          </div>

          <div className="register-field">
            <label htmlFor="last_name">Last name</label>

            <input
              id="last_name"
              type="text"
              autoComplete="family-name"
              placeholder="Morgan"
              aria-invalid={Boolean(errors.last_name)}
              aria-describedby={
                errors.last_name ? "last-name-error" : undefined
              }
              {...register("last_name")}
            />

            {errors.last_name && (
              <p id="last-name-error" className="register-field-error">
                {errors.last_name.message}
              </p>
            )}
          </div>
        </div>

        <div className="register-field">
          <label htmlFor="register-email">Email address</label>

          <input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "register-email-error" : undefined}
            {...register("email")}
          />

          {errors.email && (
            <p id="register-email-error" className="register-field-error">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="register-field">
          <label htmlFor="register-password">Password</label>

          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create a password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "register-password-error" : undefined
            }
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
            <p id="register-password-error" className="register-field-error">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="register-field">
          <label htmlFor="confirmPassword">Confirm password</label>

          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Enter your password again"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword ? "confirm-password-error" : undefined
            }
            {...register("confirmPassword")}
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword((visible) => !visible)}
            aria-label={
              showConfirmPassword
                ? "Hide password confirmation"
                : "Show password confirmation"
            }
            aria-pressed={showConfirmPassword}
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>

          {errors.confirmPassword && (
            <p id="confirm-password-error" className="register-field-error">
              {errors.confirmPassword.message}
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
          {isSubmitting ? "Creating account..." : "Create account"}

          {!isSubmitting && <span aria-hidden="true">→</span>}
        </button>

        <p className="register-login-prompt">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>

      <p className="register-terms">
        By creating an account, you agree to use TaskFlow responsibly.
      </p>
    </AuthLayout>
  );
}
