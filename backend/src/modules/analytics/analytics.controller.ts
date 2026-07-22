import type { NextFunction, Request, Response } from "express";
import {
  calculateAllDashboardMetrics,
  calculateFocusHeatmap,
  calculateBurnoutMetric,
  calculatePeakProductivityHours,
  calculateDeepWorkScore,
} from "./analytics.service.js";
import { cacheGet, cacheSet, dashboardCacheKey } from "../../config/redis.js";
import logger from "../../utils/logger.js";
import { getUserStats, getUserAnalytics, getUserDailyStats } from "../pomodoro/pomodoro.service.js";
import type { DashboardMetrics } from "./analytics.service.js";

/**
 * Legacy stats handler (moved from pomodoro controller).
 */
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getUserStats(req.user!.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await getUserAnalytics(req.user!.id);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
};

export const getDailyStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dailyStats = await getUserDailyStats(req.user!.id);
    res.json(dailyStats);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to fetch all advanced dashboard metrics.
 * Implements a cache-aside pattern with Redis (TTL: 10 minutes).
 */
export const getDashboardAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const key = dashboardCacheKey(userId);
  const t0 = performance.now();

  try {
    const cachedData = await cacheGet<DashboardMetrics>(key);
    if (cachedData) {
      const duration = performance.now() - t0;
      logger.info(
        { userId, route: req.originalUrl, action: "cache_hit", duration },
        `Dashboard cache hit for user ${userId} in ${duration.toFixed(2)}ms`,
      );
      res.json({ ...cachedData, cached: true });
      return;
    }

    logger.info(
      { userId, route: req.originalUrl, action: "cache_miss" },
      `Dashboard cache miss for user ${userId}. Computing metrics...`,
    );
    const metrics = await calculateAllDashboardMetrics(userId);
    await cacheSet(key, metrics, 600);

    const duration = performance.now() - t0;
    logger.info(
      { userId, route: req.originalUrl, action: "calculated_and_cached", duration },
      `Dashboard metrics computed and cached in ${duration.toFixed(2)}ms`,
    );
    res.json({ ...metrics, cached: false });
  } catch (error) {
    next(error);
  }
};

export const getHeatmap = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const t0 = performance.now();
  try {
    const heatmap = await calculateFocusHeatmap(userId);
    const duration = performance.now() - t0;
    logger.info(
      { userId, route: req.originalUrl, action: "fetch_heatmap", duration },
      `Fetched heatmap in ${duration.toFixed(2)}ms`,
    );
    res.json(heatmap);
  } catch (error) {
    next(error);
  }
};

export const getBurnout = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const t0 = performance.now();
  try {
    const burnout = await calculateBurnoutMetric(userId);
    const duration = performance.now() - t0;
    logger.info(
      { userId, route: req.originalUrl, action: "fetch_burnout", duration },
      `Fetched burnout metrics in ${duration.toFixed(2)}ms`,
    );
    res.json(burnout);
  } catch (error) {
    next(error);
  }
};

export const getDeepWorkScore = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const t0 = performance.now();
  try {
    const deepWorkScore = await calculateDeepWorkScore(userId);
    const duration = performance.now() - t0;
    logger.info(
      { userId, route: req.originalUrl, action: "fetch_deep_work_score", duration },
      `Fetched deep work score in ${duration.toFixed(2)}ms`,
    );
    res.json(deepWorkScore);
  } catch (error) {
    next(error);
  }
};

export const getPeakHours = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const t0 = performance.now();
  try {
    const peakHours = await calculatePeakProductivityHours(userId);
    const duration = performance.now() - t0;
    logger.info(
      { userId, route: req.originalUrl, action: "fetch_peak_hours", duration },
      `Fetched peak productivity hours in ${duration.toFixed(2)}ms`,
    );
    res.json(peakHours);
  } catch (error) {
    next(error);
  }
};
