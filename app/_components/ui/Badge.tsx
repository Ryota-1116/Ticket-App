type Variant = "default" | "success" | "warning" | "danger" | "info";

const styles: Record<Variant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
};

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: Variant;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 ${styles[variant]}`}>
      {children}
    </span>
  );
}

export function eventStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: Variant }> = {
    DRAFT: { label: "下書き", variant: "default" },
    PUBLISHED: { label: "公開中", variant: "success" },
    CANCELLED: { label: "キャンセル", variant: "danger" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "default" };
  return <Badge variant={variant}>{label}</Badge>;
}

export function orderStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: Variant }> = {
    PENDING: { label: "保留中", variant: "warning" },
    PAID: { label: "支払済", variant: "success" },
    PARTIALLY_REFUNDED: { label: "一部返金", variant: "info" },
    REFUNDED: { label: "返金済", variant: "danger" },
    CANCELLED: { label: "キャンセル", variant: "default" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "default" };
  return <Badge variant={variant}>{label}</Badge>;
}
