// src/components/ui/PaginationControls.tsx
"use client"; 

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalCount: number | null; 
  itemsPerPage: number;
  basePath: string;
  currentSearchParams: URLSearchParams; 
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalCount,
  itemsPerPage,
  basePath,
  currentSearchParams,
}) => {
  if (totalCount === null || totalCount === undefined) {
    return null; 
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (totalPages <= 1) {
    return null; 
  }

  const buildPageLink = (pageNumber: number) => {
    const params = new URLSearchParams(currentSearchParams.toString()); 
    params.set('page', String(pageNumber));
    const queryString = params.toString();
    return `${basePath}${queryString ? `?${queryString}` : ''}`;
  };

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const pageNumbers = [];
  const maxPageLinksToShow = 3; // Number of page links to show (e.g., 1 ... 4 5 6 ... 10)
  const sideBuffer = 1; // Number of pages to show from start/end before ellipsis

  // Add first page
  if (totalPages > 0) pageNumbers.push(1);

  // Ellipsis after first page?
  // Show ellipsis if current page is far enough from the start
  if (currentPage > sideBuffer + Math.ceil(maxPageLinksToShow / 2) && totalPages > (2 * sideBuffer) + maxPageLinksToShow) {
    pageNumbers.push(-1); // -1 indicates ellipsis
  }
  
  // Determine range of pages to show around current page
  let startPageLoop = Math.max(2, currentPage - Math.floor((maxPageLinksToShow - 1) / 2));
  let endPageLoop = Math.min(totalPages - 1, currentPage + Math.floor(maxPageLinksToShow / 2));

  // Adjust range if it's too close to the start or end
  if (currentPage - 1 <= Math.floor(maxPageLinksToShow/2) ) { // near the start
    endPageLoop = Math.min(totalPages - 1, maxPageLinksToShow);
  }
  if (totalPages - currentPage <= Math.floor(maxPageLinksToShow/2)) { // near the end
    startPageLoop = Math.max(2, totalPages - maxPageLinksToShow +1);
  }
  
  for (let i = startPageLoop; i <= endPageLoop; i++) {
    if (!pageNumbers.includes(i)) { 
        pageNumbers.push(i);
    }
  }
  
  // Ellipsis before last page?
  // Show ellipsis if current page is far enough from the end
  if (currentPage < totalPages - sideBuffer - Math.floor(maxPageLinksToShow / 2) && totalPages > (2 * sideBuffer) + maxPageLinksToShow) {
     // Check if the last number added isn't already an ellipsis or the one before last page
    if (pageNumbers[pageNumbers.length -1] !== totalPages -1 && pageNumbers[pageNumbers.length -1] !== -1) {
        pageNumbers.push(-1);
    }
  }

  // Add last page if not already included and totalPages > 1
  if (totalPages > 1 && !pageNumbers.includes(totalPages)) {
    pageNumbers.push(totalPages);
  }
  
  // Remove duplicate ellipsis if they are adjacent due to logic
  const finalPageNumbers = pageNumbers.filter((num, index, arr) => !(num === -1 && arr[index-1] === -1));


  return (
    <nav aria-label="Pagination" className="flex items-center justify-center space-x-1 sm:space-x-2 mt-8">
      {hasPreviousPage ? (
        <Link href={buildPageLink(currentPage - 1)} passHref legacyBehavior>
          <Button variant="outline" size="sm" asChild className="h-9 px-2 sm:px-3">
            <a>
              <ChevronLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Prev</span>
            </a>
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled className="h-9 px-2 sm:px-3">
          <ChevronLeft className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Prev</span>
        </Button>
      )}

      {finalPageNumbers.map((page, index) => 
        page === -1 ? (
          <span key={`ellipsis-${index}`} className="text-muted-foreground px-1 text-sm self-end pb-1">...</span>
        ) : (
          <Link key={page} href={buildPageLink(page)} passHref legacyBehavior>
            <Button variant={currentPage === page ? 'default' : 'ghost'} size="icon" asChild className="h-9 w-9 text-xs">
              <a>{page}</a>
            </Button>
          </Link>
        )
      )}

      {hasNextPage ? (
        <Link href={buildPageLink(currentPage + 1)} passHref legacyBehavior>
          <Button variant="outline" size="sm" asChild className="h-9 px-2 sm:px-3">
            <a>
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4 sm:ml-1" />
            </a>
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled className="h-9 px-2 sm:px-3">
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4 sm:ml-1" />
        </Button>
      )}
    </nav>
  );
};

export default PaginationControls;
