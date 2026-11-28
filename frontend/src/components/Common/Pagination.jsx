import { ChevronLeft, ChevronRight } from "lucide-react";

function Pagination({ page, totalPages, total, onPageChange }) {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  return (
    <nav className="pagination" aria-label="Paginación">
      <button
        className="ghost-button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
      >
        <ChevronLeft size={17} /> Anterior
      </button>
      <span className="muted">
        Página {page} de {totalPages} · {total} registros
      </span>
      <button
        className="ghost-button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Página siguiente"
      >
        Siguiente <ChevronRight size={17} />
      </button>
    </nav>
  );
}

export default Pagination;
