import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

const JOB_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "tmp", "map-restore-jobs");
const MAX_MAP_RESTORE_ENTRIES = 1000;
const ALLOWED_MAP_RESTORE_EXTENSIONS = new Set([".gpx", ".json", ".geojson"]);

export type MapRestoreJobState = "queued" | "processing" | "completed" | "failed";
export type MapRestoreJobPhase = "extracting" | "moving";

export type MapRestoreJobRecord = {
  id: string;
  state: MapRestoreJobState;
  fileName: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  percent: number;
  phase?: MapRestoreJobPhase;
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

function writeJob(job: MapRestoreJobRecord) {
  ensureJobDir();
  fs.writeFileSync(getJobFilePath(job.id), JSON.stringify(job, null, 2), "utf-8");
}

export function getMapRestoreJob(jobId: string) {
  const jobPath = getJobFilePath(jobId);
  if (!fs.existsSync(jobPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(jobPath, "utf-8")) as MapRestoreJobRecord;
}

function updateJob(jobId: string, updater: (job: MapRestoreJobRecord) => MapRestoreJobRecord) {
  const currentJob = getMapRestoreJob(jobId);
  if (!currentJob) {
    throw new Error("Job restore peta tidak ditemukan.");
  }

  const nextJob = updater(currentJob);
  writeJob(nextJob);
  return nextJob;
}

export function createMapRestoreJob(fileName: string, buffer: Buffer) {
  ensureJobDir();

  const id = `map-restore-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const tempFilePath = path.join(JOB_DIR, `${id}.zip`);
  fs.writeFileSync(tempFilePath, buffer);

  const job: MapRestoreJobRecord = {
    id,
    state: "queued",
    fileName,
    createdAt: new Date().toISOString(),
    percent: 0,
    current: 0,
    total: 0,
    status: "Menunggu proses restore peta dimulai...",
    tempFilePath,
  };

  writeJob(job);
  setTimeout(() => {
    void processMapRestoreJob(id);
  }, 0);

  return job;
}

async function processMapRestoreJob(jobId: string) {
  const job = getMapRestoreJob(jobId);
  if (!job) {
    return;
  }

  const mapDir = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "maps");
  const stagingDir = path.join(/* turbopackIgnore: true */ process.cwd(), "tmp", `restore-map-${job.id}`);

  try {
    updateJob(jobId, (current) => ({
      ...current,
      state: "processing",
      startedAt: new Date().toISOString(),
      percent: 5,
      status: `Memulai restore ${current.fileName}...`,
    }));

    if (!fs.existsSync(mapDir)) {
      fs.mkdirSync(mapDir, { recursive: true });
    }

    const zip = new AdmZip(fs.readFileSync(job.tempFilePath));
    const entries = zip.getEntries();

    if (entries.length === 0) {
      throw new Error("Arsip ZIP kosong.");
    }

    if (entries.length > MAX_MAP_RESTORE_ENTRIES) {
      throw new Error(`Jumlah file dalam ZIP melebihi batas ${MAX_MAP_RESTORE_ENTRIES} entry.`);
    }

    for (const entry of entries) {
      if (entry.isDirectory) {
        continue;
      }

      const entryName = path.basename(entry.entryName).toLowerCase();
      const isAllowedEntry = [...ALLOWED_MAP_RESTORE_EXTENSIONS].some((extension) =>
        entryName.endsWith(extension)
      );
      if (!isAllowedEntry) {
        throw new Error(`File ${entry.entryName} tidak diizinkan dalam backup peta.`);
      }
    }

    if (!fs.existsSync(stagingDir)) {
      fs.mkdirSync(stagingDir, { recursive: true });
    }

    updateJob(jobId, (current) => ({
      ...current,
      phase: "extracting",
      total: entries.length,
      status: `Mengekstrak ${entries.length} file...`,
    }));

    for (let i = 0; i < entries.length; i++) {
      zip.extractEntryTo(entries[i], stagingDir, false, true);
      updateJob(jobId, (current) => ({
        ...current,
        phase: "extracting",
        current: i + 1,
        total: entries.length,
        percent: Math.round(((i + 1) / entries.length) * 40) + 10,
        status: `Ekstrak ${i + 1}/${entries.length} file...`,
      }));
    }

    try {
      const existing = fs.readdirSync(mapDir);
      for (const filename of existing) {
        const fullPath = path.join(mapDir, filename);
        if (fs.statSync(fullPath).isFile()) {
          fs.unlinkSync(fullPath);
        } else {
          fs.rmSync(fullPath, { recursive: true, force: true });
        }
      }
    } catch {
      // ignore cleanup errors before restore
    }

    const allFiles: string[] = [];
    const collectFiles = (dir: string) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          collectFiles(fullPath);
        } else {
          allFiles.push(fullPath);
        }
      }
    };
    collectFiles(stagingDir);

    updateJob(jobId, (current) => ({
      ...current,
      phase: "moving",
      current: 0,
      total: allFiles.length,
      status: `Memindahkan ${allFiles.length} file peta...`,
    }));

    for (let i = 0; i < allFiles.length; i++) {
      const src = allFiles[i];
      fs.copyFileSync(src, path.join(mapDir, path.basename(src)));

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
      status: "Data peta berhasil dipulihkan dari cadangan.",
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

    const latestJob = getMapRestoreJob(jobId);
    if (latestJob?.tempFilePath && fs.existsSync(latestJob.tempFilePath)) {
      fs.rmSync(latestJob.tempFilePath, { force: true });
    }
  }
}
