import { ISharingScope } from '../naavre-common/types/NaaVRECatalogue/BaseAssets';
import { useContext, useEffect, useState } from 'react';
import { SharingScopesContext } from '../components/cells/SharingScopesContext';
import { ISettings, SettingsContext } from '../settings';

export interface ICheckboxFilter {
  key: string;
  title: string;
  section: string | null;
  checked: boolean;
  getSearchParams: (checked: boolean) => {
    [p: string]: string | null;
  };
}

export interface ICheckboxFiltersSection {
  key: string | null;
  title: string | null;
  checkboxFilters: ICheckboxFilter[];
}

const sharingScopeURLRegExp = /^.*sharing-scopes\/([^/]+)\/?$/;

const sectionTitles: { [k: string]: string } = {
  community: 'Communities',
  virtual_lab: 'Virtual labs'
};

function getSharingScopesAsCheckboxFilters(
  settings: ISettings,
  sharingScopes: ISharingScope[],
  activeSharingScopes: Set<string>,
  setActiveSharingScopes: any
): ICheckboxFilter[] {
  return sharingScopes.map((s: ISharingScope) => {
    const key = s.url.replace(sharingScopeURLRegExp, '$1');
    return {
      key: key,
      title: s.title,
      section: s.label,
      checked: settings.virtualLab
        ? s.check_in_virtual_labs.includes(settings.virtualLab)
        : true,
      getSearchParams: (checked: boolean) => {
        const newActiveSharingScopes = activeSharingScopes;
        checked
          ? newActiveSharingScopes.add(key)
          : newActiveSharingScopes.delete(key);
        setActiveSharingScopes(newActiveSharingScopes);
        return {
          shared_with_scopes: Array.from(newActiveSharingScopes).join(','),
          page: null
        };
      }
    };
  });
}

function getCheckboxFiltersAsSections(
  checkboxFilters: ICheckboxFilter[]
): ICheckboxFiltersSection[] {
  const sections = Array.from(new Set(checkboxFilters.map(f => f.section)));
  sections.sort((a, b) => {
    if (a === null && b === null) {
      return 0;
    }
    if (a === null) {
      return -1;
    }
    if (b === null) {
      return 1;
    }
    return a.localeCompare(b);
  });
  return sections.map(s => ({
    key: s,
    title: (s !== null && sectionTitles[s]) || null,
    checkboxFilters: checkboxFilters.filter(f => f.section === s)
  }));
}

export function useSharingScopeCheckboxes(
  defaultCheckboxFilters: ICheckboxFilter[]
) {
  const settings = useContext(SettingsContext);

  // All checkbox filters
  const [checkboxFilters, setCheckboxFilters] = useState<ICheckboxFilter[]>(
    defaultCheckboxFilters
  );

  // Checkbox filters organized by sections
  const [checkboxFiltersBySection, setCheckboxFiltersBySection] = useState<
    ICheckboxFiltersSection[]
  >([]);

  // Sharing scopes from the catalogue
  const sharingScopes = useContext(SharingScopesContext);

  // Keys of the active sharing scopes.  Keeping them in a separate state makes it easier to
  // update the URL search params in the .getSearchParams of individual checkbox filters.
  const [activeSharingScopes, setActiveSharingScopes] = useState<Set<string>>(
    new Set([])
  );

  // Updates checkboxFilters when sharingScopes changes, i.e. when getting the response from the catalogue
  useEffect(() => {
    setCheckboxFilters(checkboxFilters => [
      ...checkboxFilters,
      ...getSharingScopesAsCheckboxFilters(
        settings,
        sharingScopes.filter(s =>
          settings.virtualLab
            ? s.show_in_virtual_labs.includes(settings.virtualLab)
            : true
        ),
        activeSharingScopes,
        setActiveSharingScopes
      ).filter(f => !checkboxFilters.some(d => d.key === f.key))
    ]);
  }, [settings, sharingScopes, activeSharingScopes, setActiveSharingScopes]);

  // Update checkboxFiltersBySection when checkboxFilters change
  useEffect(() => {
    setCheckboxFiltersBySection(getCheckboxFiltersAsSections(checkboxFilters));
  }, [checkboxFilters]);

  return {
    checkboxFilters,
    setCheckboxFilters,
    checkboxFiltersBySection,
    activeSharingScopes
  };
}
