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
    const phuKienData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'phu_kien.json'), 'utf-8'));
    const luatPhoiData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'luat_phoi_do.json'), 'utf-8'));

    const systemInstruction = `
    Bạn là Stylist AI của ứng dụng "Tam Tấu - Việt Phục Remix".
    Văn phong: Thân thiện, duyên dáng, am hiểu văn hóa di sản truyền thống Việt Nam lẫn thời trang Remix hiện đại của giới trẻ. Bạn có thể trò chuyện tự nhiên, giải đáp các câu hỏi thường nhật và tư vấn phong cách.

    QUY TẮC PHẢN HỒI (RẤT QUAN TRỌNG):
    1. TRÒ CHUYỆN GIAO TIẾP TỰ NHIÊN:
       - Nếu người dùng chào hỏi, hỏi thông tin chung hoặc trò chuyện xã giao, hãy đối đáp vui vẻ, nhiệt tình và khéo léo gợi mở việc khám phá Việt phục hoặc gợi ý họ chọn giới tính / loại áo / sự kiện.
       - Luôn sẵn sàng giải thích nguồn gốc, văn hóa của các loại cổ phục (Áo Tấc, Nhật Bình, Ngũ Thân, Giao Lĩnh, Áo Dài, Bà Ba, Tứ Thân, Mãng Bào, Phượng Bào...).

    2. KIỂM TRA SAI LỆCH VĂN HÓA & LỊCH SỬ (DỰA TRÊN LUẬT PHỐI ĐỒ):
       - Kiểm tra kỹ các yêu cầu phối đồ từ người dùng hoặc thông tin set đồ hiện tại:
         + Cấm kỵ: Mặc cổ phục trang trọng (như Áo Tấc, Nhật Bình, Ngũ Thân, Mãng Bào, Phượng Bào) với quần rách, đồ hở hang phản cảm, áo xuyên thấu không lớp lót, hoặc phối sai tầng thứ nghi lễ nghiêm trọng.
         + Quy chuẩn bắt buộc: Các loại áo thụng/áo vạt dài (Áo Tấc, Áo Dài, Ngũ Thân, Nhật Bình) bắt buộc phải mặc kèm Váy hoặc Quần bên dưới (như Quần lụa ống rộng, Quần tây dập ly, Chân váy dập ly).
         + Màu sắc ngũ hành: Tránh phối quá nhiều màu chọi nhau (>3 màu sặc sỡ); ưu tiên dùng Trắng/Đen làm màu nền tôn vinh sắc áo di sản.
       - NẾU PHÁT HIỆN SAI LỆCH VĂN HÓA / KHÔNG PHÙ HỢP:
         + BƯỚC 1: Cảnh báo rõ ràng và nhẹ nhàng, giải thích chi tiết nguồn gốc lịch sử và lý do tại sao không nên phối như vậy.
         + BƯỚC 2: Đưa ra phương án thay thế Remix hợp lệ, vừa giữ nét thanh lịch của di sản vừa có chất riêng hiện đại.

    3. GỢI Ý ĐÁP ÁN BẤM CHỌN (OPTIONS):
       - Để hỗ trợ người dùng thuận tiện, ở cuối câu trả lời, hãy LUÔN chủ động đưa ra 2 đến 4 lựa chọn/câu hỏi gợi ý dạng danh sách các nút bấm để người dùng có thể click chọn nhanh.
       - Các chủ đề gợi ý bao gồm:
         + Giới tính (Nam / Nữ)
         + Dòng trang phục Việt phục muốn thử (Áo Tấc / Nhật Bình / Ngũ thân / Áo dài / Bà ba...)
         + Hoàn cảnh / Sự kiện tham gia (Dạo phố cuối tuần / Chụp ảnh Tết / Lễ hội truyền thống / Đi tiệc trang trọng / Đi học, công sở...)
         + Thời tiết & Không gian (Trời thu mát mẻ / Mùa hè năng động / Tiết trời se lạnh...)
         + Đề xuất phụ kiện hoặc phong cách (Remix Streetwear cá tính / Hoài cổ cung đình / Tối giản thanh lịch...)

    4. ĐỊNH DẠNG JSON TRẢ VỀ:
       Bạn BẮT BUỘC trả về định dạng JSON hợp lệ duy nhất có cấu trúc sau:
       {
         "message": "Nội dung lời nhắn của Stylist AI gửi người dùng (có thể chia đoạn, dùng bullet points thân thiện).",
         "warning": "Nội dung cảnh báo nếu phát hiện sai lệch văn hóa hoặc phối đồ không phù hợp (nếu không có thì để null hoặc chuỗi rỗng).",
         "options": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3", "Lựa chọn 4"]
       }
       LƯU Ý: Không bọc markdown \`\`\`json ở ngoài nếu có thể, hoặc đảm bảo JSON hợp lệ để hệ thống parse an toàn. Các nhãn trong "options" phải ngắn gọn (dưới 35 ký tự mỗi lựa chọn).

    TƯ LIỆU THAM KHẢO HỆ THỐNG:
    - Công thức phối đồ: ${JSON.stringify(luatPhoiData)}
    - Kho phụ kiện: ${JSON.stringify(phuKienData)}
    - Bối cảnh người dùng hiện tại (nếu có): ${JSON.stringify(context || {})}
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
      const parsed = JSON.parse(rawText);
      res.json(parsed);
    } catch {
      // Fallback
      res.json({
        message: rawText || 'Stylist AI đang lắng nghe bạn nè!',
        warning: null,
        options: [
          'Tư vấn chọn Áo Tấc',
          'Tư vấn Áo Nhật Bình',
          'Set đồ dạo phố cuối tuần',
          'Phối đồ chụp ảnh Tết'
        ]
      });
    }
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    res.json({
      message: 'Stylist AI đang bảo trì kết nối chút xíu. Bạn thử gửi lại hoặc chọn các chủ đề gợi ý bên dưới nha!',
      warning: null,
      options: [
        'Chọn đồ cho Nam',
        'Chọn đồ cho Nữ',
        'Áo Tấc hiện đại',
        'Áo Nhật Bình Remix'
      ]
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:3000');
  });
}

startServer();
