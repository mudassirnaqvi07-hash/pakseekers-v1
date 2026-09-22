/**
 * Engineering Foundation — Verification Page
 *
 * This page confirms that the design system, fonts, and UI components
 * render correctly. It is NOT a product page and will be replaced
 * in Phase 4 (Admin Shell + Dashboard).
 *
 * See docs/ROADMAP.md for development phases.
 */

import { Badge, Button, Card, CardFooter, CardHeader, Input } from "@/components/ui";
import { APP_NAME, APP_VERSION } from "@/lib/config/app";
import { BookOpen, CheckCircle, Database, FileText, Layers, Settings } from "lucide-react";

export default function FoundationPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ------------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------------ */}
      <header className="bg-primary border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              {APP_NAME}
            </span>
          </div>
          <Badge variant="info" dot>
            v{APP_VERSION} — Engineering Foundation
          </Badge>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Main */}
      {/* ------------------------------------------------------------------ */}
      <main className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-10">
        {/* Hero */}
        <section className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            Phase 0 Complete — Engineering Foundation
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl">
            The project structure, design system, and reusable UI components
            have been established. This page verifies that the foundation
            renders correctly before proceeding to the next phase.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Foundation checklist */}
        {/* ---------------------------------------------------------------- */}
        <section aria-labelledby="checklist-heading">
          <h2
            id="checklist-heading"
            className="text-lg font-semibold text-text-primary mb-4"
          >
            Foundation Checklist
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CHECKLIST_ITEMS.map((item) => (
              <FoundationCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Design tokens */}
        {/* ---------------------------------------------------------------- */}
        <section aria-labelledby="tokens-heading">
          <h2
            id="tokens-heading"
            className="text-lg font-semibold text-text-primary mb-4"
          >
            Design Tokens
          </h2>
          <Card>
            <CardHeader
              title="Color System"
              description="All colors reference tokens defined in globals.css — no arbitrary values."
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {COLOR_TOKENS.map((token) => (
                <div key={token.name} className="flex flex-col gap-2">
                  <div
                    className="h-12 rounded-md border border-border"
                    style={{ backgroundColor: token.value }}
                    aria-label={`Color swatch for ${token.name}`}
                  />
                  <div>
                    <p className="text-xs font-medium text-text-primary">{token.name}</p>
                    <p className="text-xs text-text-secondary font-mono">{token.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Button variants */}
        {/* ---------------------------------------------------------------- */}
        <section aria-labelledby="buttons-heading">
          <h2
            id="buttons-heading"
            className="text-lg font-semibold text-text-primary mb-4"
          >
            Button Variants
          </h2>
          <Card>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" isLoading>
                Loading
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
          </Card>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Badge variants */}
        {/* ---------------------------------------------------------------- */}
        <section aria-labelledby="badges-heading">
          <h2
            id="badges-heading"
            className="text-lg font-semibold text-text-primary mb-4"
          >
            Badge Variants
          </h2>
          <Card>
            <div className="flex flex-wrap gap-3">
              <Badge variant="success" dot>Published</Badge>
              <Badge variant="draft" dot>Draft</Badge>
              <Badge variant="warning" dot>Review</Badge>
              <Badge variant="archived" dot>Archived</Badge>
              <Badge variant="error" dot>Error</Badge>
              <Badge variant="info" dot>Info</Badge>
              <Badge variant="default">Default</Badge>
            </div>
          </Card>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Form input */}
        {/* ---------------------------------------------------------------- */}
        <section aria-labelledby="forms-heading">
          <h2
            id="forms-heading"
            className="text-lg font-semibold text-text-primary mb-4"
          >
            Form Inputs
          </h2>
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Default Input"
                placeholder="Enter text..."
                helperText="This is a helper message."
              />
              <Input
                label="Required Field"
                placeholder="Required..."
                required
              />
              <Input
                label="Error State"
                placeholder="Invalid value"
                errorMessage="This field is required."
              />
              <Input
                label="Disabled Input"
                placeholder="Disabled..."
                disabled
              />
            </div>
            <CardFooter>
              <Button variant="outline">Cancel</Button>
              <Button variant="primary">Save</Button>
            </CardFooter>
          </Card>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Next phase */}
        {/* ---------------------------------------------------------------- */}
        <section className="bg-surface border border-border rounded-lg p-6">
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Next Step:</span>{" "}
            Proceed to Phase 2 — Database + Core Domain Models. See{" "}
            <code className="text-xs bg-background px-1.5 py-0.5 rounded border border-border font-mono">
              docs/ROADMAP.md
            </code>{" "}
            for the full development plan.
          </p>
        </section>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Static data — configuration/labels only, no business data
// ---------------------------------------------------------------------------

const CHECKLIST_ITEMS: Array<{
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    title: "Project Structure",
    description: "src/app, components, features, lib, server, types",
    icon: Layers,
  },
  {
    title: "TypeScript (strict)",
    description: "Strict mode, no any, path aliases configured",
    icon: Settings,
  },
  {
    title: "Design Token System",
    description: "Colors, typography, radius — all in globals.css",
    icon: BookOpen,
  },
  {
    title: "UI Primitives",
    description: "Button, Input, Card, Badge — design-token-driven",
    icon: FileText,
  },
  {
    title: "Prisma Foundation",
    description: "Singleton client, schema configured for PostgreSQL",
    icon: Database,
  },
  {
    title: "Environment Config",
    description: "Zod-validated env vars, .env.example provided",
    icon: CheckCircle,
  },
];

const COLOR_TOKENS: Array<{ name: string; value: string }> = [
  { name: "Primary", value: "#123B63" },
  { name: "Secondary", value: "#0F766E" },
  { name: "Accent", value: "#F59E0B" },
  { name: "Background", value: "#F8FAFC" },
  { name: "Surface", value: "#FFFFFF" },
  { name: "Text Primary", value: "#172033" },
  { name: "Text Secondary", value: "#64748B" },
  { name: "Border", value: "#E2E8F0" },
  { name: "Success", value: "#16A34A" },
  { name: "Error", value: "#DC2626" },
  { name: "Warning", value: "#F59E0B" },
  { name: "Disabled", value: "#94A3B8" },
];

// ---------------------------------------------------------------------------
// Internal component — not exported
// ---------------------------------------------------------------------------

function FoundationCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex gap-3 p-4 bg-surface border border-border rounded-lg">
      <div className="w-9 h-9 bg-primary/10 rounded-md flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
