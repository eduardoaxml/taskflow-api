import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";
import { changePassword, updateProfile } from "../services/profileService";
import {
  passwordChangeSchema,
  profileSchema,
  type PasswordChangeFormValues,
  type ProfileFormValues,
} from "../utils/authSchemas";

import "./ProfilePage.css";

export default function ProfilePage() {
  const { user, request, updateUser, clearSession } = useAuth();

  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
    },
  });

  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    setError: setPasswordErrorField,
    formState: { errors: passwordErrors, isSubmitting: isChangingPassword },
  } = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
      });
    }
  }, [user, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    setServerError("");
    setSuccessMessage("");

    try {
      const updatedUser = await updateProfile(request, values);

      updateUser(updatedUser);
      reset({
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
      });

      setSuccessMessage("Your profile has been updated successfully.");
    } catch (error) {
      if (error instanceof ApiError) {
        const data = error.data;

        if (typeof data === "object" && data !== null) {
          const fieldErrors = data as Record<string, unknown>;

          for (const field of ["first_name", "last_name"] as const) {
            const message = fieldErrors[field];

            if (Array.isArray(message) && typeof message[0] === "string") {
              setError(field, { message: message[0] });
            }
          }
        }

        setServerError(error.message);
        return;
      }

      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to update your profile. Please try again.",
      );
    }
  };

  const onPasswordSubmit = async (values: PasswordChangeFormValues) => {
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const response = await changePassword(request, {
        current_password: values.current_password,
        new_password: values.new_password,
      });

      resetPassword();

      setPasswordSuccess(response.detail);
      clearSession();
    } catch (error) {
      if (error instanceof ApiError) {
        const data = error.data;

        if (typeof data === "object" && data !== null) {
          const fieldErrors = data as Record<string, unknown>;

          for (const field of ["current_password", "new_password"] as const) {
            const message = fieldErrors[field];

            if (Array.isArray(message) && typeof message[0] === "string") {
              setPasswordErrorField(field, {
                message: message[0],
              });
            }
          }
        }

        setPasswordError(error.message);
        return;
      }

      setPasswordError(
        error instanceof Error
          ? error.message
          : "Unable to change your password. Please try again.",
      );
    }
  };

  return (
    <DashboardLayout
      activeSection="dashboard"
      organizationsTo="/dashboard#organizations"
    >
      <main className="profile-page">
        <header className="profile-page__header">
          <div>
            <span className="profile-page__eyebrow">ACCOUNT SETTINGS</span>
            <h1>My profile</h1>
            <p>Manage your personal information and account details.</p>
          </div>
        </header>

        {!user ? (
          <section className="profile-card">
            <p className="profile-message">Loading your profile...</p>
          </section>
        ) : (
          <>
            <section className="profile-card">
              <div className="profile-card__header">
                <div className="profile-avatar" aria-hidden="true">
                  {user.first_name.charAt(0).toUpperCase() ||
                    user.email.charAt(0).toUpperCase()}
                  {user.last_name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <h2>
                    {[user.first_name, user.last_name]
                      .filter(Boolean)
                      .join(" ") || "Your account"}
                  </h2>
                  <p>{user.email}</p>
                </div>
              </div>

              <div className="profile-card__divider" />

              <form
                className="profile-form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
              >
                <div className="profile-form__heading">
                  <h3>Personal information</h3>
                  <p>Update the information associated with your account.</p>
                </div>

                <div className="profile-form__row">
                  <div className="profile-field">
                    <label htmlFor="first_name">First name</label>
                    <input
                      id="first_name"
                      type="text"
                      autoComplete="given-name"
                      aria-invalid={Boolean(errors.first_name)}
                      aria-describedby={
                        errors.first_name ? "first-name-error" : undefined
                      }
                      {...register("first_name")}
                    />
                    {errors.first_name && (
                      <p id="first-name-error" className="profile-field__error">
                        {errors.first_name.message}
                      </p>
                    )}
                  </div>

                  <div className="profile-field">
                    <label htmlFor="last_name">Last name</label>
                    <input
                      id="last_name"
                      type="text"
                      autoComplete="family-name"
                      aria-invalid={Boolean(errors.last_name)}
                      aria-describedby={
                        errors.last_name ? "last-name-error" : undefined
                      }
                      {...register("last_name")}
                    />
                    {errors.last_name && (
                      <p id="last-name-error" className="profile-field__error">
                        {errors.last_name.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="profile-field">
                  <label htmlFor="profile-email">Email address</label>
                  <input
                    id="profile-email"
                    type="email"
                    value={user.email}
                    readOnly
                    disabled
                  />
                  <p className="profile-field__hint">
                    Your email address cannot be changed here.
                  </p>
                </div>

                {serverError && (
                  <p className="profile-form__error" role="alert">
                    {serverError}
                  </p>
                )}

                {successMessage && (
                  <p className="profile-form__success" role="status">
                    {successMessage}
                  </p>
                )}

                <div className="profile-form__actions">
                  <button
                    type="submit"
                    className="profile-submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving changes..." : "Save changes"}
                  </button>
                </div>
              </form>
            </section>
            <section className="profile-card profile-password-card">
              <div className="profile-form__heading">
                <h3>Change password</h3>
                <p>
                  Use your current password to set a new password for your
                  account.
                </p>
              </div>

              <form
                className="profile-form"
                onSubmit={handlePasswordSubmit(onPasswordSubmit)}
                noValidate
              >
                <div className="profile-field">
                  <label htmlFor="current-password">Current password</label>
                  <input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={Boolean(passwordErrors.current_password)}
                    {...registerPassword("current_password")}
                  />
                  {passwordErrors.current_password && (
                    <p className="profile-field__error">
                      {passwordErrors.current_password.message}
                    </p>
                  )}
                </div>

                <div className="profile-field">
                  <label htmlFor="new-password">New password</label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={Boolean(passwordErrors.new_password)}
                    {...registerPassword("new_password")}
                  />
                  {passwordErrors.new_password && (
                    <p className="profile-field__error">
                      {passwordErrors.new_password.message}
                    </p>
                  )}
                </div>

                <div className="profile-field">
                  <label htmlFor="confirm-password">Confirm new password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={Boolean(passwordErrors.confirm_password)}
                    {...registerPassword("confirm_password")}
                  />
                  {passwordErrors.confirm_password && (
                    <p className="profile-field__error">
                      {passwordErrors.confirm_password.message}
                    </p>
                  )}
                </div>

                {passwordError && (
                  <p className="profile-form__error" role="alert">
                    {passwordError}
                  </p>
                )}

                {passwordSuccess && (
                  <p className="profile-form__success" role="status">
                    {passwordSuccess}
                  </p>
                )}

                <div className="profile-form__actions">
                  <button
                    type="submit"
                    className="profile-submit"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword
                      ? "Changing password..."
                      : "Change password"}
                  </button>
                </div>
              </form>
            </section>
          </>
        )}
      </main>
    </DashboardLayout>
  );
}
