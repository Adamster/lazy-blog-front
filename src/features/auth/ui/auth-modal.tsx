"use client";

import { Modal, ModalContent } from "@heroui/react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { RegisterUserRequest } from "@/shared/api/openapi";
import { addToastError } from "@/shared/lib/toasts";
import { useAuth } from "../model/use-auth";
import { useForgotPassword } from "../model/use-forgot-password";

type AuthView = "login" | "forgot" | "register";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

const fieldLabel = "mono-field-label";

const fieldInputBase = "mono-input py-2 text-[14.5px] leading-[1.5]";

const errorTextBase =
  "min-h-[16px] text-[11px] tracking-[0.02em] text-[var(--m-error)]";

const primaryBtn = `w-full bg-[var(--m-accent)] text-[var(--m-bg)] font-display font-bold text-[14px] py-[15px] transition-[filter] hover:brightness-110 disabled:pointer-events-none disabled:opacity-80 ${focusRing}`;

const accentLink = `text-[var(--m-accent)] font-semibold underline-offset-2 hover:underline ${focusRing}`;

function GoogleGlyph() {
  // Official multicolor Google "G" — the one sanctioned color exception.
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[17px] shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1C3.3 21.3 7.3 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.1 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"
      />
    </svg>
  );
}

function GoogleButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-display flex w-full items-center justify-center gap-2.5 border-2 border-[var(--m-dim)] bg-transparent py-[13px] text-[13.5px] font-semibold text-[var(--m-fg)] transition-colors hover:border-[var(--m-muted)] hover:bg-[var(--m-panel)] ${focusRing}`}
    >
      <GoogleGlyph />
      {label}
    </button>
  );
}

function OrRule() {
  return (
    <div className="my-[22px] flex items-center gap-3.5">
      <span className="h-0.5 flex-1 bg-[var(--m-dim)]" />
      <span className="mono-label text-[var(--m-muted2)]">{"// OR"}</span>
      <span className="h-0.5 flex-1 bg-[var(--m-dim)]" />
    </div>
  );
}

function inputClasses(hasError: boolean) {
  return `${fieldInputBase} ${
    hasError
      ? "border-[var(--m-error)]"
      : "border-[var(--m-dim)] focus:border-[var(--m-accent)]"
  }`;
}

/** Modal chrome shared by every view: subtle frame + 3px accent top stripe,
 *  header row (eyebrow + title + optional subtitle, close ✕). */
function AuthShell({
  eyebrow,
  title,
  subtitle,
  onClose,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-t-[3px] border-t-[var(--m-accent)]">
      <div className="px-9 pt-[34px] pb-9">
        <div className="mb-[26px] flex items-start justify-between gap-4">
          <div>
            <div className="mono-label mb-3">{eyebrow}</div>
            <h2 className="font-display text-[30px] leading-none font-bold tracking-[-0.02em] text-[var(--m-fg)]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-3 text-[12.5px] leading-[1.5] text-[var(--m-muted)]">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`-mt-1.5 -mr-2 flex size-[34px] shrink-0 items-center justify-center text-[20px] text-[var(--m-muted2)] transition-colors hover:bg-[var(--m-panel)] hover:text-[var(--m-fg)] ${focusRing}`}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" />
      {off ? <path d="M3 3l18 18" strokeLinecap="round" /> : null}
    </svg>
  );
}

/* ------------------------------- LOGIN ------------------------------- */

function LoginView({
  onClose,
  goForgot,
  goRegister,
}: {
  onClose: () => void;
  goForgot: () => void;
  goRegister: () => void;
}) {
  const { auth, login, isAuthenticated, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string; password: string }>({
    shouldUseNativeValidation: false,
  });

  const onSubmit = async (data: { email: string; password: string }) => {
    setLoading(true);
    await login(data.email, data.password)
      .catch((error) => addToastError("Login Failed", error))
      .finally(() => setLoading(false));
  };

  return (
    <AuthShell
      eyebrow="// ACCESS"
      title="Welcome back"
      subtitle="Залогинься, чтобы лайкать и комментить."
      onClose={onClose}
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        {/* Email */}
        <div className="mb-[22px]">
          <label htmlFor="login-email" className={fieldLabel}>
            EMAIL
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder=""
            aria-invalid={Boolean(errors.email)}
            className={inputClasses(Boolean(errors.email))}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Enter a valid email address",
              },
            })}
          />
          <p
            className={errorTextBase}
            role={errors.email ? "alert" : undefined}
          >
            {errors.email ? `! ${errors.email.message}` : ""}
          </p>
        </div>

        {/* Password */}
        <div className="mb-[22px]">
          <div className="mb-2 flex items-baseline justify-between">
            <label
              htmlFor="login-password"
              className="text-[11px] tracking-[0.12em] text-[var(--m-muted2)] uppercase"
            >
              PASSWORD
            </label>
            <button
              type="button"
              onClick={goForgot}
              className={`text-[11px] ${accentLink}`}
            >
              Forgot?
            </button>
          </div>
          <div className="relative flex items-center">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder=""
              aria-invalid={Boolean(errors.password)}
              className={`${inputClasses(Boolean(errors.password))} pr-8`}
              {...register("password", { required: "Password is required" })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className={`absolute right-0 flex p-1 text-[var(--m-muted2)] transition-colors hover:text-[var(--m-accent)] ${focusRing}`}
            >
              <EyeIcon off={showPassword} />
            </button>
          </div>
          <p
            className={errorTextBase}
            role={errors.password ? "alert" : undefined}
          >
            {errors.password ? `! ${errors.password.message}` : ""}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`mt-1 ${primaryBtn}`}
        >
          {loading ? "Logging in…" : "Log in →"}
        </button>
      </form>

      <OrRule />
      <GoogleButton label="Continue with Google" onClick={loginWithGoogle} />

      <p className="mt-6 text-center text-[12.5px] text-[var(--m-muted)]">
        Not a member yet?{" "}
        <button type="button" onClick={goRegister} className={accentLink}>
          Create account
        </button>
      </p>
    </AuthShell>
  );
}

/* ------------------------------- FORGOT ------------------------------- */

function ForgotView({
  onClose,
  goLogin,
}: {
  onClose: () => void;
  goLogin: () => void;
}) {
  const { mutate, isPending } = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({ shouldUseNativeValidation: false });

  const onSubmit = (data: { email: string }) => {
    mutate({ email: data.email });
  };

  return (
    <AuthShell eyebrow="// RECOVERY" title="Reset password" onClose={onClose}>
      <div className="mb-7 border-l-[3px] border-l-[var(--m-accent)] bg-[var(--m-accent)]/[0.06] px-3.5 py-3 text-[13px] leading-[1.6] text-[var(--m-muted)]">
        Введи email — пришлём ссылку для сброса пароля. Проверь спам, если
        письма нет.
      </div>

      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-2">
          <label htmlFor="forgot-email" className={fieldLabel}>
            EMAIL
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder=""
            aria-invalid={Boolean(errors.email)}
            className={inputClasses(Boolean(errors.email))}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Enter a valid email address",
              },
            })}
          />
          <p
            className={errorTextBase}
            role={errors.email ? "alert" : undefined}
          >
            {errors.email ? `! ${errors.email.message}` : ""}
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={`mt-3.5 ${primaryBtn}`}
        >
          {isPending ? "Sending…" : "Send reset link →"}
        </button>
      </form>

      <p className="mt-6 text-center text-[12.5px] text-[var(--m-muted)]">
        ←{" "}
        <button type="button" onClick={goLogin} className={accentLink}>
          Back to Log in
        </button>
      </p>
    </AuthShell>
  );
}

/* ------------------------------- REGISTER ------------------------------- */

type RegisterFields = RegisterUserRequest & { confirmPassword: string };

function RegisterView({
  onClose,
  goLogin,
}: {
  onClose: () => void;
  goLogin: () => void;
}) {
  const {
    auth,
    register: registerUser,
    isAuthenticated,
    loginWithGoogle,
  } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterFields>({ shouldUseNativeValidation: false });

  const onSubmit = async (data: RegisterFields) => {
    setLoading(true);
    try {
      await registerUser({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        userName: data.userName,
        password: data.password,
        biography: null,
      });
      // register() logs the user in on success → the auth effect closes the
      // modal. If we ever land here without becoming authenticated, fall back
      // to the login view so they can sign in manually.
      if (!isAuthenticated) {
        goLogin();
      }
    } catch (error) {
      addToastError("Registration Failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="// NEW USER"
      title="Create an account"
      onClose={onClose}
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        {/* Email + Username — two columns */}
        <div className="mb-5 grid grid-cols-2 gap-[18px]">
          <div>
            <label htmlFor="reg-email" className={fieldLabel}>
              EMAIL <span className="text-[var(--m-accent)]">*</span>
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder=""
              aria-invalid={Boolean(errors.email)}
              className={inputClasses(Boolean(errors.email))}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Enter a valid email address",
                },
              })}
            />
            <p
              className={errorTextBase}
              role={errors.email ? "alert" : undefined}
            >
              {errors.email ? `! ${errors.email.message}` : ""}
            </p>
          </div>
          <div>
            <label htmlFor="reg-username" className={fieldLabel}>
              USERNAME <span className="text-[var(--m-accent)]">*</span>
            </label>
            <input
              id="reg-username"
              type="text"
              autoComplete="username"
              placeholder=""
              aria-invalid={Boolean(errors.userName)}
              className={inputClasses(Boolean(errors.userName))}
              {...register("userName", {
                required: "Username is required",
                pattern: {
                  value: /^[A-Za-z0-9_.-]+$/,
                  message: "No spaces or special characters",
                },
              })}
            />
            <p
              className={errorTextBase}
              role={errors.userName ? "alert" : undefined}
            >
              {errors.userName ? `! ${errors.userName.message}` : ""}
            </p>
          </div>
        </div>

        {/* First + Last name */}
        <div className="mb-5 grid grid-cols-2 gap-[18px]">
          <div>
            <label htmlFor="reg-firstname" className={fieldLabel}>
              FIRST NAME <span className="text-[var(--m-accent)]">*</span>
            </label>
            <input
              id="reg-firstname"
              type="text"
              autoComplete="given-name"
              placeholder=""
              aria-invalid={Boolean(errors.firstName)}
              className={inputClasses(Boolean(errors.firstName))}
              {...register("firstName", {
                required: "First Name is required",
                minLength: { value: 2, message: "At least 2 characters" },
              })}
            />
            <p
              className={errorTextBase}
              role={errors.firstName ? "alert" : undefined}
            >
              {errors.firstName ? `! ${errors.firstName.message}` : ""}
            </p>
          </div>
          <div>
            <label htmlFor="reg-lastname" className={fieldLabel}>
              LAST NAME <span className="text-[var(--m-accent)]">*</span>
            </label>
            <input
              id="reg-lastname"
              type="text"
              autoComplete="family-name"
              placeholder=""
              aria-invalid={Boolean(errors.lastName)}
              className={inputClasses(Boolean(errors.lastName))}
              {...register("lastName", {
                required: "Last Name is required",
                minLength: { value: 2, message: "At least 2 characters" },
              })}
            />
            <p
              className={errorTextBase}
              role={errors.lastName ? "alert" : undefined}
            >
              {errors.lastName ? `! ${errors.lastName.message}` : ""}
            </p>
          </div>
        </div>

        {/* Password + Confirm — two columns, like first/last name */}
        <div className="mb-1.5 grid grid-cols-2 gap-[18px]">
          <div>
            <label htmlFor="reg-password" className={fieldLabel}>
              PASSWORD <span className="text-[var(--m-accent)]">*</span>
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              placeholder=""
              aria-invalid={Boolean(errors.password)}
              className={inputClasses(Boolean(errors.password))}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "At least 6 characters" },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/,
                  message:
                    "At least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character",
                },
              })}
            />
            <p
              className={errorTextBase}
              role={errors.password ? "alert" : undefined}
            >
              {errors.password ? `! ${errors.password.message}` : ""}
            </p>
          </div>
          <div>
            <label htmlFor="reg-confirm" className={fieldLabel}>
              CONFIRM PASSWORD <span className="text-[var(--m-accent)]">*</span>
            </label>
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              placeholder=""
              aria-invalid={Boolean(errors.confirmPassword)}
              className={inputClasses(Boolean(errors.confirmPassword))}
              {...register("confirmPassword", {
                required: "Password confirmation is required",
                validate: (value) =>
                  value === getValues("password") || "Passwords do not match",
              })}
            />
            <p
              className={errorTextBase}
              role={errors.confirmPassword ? "alert" : undefined}
            >
              {errors.confirmPassword
                ? `! ${errors.confirmPassword.message}`
                : ""}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`mt-3.5 ${primaryBtn}`}
        >
          {loading ? "Creating…" : "Create account →"}
        </button>
      </form>

      <OrRule />
      <GoogleButton label="Sign up with Google" onClick={loginWithGoogle} />

      <p className="mt-6 text-center text-[12.5px] text-[var(--m-muted)]">
        Already have an account?{" "}
        <button type="button" onClick={goLogin} className={accentLink}>
          Log in
        </button>
      </p>
    </AuthShell>
  );
}

/* ------------------------------- MODAL ------------------------------- */

export function AuthModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: () => void;
}) {
  const [view, setView] = useState<AuthView>("login");
  // Portal the modal into a node inside the themed `.mono-portal` scope; HeroUI
  // otherwise mounts overlays on document.body, outside `.dark` and the --m-*
  // tokens (mirrors the dropdown pattern in mono-header.tsx).
  const [modalPortal, setModalPortal] = useState<HTMLElement | null>(null);

  // Register view is wider than login/forgot.
  const maxWidth = view === "register" ? "max-w-[480px]" : "max-w-[432px]";

  return (
    <>
      <div
        ref={setModalPortal}
        className="mono-portal pointer-events-none fixed inset-0 z-[60]"
        aria-hidden="true"
      />

      <Modal
        placement="center"
        scrollBehavior="outside"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        radius="none"
        hideCloseButton
        disableAnimation
        portalContainer={modalPortal ?? undefined}
        // Reset to the login view whenever the modal fully closes, so reopening
        // always starts at login.
        onClose={() => setView("login")}
        classNames={{
          // `outside` scroll = the overlay scrolls as one normal scrollbar when
          // the modal is taller than the viewport (no ugly inner modal scroll).
          wrapper: "pointer-events-auto items-center py-6",
          base: `mono-portal mono-modal-enter pointer-events-auto m-0 w-[calc(100%-2rem)] ${maxWidth} rounded-none border-2 border-[var(--m-dim)] bg-[var(--m-bg)] shadow-none`,
          backdrop:
            "mono-backdrop-enter pointer-events-auto bg-[#0a0a0a]/70 backdrop-blur-[2px]",
          header: "p-0",
          body: "p-0",
          footer: "p-0",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              {view === "login" && (
                <LoginView
                  onClose={onClose}
                  goForgot={() => setView("forgot")}
                  goRegister={() => setView("register")}
                />
              )}
              {view === "forgot" && (
                <ForgotView
                  onClose={onClose}
                  goLogin={() => setView("login")}
                />
              )}
              {view === "register" && (
                <RegisterView
                  onClose={onClose}
                  goLogin={() => setView("login")}
                />
              )}
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
