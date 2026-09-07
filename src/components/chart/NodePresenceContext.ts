import { createContext } from 'react';
import { INodePresence } from '../../utils/presence';

/**
 * Remote collaborators by node id. Context, not a factory: a new component type
 * remounts every node, and react-flow-chart re-registers sizes and ports.
 */
export const NodePresenceContext = createContext<INodePresence>({});
