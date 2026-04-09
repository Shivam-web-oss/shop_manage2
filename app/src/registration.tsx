"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation (don’t skip this)
    if (!form.name || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Registration failed")
      }

      setSuccess(data.message || "Account created successfully")

      // Redirect after success
      setTimeout(() => {
        router.replace("/login");
      }, 1000);

    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="glass rounded-3xl w-full max-w-md p-8 shadow-2xl"
      >
        <h1 className="text-2xl font-bold text-center mb-6 text-white">
          Create Account
        </h1>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className="w-full mb-4 p-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full mb-4 p-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full mb-4 p-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white/20 text-white p-3 rounded-lg hover:bg-white/30 transition backdrop-blur-sm border border-white/30"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        {/* Feedback */}
        {error && (
          <p className="mt-4 text-red-300 text-sm text-center">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-4 text-green-300 text-sm text-center">
            {success}
          </p>
        )}

        {/* Navigation */}
        <p className="mt-4 text-center text-sm text-white/80">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:text-white/80 underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}