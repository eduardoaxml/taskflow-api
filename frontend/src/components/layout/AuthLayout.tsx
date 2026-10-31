import type { ReactNode } from "react";
import { Link } from "react-router";

import "../../pages/RegisterPage.css";

interface AuthLayoutProps {
  brandContent: ReactNode;
  children: ReactNode;
}

export default function AuthLayout({
  brandContent,
  children,
}: AuthLayoutProps) {
  return (
    <main className="register-page">
      <div className="register-layout">
        <aside className="register-brand-panel">{brandContent}</aside>

        <section className="register-form-panel">
          <div className="register-form-container">
            <Link to="/" className="register-mobile-brand">
              <span className="register-brand-mark">T</span>
              <span>
                TaskFlow<span className="register-brand-period">.</span>
              </span>
            </Link>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
