import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';
import { Deal } from '../models/Deal.js';
import { User } from '../models/User.js';
import { getRecordScope, getDealScope } from './accessService.js';

function getEndDate(dateRange) {
  const end = new Date(dateRange.endDate);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateRange.endDate)) end.setUTCHours(23, 59, 59, 999);
  return end;
}

function getDateFilter({ startDate, endDate }, field = 'createdAt') {
  const range = {};
  if (startDate) range.$gte = new Date(startDate);
  if (endDate) range.$lte = getEndDate({ endDate });
  return Object.keys(range).length ? { [field]: range } : {};
}

function withDateRange(scope, dateRange, field = 'createdAt') {
  const dateFilter = getDateFilter(dateRange, field);
  return Object.keys(dateFilter).length
    ? { $and: [scope, dateFilter] }
    : scope;
}

function dateRangeExpression(field, dateRange) {
  const clauses = [];
  if (dateRange.startDate) clauses.push({ $gte: [field, new Date(dateRange.startDate)] });
  if (dateRange.endDate) clauses.push({ $lte: [field, getEndDate(dateRange)] });
  if (!clauses.length) return true;
  return clauses.length === 1 ? clauses[0] : { $and: clauses };
}

const firstWonAtExpression = {
  $let: {
    vars: {
      wonHistory: {
        $filter: {
          input: { $ifNull: ['$stageHistory', []] },
          as: 'entry',
          cond: { $eq: ['$$entry.stage', 'won'] }
        }
      }
    },
    in: {
      $ifNull: [
        {
          $arrayElemAt: [
            { $map: { input: '$$wonHistory', as: 'won', in: '$$won.changedAt' } },
            0
          ]
        },
        { $cond: [{ $eq: ['$stage', 'won'] }, '$updatedAt', null] }
      ]
    }
  }
};

const wonRevenueStages = [
  { $addFields: { firstWonAt: firstWonAtExpression } },
  { $match: { firstWonAt: { $ne: null } } }
];

/** Calculates date-scoped lead conversion, won revenue, and open pipeline KPIs. */
export async function getDashboardKpis(user, dateRange = {}) {
  const leadScope = await getRecordScope(user);
  const dealScope = await getDealScope(user);
  const leadMatch = withDateRange(leadScope, dateRange);
  const dealMatch = withDateRange(dealScope, dateRange);

  const [leadStats, wonStats, openStats, customerCount] = await Promise.all([
    Lead.aggregate([
      { $match: leadMatch },
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          convertedLeads: {
            $sum: { $cond: [{ $or: [{ $eq: ['$status', 'converted'] }, { $ne: ['$convertedCustomer', null] }] }, 1, 0] }
          }
        }
      }
    ]),
    Deal.aggregate([
      { $match: dealScope },
      ...wonRevenueStages,
      { $match: getDateFilter(dateRange, 'firstWonAt') },
      { $group: { _id: null, revenueWon: { $sum: '$value' } } }
    ]),
    Deal.aggregate([
      { $match: dealMatch },
      { $match: { stage: { $nin: ['won', 'lost'] } } },
      { $group: { _id: null, openPipelineValue: { $sum: '$value' }, openDealCount: { $sum: 1 } } }
    ]),
    Customer.countDocuments(withDateRange(leadScope, dateRange))
  ]);

  const leads = leadStats[0] || { totalLeads: 0, convertedLeads: 0 };
  const won = wonStats[0] || { revenueWon: 0 };
  const open = openStats[0] || { openPipelineValue: 0, openDealCount: 0 };
  return {
    totalLeads: leads.totalLeads,
    conversionRate: leads.totalLeads
      ? Number(((leads.convertedLeads / leads.totalLeads) * 100).toFixed(2))
      : 0,
    revenueWon: won.revenueWon,
    openPipelineValue: open.openPipelineValue,
    openDealCount: open.openDealCount,
    customerCount
  };
}

/** Groups first-time won revenue by UTC calendar month within the user's deal scope. */
export async function getMonthlyRevenue(user, dateRange = {}) {
  const dealScope = await getDealScope(user);
  const [rows] = await Deal.aggregate([
    { $match: dealScope },
    ...wonRevenueStages,
    { $match: getDateFilter(dateRange, 'firstWonAt') },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$firstWonAt', timezone: 'UTC' } },
        revenue: { $sum: '$value' },
        dealsWon: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $group: { _id: null, months: { $push: { month: '$_id', revenue: '$revenue', dealsWon: '$dealsWon' } } } }
  ]);
  return rows?.months || [];
}

/** Groups leads created in the date range by acquisition source. */
export async function getLeadsBySource(user, dateRange = {}) {
  const leadScope = await getRecordScope(user);
  return Lead.aggregate([
    { $match: withDateRange(leadScope, dateRange) },
    {
      $group: {
        _id: { $ifNull: [{ $cond: [{ $eq: ['$source', ''] }, null, '$source'] }, 'Unknown'] },
        count: { $sum: 1 }
      }
    },
    { $project: { _id: 0, source: '$_id', count: 1 } },
    { $sort: { count: -1, source: 1 } }
  ]);
}

/** Groups deals created in the date range by current stage and weighted value. */
export async function getDealsByStage(user, dateRange = {}) {
  const dealScope = await getDealScope(user);
  return Deal.aggregate([
    { $match: withDateRange(dealScope, dateRange) },
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 },
        value: { $sum: '$value' },
        weightedValue: {
          $sum: { $multiply: ['$value', { $divide: [{ $ifNull: ['$probability', 0] }, 100] }] }
        }
      }
    },
    { $project: { _id: 0, stage: '$_id', count: 1, value: 1, weightedValue: 1 } },
    { $sort: { count: -1, stage: 1 } }
  ]);
}

/** Ranks visible sales reps by won revenue and converted leads for the date range. */
export async function getTopPerformingReps(user, dateRange = {}, limit = 5) {
  const repFilter = { role: 'sales_rep', isActive: true };
  if (user.role === 'manager') repFilter.managerId = user._id;
  if (user.role === 'sales_rep') repFilter._id = user._id;
  const reps = await User.find(repFilter).select('_id name email').lean();
  if (!reps.length) return [];

  const repIds = reps.map((rep) => rep._id);
  const [leadStats, dealStats] = await Promise.all([
    Lead.aggregate([
      { $match: { ...withDateRange(await getRecordScope(user), dateRange), assignedTo: { $in: repIds } } },
      {
        $group: {
          _id: '$assignedTo',
          leads: { $sum: 1 },
          convertedLeads: {
            $sum: { $cond: [{ $or: [{ $eq: ['$status', 'converted'] }, { $ne: ['$convertedCustomer', null] }] }, 1, 0] }
          }
        }
      }
    ]),
    Deal.aggregate([
      {
        $match: {
          ...await getDealScope(user),
          $expr: { $in: [{ $ifNull: ['$owner', '$assignedTo'] }, repIds] }
        }
      },
      { $addFields: { firstWonAt: firstWonAtExpression } },
      {
        $group: {
          _id: { $ifNull: ['$owner', '$assignedTo'] },
          deals: {
            $sum: { $cond: [dateRangeExpression('$createdAt', dateRange), 1, 0] }
          },
          openPipelineValue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $not: [{ $in: ['$stage', ['won', 'lost']] }] },
                    dateRangeExpression('$createdAt', dateRange)
                  ]
                },
                '$value',
                0
              ]
            }
          },
          revenueWon: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$firstWonAt', null] },
                    dateRangeExpression('$firstWonAt', dateRange)
                  ]
                },
                '$value',
                0
              ]
            }
          }
        }
      }
    ])
  ]);

  const leadsByRep = new Map(leadStats.map((row) => [String(row._id), row]));
  const dealsByRep = new Map(dealStats.map((row) => [String(row._id), row]));
  return reps.map((rep) => {
    const leads = leadsByRep.get(String(rep._id)) || { leads: 0, convertedLeads: 0 };
    const deals = dealsByRep.get(String(rep._id)) || { deals: 0, revenueWon: 0, openPipelineValue: 0 };
    return {
      id: rep._id,
      name: rep.name,
      email: rep.email,
      leads: leads.leads,
      convertedLeads: leads.convertedLeads,
      conversionRate: leads.leads
        ? Number(((leads.convertedLeads / leads.leads) * 100).toFixed(2))
        : 0,
      deals: deals.deals,
      revenueWon: deals.revenueWon,
      openPipelineValue: deals.openPipelineValue
    };
  }).sort((a, b) => b.revenueWon - a.revenueWon || b.convertedLeads - a.convertedLeads)
    .slice(0, limit);
}

/** Combines dashboard aggregates while preserving the original summary response fields. */
export async function getDashboardSummary(user, dateRange = {}) {
  const [kpis, monthlyRevenue, leadsBySource, dealsByStage, topPerformingReps] = await Promise.all([
    getDashboardKpis(user, dateRange),
    getMonthlyRevenue(user, dateRange),
    getLeadsBySource(user, dateRange),
    getDealsByStage(user, dateRange),
    getTopPerformingReps(user, dateRange)
  ]);
  const leadScope = await getRecordScope(user);
  const leadsByStatus = await Lead.aggregate([
    { $match: withDateRange(leadScope, dateRange) },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  return {
    ...kpis,
    leadCount: kpis.totalLeads,
    openDealValue: kpis.openPipelineValue,
    monthlyRevenue,
    leadsBySource,
    leadsByStatus: leadsByStatus.map(({ _id, count }) => ({ name: _id, count })),
    dealsByStage: dealsByStage.map(({ stage, count, value }) => ({ name: stage, count, value })),
    topPerformingReps,
    dateRange
  };
}
