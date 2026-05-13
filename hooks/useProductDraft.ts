"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearProductDraft,
  getProductDraft,
  setProductDraft,
  type ProductDraft,
} from "@/utils/storage";

export function useProductDraft() {
  const [draft, setDraftState] = useState<ProductDraft | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // localStorage is only available after hydration, so the draft is loaded client-side.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftState(getProductDraft());
    setLoaded(true);
  }, []);

  const saveDraft = useCallback((nextDraft: ProductDraft) => {
    setProductDraft(nextDraft);
    setDraftState(nextDraft);
  }, []);

  const clearDraft = useCallback(() => {
    clearProductDraft();
    setDraftState(null);
  }, []);

  return {
    draft,
    loaded,
    saveDraft,
    clearDraft,
  };
}
