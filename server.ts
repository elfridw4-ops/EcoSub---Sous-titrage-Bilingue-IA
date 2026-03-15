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

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Request Logger
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes
  app.post('/api/upload', upload.single('video'), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ filename: req.file.filename });
  });

  app.post('/api/upload-multi', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'reference', maxCount: 1 }]), (req: any, res) => {
    if (!req.files || !req.files['video']) return res.status(400).json({ error: 'Target video required' });
    res.json({ 
      filename: req.files['video'][0].filename,
      refFilename: req.files['reference'] ? req.files['reference'][0].filename : null
    });
  });

  app.post('/api/burn-subtitles', async (req, res) => {
    const { filename, segments, style } = req.body;
    if (!filename || !segments) return res.status(400).json({ error: 'Filename and segments required' });

    const inputPath = path.join(UPLOADS_DIR, filename);
    const assPath = path.join(UPLOADS_DIR, `${filename}.ass`);
    const outputFilename = `processed_${filename}`;
    const outputPath = path.join(OUTPUTS_DIR, outputFilename);

    try {
      // Helper to convert hex to ASS color (&HBBGGRR)
      const hexToAss = (hex: string) => {
        if (!hex) return '&H00FFFFFF';
        const cleanHex = hex.replace('#', '');
        if (cleanHex.length !== 6) return '&H00FFFFFF';
        const r = cleanHex.substring(0, 2);
        const g = cleanHex.substring(2, 4);
        const b = cleanHex.substring(4, 6);
        return `&H00${b}${g}${r}`;
      };

      const primaryColor = hexToAss(style?.primaryColor || '#FFFFFF');
      const outlineColor = hexToAss(style?.outlineColor || '#000000');
      
      // Check if we have bilingual segments to adjust layout
      const isBilingual = segments.some((seg: any) => seg.original && seg.translated);
      
      // Optimization: Increase font size and vertical margin for single-language mode
      // to avoid text being too low or too small.
      const fontSize = style?.fontSize || (isBilingual ? 14 : 18);
      const alignment = style?.alignment || 2;
      const marginV = isBilingual ? 20 : 45; // Higher margin for single line to center it better

      // 1. Generate .ass subtitle file
      const assHeader = `[Script Info]
ScriptType: v4.00+
PlayResX: 640
PlayResY: 360

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Sans-serif,${fontSize},${primaryColor},&H000000FF,${outlineColor},&H00000000,1,0,0,0,100,100,0,0,1,2,2,${alignment},10,10,${marginV},1

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

  // 404 handler for API
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

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
