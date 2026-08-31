// Presence over the awareness channel: who has which node open. Awareness
// states come from other clients, so collectNodePresence has to cope with
// whatever they contain. See utils/presence.ts.

import {
  collectNodePresence,
  readableTextColor,
  SELECTION_FIELD
} from './presence';

const LOCAL_CLIENT = 1;

function state(nodeId: string | null, user: any = undefined, editing = false) {
  return {
    [SELECTION_FIELD]: { nodeId, editing },
    ...(user === undefined ? {} : { user })
  };
}

const alice = {
  username: 'alice',
  name: 'Alice Green',
  display_name: 'Alice',
  color: '#ff8800'
};

describe('collectNodePresence', () => {
  it('groups remote clients by the node they have open', () => {
    const presence = collectNodePresence(
      new Map<number, any>([
        [2, state('n1', alice)],
        [3, state('n2', { ...alice, display_name: 'Bob', color: '#0088ff' })]
      ]),
      LOCAL_CLIENT
    );

    expect(Object.keys(presence).sort()).toEqual(['n1', 'n2']);
    expect(presence['n1'][0]).toMatchObject({
      name: 'Alice',
      color: '#ff8800'
    });
    expect(presence['n2'][0]).toMatchObject({ name: 'Bob', color: '#0088ff' });
  });

  it('lists several clients on one node, ordered by client id', () => {
    const presence = collectNodePresence(
      new Map<number, any>([
        [7, state('n1', { ...alice, display_name: 'Carol' })],
        [3, state('n1', alice)]
      ]),
      LOCAL_CLIENT
    );

    expect(presence['n1'].map(c => c.clientId)).toEqual([3, 7]);
  });

  it('leaves out the local client', () => {
    const presence = collectNodePresence(
      new Map<number, any>([[LOCAL_CLIENT, state('n1', alice)]]),
      LOCAL_CLIENT
    );

    expect(presence).toEqual({});
  });

  it('leaves out clients with nothing selected', () => {
    const presence = collectNodePresence(
      new Map<number, any>([
        [2, state(null, alice)],
        [3, { user: alice }],
        [4, {}]
      ]),
      LOCAL_CLIENT
    );

    expect(presence).toEqual({});
  });

  it('carries the editing flag through', () => {
    const presence = collectNodePresence(
      new Map<number, any>([[2, state('n1', alice, true)]]),
      LOCAL_CLIENT
    );

    expect(presence['n1'][0].editing).toBe(true);
  });

  it('falls back through the identity fields for a display name', () => {
    const presence = collectNodePresence(
      new Map<number, any>([
        [2, state('n1', { name: 'Full Name', color: '#111111' })],
        [3, state('n2', { username: 'dana', color: '#222222' })]
      ]),
      LOCAL_CLIENT
    );

    expect(presence['n1'][0].name).toBe('Full Name');
    expect(presence['n2'][0].name).toBe('dana');
  });

  it('survives a client with no user identity, as when RTC is off', () => {
    const presence = collectNodePresence(
      new Map<number, any>([[2, state('n1')]]),
      LOCAL_CLIENT
    );

    expect(presence['n1']).toHaveLength(1);
    expect(presence['n1'][0].name).toBe('Anonymous');
    expect(presence['n1'][0].color).toMatch(/^#/);
  });

  it('skips malformed states instead of throwing', () => {
    const presence = collectNodePresence(
      new Map<number, any>([
        [2, null],
        [3, { [SELECTION_FIELD]: 'not an object' }],
        [4, { [SELECTION_FIELD]: { nodeId: 42 } }],
        [5, { [SELECTION_FIELD]: { nodeId: '' } }],
        [6, state('n1', { display_name: 7, color: [] })]
      ]),
      LOCAL_CLIENT
    );

    expect(Object.keys(presence)).toEqual(['n1']);
    expect(presence['n1'][0].name).toBe('Anonymous');
  });
});

describe('readableTextColor', () => {
  it('uses dark text on light backgrounds and light text on dark ones', () => {
    expect(readableTextColor('#ffff00')).toBe('#1a1a1a');
    expect(readableTextColor('#000080')).toBe('#ffffff');
  });

  it('accepts three-digit hex', () => {
    expect(readableTextColor('#fff')).toBe('#1a1a1a');
    expect(readableTextColor('#000')).toBe('#ffffff');
  });

  it('falls back to light text on an unparseable colour', () => {
    expect(readableTextColor('rebeccapurple')).toBe('#ffffff');
    expect(readableTextColor('#12345g')).toBe('#ffffff');
  });
});
