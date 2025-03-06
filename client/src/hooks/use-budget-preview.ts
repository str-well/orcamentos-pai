import { Budget } from "@shared/schema";
import { create } from "zustand";

type BudgetPreviewStore = {
  selectedBudget: Budget | null;
  openPreview: (budget: Budget) => void;
  closePreview: () => void;
};

export const useBudgetPreview = create<BudgetPreviewStore>((set) => ({
  selectedBudget: null,
  openPreview: (budget) => set({ selectedBudget: budget }),
  closePreview: () => set({ selectedBudget: null }),
})); 