import React, { useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Composer } from './Composer';
import { chart as mockChart } from '../mocks/chart';

function ComposerStory() {
  const composerRef = useRef<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      composerRef.current?.setState({ chart: mockChart });
    }, 100);

    return () => clearTimeout(timer);
  }, []);
  return <Composer ref={composerRef} />;
}

const meta = {
  component: ComposerStory
} satisfies Meta<typeof Composer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
