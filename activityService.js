import { Activity } from '../models/Activity.js';
import { assertRelatedRecordAccess, getRelatedRecordLink } from './relatedRecordService.js';
import { sendEmail } from './emailService.js';

/** Creates an activity after verifying access to its linked CRM record. */
export async function createActivity(user, data) {
  const links = getRelatedRecordLink(data);
  await assertRelatedRecordAccess(user, links);
  return Activity.create({ ...data, ...links, createdBy: user._id });
}

/** Returns a newest-first, paginated timeline for one visible CRM record. */
export async function getTimeline(user, query) {
  const links = getRelatedRecordLink(query);
  await assertRelatedRecordAccess(user, links);
  const filter = { ...links };
  const [items, total] = await Promise.all([
    Activity.find(filter).populate('createdBy', 'name email')
      .sort({ occurredAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit).limit(query.limit),
    Activity.countDocuments(filter)
  ]);
  return {
    items,
    total,
    page: query.page,
    limit: query.limit,
    pages: Math.ceil(total / query.limit)
  };
}

/** Sends plain-text email and records pending, sent, or failed delivery state. */
export async function sendAndLogEmail(user, data) {
  const links = getRelatedRecordLink(data);
  await assertRelatedRecordAccess(user, links);
  const activity = await Activity.create({
    type: 'email',
    subject: data.subject,
    content: data.text,
    emailTo: data.to,
    emailStatus: 'pending',
    ...links,
    createdBy: user._id
  });

  let result;
  try {
    result = await sendEmail(data);
  } catch (error) {
    activity.emailStatus = 'failed';
    activity.emailError = error.message;
    await activity.save();
    throw error;
  }

  activity.emailStatus = 'sent';
  activity.emailMessageId = result.messageId;
  await activity.save();
  return activity;
}
