import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { exec } from 'child_process';

// Ensure directories exist
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const OUTPUTS_DIR = path.join(process.cwd(), 'outputs');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes
  app.post('/api/upload', upload.single('video'), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ filename: req.file.filename });
  });

  app.post('/api/burn-subtitles', async (req, res) => {
    const { filename, segments } = req.body;
    if (!filename || !segments) return res.status(400).json({ error: 'Filename and segments required' });

    const inputPath = path.join(UPLOADS_DIR, filename);
    const assPath = path.join(UPLOADS_DIR, `${filename}.ass`);
    const outputFilename = `processed_${filename}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFilename);

    try {
      // 1. Generate .ass subtitle file
      const assHeader = `[Script Info]
ScriptType: v4.00+
PlayResX: 640
PlayResY: 360

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,12,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,20,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

      const formatTime = (seconds: number) => {
        const date = new Date(0);
        date.setSeconds(seconds);
        const ms = Math.floor((seconds % 1) * 100);
        return date.toISOString().substr(11, 8) + '.' + ms.toString().padStart(2, '0');
      };

      let assEvents = '';
      segments.forEach((seg: any) => {
        const start = formatTime(seg.start);
        const end = formatTime(seg.end);
        
        let combinedText = '';
        if (seg.original && seg.translated) {
          // Mode Bilingue
          combinedText = `${seg.original}\\N{\\c&H3366FF&}{\\i1}${seg.translated}`;
        } else {
          // Mode Langue Unique
          combinedText = seg.original || seg.translated;
        }
        
        assEvents += `Dialogue: 0,${start},${end},Default,,0,0,0,,${combinedText}\n`;
      });

      fs.writeFileSync(assPath, assHeader + assEvents);

      // 2. Burn subtitles into video
      const escapedAssPath = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');
      
      await new Promise((resolve, reject) => {
        exec(`ffmpeg -i "${inputPath}" -vf "subtitles='${escapedAssPath}'" -c:a copy -y "${outputPath}"`, (err, stdout, stderr) => {
          if (err) {
            console.error('FFmpeg Error:', stderr);
            reject(err);
          }
          else resolve(true);
        });
      });

      res.json({ downloadUrl: `/api/download/${outputFilename}` });
    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).json({ error: 'Failed to burn subtitles' });
    }
  });

  app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(OUTPUTS_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'video/mp4');
      res.download(filePath, filename);
    } else {
      res.status(404).send('File not found');
    }
  });

  // Serve processed files
  app.use('/outputs', express.static(OUTPUTS_DIR));

  // Global Error Handler for API
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Error:', err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ 
      error: err.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
