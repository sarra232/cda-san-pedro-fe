import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (size: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-cda-dark-800 text-xs text-slate-400">
      {/* Items count & Size selector */}
      <div className="flex items-center gap-3">
        <span>
          Mostrando <strong className="text-white font-mono">{startItem}</strong> a{' '}
          <strong className="text-white font-mono">{endItem}</strong> de{' '}
          <strong className="text-cda-yellow-400 font-mono">{totalItems}</strong> registros
        </span>

        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-cda-dark-800">
            <span className="text-[11px] text-slate-500">Por pág:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="bg-cda-dark-900 border border-cda-dark-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:border-cda-yellow-500 focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-cda-dark-900 border border-cda-dark-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:text-slate-300 transition-colors"
            title="Primera página"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-cda-dark-900 border border-cda-dark-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:text-slate-300 transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 px-1">
            {getPageNumbers().map((page, idx) =>
              typeof page === 'number' ? (
                <button
                  key={idx}
                  onClick={() => onPageChange(page)}
                  className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-all ${
                    currentPage === page
                      ? 'bg-cda-yellow-500 text-black shadow shadow-cda-yellow-500/20'
                      : 'bg-cda-dark-900 text-slate-300 border border-cda-dark-800 hover:border-cda-dark-700 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span key={idx} className="px-1 text-slate-600">
                  {page}
                </span>
              )
            )}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg bg-cda-dark-900 border border-cda-dark-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:text-slate-300 transition-colors"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg bg-cda-dark-900 border border-cda-dark-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:text-slate-300 transition-colors"
            title="Última página"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
