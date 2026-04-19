import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const backupSuffix = ".pristine-auth-opennext-backup";
const managedPnpFiles = [".pnp.cjs", ".pnp.loader.mjs"];
const commandName = process.argv[2];
const commandScripts = {
  build: ["build:cf:core"],
  deploy: ["build:cf:core", "deploy:cf:core"],
};

function getAncestorDirectories(projectRoot) {
  const directories = [];
  let currentDirectory = path.resolve(projectRoot);

  while (true) {
    const parentDirectory = path.dirname(currentDirectory);

    if (parentDirectory === currentDirectory) {
      return directories;
    }

    directories.push(parentDirectory);
    currentDirectory = parentDirectory;
  }
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function normalizeBackups(projectRoot) {
  for (const directory of getAncestorDirectories(projectRoot)) {
    for (const fileName of managedPnpFiles) {
      const sourcePath = path.join(directory, fileName);
      const backupPath = `${sourcePath}${backupSuffix}`;
      const sourceExists = await pathExists(sourcePath);
      const backupExists = await pathExists(backupPath);

      if (sourceExists && backupExists) {
        throw new Error(
          `Both the original PnP file and a pristine-auth backup exist. Restore manually: ${sourcePath}`,
        );
      }

      if (backupExists) {
        await fs.rename(backupPath, sourcePath);
        console.log(`Restored stale pristine-auth PnP backup: ${sourcePath}`);
      }
    }
  }
}

async function moveAncestorPnpFiles(projectRoot) {
  const movedFiles = [];

  for (const directory of getAncestorDirectories(projectRoot)) {
    for (const fileName of managedPnpFiles) {
      const sourcePath = path.join(directory, fileName);

      if (!(await pathExists(sourcePath))) {
        continue;
      }

      const backupPath = `${sourcePath}${backupSuffix}`;
      await fs.rename(sourcePath, backupPath);
      movedFiles.push({ sourcePath, backupPath });

      console.log(`Temporarily moved ancestor PnP file: ${sourcePath}`);
    }
  }

  return movedFiles;
}

async function restoreMovedFiles(movedFiles) {
  for (let index = movedFiles.length - 1; index >= 0; index -= 1) {
    const { sourcePath, backupPath } = movedFiles[index];

    if (!(await pathExists(backupPath))) {
      continue;
    }

    await fs.rename(backupPath, sourcePath);
    console.log(`Restored ancestor PnP file: ${sourcePath}`);
  }
}

function runPnpmScript(projectRoot, scriptName) {
  const result =
    process.platform === "win32"
      ? spawnSync("cmd.exe", ["/d", "/s", "/c", `pnpm run ${scriptName}`], {
          cwd: projectRoot,
          env: process.env,
          stdio: "inherit",
        })
      : spawnSync("pnpm", ["run", scriptName], {
          cwd: projectRoot,
          env: process.env,
          stdio: "inherit",
        });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  const scripts = commandScripts[commandName];

  if (!scripts) {
    throw new Error(`Unknown Cloudflare command: ${commandName ?? "<missing>"}`);
  }

  const projectRoot = process.cwd();

  if (process.platform !== "win32") {
    for (const scriptName of scripts) {
      runPnpmScript(projectRoot, scriptName);
    }

    return;
  }

  await normalizeBackups(projectRoot);
  const movedFiles = await moveAncestorPnpFiles(projectRoot);

  if (movedFiles.length > 0) {
    console.log(
      `Windows PnP guard enabled for ${movedFiles.length} ancestor file${movedFiles.length === 1 ? "" : "s"}.`,
    );
  } else {
    console.log("Windows PnP guard found no ancestor PnP files.");
  }

  try {
    for (const scriptName of scripts) {
      runPnpmScript(projectRoot, scriptName);
    }
  } finally {
    await restoreMovedFiles(movedFiles);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});