const path = require("path");
const fs = require("fs");

class FileUploadService {
  constructor() {
    this.basePath = path.join(__dirname, "../assets/documents/clients");
    // Remove the /v1/ prefix - files are served directly at /client-documents/
    this.baseUrl = "/client-documents";

    // Ensure directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
      console.log(`✅ Created directory: ${this.basePath}`);
    } else {
      console.log(`✅ Directory exists: ${this.basePath}`);
    }
  }

  // Generate unique filename
  generateFileName(originalName, clientId) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(originalName);
    return `${clientId}_${timestamp}_${randomString}${extension}`;
  }

  // Save file to local storage
  async saveFile(file, clientId) {
    return new Promise((resolve, reject) => {
      try {
        if (!file) {
          console.error("❌ No file object provided");
          return reject(new Error("No file provided"));
        }

        const fileName = this.generateFileName(file.name, clientId);
        const filePath = path.join(this.basePath, fileName);

        // PRIORITY 1: Use temp file if available (for large files)
        if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
          // console.log("💾 Saving from temp file path:", file.tempFilePath);
          const tempStats = fs.statSync(file.tempFilePath);
          // console.log("📊 Temp file stats:", {
          //   size: tempStats.size,
          //   exists: true,
          // });

          if (tempStats.size === 0) {
            // console.error("❌ Temp file exists but is empty!");
            return reject(new Error("Temporary file is empty"));
          }

          // Copy the temp file to destination
          fs.copyFile(file.tempFilePath, filePath, (copyErr) => {
            if (copyErr) {
              // console.error("❌ Error copying file from temp:", copyErr);
              return reject(copyErr);
            }

            // Clean up temp file
            fs.unlink(file.tempFilePath, (unlinkErr) => {
              if (unlinkErr)
                console.error("⚠️ Error deleting temp file:", unlinkErr);
            });

            // Verify copied file
            fs.stat(filePath, (statErr, stats) => {
              if (statErr) {
                console.error("❌ Error verifying copied file:", statErr);
                return reject(statErr);
              }

              resolve({
                fileName: fileName,
                originalName: file.name,
                filePath: filePath,
                // Use the correct URL without /v1/ prefix
                url: `${this.baseUrl}/${fileName}`,
                fileSize: stats.size,
                fileType: file.mimetype,
                uploadedAt: new Date(),
              });
            });
          });
        }
        // PRIORITY 2: Use buffer data if available (for small files)
        else if (
          file.data &&
          Buffer.isBuffer(file.data) &&
          file.data.length > 0
        ) {
          fs.writeFile(filePath, file.data, (err) => {
            if (err) {
              console.error("❌ Error writing file from buffer:", err);
              return reject(err);
            }

            // Verify file was written correctly
            fs.stat(filePath, (statErr, stats) => {
              if (statErr) {
                console.error("❌ Error verifying file:", statErr);
                return reject(statErr);
              }

              console.log(
                "✅ File saved successfully from buffer, actual size:",
                stats.size
              );
              resolve({
                fileName: fileName,
                originalName: file.name,
                filePath: filePath,
                // Use the correct URL without /v1/ prefix
                url: `${this.baseUrl}/${fileName}`,
                fileSize: stats.size,
                fileType: file.mimetype,
                uploadedAt: new Date(),
              });
            });
          });
        }
        // If no data is available
        else {
          console.error("❌ No file data available:", {
            hasData: !!file.data,
            dataLength: file.data ? file.data.length : 0,
            hasTempFilePath: !!file.tempFilePath,
            tempFilePathExists: file.tempFilePath
              ? fs.existsSync(file.tempFilePath)
              : false,
          });
          reject(
            new Error(
              "No file data available - file may not have been uploaded correctly"
            )
          );
        }
      } catch (error) {
        console.error("💥 Unexpected error in saveFile:", error);
        reject(error);
      }
    });
  }

  async deleteFile(fileName) {
    return new Promise((resolve, reject) => {
      if (!fileName) {
        return resolve(true);
      }

      const filePath = path.join(this.basePath, fileName);

      // Check if file exists before trying to delete
      fs.access(filePath, fs.constants.F_OK, (accessErr) => {
        if (accessErr) {
          return resolve(true);
        }

        // File exists, proceed with deletion
        fs.unlink(filePath, (err) => {
          if (err) {
            if (err.code === "ENOENT") {
              return resolve(true);
            }
            return reject(err);
          }
          resolve(true);
        });
      });
    });
  }

  getFileInfo(fileName) {
    const filePath = path.join(this.basePath, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }

    const stats = fs.statSync(filePath);

    return {
      fileName: fileName,
      filePath: filePath,
      url: `${this.baseUrl}/${fileName}`,
      fileSize: stats.size,
      lastModified: stats.mtime,
    };
  }
}

// Export an instance
module.exports = new FileUploadService();
