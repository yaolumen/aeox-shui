"use client";
import { useState } from "react";
import { useAdmin, Card, Field, Input, PrimaryBtn, Badge, SectionTitle } from "./ui";
import type { Admin } from "./types";

export function AccountTab({
  admins,
  onChangePassword,
}: {
  admins: Admin[];
  onChangePassword: (newPwd: string) => Promise<void>;
}) {
  const { t, toast, busy } = useAdmin();
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  async function handleChange() {
    if (newPwd.length < 6) {
      toast(t.passwordTooShort, "err");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast(t.passwordMismatch, "err");
      return;
    }
    await onChangePassword(newPwd);
    setNewPwd("");
    setConfirmPwd("");
    toast(t.passwordChanged, "ok");
  }

  return (
    <div className="space-y-6">
      <SectionTitle>{t.tabAdmins}</SectionTitle>

      {admins.length > 0 && (
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
              {admins[0]?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold">{admins[0]?.name}</div>
              <Badge color="amber">{t.adminSuper}</Badge>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          {t.changePassword}
        </h3>
        <div className="max-w-sm space-y-3">
          <Field label={t.newPassword}>
            <Input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="≥ 6 chars"
            />
          </Field>
          <Field label={t.confirmPassword}>
            <Input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
            />
          </Field>
          <PrimaryBtn onClick={handleChange} disabled={busy || !newPwd || !confirmPwd}>
            {t.save}
          </PrimaryBtn>
        </div>
      </Card>
    </div>
  );
}
