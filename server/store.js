import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data.json');

const DEFAULT_DATA = {
  verifications: [],
  notifications: [],
  activity: [],
};

function read() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
      return structuredClone(DEFAULT_DATA);
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

function write(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function getAll() {
  return read();
}

export function getVerifications() {
  return read().verifications;
}

export function getNotifications() {
  return read().notifications;
}

export function getActivity() {
  return read().activity;
}

export function saveVerification(result) {
  const data = read();
  data.verifications.unshift(result);

  const verdictLabel = {
    authentic: 'Authentic',
    suspicious: 'Suspicious',
    likelyManipulated: 'Likely Manipulated',
    manipulated: 'AI-Generated',
    fake: 'AI-Generated',
  };

  const isHighRisk = result.score >= 50;
  data.notifications.unshift({
    id: `n_${result.id}`,
    title: isHighRisk ? 'High-risk detection' : 'Scan complete',
    message: isHighRisk
      ? `${result.mediaType === 'image' ? 'Image' : result.mediaType === 'video' ? 'Video' : 'Audio'} "${result.fileName}" flagged with ${result.score}% confidence.`
      : `${result.mediaType === 'image' ? 'Image' : result.mediaType === 'video' ? 'Video' : 'Audio'} "${result.fileName}" verified as ${verdictLabel[result.verdict] || result.verdict}.`,
    type: isHighRisk ? (result.score >= 75 ? 'danger' : 'warning') : 'success',
    timestamp: result.uploadedAt,
    read: false,
  });

  data.activity.unshift({
    id: `a_${result.id}_scan`,
    action: 'Verification completed',
    detail: `${result.fileName} — ${verdictLabel[result.verdict] || result.verdict} (${result.score}%)`,
    timestamp: result.uploadedAt,
    icon: 'scan',
  });

  data.activity.unshift({
    id: `a_${result.id}_upload`,
    action: 'Media uploaded',
    detail: `${result.fileName} (${result.fileSize})`,
    timestamp: result.uploadedAt,
    icon: 'upload',
  });

  if (result.score >= 75) {
    data.activity.unshift({
      id: `a_${result.id}_alert`,
      action: 'Alert triggered',
      detail: `High-risk deepfake detected: ${result.fileName}`,
      timestamp: result.uploadedAt,
      icon: 'alert',
    });
  }

  // Cap lists for demo
  data.verifications = data.verifications.slice(0, 100);
  data.notifications = data.notifications.slice(0, 50);
  data.activity = data.activity.slice(0, 50);

  write(data);
  return result;
}

export function deleteVerification(id) {
  const data = read();

  const index = data.verifications.findIndex(
    (verification) => verification.id === id
  );

  if (index === -1) {
    return null;
  }

  const [deleted] = data.verifications.splice(index, 1);

  // Remove related notification
  data.notifications = data.notifications.filter(
    (notification) => notification.id !== `n_${id}`
  );

  // Remove related activity
  data.activity = data.activity.filter(
    (activity) => !activity.id.startsWith(`a_${id}_`)
  );

  write(data);

  return deleted;
}

export function computeStats() {
  const { verifications } = read();
  const total = verifications.length;

  if (total === 0) {
    return {
      totalScans: 0,
      authenticRate: 0,
      aiDetectedRate: 0,
      manipulatedRate: 0,
      avgConfidence: 0,
      activeThreats: 0,
      responseTime: 0,
      teamMembers: 1,
    };
  }

  const authentic = verifications.filter((v) => v.verdict === 'authentic').length;
  const suspicious = verifications.filter((v) => v.verdict === 'suspicious').length;
  const fakeLike = verifications.filter(
    (v) => v.verdict === 'manipulated' || v.verdict === 'likelyManipulated' || v.verdict === 'fake',
  ).length;
  const highRisk = verifications.filter((v) => v.score >= 75).length;
  const avgScore = verifications.reduce((s, v) => s + v.score, 0) / total;
  const avgTime =
    verifications.reduce((s, v) => {
      const n = parseFloat(String(v.processedIn || '0').replace('s', ''));
      return s + (Number.isFinite(n) ? n : 0);
    }, 0) / total;

  return {
    totalScans: total,
    authenticRate: Math.round((authentic / total) * 1000) / 10,
    aiDetectedRate: Math.round((fakeLike / total) * 1000) / 10,
    manipulatedRate: Math.round((suspicious / total) * 1000) / 10,
    avgConfidence: Math.round(avgScore * 10) / 10,
    activeThreats: highRisk,
    responseTime: Math.round(avgTime * 10) / 10,
    teamMembers: 1,
  };
}
