import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  basePath: string;
  extraQuery?: string;
};

export function Pagination({ page, totalPages, basePath, extraQuery }: Props) {
  if (totalPages <= 1) return null;

  const q = (p: number) =>
    `${basePath}?${extraQuery ? `${extraQuery}&` : ""}page=${p}`;

  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      {page > 1 ? (
        <Link
          href={q(page - 1)}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
        >
          前へ
        </Link>
      ) : (
        <span className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-300 cursor-default">
          前へ
        </span>
      )}

      <span className="text-sm text-gray-500">
        {page} / {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={q(page + 1)}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
        >
          次へ
        </Link>
      ) : (
        <span className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-300 cursor-default">
          次へ
        </span>
      )}
    </div>
  );
}
