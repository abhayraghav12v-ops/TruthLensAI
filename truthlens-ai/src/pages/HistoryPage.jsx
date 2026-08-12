import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Download,
  Image as ImageIcon,
  Video,
  Music,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Breadcrumb,
  Table,
  Pagination,
  Tabs,
} from "../components/ui";
import { VerificationCard } from "../components/dashboard/VerificationCard";
import { mockApi } from "../services/api";
import { VERDICT } from "../constants/navigation";
import { slideUp, staggerContainer } from "../animations";

const verdictTone = {
  authentic: "success",
  suspicious: "warning",
  likelyManipulated: "secondary",
  manipulated: "danger",
};

const mediaIcons = { image: ImageIcon, video: Video, audio: Music };

export function HistoryPage() {
  const [view, setView] = useState("grid");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [verifications, setVerifications] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this verification?",
    );

    if (!confirmed) return;

    try {
      await mockApi.deleteVerification(id);

      setVerifications((prev) => prev.filter((record) => record.id !== id));
    } catch (error) {
      console.error("Failed to delete verification:", error);
      alert("Failed to delete verification.");
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert("No verification records to export.");
      return;
    }

    const headers = [
      "File Name",
      "Media Type",
      "Score",
      "Verdict",
      "File Size",
      "Processed In",
      "Uploaded At",
      "Flags",
    ];

    const rows = filtered.map((record) => [
      record.fileName,
      record.mediaType,
      `${record.score}%`,
      VERDICT[record.verdict]?.label || record.verdict,
      record.fileSize,
      record.processedIn,
      new Date(record.uploadedAt).toLocaleString(),
      record.flags?.join("; ") || "None",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `truthlens-verification-history-${Date.now()}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    let cancelled = false;
    mockApi
      .getVerifications()
      .then((data) => {
        if (!cancelled) setVerifications(data);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return verifications.filter((v) => {
      if (filter !== "all" && v.verdict !== filter) return false;
      if (search && !v.fileName.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [verifications, filter, search]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Breadcrumb items={[{ label: "History" }]} />
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
            Verification History
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {filtered.length} records found
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={handleExportCSV}
        >
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <Input
              placeholder="Search by filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="max-w-xs"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              value={filter}
              onChange={setFilter}
              tabs={[
                { label: "All", value: "all" },
                { label: "Authentic", value: "authentic" },
                { label: "Suspicious", value: "suspicious" },
                { label: "Manipulated", value: "manipulated" },
              ]}
            />
            <Tabs
              value={view}
              onChange={(v) => setView(v)}
              tabs={[
                { label: "Grid", value: "grid" },
                { label: "Table", value: "table" },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No verifications yet. Upload media from New Verification.
        </p>
      ) : view === "grid" ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filtered.map((record) => (
            <motion.div key={record.id} variants={slideUp}>
              <VerificationCard
                record={record}
                onClick={() => setSelectedRecord(record)}
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div variants={slideUp} initial="hidden" animate="show">
          <Card>
            <Table
              data={filtered}
              columns={[
                {
                  key: "fileName",
                  header: "File",
                  render: (row) => (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        {(() => {
                          const Icon = mediaIcons[row.mediaType];
                          return <Icon className="h-4 w-4 text-slate-500" />;
                        })()}
                      </div>
                      <span className="font-medium">{row.fileName}</span>
                    </div>
                  ),
                },
                {
                  key: "mediaType",
                  header: "Type",
                  render: (row) => (
                    <span className="capitalize text-slate-500">
                      {row.mediaType}
                    </span>
                  ),
                },
                {
                  key: "score",
                  header: "Score",
                  render: (row) => (
                    <span className="font-mono font-medium">{row.score}%</span>
                  ),
                },
                {
                  key: "verdict",
                  header: "Verdict",
                  render: (row) => (
                    <Badge
                      tone={verdictTone[row.verdict] || "secondary"}
                      variant="soft"
                    >
                      {row.verdict === "authentic" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {VERDICT[row.verdict]?.label || row.verdict}
                    </Badge>
                  ),
                },
                {
                  key: "fileSize",
                  header: "Size",
                },
                {
                  key: "processedIn",
                  header: "Processed",
                },
              ]}
            />
          </Card>
        </motion.div>
      )}

      {filtered.length > 0 && (
        <Pagination
          page={page}
          totalPages={Math.ceil(filtered.length / 8) || 1}
          onPageChange={setPage}
        />
      )}

      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedRecord(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold">Verification Report</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Detailed analysis of {selectedRecord.fileName}
                </p>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Report Content */}
            <div className="space-y-5 p-5">
              {/* File */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs text-slate-500">FILE NAME</p>

                <p className="mt-1 font-medium break-all">
                  {selectedRecord.fileName}
                </p>
              </div>

              {/* Verdict + Score */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-xs text-slate-500">VERDICT</p>

                  <div className="mt-2">
                    <Badge
                      tone={verdictTone[selectedRecord.verdict] || "secondary"}
                      variant="soft"
                    >
                      {selectedRecord.verdict === "authentic" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}

                      {VERDICT[selectedRecord.verdict]?.label ||
                        selectedRecord.verdict}
                    </Badge>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-xs text-slate-500">CONFIDENCE SCORE</p>

                  <p className="mt-1 text-2xl font-bold">
                    {selectedRecord.score}%
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-xs text-slate-500">MEDIA TYPE</p>

                  <p className="mt-1 font-medium capitalize">
                    {selectedRecord.mediaType}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-xs text-slate-500">FILE SIZE</p>

                  <p className="mt-1 font-medium">{selectedRecord.fileSize}</p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-xs text-slate-500">PROCESSED IN</p>

                  <p className="mt-1 font-medium">
                    {selectedRecord.processedIn}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-xs text-slate-500">UPLOADED</p>

                  <p className="mt-1 font-medium">
                    {new Date(selectedRecord.uploadedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Flags */}
              {selectedRecord.flags?.length > 0 && (
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-500">
                    DETECTION FLAGS
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedRecord.flags.map((flag, index) => (
                      <span
                        key={index}
                        className="rounded-md bg-red-50 px-2.5 py-1 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-300"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Close */}
              <Button
                className="w-full"
                onClick={() => setSelectedRecord(null)}
              >
                Close Report
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
