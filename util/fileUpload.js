const Busboy = require('busboy');
const { promises: fs, constants } = require('fs');
const path = require('path');

// Check if directory is writable
const checkDirWritable = async (dir) => {
  try {
    await fs.access(dir, constants.W_OK);
    return true;
  } catch (err) {
    console.error(`Directory ${dir} is not writable:`, err);
    return false;
  }
};

const parseFormData = async (req) => {
  const uploadDir = path.join(__dirname, '..', 'asset', 'Uploads');

  // Ensure directory is writable
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    if (!(await checkDirWritable(uploadDir))) {
      throw new Error(`Upload directory ${uploadDir} is not writable`);
    }
    console.log(`Upload directory ${uploadDir} is ready`);
  } catch (err) {
    throw new Error(`Failed to setup upload directory: ${err.message}`);
  }

  return new Promise((resolve, reject) => {
    const fields = {};
    const files = { featuredImage: null, galleryImages: [] };
    const tempFiles = [];

    const busboy = Busboy({
      headers: req.headers,
      limits: { fileSize: 10 * 1024 * 1024, files: 15 },
    });

    // Timeout for parsing (30s)
    const timeout = setTimeout(() => {
      req.unpipe(busboy);
      busboy.destroy();
      reject(new Error('Form parsing timed out after 30 seconds'));
    }, 30000);

    busboy.on('field', (name, value) => {
      fields[name] = fields[name] || [];
      fields[name].push(value);
    });

    busboy.on('file', (name, file, info) => {
      const { filename, mimeType } = info;
      if (!/jpeg|jpg|png|gif/.test(mimeType)) {
        file.resume();
        return;
      }

      const savePath = path.join(uploadDir, `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}${path.extname(filename || '.jpg')}`);
      const writeStream = require('fs').createWriteStream(savePath);
      tempFiles.push(savePath);

      console.log(`Writing file: ${name} - ${filename} to ${savePath}`);

      file.pipe(writeStream);

      file.on('limit', () => {
        console.warn(`File ${filename} exceeded size limit`);
        file.resume();
        writeStream.end();
        fs.unlink(savePath).catch(err => console.error('Error cleaning oversized file:', err));
      });

      writeStream.on('error', (err) => {
        console.error(`Write stream error for ${savePath}:`, err);
        reject(err);
      });

      writeStream.on('finish', () => {
        if (name === 'featuredImage') {
          files.featuredImage = { filepath: savePath, originalFilename: filename };
        } else if (name === 'galleryImages') {
          files.galleryImages.push({ filepath: savePath, originalFilename: filename });
        }
      });
    });

    busboy.on('error', (err) => {
      clearTimeout(timeout);
      console.error('Busboy error:', err);
      reject(err);
    });

    busboy.on('finish', () => {
      clearTimeout(timeout);
      console.log('Parsed fields:', fields);
      console.log('Parsed files:', {
        featuredImage: files.featuredImage?.originalFilename,
        galleryImages: files.galleryImages.map(f => f.originalFilename),
      });
      resolve({ fields, files, tempFiles });
    });

    req.pipe(busboy);
  });
};

const logFormData = (req, res, next) => {
  console.log('Incoming headers:', {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length'],
    'authorization': req.headers['authorization'] ? 'Bearer [redacted]' : 'None',
  });
  next();
};

const getUploadDir = () => {
  return path.join(__dirname, '..', 'asset', 'Uploads');
};

module.exports = { parseFormData, logFormData, getUploadDir };