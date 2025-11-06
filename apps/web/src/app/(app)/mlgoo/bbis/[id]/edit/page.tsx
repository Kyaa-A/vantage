"use client";

import { useRouter, useParams } from "next/navigation";
import { useBBI, useUpdateBBIMutation } from "@/hooks/useBBIs";
import { BBIForm } from "@/components/features/bbis";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { BBIUpdate } from "@vantage/shared";

export default function EditBBIPage() {
  const router = useRouter();
  const params = useParams();
  const bbiId = parseInt(params.id as string);

  const { data: bbi, isLoading } = useBBI(bbiId);
  const updateBBIMutation = useUpdateBBIMutation();

  const handleSubmit = async (data: BBIUpdate) => {
    try {
      await updateBBIMutation.mutateAsync({ bbiId, data });
      toast.success("BBI updated successfully!");
      router.push("/mlgoo/bbis");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || "Failed to update BBI. Please try again."
      );
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--cityscape-yellow)] mx-auto mb-4"></div>
          <p className="text-[var(--muted-foreground)]">Loading BBI...</p>
        </div>
      </div>
    );
  }

  if (!bbi) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-sm p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              BBI Not Found
            </h2>
            <p className="text-[var(--muted-foreground)]">
              The BBI you're looking for doesn't exist.
            </p>
            <button
              onClick={() => router.push("/mlgoo/bbis")}
              className="mt-4 text-[var(--cityscape-yellow)] hover:underline"
            >
              ← Back to BBIs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to BBIs
          </button>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Edit{" "}
            <span className="bg-gradient-to-r from-[var(--cityscape-yellow)] to-[var(--cityscape-yellow-dark)] bg-clip-text text-transparent">
              BBI
            </span>
          </h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Update the BBI configuration. Note: Governance area cannot be changed after creation.
          </p>
        </div>

        {/* Form */}
        <BBIForm
          initialValues={{
            id: bbi.id,
            name: bbi.name,
            abbreviation: bbi.abbreviation,
            description: bbi.description || undefined,
            governance_area_id: bbi.governance_area_id,
            mapping_rules: bbi.mapping_rules || undefined,
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEditing
          isSubmitting={updateBBIMutation.isPending}
        />
      </div>
    </div>
  );
}
