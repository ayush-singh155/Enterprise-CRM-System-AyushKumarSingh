import {
  getDashboardKpis,
  getDashboardSummary,
  getDealsByStage,
  getLeadsBySource,
  getMonthlyRevenue,
  getTopPerformingReps
} from '../services/dashboardService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getDateRange = (query) => ({
  ...(query.startDate ? { startDate: query.startDate } : {}),
  ...(query.endDate ? { endDate: query.endDate } : {})
});

export const summary = asyncHandler(async (req, res) => {
  res.json(await getDashboardSummary(req.user, getDateRange(req.query)));
});

export const kpis = asyncHandler(async (req, res) => {
  res.json(await getDashboardKpis(req.user, getDateRange(req.query)));
});

export const monthlyRevenue = asyncHandler(async (req, res) => {
  res.json({ items: await getMonthlyRevenue(req.user, getDateRange(req.query)) });
});

export const leadsBySource = asyncHandler(async (req, res) => {
  res.json({ items: await getLeadsBySource(req.user, getDateRange(req.query)) });
});

export const dealsByStage = asyncHandler(async (req, res) => {
  res.json({ items: await getDealsByStage(req.user, getDateRange(req.query)) });
});

export const topPerformingReps = asyncHandler(async (req, res) => {
  res.json({
    items: await getTopPerformingReps(req.user, getDateRange(req.query), req.query.limit)
  });
});
