import mongoose from 'mongoose';
import { env } from './src/config/env.js';
import { connectDatabase } from './src/config/db.js';
import { User } from './src/models/User.js';
import { Lead } from './src/models/Lead.js';
import { Customer } from './src/models/Customer.js';
import { Deal } from './src/models/Deal.js';
import { Activity } from './src/models/Activity.js';

if (env.NODE_ENV === 'production') {
  throw new Error('Refusing to seed sample CRM data in production.');
}

const requiredSeedConfig = [
  ['ADMIN_EMAIL', env.ADMIN_EMAIL],
  ['ADMIN_PASSWORD', env.ADMIN_PASSWORD],
  ['SEED_MANAGER_EMAIL', env.SEED_MANAGER_EMAIL],
  ['SEED_MANAGER_PASSWORD', env.SEED_MANAGER_PASSWORD],
  ['SEED_REP_EMAIL', env.SEED_REP_EMAIL],
  ['SEED_REP_PASSWORD', env.SEED_REP_PASSWORD]
];

const missingConfig = requiredSeedConfig.filter(([, value]) => !value).map(([key]) => key);
if (missingConfig.length) {
  throw new Error(`Set the following values in server/.env before seeding: ${missingConfig.join(', ')}`);
}

async function ensureUser({ name, email, password, role, managerId = null }) {
  const normalizedEmail = email.toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });
  if (user) {
    if (user.role !== role) {
      throw new Error(`Seed account ${normalizedEmail} already exists with role "${user.role}", expected "${role}".`);
    }
    if (!user.isActive) {
      throw new Error(`Seed account ${normalizedEmail} is inactive; reactivate it before seeding.`);
    }
    if (role === 'sales_rep' && String(user.managerId) !== String(managerId)) {
      user.managerId = managerId;
      await user.save();
    }
    return user;
  }
  user = await User.create({ name, email: normalizedEmail, password, role, managerId });
  console.info(`Created ${role} seed user: ${normalizedEmail}`);
  return user;
}

async function ensureRecord(Model, filter, values) {
  const existing = await Model.findOne(filter);
  if (existing) return existing;
  return Model.create(values);
}

/**
 * Adds deterministic demo records without deleting or overwriting CRM data.
 * Existing seed records are found by stable owner/contact/title identifiers.
 */
async function seed() {
  await connectDatabase();

  const admin = await ensureUser({
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    role: 'admin'
  });
  const manager = await ensureUser({
    name: env.SEED_MANAGER_NAME,
    email: env.SEED_MANAGER_EMAIL,
    password: env.SEED_MANAGER_PASSWORD,
    role: 'manager'
  });
  const rep = await ensureUser({
    name: env.SEED_REP_NAME,
    email: env.SEED_REP_EMAIL,
    password: env.SEED_REP_PASSWORD,
    role: 'sales_rep',
    managerId: manager._id
  });

  const now = new Date();
  const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const leadsData = [
    { name: 'Avery Chen', email: 'avery.chen@northwind-demo.com', phone: '+1-415-555-0141', company: 'Northwind Analytics', source: 'Website', status: 'qualified', assignedTo: rep._id },
    { name: 'Jordan Patel', email: 'jordan.patel@brightpath-demo.com', phone: '+1-415-555-0182', company: 'Brightpath Health', source: 'Referral', status: 'contacted', assignedTo: rep._id },
    { name: 'Casey Morgan', email: 'casey.morgan@fieldstone-demo.com', phone: '+1-415-555-0127', company: 'Fieldstone Group', source: 'Conference', status: 'proposal', assignedTo: manager._id },
    { name: 'Taylor Brooks', email: 'taylor.brooks@lumen-demo.com', phone: '+1-415-555-0173', company: 'Lumen Retail', source: 'LinkedIn', status: 'new', assignedTo: rep._id },
    { name: 'Sam Rivera', email: 'sam.rivera@cedar-demo.com', phone: '+1-415-555-0196', company: 'Cedar Peak Logistics', source: 'Website', status: 'qualified', assignedTo: manager._id },
    { name: 'Drew Kim', email: 'drew.kim@redwood-demo.com', phone: '+1-415-555-0118', company: 'Redwood Finance', source: 'Partner', status: 'contacted', assignedTo: rep._id }
  ];

  const leads = [];
  for (let index = 0; index < leadsData.length; index += 1) {
    const data = leadsData[index];
    leads.push(await ensureRecord(
      Lead,
      { email: data.email, createdBy: admin._id },
      { ...data, notes: 'Demo prospect. Follow up to confirm needs, stakeholders, and timeline.', createdBy: admin._id, createdAt: daysAgo(5 + index * 6) }
    ));
  }

  const customersData = [
    { name: 'Harper Ellis', email: 'harper.ellis@atlas-demo.com', phone: '+1-212-555-0134', company: 'Atlas Manufacturing', assignedTo: rep._id },
    { name: 'Quinn Foster', email: 'quinn.foster@solstice-demo.com', phone: '+1-212-555-0165', company: 'Solstice Energy', assignedTo: manager._id },
    { name: 'Reese Wallace', email: 'reese.wallace@bluebird-demo.com', phone: '+1-212-555-0191', company: 'Bluebird Education', assignedTo: rep._id }
  ];

  const customers = [];
  for (let index = 0; index < customersData.length; index += 1) {
    const data = customersData[index];
    customers.push(await ensureRecord(
      Customer,
      { email: data.email, createdBy: admin._id },
      { ...data, notes: 'Demo customer. Quarterly account review and adoption check-in scheduled.', createdBy: admin._id, createdAt: daysAgo(35 + index * 20) }
    ));
  }

  const dealData = [
    { title: 'Northwind analytics rollout', value: 48000, stage: 'proposal', probability: 60, owner: rep._id, lead: leads[0]._id, expectedCloseDate: new Date(now.getTime() + 28 * 86400000) },
    { title: 'Atlas manufacturing renewal', value: 72000, stage: 'negotiation', probability: 80, owner: rep._id, customer: customers[0]._id, expectedCloseDate: new Date(now.getTime() + 14 * 86400000) },
    { title: 'Fieldstone team expansion', value: 96500, stage: 'qualified', probability: 40, owner: manager._id, lead: leads[2]._id, expectedCloseDate: new Date(now.getTime() + 52 * 86400000) },
    { title: 'Solstice energy implementation', value: 125000, stage: 'won', probability: 100, owner: manager._id, customer: customers[1]._id, expectedCloseDate: daysAgo(8) },
    { title: 'Bluebird learning platform', value: 36000, stage: 'contacted', probability: 20, owner: rep._id, customer: customers[2]._id, expectedCloseDate: new Date(now.getTime() + 75 * 86400000) }
  ];

  const deals = [];
  for (let index = 0; index < dealData.length; index += 1) {
    const data = dealData[index];
    const changedAt = data.stage === 'won' ? daysAgo(8) : daysAgo(4 + index * 3);
    deals.push(await ensureRecord(
      Deal,
      { title: data.title, createdBy: admin._id },
      {
        ...data,
        createdBy: admin._id,
        createdAt: daysAgo(12 + index * 9),
        stageHistory: [
          { stage: 'new', probability: 10, changedBy: admin._id, changedAt: daysAgo(13 + index * 9) },
          { stage: data.stage, probability: data.probability, changedBy: data.owner, changedAt }
        ]
      }
    ));
  }

  const activities = [
    { type: 'call', subject: 'Discovery call — Northwind Analytics', content: 'Discussed reporting workflows, current tooling, and a phased analytics rollout.', lead: leads[0], createdBy: rep, occurredAt: daysAgo(3) },
    { type: 'email', subject: 'Proposal follow-up — Atlas Manufacturing', content: 'Shared the renewal proposal and outlined implementation milestones for the next quarter.', customer: customers[0], emailTo: customers[0].email, createdBy: rep, occurredAt: daysAgo(2) },
    { type: 'meeting', subject: 'Solution review — Fieldstone Group', content: 'Reviewed team requirements, rollout options, and target decision date with key stakeholders.', lead: leads[2], createdBy: manager, occurredAt: daysAgo(4) },
    { type: 'note', subject: 'Won deal handoff — Solstice Energy', content: 'Agreement completed. Schedule onboarding kickoff and introduce the implementation lead.', deal: deals[3], createdBy: manager, occurredAt: daysAgo(7) },
    { type: 'call', subject: 'Qualification call — Lumen Retail', content: 'Initial conversation completed; prospect requested a short overview for the operations team.', lead: leads[3], createdBy: rep, occurredAt: daysAgo(1) },
    { type: 'meeting', subject: 'Quarterly account review — Bluebird Education', content: 'Reviewed adoption goals and identified additional departments for a possible expansion.', customer: customers[2], createdBy: rep, occurredAt: daysAgo(6) }
  ];

  let createdActivities = 0;
  for (const data of activities) {
    const { lead, customer, deal, createdBy, ...activityData } = data;
    const links = {
      ...(lead ? { lead: lead._id } : {}),
      ...(customer ? { customer: customer._id } : {}),
      ...(deal ? { deal: deal._id } : {})
    };
    const existing = await Activity.findOne({
      subject: data.subject,
      createdBy: createdBy._id,
      ...links
    });
    if (existing) continue;
    await Activity.create({ ...activityData, ...links, createdBy: createdBy._id });
    createdActivities += 1;
  }

  console.info(
    `Seed complete. Users: 3 (admin, manager, sales rep); ` +
    `leads: ${leads.length}; customers: ${customers.length}; ` +
    `deals: ${deals.length}; activities added: ${createdActivities}.`
  );
}

try {
  await seed();
} finally {
  await mongoose.disconnect();
}
