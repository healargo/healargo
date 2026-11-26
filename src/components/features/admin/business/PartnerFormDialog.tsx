"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminFormDialog } from "@/components/features/admin/AdminFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BUSINESS_COPY } from "@/constants/business";
import { API_ENDPOINTS } from "@/constants/api";
import type { BusinessPartner } from "@/types/business";

export function PartnerFormDialog({
  open,
  onOpenChange,
  partner,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner?: BusinessPartner | null;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setName(partner?.name ?? "");
  }, [open, partner]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(
        partner
          ? API_ENDPOINTS.ADMIN_BUSINESS_PARTNER(partner._id)
          : API_ENDPOINTS.ADMIN_BUSINESS_PARTNERS,
        {
          method: partner ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error || BUSINESS_COPY.createFailed);
        return;
      }
      toast.success(
        partner ? BUSINESS_COPY.partnerUpdated : BUSINESS_COPY.partnerCreated,
      );
      onOpenChange(false);
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={partner ? BUSINESS_COPY.editPartner : BUSINESS_COPY.addPartner}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="partner-name">{BUSINESS_COPY.partnerName}</Label>
          <Input
            id="partner-name"
            className="mt-1.5"
            placeholder={BUSINESS_COPY.partnerNamePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {BUSINESS_COPY.cancel}
          </Button>
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? BUSINESS_COPY.saving : BUSINESS_COPY.save}
          </Button>
        </div>
      </form>
    </AdminFormDialog>
  );
}
