import { motion } from "framer-motion";
import {
  Image,
  Video,
  Music,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Trash2,
} from "lucide-react";
import { Card, Badge, ProgressRing, Button } from "../ui";
import { VERDICT } from "../../constants/navigation";
import { cn, formatRelativeTime } from "../../utils";

const mediaIcons = {
  image: Image,
  video: Video,
  audio: Music,
};

const verdictTone = {
  authentic: "success",
  suspicious: "warning",
  likelyManipulated: "secondary",
  manipulated: "danger",
};

export function VerificationCard({ record, onClick, onDelete }) {
  const Icon = mediaIcons[record.mediaType];
  const verdict = VERDICT[record.verdict];
  const tone = verdictTone[record.verdict];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card className="overflow-hidden">
        {/* Thumbnail */}
        <MediaPreviewCard
          type={record.mediaType}
          fileName={record.fileName}
          thumbnailUrl={record.thumbnailUrl}
        />

        {/* Body */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <Badge tone={tone} variant="soft">
              {record.verdict === "authentic" ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {verdict?.label || record.verdict}
            </Badge>

            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(record.uploadedAt)}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <ProgressRing
              value={record.score}
              size={64}
              strokeWidth={6}
              label={`${record.score}`}
              sublabel="score"
            />

            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">File size</span>
                <span className="font-medium">{record.fileSize}</span>
              </div>

              {record.duration && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Duration</span>
                  <span className="font-medium">{record.duration}</span>
                </div>
              )}

              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Processed in</span>
                <span className="font-medium">{record.processedIn}</span>
              </div>
            </div>
          </div>

          {record.flags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {record.flags.slice(0, 2).map((flag, i) => (
                <span
                  key={i}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs",
                    tone === "danger"
                      ? "bg-danger-50 text-danger-700 dark:bg-danger-950/40 dark:text-danger-300"
                      : tone === "secondary"
                        ? "bg-secondary-50 text-secondary-700 dark:bg-secondary-950/40 dark:text-secondary-300"
                        : "bg-warning-50 text-warning-700 dark:bg-warning-950/40 dark:text-warning-300",
                  )}
                >
                  {flag}
                </span>
              ))}

              {record.flags.length > 2 && (
                <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-500">
                  +{record.flags.length - 2} more
                </span>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              leftIcon={<FileText className="h-3.5 w-3.5" />}
              onClick={() => onClick?.(record)}
            >
              View Report
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="px-3 text-danger-600 hover:bg-danger-50 hover:text-danger-700 dark:hover:bg-danger-950/40"
              onClick={() => onDelete?.(record.id)}
              aria-label="Delete verification"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function MediaPreviewCard({ type, fileName, thumbnailUrl }) {
  const Icon = mediaIcons[type] || Image;

  return (
    <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={fileName}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
          <Icon className="h-10 w-10" />
          <span className="px-4 text-center text-xs">{fileName}</span>
        </div>
      )}

      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-slate-950/70 px-2 py-1 text-xs text-white">
        <Icon className="h-3.5 w-3.5" />
        <span className="capitalize">{type}</span>
      </div>
    </div>
  );
}
