import { readFileSync, readdirSync, existsSync, writeFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { getDb } from './index.js';
import { q } from './params.js';

const assetsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../assets/products');

const MIME_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

const EXT_MIME = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

function fileFor(productId, ext) {
  return path.join(assetsDir, `${productId}.${ext}`);
}

function readFileImage(productId) {
  for (const ext of Object.keys(EXT_MIME)) {
    const file = fileFor(productId, ext);
    if (!existsSync(file)) continue;
    return { buffer: readFileSync(file), mime: EXT_MIME[ext] };
  }
  return null;
}

async function storeFileImage(productId, buffer) {
  const db = getDb();
  const url = `/api/products/${productId}/image`;
  const { rows } = await db.query(
    'SELECT MediaID AS media_id, octet_length(ImageData) AS bytes FROM ProductMedia WHERE ProductID = @productId;',
    { productId: q.int(productId) },
  );
  if (Number(rows[0]?.bytes) === buffer.length) return;
  const payload = {
    productId: q.int(productId),
    url: q.text(url, 500),
    image: { type: 'VarBinary', value: buffer },
  };
  if (!rows[0]) {
    await db.query(
      `
      INSERT INTO ProductMedia (ProductID, ImageURL, IsMain, ImageData, MimeType)
      VALUES (@productId, @url, true, @image, 'image/png');`,
      payload,
    );
    return;
  }
  await db.query(
    `
    UPDATE ProductMedia
       SET ImageData = @image, MimeType = 'image/png', ImageURL = @url, IsMain = true
     WHERE ProductID = @productId;`,
    payload,
  );
}

export async function readProductImage(productId) {
  const file = readFileImage(productId);
  if (file) return file;
  if (!env.mockDb) {
    try {
      const { rows } = await getDb().query(
        `
        SELECT ImageData AS image_data, MimeType AS mime_type
        FROM ProductMedia
        WHERE ProductID = @productId AND ImageData IS NOT NULL
        ORDER BY IsMain DESC, MediaID
        LIMIT 1;`,
        { productId: q.int(productId) },
      );
      const row = rows[0];
      if (row?.image_data) {
        const buffer = Buffer.isBuffer(row.image_data) ? row.image_data : Buffer.from(row.image_data);
        if (buffer.length) return { buffer, mime: row.mime_type || 'image/png' };
      }
    } catch {

    }
  }
  return file;
}

let synced = false;

export async function ensureProductImages() {
  if (env.mockDb || synced) return 0;
  synced = true;
  return 0;
}

export function resetImageSync() {
  synced = false;
}

export async function saveArtistImage(artistId, productId, buffer, mime) {
  const ext = MIME_EXT[mime];
  if (!ext) return null;

  if (env.mockDb) {
    for (const old of Object.values(MIME_EXT)) {
      const file = fileFor(productId, old);
      if (existsSync(file)) unlinkSync(file);
    }
    writeFileSync(fileFor(productId, ext), buffer);
    return { image_url: `/api/products/${productId}/image` };
  }

  const db = getDb();
  const { rows } = await db.query(
    'SELECT ProductID AS product_id FROM Product WHERE ProductID = @productId AND ArtistID = @artistId;',
    { productId: q.int(productId), artistId: q.int(artistId) },
  );
  if (!rows[0]) return null;

  const url = `/api/products/${productId}/image`;
  const { rows: media } = await db.query(
    'SELECT MediaID AS media_id FROM ProductMedia WHERE ProductID = @productId;',
    { productId: q.int(productId) },
  );
  const inputs = {
    productId: q.int(productId),
    url: q.text(url, 500),
    mime: q.text(mime, 40),
    image: { type: 'VarBinary', value: buffer },
  };

  if (media[0]) {
    await db.query(
      `
      UPDATE ProductMedia
         SET ImageData = @image, MimeType = @mime, ImageURL = @url, IsMain = true
       WHERE ProductID = @productId;`,
      inputs,
    );
  } else {
    await db.query(
      `
      INSERT INTO ProductMedia (ProductID, ImageURL, IsMain, ImageData, MimeType)
      VALUES (@productId, @url, true, @image, @mime);`,
      inputs,
    );
  }
  return { image_url: url };
}
