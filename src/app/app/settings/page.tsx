import { Card, SectionTitle } from "@/components/ui";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle
          title="Settings"
          subtitle="MVP settings are intentionally minimal."
        />
        <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/90 marker:text-accent">
          <li>Password reset is available from the login page.</li>
          <li>Email reminders are planned for v1.1.</li>
          <li>Household transfer and advanced roles are out of scope for MVP.</li>
        </ul>
      </Card>
    </div>
  );
}
