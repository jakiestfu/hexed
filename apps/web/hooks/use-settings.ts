'use client';

import { useLocalStorage } from './use-local-storage';

const ASCII = 'hexed:show-ascii';
const CHECKSUMS = 'hexed:show-checksums';
const STRINGS = 'hexed:show-strings';
const TEMPLATES = 'hexed:show-templates';
const INTERPRETER = 'hexed:show-interpreter';
const SIDEBAR_POSITION = 'hexed:sidebar-position';

export type SidebarPosition = 'left' | 'right';

/**
 * Consolidated hook for managing all application settings in localStorage
 *
 * @returns An object containing all settings and their setters
 */
export function useSettings() {
  const [showAscii, setShowAscii] = useLocalStorage(ASCII, true);
  const [showChecksums, setShowChecksums] = useLocalStorage(CHECKSUMS, true);
  const [showStrings, setShowStrings] = useLocalStorage(STRINGS, false);
  const [showTemplates, setShowTemplates] = useLocalStorage(TEMPLATES, false);
  const [showInterpreter, setShowInterpreter] = useLocalStorage(
    INTERPRETER,
    false
  );
  const [sidebarPosition, setSidebarPosition] =
    useLocalStorage<SidebarPosition>(SIDEBAR_POSITION, 'right');

  const toggleSidebarPosition = () => {
    setSidebarPosition((prev) => (prev === 'left' ? 'right' : 'left'));
  };

  return {
    // ASCII visibility
    showAscii,
    setShowAscii,
    // Checksum visibility
    showChecksums,
    setShowChecksums,
    // Strings visibility
    showStrings,
    setShowStrings,
    // Templates visibility
    showTemplates,
    setShowTemplates,
    // Interpreter visibility
    showInterpreter,
    setShowInterpreter,
    // Sidebar position
    sidebarPosition,
    setSidebarPosition,
    toggleSidebarPosition
  };
}
