import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { getArchivePath } from "@/lib/storage";

const JOB_DIR = path.join(process.cwd(), "tmp", "archive-restore-jobs");
const MAX_ARCHIVE_RESTORE_ENTRIES = 5000;

export type ArchiveRestoreJobState = "queued" | "processing" | "completed" | "failed";
export type ArchiveRestoreJobPhase = "extracting" | "moving";

export type ArchiveRestoreJobRecord = {
  id: string;
  state: ArchiveRestoreJobState;
  fileName: string;
  year: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  percent: number;
  phase?: ArchiveRestoreJobPhase;
  current: number;
  total: number;
  status: string;
  error?: string;
  tempFilePath: string;
};

function ensureJobDir() {
  if (!fs.existsSync(JOB_DIR)) {
    fs.mkdirSync(JOB_DIR, { recursive: true });
  }
}

function getJobFilePath(jobId: string) {
  return path.join(JOB_DIR, `${jobId}.json`);
}

function writeJob(job: ArchiveRestoreJobRecord) {
  ensureJobDir();
  fs.writeFileSync(getJobFilePath(job.id), JSON.stringify(job, null, 2), "utf-8");
}

export function getArchiveRestoreJob(jobId: string) {
  const jobPath = getJobFilePath(jobId);
  if (!fs.existsSync(jobPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(jobPath, "utf-8")) as ArchiveRestoreJobRecord;
}

function updateJob(jobId: string, updater: (job: ArchiveRestoreJobRecord) => ArchiveRestoreJobRecord) {
  const currentJob = getArchiveRestoreJob(jobId);
  if (!currentJob) {
    throw new Error("Job restore arsip tidak ditemukan.");
  }

  const nextJob = updater(currentJob);
  writeJob(nextJob);
  return nextJob;
}

export function createArchiveRestoreJob(fileName: string, year: string, buffer: Buffer) {
  ensureJobDir();

  const id = `restore-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const tempFilePath = path.join(JOB_DIR, `${id}.zip`);
  fs.writeFileSync(tempFilePath, buffer);

  const job: ArchiveRestoreJobRecord = {
    id,
    state: "queued",
    fileName,
    year,
    createdAt: new Date().toISOString(),
    percent: 0,
    current: 0,
    total: 0,
    status: "Menunggu proses restore dimulai...",
    tempFilePath,
  };

  writeJob(job);
  setTimeout(() => {
    void processArchiveRestoreJob(id);
  }, 0);

  return job;
}

async function processArchiveRestoreJob(jobId: string) {
  const job = getArchiveRestoreJob(jobId);
  if (!job) {
    return;
  }

  const archiveDir = getArchivePath(job.year);
  const stagingDir = path.join(process.cwd(), "tmp", `restore-archive-${job.id}`);

  try {
    updateJob(jobId, (current) => ({
      ...current,
      state: "processing",
      startedAt: new Date().toISOString(),
      percent: 5,
      status: `Memulai restore ${current.fileName}...`,
    }));

    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    const zip = new AdmZip(fs.readFileSync(job.tempFilePath));
    const zipEntries = zip.getEntries();
    const totalEntries = zipEntries.length;

    if (totalEntries === 0) {
      throw new Error("Arsip ZIP kosong.");
    }

    if (totalEntries > MAX_ARCHIVE_RESTORE_ENTRIES) {
      throw new Error(`Jumlah file dalam ZIP melebihi batas ${MAX_ARCHIVE_RESTORE_ENTRIES} entry.`);
    }

    for (const entry of zipEntries) {
      if (entry.isDirectory) {
        continue;
      }

      const entryName = path.basename(entry.entryName).trim().toLowerCase();
      if (!entryName.endsWith(".pdf")) {
        throw new Error("Restore arsip hanya menerima file PDF di dalam ZIP.");
      }
    }

    if (!fs.existsSync(stagingDir)) {
      fs.mkdirSync(stagingDir, { recursive: true });
    }

    updateJob(jobId, (current) => ({
      ...current,
      phase: "extracting",
      total: totalEntries,
      status: `Mengekstrak ${totalEntries} file...`,
    }));

    for (let i = 0; i < totalEntries; i++) {
      const entry = zipEntries[i];
      zip.extractEntryTo(entry, stagingDir, false, true);

      updateJob(jobId, (current) => ({
        ...current,
        phase: "extracting",
        current: i + 1,
        total: totalEntries,
        percent: Math.round(((i + 1) / totalEntries) * 40) + 10,
        status: `Ekstrak ${i + 1}/${totalEntries} file...`,
      }));
    }

    try {
      const existingFiles = fs.readdirSync(archiveDir);
      for (const filename of existingFiles) {
        const fullPath = path.join(archiveDir, filename);
        if (fs.statSync(fullPath).isFile()) {
          fs.unlinkSync(fullPath);
        } else {
          fs.rmSync(fullPath, { recursive: true, force: true });
        }
      }
    } catch {
      // ignore cleanup errors before copy
    }

    const allFiles: string[] = [];
    const collectFiles = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          collectFiles(full);
        } else {
          allFiles.push(full);
        }
      }
    };
    collectFiles(stagingDir);

    updateJob(jobId, (current) => ({
      ...current,
      phase: "moving",
      current: 0,
      total: allFiles.length,
      status: `Memindahkan ${allFiles.length} file ke arsip...`,
    }));

    for (let i = 0; i < allFiles.length; i++) {
      const src = allFiles[i];
      const name = path.basename(src);
      if (!name.toLowerCase().endsWith(".pdf")) {
        continue;
      }

      fs.copyFileSync(src, path.join(archiveDir, name));

      updateJob(jobId, (current) => ({
        ...current,
        phase: "moving",
        current: i + 1,
        total: allFiles.length,
        percent: Math.round(((i + 1) / Math.max(allFiles.length, 1)) * 45) + 50,
        status: `Menyusun ${i + 1}/${allFiles.length} file...`,
      }));
    }

    updateJob(jobId, (current) => ({
      ...current,
      state: "completed",
      finishedAt: new Date().toISOString(),
      percent: 100,
      current: allFiles.length,
      total: allFiles.length,
      status: "Arsip berhasil dipulihkan total.",
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    updateJob(jobId, (current) => ({
      ...current,
      state: "failed",
      finishedAt: new Date().toISOString(),
      error: message,
      status: message,
    }));
  } finally {
    if (fs.existsSync(stagingDir)) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
    }

    const latestJob = getArchiveRestoreJob(jobId);
    if (latestJob?.tempFilePath && fs.existsSync(latestJob.tempFilePath)) {
      fs.rmSync(latestJob.tempFilePath, { force: true });
    }
  }
}
