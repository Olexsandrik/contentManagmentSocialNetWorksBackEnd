const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { fromBuffer } = require("file-type");

module.exports.downloadVideoFile = async function downloadVideoFile(url) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  const buffer = Buffer.from(res.data, "binary");

  const type = await fromBuffer(buffer);
  if (!type) throw new Error("Не вдалося визначити тип файлу");

  const extension = type.ext;
  const filename = `media-${Date.now()}.${extension}`;
  const outputPath = path.join(__dirname, "../uploads", filename);

  fs.writeFileSync(outputPath, buffer);

  return `/uploads/${filename}`;
};
