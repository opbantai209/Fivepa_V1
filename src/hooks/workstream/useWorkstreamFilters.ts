import { useMemo } from 'react';
import { WorkstreamItem, WorkstreamFilter } from '../../components/workstream/types';

export interface UseWorkstreamFiltersProps {
  hydratedWorkstreamItems?: WorkstreamItem[];
  workstreamTab?: WorkstreamFilter;
  starredWorkstreams?: string[];
  selectedPersonFilter?: string | null;
  projectFilterSearch?: string;
  workstreamSearch?: string;
}

/**
 * Hook responsible for filtering hydrated workstream items based on the active
 * tab, starred status, person filter, project filter search, and keyword search.
 */
export function useWorkstreamFilters({
  hydratedWorkstreamItems = [],
  workstreamTab = 'all',
  starredWorkstreams = [],
  selectedPersonFilter = null,
  projectFilterSearch = '',
  workstreamSearch = ''
}: UseWorkstreamFiltersProps = {}) {
  const filteredWorkstreamItems: WorkstreamItem[] = useMemo(() => {
    return hydratedWorkstreamItems.filter(w => {
      // Tab filter
      if (workstreamTab === 'inbox' && !['funded_in_escrow', 'in_progress'].includes(w.status)) return false;
      if (workstreamTab === 'discussion' && w.status !== 'in_progress') return false;
      if (workstreamTab === 'in_progress' && w.status !== 'in_progress') return false;
      if (workstreamTab === 'delivered' && w.status !== 'delivered') return false;
      if (workstreamTab === 'completed' && w.status !== 'completed') return false;
      if (workstreamTab === 'starred' && !starredWorkstreams.includes(w.id)) return false;
      if (workstreamTab === 'escrow' && (w.amount <= 0 || w.status === 'cancelled')) return false;
      if (workstreamTab === 'archived' && w.status !== 'cancelled') return false;

      // Person filter
      if (selectedPersonFilter && w.sellerId !== selectedPersonFilter && w.buyerId !== selectedPersonFilter) return false;

      // Project filter
      if (projectFilterSearch && !w.title.toLowerCase().includes(projectFilterSearch.toLowerCase())) return false;

      // Search query
      if (workstreamSearch) {
        const q = workstreamSearch.toLowerCase();
        const matchesTitle = w.title.toLowerCase().includes(q);
        const matchesId = w.id.toLowerCase().includes(q);
        const matchesSeller = w.seller?.name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesId && !matchesSeller) return false;
      }

      return true;
    });
  }, [hydratedWorkstreamItems, workstreamTab, starredWorkstreams, selectedPersonFilter, projectFilterSearch, workstreamSearch]);

  return {
    filteredWorkstreamItems
  };
}
