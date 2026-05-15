export const priorityConfig: Record<string, { label: string; badgeClass: string; borderClass: string }> = {
  HIGH: {
    label: "Alta",
    badgeClass: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/40",
    borderClass: "border-t-red-600",
  },
  MEDIUM: {
    label: "Média",
    badgeClass: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-950/40",
    borderClass: "border-t-yellow-500",
  },
  LOW: {
    label: "Baixa",
    badgeClass: "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-950/40",
    borderClass: "border-t-green-500",
  },
};
