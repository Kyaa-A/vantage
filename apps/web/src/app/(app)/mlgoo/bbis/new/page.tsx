"use client";

import { useRouter } from "next/navigation";
import { useCreateBBIMutation } from "@/hooks/useBBIs";
import { BBIForm } from "@/components/features/bbis";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { BBICreate } from "@vantage/shared";

export default function NewBBIPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createBBIMutation = useCreateBBIMutation();

  const handleSubmit = async (data: BBICreate) => {
    try {
      await createBBIMutation.mutateAsync({ data });
      toast.success("BBI created successfully!");
      // Invalidate the BBIs list cache so it refetches with the new BBI
      queryClient.invalidateQueries({ queryKey: ['bbis'] });
      router.push("/mlgoo/bbis");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || "Failed to create BBI. Please try again."
      );
    }
  };

  const handleCancel = () => {
    router.back();
  };

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
            Create New{" "}
            <span className="bg-gradient-to-r from-[var(--cityscape-yellow)] to-[var(--cityscape-yellow-dark)] bg-clip-text text-transparent">
              BBI
            </span>
          </h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Create a new Barangay-based Institution configuration. You can configure mapping rules after creation.
          </p>
        </div>

        {/* Form */}
        <BBIForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createBBIMutation.isPending}
        />
      </div>
    </div>
  );
}
