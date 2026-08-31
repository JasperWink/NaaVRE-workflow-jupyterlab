import { createContext } from 'react';
import { INodePresence } from '../../utils/presence';

/**
 * Remote collaborators by node id, for the nodes on the canvas.
 *
 * Presence reaches the node components through context rather than through a
 * factory that closes over it. react-flow-chart re-registers a node's size and
 * every one of its port positions whenever the Node component remounts, and a
 * new factory result is a new component type to React — so rebuilding it on
 * each presence change would remount the whole canvas and fire that
 * registration storm through the chart actions, which recompute from the
 * component state as it was when they were dispatched. Context keeps the
 * component identity fixed and re-renders the nodes in place.
 */
export const NodePresenceContext = createContext<INodePresence>({});
