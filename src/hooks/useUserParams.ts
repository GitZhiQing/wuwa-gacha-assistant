"use client";

import { useEffect, useState } from "react";
import { loadParams } from "@/lib/params";
import { useUserStore } from "@/store/user-store";
import type { UserParams } from "@/lib/types";

export function useUserParams() {
  const { params, setParams, hasParams } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadParams()
      .then((saved) => {
        if (saved) {
          setParams(saved);
        }
      })
      .finally(() => setIsLoading(false));
  }, [setParams]);

  return { params, hasParams, isLoading };
}
