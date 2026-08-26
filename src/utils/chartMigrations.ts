import { mapValues, merge } from 'lodash';
import { IChart } from './chart';

type MigratingChart = Record<string, any>;

type ChartMigration = {
  summary: string;
  // Returns true if the migration should be applied to the chart object
  needsMigration: (chart: MigratingChart) => boolean;
  // Returns a migrated copy of the chart object.
  // This function should be idempotent
  migrate: (chart: MigratingChart) => MigratingChart;
};

// Ordered list of migrations. A migration can assume that it is called on the result of the previous migration
const chartMigrations: Array<ChartMigration> = [
  {
    summary: 'add chart version',
    needsMigration: chart => !('metadata' in chart),
    migrate: chart => ({
      ...chart,
      metadata: {
        version: '1.0'
      }
    })
  },
  {
    summary:
      'add properties.params to chart and param_max_branches to splitter',
    needsMigration: chart => chart.metadata.version === '1.0',
    migrate: chart => ({
      ...chart,
      nodes: mapValues(chart.nodes, node =>
        node.type !== 'splitter'
          ? node
          : merge({}, node, {
              properties: {
                cell: {
                  params: [
                    {
                      name: 'param_max_branches',
                      type: 'int',
                      default_value: ''
                    }
                  ]
                }
              }
            })
      ),
      properties: {
        params: []
      },
      metadata: {
        version: '1.1'
      }
    })
  }
];

// Applies all migrations to a chart
export function migrateChart(chart: MigratingChart): IChart {
  // Detect the first needed migration
  const firstIndex = chartMigrations.findIndex(migration => {
    return migration.needsMigration(chart);
  });
  if (firstIndex === -1) {
    return chart as IChart;
  }

  // Apply all migrations sequentially starting from the first needed one
  return chartMigrations.slice(firstIndex).reduce((currentChart, migration) => {
    console.debug(`Applying chart migration: ${migration.summary}`);
    return migration.migrate(currentChart);
  }, chart) as IChart;
}
