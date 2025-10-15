import express from "express";
import fileUpload from "express-fileupload";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
// app.use(cors());
app.use(fileUpload());
app.use(express.static("uploads"));
app.use(
  cors({
    origin: ["http://localhost:3000", "https://deepavali-wishes.netlify.app"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);


app.post("/convert", async (req, res) => {
  try {
    if (!req.files || !req.files.video) {
      return res.status(400).send("No video uploaded.");
    }

    const webmFile = req.files.video;
    const inputPath = `uploads/${Date.now()}.webm`;
    const outputPath = `uploads/${Date.now()}.mp4`;

    await fs.promises.mkdir("uploads", { recursive: true });
    await webmFile.mv(inputPath);

    ffmpeg(inputPath)
      .outputOptions([
        "-c:v libx264",
        "-preset ultrafast",
        "-crf 23",
        "-c:a aac",
        "-b:a 128k",
        "-movflags +faststart",
      ])
      .on("end", async () => {
        res.download(outputPath, "deepavali-wish.mp4", async () => {
          await fs.promises.unlink(inputPath);
          await fs.promises.unlink(outputPath);
        });
      })
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        res.status(500).send("Conversion failed.");
      })
      .save(outputPath);
  } catch (err) {
    console.error("Conversion Error:", err);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/ping", (req, res) => {
  res.send("pong");
})

app.listen(4000, () =>
  console.log("✅ Backend running on http://localhost:4000")
);
