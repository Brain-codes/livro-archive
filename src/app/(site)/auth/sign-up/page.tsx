"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { apiPost } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await apiPost("auth-profile/signup", {
      email,
      password,
      full_name: fullName,
      phone,
    });

    if (!res.success) {
      setLoading(false);
      return toast.error(res.message ?? "Could not create your account");
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.success("Account created — please check your email to verify, then sign in.");
      router.push("/auth/sign-in");
      return;
    }
    router.push("/account");
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-24">
      <h1 className="font-display text-3xl text-ink mb-2">Create an account</h1>
      <p className="text-ink-muted mb-8">
        Optional, but it keeps every order in one place.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have one?{" "}
        <Link href="/auth/sign-in" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
