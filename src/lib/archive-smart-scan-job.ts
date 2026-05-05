import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { ensureArchiveDir, extractNopFromText } from "@/lib/archive-utils";

const JOB_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "tmp", "archive-smart-scan-jobs");

export type SmartScanJobState = "queued" | "processing" | "completed" | "failed";

export type SmartScanJobRecord = {
  id: string;
  state: SmartScanJobState;
  fileName: string;
  year: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  percent: number;
  current: number;
  total: number;
  status: string;
  nopLast?: string;
  detectedCount: number;
  skippedCount: number;
  error?: string;
  tempFilePath: string;
};

const MAX_SMART_SCAN_PAGES = 500;

type PdfParseResult = { text?: string };
type PdfParseFn = (dataBuffer: Buffer) => Promise<PdfParseResult>;
const parsePdf = pdfParse as PdfParseFn;

function ensureJobDir() {
  if (!fs.existsSync(JOB_DIR)) {
    fs.mkdirSync(JOB_DIR, { recursive: true });
  }
}

function getJobFilePath(jobId: string) {
  return path.join(JOB_DIR, `${jobId}.json`);
}

export function createSmartScanJob(fileName: string, year: number, fileBuffer: Buffer) {
  ensureJobDir();

  const id = `scan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const tempFilePath = path.join(JOB_DIR, `${id}.pdf`);
  fs.writeFileSync(tempFilePath, fileBuffer);

  const job: SmartScanJobRecord = {
    id,
    state: "queued",
    fileName,
    year,
    createdAt: new Date().toISOString(),
    percent: 0,
    current: 0,
    total: 0,
    status: "Menunggu proses dimulai...",
    detectedCount: 0,
    skippedCount: 0,
    tempFilePath,
  };

  writeSmartScanJob(job);

  setTimeout(() => {
    void processSmartScanJob(id);
  }, 0);

  return job;
}

export function getSmartScanJob(jobId: string) {
  const jobPath = getJobFilePath(jobId);
  if (!fs.existsSync(jobPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(jobPath, "utf-8")) as SmartScanJobRecord;
}

function writeSmartScanJob(job: SmartScanJobRecord) {
  ensureJobDir();
  fs.writeFileSync(getJobFilePath(job.id), JSON.stringify(job, null, 2), "utf-8");
}

function updateSmartScanJob(jobId: string, updater: (job: SmartScanJobRecord) => SmartScanJobRecord) {
  const currentJob = getSmartScanJob(jobId);
  if (!currentJob) {
    throw new Error("Job smart scan tidak ditemukan.");
  }

  const nextJob = updater(currentJob);
  writeSmartScanJob(nextJob);
  return nextJob;
}

async function processSmartScanJob(jobId: string) {
  const currentJob = getSmartScanJob(jobId);
  if (!currentJob) {
    return;
  }

  try {
    updateSmartScanJob(jobId, (job) => ({
      ...job,
      state: "processing",
      startedAt: new Date().toISOString(),
      status: `Memproses ${job.fileName}...`,
      percent: 5,
    }));

    const inputBuffer = fs.readFileSync(currentJob.tempFilePath);
    const mainPdfDoc = await PDFDocument.load(inputBuffer);
    const totalPages = mainPdfDoc.getPageCount();

    if (totalPages > MAX_SMART_SCAN_PAGES) {
      throw new Error(`Jumlah halaman maksimal ${MAX_SMART_SCAN_PAGES} untuk sekali smart scan.`);
    }

    updateSmartScanJob(jobId, (job) => ({
      ...job,
      total: totalPages,
      status: `Memindai ${totalPages} halaman...`,
    }));

    const archiveDir = ensureArchiveDir(currentJob.year);

    let detectedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < totalPages; i++) {
      try {
        const subPdfDoc = await PDFDocument.create();
        const [copiedPage] = await subPdfDoc.copyPages(mainPdfDoc, [i]);
        subPdfDoc.addPage(copiedPage);
        const subPdfBytes = await subPdfDoc.save();

        let rawText = "";
        try {
          const data = await parsePdf(Buffer.from(subPdfBytes));
          rawText = data.text || "";
        } catch {
          rawText = "";
        }

        const nop = extractNopFromText(rawText);
        if (nop) {
          fs.writeFileSync(path.join(archiveDir, `${nop}.pdf`), subPdfBytes);
          detectedCount++;
        } else {
          skippedCount++;
        }

        updateSmartScanJob(jobId, (job) => ({
          ...job,
          current: i + 1,
          total: totalPages,
          detectedCount,
          skippedCount,
          nopLast: nop || "Tidak terdeteksi",
          percent: Math.min(99, Math.round(((i + 1) / totalPages) * 100)),
          status: `Halaman ${i + 1}/${totalPages} diproses`,
        }));
      } catch {
        skippedCount++;
        updateSmartScanJob(jobId, (job) => ({
          ...job,
          current: i + 1,
          total: totalPages,
          detectedCount,
          skippedCount,
          nopLast: "Tidak terdeteksi",
          percent: Math.min(99, Math.round(((i + 1) / totalPages) * 100)),
          status: `Halaman ${i + 1}/${totalPages} diproses`,
        }));
      }
    }

    updateSmartScanJob(jobId, (job) => ({
      ...job,
      state: "completed",
      finishedAt: new Date().toISOString(),
      percent: 100,
      current: totalPages,
      total: totalPages,
      detectedCount,
      skippedCount,
      status: `Selesai! Berhasil: ${detectedCount}, Terlewati: ${skippedCount}.`,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    updateSmartScanJob(jobId, (job) => ({
      ...job,
      state: "failed",
      finishedAt: new Date().toISOString(),
      error: message,
      status: message,
    }));
  } finally {
    const latestJob = getSmartScanJob(jobId);
    if (latestJob?.tempFilePath && fs.existsSync(latestJob.tempFilePath)) {
      fs.rmSync(latestJob.tempFilePath, { force: true });
    }
  }
}
