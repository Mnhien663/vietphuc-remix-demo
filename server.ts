import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Static assets
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.get('/trongdong.jpg', (req, res) => {
  res.sendFile(path.join(__dirname, 'trongdong.jpg'));
});
app.get('/fontChu.otf', (req, res) => {
  res.sendFile(path.join(__dirname, 'fontChu.otf'));
});
app.get('/logo.svg', (req, res) => {
  res.sendFile(path.join(__dirname, 'logo.svg'));
});

function mapColorToCode(colorStr: string): string | null {
  const c = colorStr.toLowerCase();
  if (c.includes('đỏ')) return 'do';
  if (c.includes('đen')) return 'den';
  if (c.includes('trắng') || c.includes('bạc')) return 'trang';
  if (c.includes('vàng')) return 'vang';
  if (c.includes('nâu')) return 'nau';
  if (c.includes('tím')) return 'tim';
  if (c.includes('cam')) return 'cam';
  if (c.includes('be') || c.includes('kem') || c.includes('nude')) return 'be';
  if (c.includes('xám') || c.includes('ghi')) return 'xam';
  if (c.includes('cổ vịt')) return 'xanh_co_vit';
  if (c.includes('nhạt') && c.includes('xanh')) return 'xanh_com_nhat';
  if (c.includes('rêu')) return 'reu';
  if (c.includes('xanh')) return 'xanh';
  if (c.includes('hồng')) return 'hong';
  return null;
}

app.get('/api/catalog', (req, res) => {
  try {
    const trangPhucRaw = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'trang_phuc.json'), 'utf-8'));
    const phuKienRaw = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'phu_kien.json'), 'utf-8'));
    const dataFiles = fs.readdirSync(path.join(__dirname, 'data')).filter(f => f.endsWith('.png'));

    const data: Record<string, any[]> = {
      'Trang phục': [],
      'Áo': [],
      'Váy/Quần': [],
      'Nón': [],
      'Túi xách': [],
      'Phụ kiện': [],
      'Giày': []
    };

    const allColors = new Set<string>();

    const extractColors = (itemData: any): string[] => {
      const colors: string[] = [];
      if (Array.isArray(itemData.mau_sac)) {
        for (const m of itemData.mau_sac) {
          const code = mapColorToCode(m);
          if (code) colors.push(code);
        }
      }
      if (Array.isArray(itemData.mau_sac_nu)) {
        for (const m of itemData.mau_sac_nu) {
          if (m.file_mau) colors.push(m.file_mau);
        }
      }
      if (Array.isArray(itemData.mau_sac_nam)) {
        for (const m of itemData.mau_sac_nam) {
          if (m.file_mau) colors.push(m.file_mau);
        }
      }
      return Array.from(new Set(colors));
    };

    for (const [k, v] of Object.entries<any>(trangPhucRaw)) {
      const colors = extractColors(v);
      colors.forEach(c => allColors.add(c));
      data['Trang phục'].push({
        id: k,
        name: v.ten,
        file_prefix: v.file_prefix,
        gioi_tinh: v.gioi_tinh || [],
        mau_sac: colors,
        nguon_goc: v.nguon_goc,
        y_nghia: v.y_nghia,
        dac_diem: v.dac_diem,
        hoan_canh: v.hoan_canh,
        cach_phoi_truyen_thong: v.cach_phoi_truyen_thong,
        cach_phoi_hien_dai: v.cach_phoi_hien_dai,
        phoi_mau: v.phoi_mau
      });
    }

    const categories: Record<string, string> = {
      ao_mac_trong: 'Áo',
      ao_khoac: 'Áo',
      quan_vay: 'Váy/Quần',
      tui_xach: 'Túi xách',
      giay_dep: 'Giày',
      trang_suc: 'Phụ kiện'
    };

    for (const [jsonCat, appCat] of Object.entries(categories)) {
      if (phuKienRaw[jsonCat]) {
        for (const [k, v] of Object.entries<any>(phuKienRaw[jsonCat])) {
          const colors = extractColors(v);
          colors.forEach(c => allColors.add(c));
          data[appCat].push({
            id: k,
            name: v.ten,
            file_prefix: v.file_prefix,
            gioi_tinh: v.gioi_tinh || [],
            mau_sac: colors
          });
        }
      }
    }

    if (phuKienRaw.phu_kien_dau_va_toc) {
      for (const [k, v] of Object.entries<any>(phuKienRaw.phu_kien_dau_va_toc)) {
        const colors = extractColors(v);
        colors.forEach(c => allColors.add(c));
        const lowerName = (v.ten || '').toLowerCase();
        const targetCat = lowerName.includes('mũ') || lowerName.includes('nón') ? 'Nón' : 'Phụ kiện';
        data[targetCat].push({
          id: k,
          name: v.ten,
          file_prefix: v.file_prefix,
          gioi_tinh: v.gioi_tinh || [],
          mau_sac: colors
        });
      }
    }

    res.json({
      catalog: data,
      dataFiles
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, context } = req.body;
    
    // Đọc data để AI lấy lịch sử
    const trangPhucData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'trang_phuc.json'), 'utf-8'));
    const phuKienData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'phu_kien.json'), 'utf-8'));
    const luatPhoiData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'luat_phoi_do.json'), 'utf-8'));

    const systemInstruction = `
    Bạn là Stylist AI của ứng dụng "Tam Tấu - Việt Phục Remix".
    Văn phong: Thân thiện, duyên dáng, đi thẳng vào chủ đề.

    QUY TẮC PHẢN HỒI (RẤT QUAN TRỌNG):
    1. TỪ VỰNG CẤM: TUYỆT ĐỐI KHÔNG dùng từ "ma nơ canh", "mannequin", hay "mô hình". Dùng "bạn", "bồ", "người mặc", hoặc "set đồ".
    2. CẤM MARKDOWN: Không dùng dấu *, **, #, _ dưới bất kỳ hình thức nào. Chỉ dùng Emoji.
    3. KIỂM TRA SAI LỆCH VĂN HÓA: Cấm phối đồ trang trọng với quần rách/hở hang. Nếu sai, ghi cảnh báo nhẹ nhàng vào trường "warning".

    4. PHÂN TÁCH NỘI DUNG (BẮT BUỘC TRẢ VỀ ĐÚNG CÁC TRƯỜNG JSON SAU):
       - Trường "message" (Cho khung chat): Trả lời vô thẳng chủ đề, tư vấn siêu ngắn gọn. TUYỆT ĐỐI KHÔNG giải thích nguồn gốc hay lịch sử ở đây (trừ khi người dùng chủ động hỏi).
       - Trường "ootd_history" (Cho trang kết quả): Trích xuất đúng 1-2 câu sơ lược nguồn gốc, ý nghĩa và NHÓM trang phục từ data Trang phục chủ đạo.
       - Trường "ootd_items" (Cho trang kết quả): Liệt kê danh sách các món đồ đang có trong set hiện tại mà bạn tư vấn (mỗi món đi kèm 1 emoji phù hợp, mỗi món 1 dòng, không dùng markdown).
       - Trường "ootd_advice" (Cho trang kết quả): 1-2 câu chốt lời khuyên phối đồ.

    5. GỢI Ý ĐÁP ÁN BẤM CHỌN (OPTIONS):
       - Luôn đưa ra 2-4 lựa chọn (dưới 35 ký tự).

    ĐỊNH DẠNG JSON TRẢ VỀ DUY NHẤT:
    {
      "message": "Nội dung chat đi thẳng vào vấn đề, siêu ngắn, không dài dòng lịch sử.",
      "ootd_history": "Nguồn gốc, nhóm trang phục, ý nghĩa siêu ngắn.",
      "ootd_items": "Danh sách các món trong set đồ (VD: 👘 Áo Tấc Đen \n 👖 Quần tây ống rộng).",
      "ootd_advice": "Lời khuyên 1-2 câu.",
      "warning": "Cảnh báo sai văn hóa (nếu có, không thì null).",
      "options": ["Lựa chọn 1", "Lựa chọn 2"]
    }

    TƯ LIỆU HỆ THỐNG CỦA BẠN:
    - Trang phục chủ đạo: ${JSON.stringify(trangPhucData)}
    - Công thức phối đồ: ${JSON.stringify(luatPhoiData)}
    - Kho phụ kiện: ${JSON.stringify(phuKienData)}
    - Bối cảnh người dùng: ${JSON.stringify(context || {})}
    `;

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history) {
        if (h.content) {
          const text = typeof h.content === 'string' ? h.content : (h.content.message || JSON.stringify(h.content));
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text }]
          });
        }
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.7
      }
    });

    const rawText = response.text || '';
    try {
      // Parse thử xem AI có trả JSON chuẩn không
      JSON.parse(rawText);
      res.json({ reply: rawText });
    } catch {
      res.json({
        reply: JSON.stringify({
          message: 'Stylist AI đang lắng nghe bạn nè 🌸',
          ootd_history: 'Hệ thống đang tải dữ liệu lịch sử...',
          ootd_advice: 'Chờ xíu nha!',
          warning: null,
          options: ['Tư vấn Áo Tấc', 'Tư vấn Áo Nhật Bình']
        })
      });
    }
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    res.json({
      reply: JSON.stringify({
        message: 'Dạ Stylist đang suy nghĩ hơi lâu chút xíu. Bồ thử gửi lại nha 👘',
        ootd_history: '',
        ootd_advice: '',
        warning: null,
        options: ['Chọn đồ Nam', 'Chọn đồ Nữ']
      })
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
