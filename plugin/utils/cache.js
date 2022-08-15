// @ts-check
import fs from "node:fs";
import { extname, posix as path } from "node:path";
import { fsCachePath } from "../../utils/runtimeChecks.js";

const copied = [];
let assetsDirExists;

export async function getCachedBuffer(hash, image) {
  const cacheFilePath = fsCachePath + hash;

  if (fs.existsSync(cacheFilePath)) {
    return fs.promises.readFile(cacheFilePath);
  }

  const buffer = await image.clone().toBuffer();

  await fs.promises.writeFile(cacheFilePath, buffer);

  return buffer;
}

export async function saveAndCopyAsset(
  hash,
  image,
  buffer,
  outDir,
  assetsDir,
  assetPath,
  isSsrBuild
) {
  const src = fsCachePath + hash;

  const dest = path.join(outDir, isSsrBuild ? "/client" : "", assetPath);

  assetsDir = path.join(outDir, isSsrBuild ? "/client" : "/", assetsDir);

  if (copied.includes(assetPath)) return;

  if (!assetsDirExists) {
    await fs.promises.mkdir(assetsDir, {
      recursive: true,
    });

    assetsDirExists = true;
  }

  await fs.promises.copyFile(src, dest).catch(async (error) => {
    if (error.code === "ENOENT") {
      const filePath = image.options.input.file
      const ext = extname(filePath).slice(1)
      let imageBuffer
      if (ext === 'svg') {
        imageBuffer = await fs.promises.readFile(filePath)
      } else {
        imageBuffer = buffer || (await image.toBuffer());
      }
      await Promise.all(
        [src, dest].map(async (dir) => {
          await fs.promises.writeFile(dir, imageBuffer);
        })
      );
    } else throw error;
  });

  copied.push(assetPath);
}
