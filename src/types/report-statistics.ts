import type { ReportResult, ReportType } from '@/types/report';

/**
 * One row of a statistics breakdown. `key` is the same value the reports
 * list filters on; null is «بدون جرم» in byCrimeType and «غير محدد» elsewhere.
 */
export interface StatisticItem<K> {
  key: K | null;
  label: string;
  count: number;
  /** First level only: this row's reports broken down by the other four breakdowns. */
  details?: StatisticDetails;
}

/** The breakdown of the row itself is absent. */
export interface StatisticDetails {
  byType?: StatisticItem<ReportType>[];
  byFormType?: StatisticItem<number>[];
  byCrimeType?: StatisticItem<number>[];
  byDiscovered?: StatisticItem<boolean>[];
  byResult?: StatisticItem<ReportResult>[];
}

/** GET /reports/statistics — every breakdown's counts sum to `total`. */
export interface ReportStatisticsResponse {
  from: string | null;
  to: string | null;
  total: number;
  byType: StatisticItem<ReportType>[];
  byFormType: StatisticItem<number>[];
  /** Non-zero crime types only, then «بدون جرم» (key null) last. */
  byCrimeType: StatisticItem<number>[];
  byDiscovered: StatisticItem<boolean>[];
  byResult: StatisticItem<ReportResult>[];
}

export interface StatisticsRange {
  from?: string;
  to?: string;
}
