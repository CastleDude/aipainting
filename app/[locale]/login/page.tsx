import { getMessages } from "next-intl/server";
import { LoginPage } from "@/components/LoginPage";

export default async function LoginPageServer({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const loginMessages = messages.login_modal as Record<string, string>;

  const pageMessages = {
    login: (loginMessages?.login as string) || "Log In",
    signup: (loginMessages?.signup as string) || "Sign Up",
    welcome_back: (loginMessages?.welcome_back as string) || "Welcome back",
    create_account: (loginMessages?.create_account as string) || "Create your account",
    login_desc: (loginMessages?.login_desc as string) || "Log in to access your account",
    signup_desc: (loginMessages?.signup_desc as string) || "Sign up to unlock more features",
    name: (loginMessages?.name as string) || "Name",
    name_placeholder: (loginMessages?.name_placeholder as string) || "Your name",
    email: (loginMessages?.email as string) || "Email",
    email_placeholder: (loginMessages?.email_placeholder as string) || "you@example.com",
    password: (loginMessages?.password as string) || "Password",
    password_placeholder: (loginMessages?.password_placeholder as string) || "Enter your password",
    login_btn: (loginMessages?.login_btn as string) || "Log In",
    signup_btn: (loginMessages?.signup_btn as string) || "Create Account",
    demo_notice: (loginMessages?.demo_notice as string) || "",
    error_generic: (loginMessages?.error_generic as string) || "Please fill in all fields.",
    error_invalid_email: (loginMessages?.error_invalid_email as string) || "Invalid email.",
    error_weak_password: (loginMessages?.error_weak_password as string) || "Password too weak.",
    error_network: (loginMessages?.error_network as string) || "Network error.",
    success_signup: (loginMessages?.success_signup as string) || "Account created!",
    signup_success_hint: (loginMessages?.signup_success_hint as string) || "",
    google_login: (loginMessages?.google_login as string) || "Continue with Google",
    forgot_password: (loginMessages?.forgot_password as string) || "Forgot password?",
    forgot_password_title: (loginMessages?.forgot_password_title as string) || "Reset Password",
    forgot_password_desc: (loginMessages?.forgot_password_desc as string) || "We'll send you a reset link.",
    send_reset_link: (loginMessages?.send_reset_link as string) || "Send Reset Link",
    reset_sent: (loginMessages?.reset_sent as string) || "Check your email",
    reset_sent_desc: (loginMessages?.reset_sent_desc as string) || "We sent a password reset link.",
    back_to_login: (loginMessages?.back_to_login as string) || "Back to login",
    verify_email_title: (loginMessages?.verify_email_title as string) || "Verify your email",
    verify_email_desc: (loginMessages?.verify_email_desc as string) || "Check {email} for a verification link.",
    verify_email_resent: (loginMessages?.verify_email_resent as string) || "Verification email resent.",
    resend_verification: (loginMessages?.resend_verification as string) || "Resend verification",
  };

  return <LoginPage locale={locale} messages={pageMessages} />;
}
