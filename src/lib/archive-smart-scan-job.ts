import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import * as pdfParse from "pdf-parse";
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

async function parsePdf(
  dataBuffer: Buffer,
  options?: { pagerender?: (pageData: any) => Promise<string> }
) {
  const moduleObj = pdfParse as any;
  if (typeof moduleObj === "function") {
    return await moduleObj(dataBuffer, options);
  }
  if (typeof moduleObj?.default === "function") {
    return await moduleObj.default(dataBuffer, options);
  }
  const PDFParseClass = moduleObj?.PDFParse || moduleObj?.default?.PDFParse;
  if (PDFParseClass) {
    const parser = new PDFParseClass({ data: dataBuffer });
    const res = await parser.getText();
    if (options?.pagerender) {
      for (let i = 0; i < res.pages.length; i++) {
        const page = res.pages[i];
        await options.pagerender({
          getTextContent: async () => ({
            items: [{ str: page.text, transform: [0, 0, 0, 0, 0, 0] }],
          }),
        });
      }
    }
    await parser.destroy();
    return {
      text: res.text,
      numpages: res.total || res.pages.length,
      numrender: res.pages.length,
    };
  }
  throw new Error("Tidak dapat menginisialisasi pustaka pdf-parse.");
}

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
      status: `Mengekstrak teks dari ${totalPages} halaman...`,
      percent: 10,
    }));

    const pageNops: { index: number; nop: string }[] = [];
    let pageCounter = 0;
    let lastParseProgressTime = Date.now();

    const parseOptions = {
      pagerender: async function (pageData: any) {
        const textContent = await pageData.getTextContent();
        let lastY: number | undefined = undefined;
        let text = "";
        for (const item of textContent.items) {
          if (lastY === item.transform[5] || lastY === undefined) {
            text += item.str;
          } else {
            text += "\n" + item.str;
          }
          lastY = item.transform[5];
        }

        const nop = extractNopFromText(text);
        const currentPageIndex = pageCounter++;
        pageNops.push({ index: currentPageIndex, nop });

        // Update progress of text extraction occasionally
        const nowTime = Date.now();
        if (nowTime - lastParseProgressTime > 1500 || currentPageIndex === totalPages - 1) {
          const progressPercent = Math.min(45, 10 + Math.round((currentPageIndex / totalPages) * 35));
          updateSmartScanJob(jobId, (job) => ({
            ...job,
            status: `Membaca halaman ${currentPageIndex + 1}/${totalPages}...`,
            percent: progressPercent,
          }));
          lastParseProgressTime = nowTime;
        }

        return text;
      },
    };

    await parsePdf(inputBuffer, parseOptions);

    updateSmartScanJob(jobId, (job) => ({
      ...job,
      status: `Memotong & menulis ${totalPages} halaman PDF...`,
      percent: 50,
    }));

    const archiveDir = ensureArchiveDir(currentJob.year);

    let detectedCount = 0;
    let skippedCount = 0;
    let lastWriteTime = 0;

    for (let i = 0; i < totalPages; i++) {
      const item = pageNops.find((p) => p.index === i);
      const nop = item ? item.nop : "";

      if (nop) {
        try {
          const subPdfDoc = await PDFDocument.create();
          const [copiedPage] = await subPdfDoc.copyPages(mainPdfDoc, [i]);
          subPdfDoc.addPage(copiedPage);
          const subPdfBytes = await subPdfDoc.save();

          fs.writeFileSync(path.join(archiveDir, `${nop}.pdf`), subPdfBytes);
          detectedCount++;
        } catch (err) {
          skippedCount++;
          console.error(`[SmartScan] Gagal menulis halaman ${i + 1}:`, err);
        }
      } else {
        skippedCount++;
      }

      // Throttle JSON status write to disk (mapped from 50% to 99%)
      const percent = Math.min(99, 50 + Math.round(((i + 1) / totalPages) * 49));
      const nowTime = Date.now();
      const isFirst = i === 0;
      const isLast = i === totalPages - 1;
      const isInterval = (i + 1) % 5 === 0;
      const isTimePassed = nowTime - lastWriteTime > 1000;

      if (isFirst || isLast || isInterval || isTimePassed) {
        updateSmartScanJob(jobId, (job) => ({
          ...job,
          current: i + 1,
          total: totalPages,
          detectedCount,
          skippedCount,
          nopLast: nop || "Tidak terdeteksi",
          percent,
          status: `Memproses berkas PDF halaman ${i + 1}/${totalPages}...`,
        }));
        lastWriteTime = nowTime;
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
