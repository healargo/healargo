"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Eye, UserRound } from "lucide-react";
import { toast } from "sonner";
import { PartnerFormDialog } from "@/components/features/admin/business/PartnerFormDialog";
import { PartnersTable } from "@/components/features/admin/business/PartnersTable";
import {
  AdminAddButton,
  AdminCard,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/features/admin/AdminUi";
import { BUSINESS_COPY } from "@/constants/business";
import { API_ENDPOINTS } from "@/constants/api";
import type { BusinessPartnerListItem } from "@/types/business";

export function AdminBusinessPartnersClient({
  partners,
}: {
  partners: BusinessPartnerListItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessPartnerListItem | null>(null);

  const overview = useMemo(() => {
    const yours = partners.filter((p) => p.isOwner).length;
    return {
      total: partners.length,
      yours,
      shared: partners.length - yours,
    };
  }, [partners]);

  async function onDelete(partner: BusinessPartnerListItem) {
    if (!window.confirm(BUSINESS_COPY.deletePartnerConfirm)) return;
    const res = await fetch(
      API_ENDPOINTS.ADMIN_BUSINESS_PARTNER(partner._id),
      { method: "DELETE" },
    );
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error || BUSINESS_COPY.deleteFailed);
      return;
    }
    toast.success(BUSINESS_COPY.partnerDeleted);
    router.refresh();
  }

  return (
    <div>
      <AdminPageHeader
        title={BUSINESS_COPY.listTitle}
        description={BUSINESS_COPY.listDescription}
        actions={
          <AdminAddButton
            label={BUSINESS_COPY.addPartner}
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          />
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <AdminStatCard
          label={BUSINESS_COPY.partnersCount}
          value={String(overview.total)}
          icon={<Briefcase className="h-5 w-5" />}
        />
        <AdminStatCard
          label={BUSINESS_COPY.yourPartners}
          value={String(overview.yours)}
          icon={<UserRound className="h-5 w-5" />}
          tone="accent"
        />
        <AdminStatCard
          label={BUSINESS_COPY.sharedPartners}
          value={String(overview.shared)}
          icon={<Eye className="h-5 w-5" />}
          tone="muted"
        />
      </div>

      {partners.length === 0 ? (
        <AdminCard className="px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Briefcase className="h-6 w-6" />
          </div>
          <p className="mt-4 font-display text-xl text-dark">
            {BUSINESS_COPY.emptyPartners}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            {BUSINESS_COPY.emptyPartnersHint}
          </p>
          <div className="mt-6 flex justify-center">
            <AdminAddButton
              label={BUSINESS_COPY.addPartner}
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            />
          </div>
        </AdminCard>
      ) : (
        <PartnersTable
          partners={partners}
          onEdit={(partner) => {
            setEditing(partner);
            setOpen(true);
          }}
          onDelete={onDelete}
        />
      )}

      <PartnerFormDialog
        open={open}
        onOpenChange={setOpen}
        partner={editing}
        onDone={() => router.refresh()}
      />
    </div>
  );
}
