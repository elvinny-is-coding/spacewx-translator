// lib/env-validation.ts

interface EnvVarSpec {
  name: string;
  required: boolean;
  description: string;
}

const ENV_VARS: EnvVarSpec[] = [
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    description: "Supabase project URL",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: true,
    description: "Supabase anonymous/public key",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    required: true,
    description: "Supabase service role key",
  },
  {
    name: "CLOUDFLARE_WORKER_AI_API_KEY",
    required: true,
    description: "Cloudflare Workers AI API key",
  },
  {
    name: "CLOUDFLARE_WORKER_AI_ACCOUNT_ID",
    required: true,
    description: "Cloudflare account ID",
  },
  {
    name: "NASA_API_KEY",
    required: false,
    description: "NASA DONKI API key (optional, uses DEMO_KEY if not set)",
  },
  {
    name: "CRON_SECRET",
    required: true,
    description: "Secret for cron job authentication",
  },
  {
    name: "RESEND_API_KEY",
    required: false,
    description: "Resend API key for email sending (optional)",
  },
];

export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const spec of ENV_VARS) {
    const value = process.env[spec.name];

    if (spec.required && !value) {
      errors.push(
        `Missing required environment variable: ${spec.name} (${spec.description})`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Validate on import (server‑side only)
if (typeof window === "undefined") {
  const validation = validateEnv();
  if (!validation.valid) {
    console.error("Environment validation failed:");
    validation.errors.forEach((error) => console.error(`  - ${error}`));
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment configuration");
    }
  }
}
