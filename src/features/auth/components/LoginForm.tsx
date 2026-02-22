"use client";

import { LogIn } from "lucide-react";
import { getLoginUrl } from "@/lib/auth";
import { Button } from "@/components";

export interface LoginFormProps {
  className?: string;
}

export default function LoginForm({ className = "" }: LoginFormProps) {
  const handleGoogleLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className={className}>
      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleGoogleLogin}
      >
        <LogIn size={20} aria-hidden />
        Iniciar sesión con Google
      </Button>
    </div>
  );
}
