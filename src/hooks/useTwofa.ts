import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { disableTwofa, enableTwofa, getTwofaStatus, startTwofaSetup } from "@/api/auth.api";

const KEY = ["auth", "2fa", "status"] as const;

export function useTwofaStatus() {
  return useQuery({ queryKey: KEY, queryFn: getTwofaStatus, retry: false });
}

export function useStartTwofaSetup() {
  return useMutation({ mutationFn: startTwofaSetup });
}

export function useEnableTwofa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enableTwofa,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDisableTwofa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disableTwofa,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
