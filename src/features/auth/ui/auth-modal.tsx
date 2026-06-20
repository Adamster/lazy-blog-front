"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { RegisterUserRequest } from "@/shared/api/openapi";
import { addToastError } from "@/shared/lib/toasts";
import {
  Field,
  Modal,
  ModalHeader,
  SubmitButton,
  useModalTitleId,
} from "@/shared/ui";
import { useAuth } from "@/entities/session";
import { useForgotPassword } from "../model/use-forgot-password";

type AuthView = "login" | "forgot" | "register";

const EMAIL_PATTERN = {
  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  message: "Enter a valid email address",
} as const;

// Password strength: ≥6 chars with lower, upper, digit and a special char.
const PASSWORD_PATTERN = {
  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/,
  message:
    "At least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character",
} as const;

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

const accentLink = `text-[var(--m-accent)] font-semibold underline-offset-2 hover:underline ${focusRing}`;

/* ----------------------------- shared bits ----------------------------- */

function GoogleGlyph() {
  // Official multicolor Google "G" — the one sanctioned color exception.
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" aria-hidden="true">
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
      // Full-width outline button → matches the submit height (36px / h-9).
      className={`mono-btn-outline flex h-9 w-full items-center justify-center gap-2.5 bg-transparent px-4 text-[14px] font-semibold tracking-[0.06em] text-[var(--m-fg)] hover:bg-[var(--m-panel)] hover:text-[var(--m-fg)] ${focusRing}`}
    >
      <GoogleGlyph />
      {label}
    </button>
  );
}

function OrRule() {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-0.5 flex-1 bg-[var(--m-dim)]" />
      <span className="mono-label text-[var(--m-muted2)]">{"// OR"}</span>
      <span className="h-0.5 flex-1 bg-[var(--m-dim)]" />
    </div>
  );
}

/** Centered 14px helper line under the form (with an inline accent link). */
function HelperLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 text-center text-[14px] text-[var(--m-muted)]">
      {children}
    </p>
  );
}

/* ------------------------------- LOGIN ------------------------------- */

type LoginFields = { email: string; password: string };

function LoginView({
  titleId,
  onClose,
  goForgot,
  goRegister,
}: {
  titleId: string;
  onClose: () => void;
  goForgot: () => void;
  goRegister: () => void;
}) {
  const { login, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({ shouldUseNativeValidation: false });

  const onSubmit = async ({ email, password }: LoginFields) => {
    setLoading(true);
    await login(email, password)
      .catch((error) => addToastError("Login Failed", error))
      .finally(() => setLoading(false));
  };

  return (
    <>
      <ModalHeader
        eyebrow="// ACCESS"
        title="Welcome back"
        titleId={titleId}
        subtitle="Log in to break the silence — like, comment, join the noise."
        onClose={onClose}
      />

      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <Field
            id="login-email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email", {
              required: "Email is required",
              pattern: EMAIL_PATTERN,
            })}
          />
        </div>

        {/* Password + a right-aligned "Forgot?" link. Field no longer
            reserves space below the underline, so add a deliberate `mt-2` gap
            between the field and the link, then the canonical 16 (`mt-4`)
            before the submit — stays clean in both empty and error states. */}
        <Field
          id="login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password", { required: "Password is required" })}
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={goForgot}
            className={`text-[11px] tracking-[0.12em] uppercase ${accentLink}`}
          >
            Forgot password?
          </button>
        </div>

        <div className="mt-4">
          <SubmitButton pending={loading} pendingLabel="Logging in…">
            Log in →
          </SubmitButton>
        </div>
      </form>

      <OrRule />
      <GoogleButton label="Continue with Google" onClick={loginWithGoogle} />

      <HelperLine>
        Not a member yet?{" "}
        <button type="button" onClick={goRegister} className={accentLink}>
          Create account
        </button>
      </HelperLine>
    </>
  );
}

/* ------------------------------- FORGOT ------------------------------- */

type ForgotFields = { email: string };

function ForgotView({
  titleId,
  onClose,
  goLogin,
}: {
  titleId: string;
  onClose: () => void;
  goLogin: () => void;
}) {
  const { mutate, isPending } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFields>({ shouldUseNativeValidation: false });

  const onSubmit = ({ email }: ForgotFields) => mutate({ email });

  return (
    <>
      <ModalHeader
        eyebrow="// RECOVERY"
        title="Reset password"
        titleId={titleId}
        subtitle="Drop your email — we'll beam over a reset link. Check spam if it ghosts you."
        onClose={onClose}
      />

      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <Field
            id="forgot-email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email", {
              required: "Email is required",
              pattern: EMAIL_PATTERN,
            })}
          />
        </div>

        <SubmitButton pending={isPending} pendingLabel="Sending…">
          Send reset link →
        </SubmitButton>
      </form>

      <HelperLine>
        ←{" "}
        <button type="button" onClick={goLogin} className={accentLink}>
          Back to Log in
        </button>
      </HelperLine>
    </>
  );
}

/* ------------------------------- REGISTER ------------------------------- */

type RegisterFields = RegisterUserRequest & { confirmPassword: string };

function RegisterView({
  titleId,
  onClose,
  goLogin,
}: {
  titleId: string;
  onClose: () => void;
  goLogin: () => void;
}) {
  const {
    register: registerUser,
    isAuthenticated,
    loginWithGoogle,
  } = useAuth();
  const [loading, setLoading] = useState(false);

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
      // register() logs the user in on success → the parent's auth effect closes
      // the modal. If we somehow land here unauthenticated, fall back to login.
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
    <>
      <ModalHeader
        eyebrow="// NEW USER"
        title="Create an account"
        titleId={titleId}
        onClose={onClose}
      />

      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        {/* Email + Username */}
        <div className="grid grid-cols-2 gap-4">
          <Field
            id="reg-email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            error={errors.email?.message}
            {...register("email", {
              required: "Email is required",
              pattern: EMAIL_PATTERN,
            })}
          />
          <Field
            id="reg-username"
            label="Username"
            type="text"
            autoComplete="username"
            required
            error={errors.userName?.message}
            {...register("userName", {
              required: "Username is required",
              pattern: {
                value: /^[A-Za-z0-9_.-]+$/,
                message: "No spaces or special characters",
              },
            })}
          />
        </div>

        {/* First + Last name */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field
            id="reg-firstname"
            label="First name"
            type="text"
            autoComplete="given-name"
            required
            error={errors.firstName?.message}
            {...register("firstName", {
              required: "First Name is required",
              minLength: { value: 2, message: "At least 2 characters" },
            })}
          />
          <Field
            id="reg-lastname"
            label="Last name"
            type="text"
            autoComplete="family-name"
            required
            error={errors.lastName?.message}
            {...register("lastName", {
              required: "Last Name is required",
              minLength: { value: 2, message: "At least 2 characters" },
            })}
          />
        </div>

        {/* Password + Confirm */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field
            id="reg-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            error={errors.password?.message}
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "At least 6 characters" },
              pattern: PASSWORD_PATTERN,
            })}
          />
          <Field
            id="reg-confirm"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            required
            error={errors.confirmPassword?.message}
            {...register("confirmPassword", {
              required: "Password confirmation is required",
              validate: (value) =>
                value === getValues("password") || "Passwords do not match",
            })}
          />
        </div>

        <div className="mt-4">
          <SubmitButton pending={loading} pendingLabel="Creating…">
            Create account →
          </SubmitButton>
        </div>
      </form>

      <OrRule />
      <GoogleButton label="Sign up with Google" onClick={loginWithGoogle} />

      <HelperLine>
        Already have an account?{" "}
        <button type="button" onClick={goLogin} className={accentLink}>
          Log in
        </button>
      </HelperLine>
    </>
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
  const { isAuthenticated } = useAuth();
  const titleId = useModalTitleId();

  // Close the overlay once authentication succeeds (login or register). This is
  // a sync-to-external-system effect — lifted here so it lives in one place
  // instead of being duplicated across the login/register views.
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      onOpenChange();
    }
  }, [isOpen, isAuthenticated, onOpenChange]);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      // Reset to login whenever the modal fully closes, so reopening starts fresh.
      onClose={() => setView("login")}
      width={view === "register" ? "lg" : "md"}
      labelledBy={titleId}
    >
      {(onClose) => {
        if (view === "forgot") {
          return (
            <ForgotView
              titleId={titleId}
              onClose={onClose}
              goLogin={() => setView("login")}
            />
          );
        }
        if (view === "register") {
          return (
            <RegisterView
              titleId={titleId}
              onClose={onClose}
              goLogin={() => setView("login")}
            />
          );
        }
        return (
          <LoginView
            titleId={titleId}
            onClose={onClose}
            goForgot={() => setView("forgot")}
            goRegister={() => setView("register")}
          />
        );
      }}
    </Modal>
  );
}
