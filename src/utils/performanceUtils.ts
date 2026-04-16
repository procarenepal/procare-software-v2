// src/utils/performanceUtils.ts
import React from "react";

interface PerformanceTimer {
  start: number;
  end?: number;
  duration?: number;
}

class PerformanceTracker {
  private timers: Map<string, PerformanceTimer> = new Map();

  /**
   * Start tracking a performance metric
   */
  start(label: string): void {
    this.timers.set(label, {
      start: performance.now(),
    });
  }

  /**
   * End tracking and log the duration
   */
  end(label: string): number {
    const timer = this.timers.get(label);

    if (!timer) {
      console.warn(`Performance timer '${label}' not found`);

      return 0;
    }

    const end = performance.now();
    const duration = end - timer.start;

    timer.end = end;
    timer.duration = duration;

    console.log(`⚡ ${label}: ${duration.toFixed(2)}ms`);

    return duration;
  }

  /**
   * Get the duration without ending the timer
   */
  getDuration(label: string): number {
    const timer = this.timers.get(label);

    if (!timer) {
      return 0;
    }

    if (timer.duration !== undefined) {
      return timer.duration;
    }

    return performance.now() - timer.start;
  }

  /**
   * Clear a specific timer
   */
  clear(label: string): void {
    this.timers.delete(label);
  }

  /**
   * Clear all timers
   */
  clearAll(): void {
    this.timers.clear();
  }

  /**
   * Get all timers summary
   */
  getSummary(): Record<string, number> {
    const summary: Record<string, number> = {};

    this.timers.forEach((timer, label) => {
      if (timer.duration !== undefined) {
        summary[label] = timer.duration;
      } else {
        summary[label] = performance.now() - timer.start;
      }
    });

    return summary;
  }
}

// Export singleton instance
export const performanceTracker = new PerformanceTracker();

/**
 * Higher-order component to track component render performance
 */
export function withPerformanceTracking<T extends object>(
  Component: React.ComponentType<T>,
  componentName: string,
): React.ComponentType<T> {
  return function PerformanceTrackedComponent(props: T) {
    React.useEffect(() => {
      performanceTracker.start(`${componentName}_render`);

      return () => {
        performanceTracker.end(`${componentName}_render`);
      };
    }, []);

    return React.createElement(Component, props);
  };
}

/**
 * Hook to track async operation performance
 */
export function usePerformanceTracking(operationName: string) {
  const start = React.useCallback(() => {
    performanceTracker.start(operationName);
  }, [operationName]);

  const end = React.useCallback(() => {
    return performanceTracker.end(operationName);
  }, [operationName]);

  return { start, end };
}
