export const priorityConfig: Record<string, { label: string; badgeClass: string; borderClass: string }> = {
  HIGH: {
    label: "Alta",
    badgeClass: "bg-red-100 text-red-700 hover:bg-red-100",
    borderClass: "border-t-red-600",
  },
  MEDIUM: {
    label: "Média",
    badgeClass: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    borderClass: "border-t-yellow-500",
  },
  LOW: {
    label: "Baixa",
    badgeClass: "bg-green-100 text-green-700 hover:bg-green-100",
    borderClass: "border-t-green-500",
  },
};