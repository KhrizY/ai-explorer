const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, '.data');
const DATA_FILE = path.join(DATA_DIR, 'published-courses.json');
const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_BODY = 512 * 1024;

function readStore() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return data && typeof data === 'object' ? data : {};
  } catch (_) {
    return {};
  }
}

function writeStore(store) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function cleanStore(store) {
  const now = Date.now();
  let changed = false;
  Object.keys(store).forEach((code) => {
    if (!store[code] || new Date(store[code].expiresAt).getTime() <= now) {
      delete store[code];
      changed = true;
    }
  });
  if (changed) writeStore(store);
  return store;
}

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(body));
}

function staticFile(res, filePath) {
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      res.writeHead(204);
      res.end();
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.md': 'text/markdown; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml; charset=utf-8'
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(buf);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('BODY_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (_) {
        reject(new Error('BAD_JSON'));
      }
    });
    req.on('error', reject);
  });
}

function courseValid(course) {
  if (!course ||
    typeof course !== 'object' ||
    !course.title ||
    !Array.isArray(course.chapters) ||
    !course.chapters.length) return false;
  return course.chapters.every((chapter) =>
    chapter &&
    typeof chapter === 'object' &&
    Array.isArray(chapter.sections) &&
    chapter.sections.length >= 4 &&
    chapter.sections.length <= 8
  );
}

function makeCode(store) {
  for (let i = 0; i < 100; i++) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    if (!store[code]) return code;
  }
  throw new Error('CODE_EXHAUSTED');
}

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/health') {
    json(res, 200, { ok: true });
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/courses/publish') {
    try {
      const body = await readBody(req);
      const course = body.course;
      if (!courseValid(course)) {
        json(res, 400, { error: 'INVALID_COURSE' });
        return;
      }
      const store = cleanStore(readStore());
      const code = makeCode(store);
      const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
      course.code = code;
      course.status = 'published';
      course.publishedAt = new Date().toISOString();
      course.expiresAt = expiresAt;
      store[code] = { course, expiresAt };
      writeStore(store);
      json(res, 200, {
        code,
        expiresAt,
        previewUrl: `index.html?lab=${code}`
      });
    } catch (err) {
      json(res, err.message === 'BODY_TOO_LARGE' ? 413 : 400, { error: err.message || 'BAD_REQUEST' });
    }
    return;
  }
  const m = url.pathname.match(/^\/api\/courses\/([0-9]{4})$/);
  if (req.method === 'GET' && m) {
    const code = m[1];
    const store = cleanStore(readStore());
    const item = store[code];
    if (!item) {
      json(res, 200, { found: false, error: 'COURSE_NOT_FOUND_OR_EXPIRED' });
      return;
    }
    json(res, 200, Object.assign({ found: true }, item));
    return;
  }
  if (req.method === 'DELETE' && m) {
    const code = m[1];
    const store = cleanStore(readStore());
    const existed = Boolean(store[code]);
    if (existed) {
      delete store[code];
      writeStore(store);
    }
    json(res, 200, { ok: true, deleted: existed });
    return;
  }
  json(res, 200, { found: false, error: 'NOT_FOUND' });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (process.env.DEBUG_REQUESTS === '1') {
    res.on('finish', () => console.log(`${req.method} ${req.url} -> ${res.statusCode}`));
  }
  const apiAt = url.pathname.indexOf('/api/');
  if (apiAt >= 0) {
    url.pathname = url.pathname.slice(apiAt);
    handleApi(req, res, url);
    return;
  }
  if (url.pathname === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }
  let pathname = decodeURIComponent(url.pathname);
  const known = ['/index.html', '/upload.html', '/ui-system.css', '/favicon.ico', '/design/', '/demos/', '/ux-lab/', '/ui-lab/', '/advanced-preview/'];
  for (const k of known) {
    const at = pathname.indexOf(k);
    if (at > 0) {
      pathname = pathname.slice(at);
      break;
    }
  }
  if (pathname === '/' || pathname.endsWith('/')) pathname = '/index.html';
  const filePath = path.resolve(ROOT, '.' + pathname);
  if (!filePath.startsWith(ROOT) || fs.statSync(filePath, { throwIfNoEntry: false })?.isDirectory()) {
    res.writeHead(204);
    res.end();
    return;
  }
  staticFile(res, filePath);
});

server.listen(PORT, HOST, () => {
  console.log(`AI Explorer server listening on ${HOST}:${PORT}`);
});
