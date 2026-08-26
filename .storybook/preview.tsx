import React from 'react';
import type { Preview } from '@storybook/react-webpack5';
import { initialize, mswLoader } from 'msw-storybook-addon';

import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../src/Theme';
import { externalServiceHandlers } from '../src/mocks/handlers';
import { SettingsContext } from '../src/settings';

/*
 * Initializes MSW
 * See https://github.com/mswjs/msw-storybook-addon#configuring-msw
 * to learn how to customize it
 */
initialize();

const preview: Preview = {
  loaders: [mswLoader],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    settings: {
      virtualLab: 'test-virtual-lab-1',
      workflowServiceUrl: 'http://localhost:62438',
      catalogueServiceUrl: 'http://localhost:8000'
    },
    msw: {
      handlers: externalServiceHandlers
    }
  },
  decorators: [
    (Story, { parameters }) => {
      return (
        <div
          style={{
            fontFamily:
              "system-ui,-apple-system,blinkmacsystemfont,'Segoe UI',helvetica,arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol'"
          }}
        >
          <SettingsContext.Provider value={parameters.settings}>
            <ThemeProvider theme={theme}>
              <Story />
            </ThemeProvider>
          </SettingsContext.Provider>
        </div>
      );
    }
  ]
};

export default preview;
