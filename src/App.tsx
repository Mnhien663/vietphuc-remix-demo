import React, { useState, useEffect, useRef } from 'react';

export interface CatalogItem {
  id: string;
  name: string;
  file_prefix: string;
  gioi_tinh: string[];
  mau_sac: string[];
  nguon_goc?: string;
  y_nghia?: string;
  dac_diem?: string;
  hoan_canh?: string;
  cach_phoi_truyen_thong?: string;
  cach_phoi_hien_dai?: string;
  phoi_mau?: string;
}

export interface SelectedItems {
  'Trang phục': CatalogItem | null;
  'Áo': CatalogItem | null;
  'Váy/Quần': CatalogItem | null;
  'Nón': CatalogItem | null;
  'Túi xách': CatalogItem | null;
  'Phụ kiện': CatalogItem[];
  'Giày': CatalogItem | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  warning?: string | null;
  options?: string[];
}

export interface PresetOutfit {
  id: string;
  name: string;
  subtitle: string;
  tag: string;
  gender: 'Nam' | 'Nữ' | 'Unisex';
  primaryColor: string;
  colorName: string;
  imageUrl: string;
  layeredImages: {
    robe: string;
    bottom?: string;
    inner?: string;
    hat?: string;
    shoes?: string;
    bag?: string;
    belt?: string;
  };
  description: string;
  styleAdvice: string;
  itemsConfig: {
    trangPhucPrefix?: string;
    aoPrefix?: string;
    vayQuanPrefix?: string;
    nonPrefix?: string;
    tuiPrefix?: string;
    giayPrefix?: string;
    phuKienPrefixes?: string[];
  };
  itemSummary: string[];
}

const STEPS: (keyof SelectedItems)[] = [
  'Trang phục',
  'Áo',
  'Váy/Quần',
  'Nón',
  'Túi xách',
  'Phụ kiện',
  'Giày'
];

const STEP_ICONS: Record<string, string> = {
  'Trang phục': '👘',
  'Áo': '👔',
  'Váy/Quần': '👖',
  'Nón': '👒',
  'Túi xách': '👜',
  'Phụ kiện': '💎',
  'Giày': '👞'
};

const COLOR_LABELS: Record<string, string> = {
  do: 'Đỏ',
  den: 'Đen',
  trang: 'Trắng',
  xanh: 'Xanh',
  vang: 'Vàng',
  nau: 'Nâu',
  tim: 'Tím',
  cam: 'Cam',
  be: 'Be',
  xam: 'Xám',
  xanh_com_nhat: 'Xanh nhạt',
  xanh_co_vit: 'Xanh cổ vịt',
  reu: 'Rêu',
  hong: 'Hồng'
};

// 8 BỘ PHỐI SẴN ĐÃ ĐƯỢC CHUẨN HÓA ĐƯỜNG DẪN ẢNH VÀ FILE_PREFIX
const PRESET_OUTFITS: PresetOutfit[] = [
  {
    id: 'nhat_binh_royal',
    name: 'Set Hoàng Triều Dạ Yến',
    subtitle: 'Áo Nhật Bình Dạ Tiệc Cung Đình Remix',
    tag: 'Cung Đình Triều Nguyễn',
    gender: 'Nữ',
    primaryColor: 'do',
    colorName: 'Đỏ Chu Sa',
    imageUrl: '/data/ao_nhat_binh_nu_do.png',
    layeredImages: {
      robe: '/data/ao_nhat_binh_nu_do.png',
      bottom: '/data/chan_vay_dap_ly_nu_trang.png',
      hat: '/data/khan_vanh_nu_vang.png',
      shoes: '/data/hai_theu_phuong_nu_do.png',
      bag: '/data/clutch_hop_nu_bac.png', // <-- Đã sửa đúng file JSON
      belt: '/data/tram_cai_toc_nu_bac.png' // <-- Đã sửa đúng file JSON
    },
    description: 'Tái hiện cốt cách cao quý hoàng gia triều Nguyễn nhưng biến tấu thanh thoát, mềm mại cho dạ tiệc thời thượng.',
    styleAdvice: 'Áo Nhật Bình sắc chu sa phối bay bổng cùng chân váy dập ly trắng, tôn thêm vẻ uy nghi với khăn vành vàng, trâm phượng hoàng và clutch ánh bạc kiêu kỳ.',
    itemsConfig: {
      trangPhucPrefix: 'ao_nhat_binh',
      vayQuanPrefix: 'chan_vay_xep_ly_dai',
      nonPrefix: 'khan_vanh',
      tuiPrefix: 'clutch_hop',
      giayPrefix: 'hai_theu_phuong',
      phuKienPrefixes: ['tram_cai_toc', 'khuyen_tai_ngoc_trai']
    },
    itemSummary: [
      'Áo Nhật Bình Nữ (Đỏ)',
      'Chân váy dập ly (Trắng)',
      'Khăn vành (Vàng)',
      'Hài thêu phượng (Đỏ)',
      'Clutch hộp ánh bạc',
      'Trâm phượng & Khuyên ngọc trai'
    ]
  },
  {
    id: 'ao_tac_cong_tu',
    name: 'Set Phong Lưu Nho Nhã',
    subtitle: 'Áo Tấc Nam Tân Thời Thanh Lịch',
    tag: 'Công Tử Kinh Kỳ',
    gender: 'Nam',
    primaryColor: 'den',
    colorName: 'Đen Tuyển',
    imageUrl: '/data/ao_tac_nam_den.png',
    layeredImages: {
      robe: '/data/ao_tac_nam_den.png',
      bottom: '/data/quan_tay_ong_rong_unisex_trang.png',
      hat: '/data/khan_van_unisex_den_nam.png',
      shoes: '/data/giay_loafer_unisex_den.png',
      bag: '/data/tui_deo_cheo_unisex_den.png', // <-- Đã sửa đúng file JSON
      belt: '/data/dai_lung_ngoc.png' // <-- Đã sửa đúng file JSON
    },
    description: 'Phong thái công tử Hà Thành nho nhã, điềm đạm với áo tấc thụng tay kết hợp quần tây suông trắng tối giản hiện đại.',
    styleAdvice: 'Áo tấc đen uy nghiêm kết hợp quần tây ống rộng trắng tương phản, đội khăn vấn chỉn chu, mang giày loafer bóng và đai lưng cung đình.',
    itemsConfig: {
      trangPhucPrefix: 'ao_tac',
      vayQuanPrefix: 'quan_tay_ong_rong',
      nonPrefix: 'khan_van',
      tuiPrefix: 'tui_deo_cheo',
      giayPrefix: 'giay_loafer',
      phuKienPrefixes: ['dai_lung', 'dong_ho']
    },
    itemSummary: [
      'Áo Tấc Nam (Đen)',
      'Quần tây ống rộng (Trắng)',
      'Khăn vấn Nam (Đen)',
      'Giày Loafer da bóng (Đen)',
      'Túi đeo chéo da (Đen)',
      'Đai lưng cổ truyền & Đồng hồ bạc'
    ]
  },
  {
    id: 'ngu_than_streetwear',
    name: 'Set Ngũ Thân Streetwear Gen Z',
    subtitle: 'Phá Cách Năng Động Đường Phố',
    tag: 'Streetwear Phá Cách',
    gender: 'Nam',
    primaryColor: 'xanh',
    colorName: 'Xanh Lam',
    imageUrl: '/data/ao_ngu_than_tay_chen_nam_xanh.png',
    layeredImages: {
      robe: '/data/ao_ngu_than_tay_chen_nam_xanh.png',
      bottom: '/data/quan_jeans_ong_rong_xanh_denim.png',
      hat: '/data/mu_bucket.png', // Đã tự động sửa khớp JSON
      shoes: '/data/giay_the_thao_de_bang_unisex_trang.png',
      bag: '/data/tui_tote_canvas.png' // Đã tự động sửa khớp JSON
    },
    description: 'Bản phối Gen Z bùng nổ năng lượng đương đại, đưa áo ngũ thân tay chẽn vào nhịp sống dạo phố trẻ trung.',
    styleAdvice: 'Áo ngũ thân lam tươi tắn mix cùng quần jeans ống rộng streetwear, mũ bucket sành điệu, sneaker trắng và kính mát Y2K.',
    itemsConfig: {
      trangPhucPrefix: 'ao_ngu_than_tay_chen',
      vayQuanPrefix: 'quan_jeans_ong_rong',
      nonPrefix: 'mu_bucket',
      tuiPrefix: 'tui_tote_canvas',
      giayPrefix: 'giay_the_thao_de_bang',
      phuKienPrefixes: ['kinh_mat_chu_nhat', 'dong_ho']
    },
    itemSummary: [
      'Áo Ngũ Thân tay chẽn (Xanh)',
      'Quần jeans ống rộng (Xanh denim)',
      'Mũ bucket streetwear (Đen)',
      'Giày sneaker đế bằng (Trắng)',
      'Túi tote canvas (Trắng)',
      'Kính mát chữ nhật & Đồng hồ'
    ]
  },
  {
    id: 'giao_linh_nguyet_anh',
    name: 'Set Giao Lĩnh Nguyệt Ánh',
    subtitle: 'Thời Lê Sơ Tinh Khôi & Cá Tính',
    tag: 'Hậu Lê Minimalist',
    gender: 'Nữ',
    primaryColor: 'trang',
    colorName: 'Bạch Ngọc',
    imageUrl: '/data/ao_giao_linh_nu_trang.png',
    layeredImages: {
      robe: '/data/ao_giao_linh_nu_trang.png',
      bottom: '/data/chan_vay_dap_ly_nu_den.png',
      hat: '/data/non_ba_tam.png', // Đã tự động sửa khớp JSON
      shoes: '/data/chelsea_boots_unisex_den.png',
      bag: '/data/tui_baguette.png', // Đã tự động sửa khớp JSON
      belt: '/data/that_lung_lua.png' // Đã tự động sửa khớp JSON
    },
    description: 'Nét đẹp thoát tục thời Hậu Lê với vạt áo giao lĩnh đan chéo thanh thoát, hòa quyện phong cách monochrome đương đại.',
    styleAdvice: 'Áo giao lĩnh trắng tuyết thắt dây lụa đỏ son tạo điểm nhấn eo, phối chân váy dập ly đen thướt tha, nón ba tầm và chelsea boots da cá tính.',
    itemsConfig: {
      trangPhucPrefix: 'ao_giao_linh',
      vayQuanPrefix: 'chan_vay_xep_ly_dai',
      nonPrefix: 'non_ba_tam',
      tuiPrefix: 'tui_baguette',
      giayPrefix: 'chelsea_boots',
      phuKienPrefixes: ['that_lung_lua', 'khuyen_tai_ngoc_trai']
    },
    itemSummary: [
      'Áo Giao Lĩnh Nữ (Trắng)',
      'Chân váy dập ly (Đen)',
      'Nón ba tầm quai thao (Be)',
      'Chelsea boots da (Đen)',
      'Túi baguette kẹp nách (Đen)',
      'Thắt lưng lụa Đỏ & Khuyên ngọc trai'
    ]
  },
  {
    id: 'ao_dai_tan_thoi',
    name: 'Set Hà Thành Tân Thời',
    subtitle: 'Áo Dài Lemur & Chuỗi Ngọc Đài Các',
    tag: 'Áo Dài Lemur 1930s',
    gender: 'Nữ',
    primaryColor: 'hong',
    colorName: 'Hồng Đào',
    imageUrl: '/data/ao_dai_tan_thoi_nu_hong.png',
    layeredImages: {
      robe: '/data/ao_dai_tan_thoi_nu_hong.png',
      bottom: '/data/quan_lua_ong_rong_unisex_trang.png',
      hat: '/data/khan_van_unisex_den_nu.png',
      shoes: '/data/giay_cao_got_nu_trang.png',
      bag: '/data/tui_mini_ngoc_trai.png' // Đã tự động sửa khớp JSON
    },
    description: 'Nét đẹp thiếu nữ Tràng An thập niên 1930 lãng mạn, tôn vinh đường cong yêu kiều với áo dài chiết eo Lemur / Lê Phổ.',
    styleAdvice: 'Sắc hồng đào dịu ngọt đi cùng quần lụa trắng buông rủ, khăn vấn nhung nữ, giày cao gót thanh mảnh và túi xách chuỗi ngọc trai.',
    itemsConfig: {
      trangPhucPrefix: 'ao_dai_tan_thoi',
      vayQuanPrefix: 'quan_lua_ong_rong',
      nonPrefix: 'khan_van',
      tuiPrefix: 'tui_mini_ngoc_trai',
      giayPrefix: 'giay_cao_got',
      phuKienPrefixes: ['khuyen_tai_ngoc_trai', 'nhan_ngoc_bich']
    },
    itemSummary: [
      'Áo Dài Tân Thời (Hồng)',
      'Quần lụa ống rộng (Trắng)',
      'Khăn vấn Nữ (Đen)',
      'Giày cao gót thanh lịch (Trắng)',
      'Túi mini chuỗi ngọc trai (Trắng)',
      'Khuyên ngọc trai & Nhẫn ngọc bích'
    ]
  },
  {
    id: 'ba_ba_mien_tay',
    name: 'Set Miền Tây Mộc Mạc',
    subtitle: 'Áo Bà Ba Dã Ngoại Bình Dị',
    tag: 'Dân Gian Nam Bộ',
    gender: 'Nam',
    primaryColor: 'nau',
    colorName: 'Nâu Đất',
    imageUrl: '/data/ao_ba_ba_nam_nau.png',
    layeredImages: {
      robe: '/data/ao_ba_ba_nam_nau.png',
      bottom: '/data/quan_linen_unisex_be.png',
      hat: '/data/khan_ran.png', // Đã tự động sửa khớp JSON
      shoes: '/data/dep_da_unisex_nau.png',
      bag: '/data/tui_may_tre_hop.png' // Đã tự động sửa khớp JSON
    },
    description: 'Hơi thở phóng khoáng, chân chất của miền sông nước Cửu Long với áo bà ba vải tơ và khăn rằn quấn cổ phong trần.',
    styleAdvice: 'Áo bà ba nâu đất kết hợp quần linen be thoáng mát, khăn rằn Nam Bộ, dép da quai chéo và túi mây tre đan thủ công mộc mạc.',
    itemsConfig: {
      trangPhucPrefix: 'ao_ba_ba',
      vayQuanPrefix: 'quan_linen',
      nonPrefix: 'khan_ran',
      tuiPrefix: 'tui_may_tre',
      giayPrefix: 'dep_da',
      phuKienPrefixes: ['dong_ho']
    },
    itemSummary: [
      'Áo Bà Ba Nam (Nâu)',
      'Quần linen form rộng (Be)',
      'Khăn rằn Nam Bộ (Đen)',
      'Dép da quai chéo (Nâu)',
      'Túi mây tre đan thủ công (Nâu)',
      'Đồng hồ kim loại vintage'
    ]
  },
  {
    id: 'tu_than_kinh_bac',
    name: 'Set Tứ Thân Kinh Bắc',
    subtitle: 'Nắng Xuân Trẩy Hội Lim Duyên Dáng',
    tag: 'Dân Gian Kinh Bắc',
    gender: 'Nữ',
    primaryColor: 'nau',
    colorName: 'Nâu Trầm',
    imageUrl: '/data/ao_tu_than_nu_nau.png',
    layeredImages: {
      robe: '/data/ao_tu_than_nu_nau.png',
      bottom: '/data/vay_quay_nu_den.png',
      hat: '/data/non_ba_tam.png', // Đã tự động sửa khớp JSON
      shoes: '/data/guoc_moc_unisex_nau.png',
      bag: '/data/tui_may_tre_hop.png', // Đã tự động sửa khớp JSON
      belt: '/data/that_lung_lua.png' // Đã tự động sửa khớp JSON
    },
    description: 'Nét duyên quan họ Kinh Bắc trẩy hội mùa xuân, tà áo tứ thân bốn vạt thắt dải yếm lụa vàng rực rỡ.',
    styleAdvice: 'Áo tứ thân kết hợp váy quây đen đụp cổ truyền, nón thúng quai thao quai thao, guốc mộc và trâm cài tóc phượng hoàng bằng bạc.',
    itemsConfig: {
      trangPhucPrefix: 'ao_tu_than',
      vayQuanPrefix: 'vay_quay',
      nonPrefix: 'non_ba_tam',
      tuiPrefix: 'tui_may_tre',
      giayPrefix: 'guoc_moc',
      phuKienPrefixes: ['that_lung_lua', 'tram_cai_toc']
    },
    itemSummary: [
      'Áo Tứ Thân Nữ (Nâu)',
      'Váy quây đụp (Đen)',
      'Nón ba tầm quai thao (Be)',
      'Guốc mộc truyền thống (Nâu)',
      'Giỏ mây tre đan thủ công',
      'Thắt lưng lụa Vàng & Trâm bạc'
    ]
  },
  {
    id: 'ao_tac_hy_su',
    name: 'Set Cổ Phục Hỷ Sự Áo Tấc Đỏ',
    subtitle: 'Lễ Hội Tết & Đại Lễ Trang Trọng',
    tag: 'Lễ Hội & Hỷ Sự',
    gender: 'Nữ',
    primaryColor: 'do',
    colorName: 'Đỏ Gấm Hỷ',
    imageUrl: '/data/ao_tac_nu_do.png',
    layeredImages: {
      robe: '/data/ao_tac_nu_do.png',
      bottom: '/data/quan_lua_ong_rong_unisex_trang.png',
      hat: '/data/khan_vanh_nu_vang.png',
      shoes: '/data/hai_theu_phuong_nu_vang.png',
      bag: '/data/clutch_hop_cung.png', // Đã tự động sửa khớp JSON
      belt: '/data/that_lung_lua.png' // Đã tự động sửa khớp JSON
    },
    description: 'Sắc đỏ may mắn của áo tấc thụng tay triều Nguyễn, biểu tượng cho phúc lộc và thịnh vượng trong ngày trọng đại.',
    styleAdvice: 'Áo tấc đỏ gấm phối cùng quần lụa trắng, khăn vành vàng uy nghi, hài thêu phượng hoàng rực rỡ và clutch cầm tay dự tiệc.',
    itemsConfig: {
      trangPhucPrefix: 'ao_tac',
      vayQuanPrefix: 'quan_lua_ong_rong',
      nonPrefix: 'khan_vanh',
      tuiPrefix: 'clutch_hop',
      giayPrefix: 'hai_theu_phuong',
      phuKienPrefixes: ['that_lung_lua', 'khuyen_tai_ngoc_trai']
    },
    itemSummary: [
      'Áo Tấc Nữ (Đỏ)',
      'Quần lụa ống rộng (Trắng)',
      'Khăn vành Nữ (Vàng)',
      'Hài thêu phượng (Vàng)',
      'Clutch hộp ánh bạc',
      'Thắt lưng lụa Đỏ & Khuyên ngọc trai'
    ]
  }
];

export function PresetMannequinPreview({
  preset,
  isDark,
  size = 'normal'
}: {
  preset: PresetOutfit;
  isDark: boolean;
  size?: 'normal' | 'large';
}) {
  const isLarge = size === 'large';
  const width = isLarge ? 300 : 220;
  const height = isLarge ? 380 : 275;

  return (
    <div
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      {/* NHÓM BÊN TRÁI: Thu nhỏ một chút để không mất mép áo */}
      {preset.layeredImages.inner && (
        <img src={preset.layeredImages.inner} alt="Áo trong" className="mannequin-layer" style={{ zIndex: 2, transform: 'translate(-15%, 0%) scale(0.75)' }} />
      )}
      {preset.layeredImages.robe && (
        <img src={preset.layeredImages.robe} alt={preset.name} className="mannequin-layer" style={{ zIndex: 3, transform: 'translate(-15%, 0%) scale(0.75)' }} />
      )}

      {/* NHÓM BÊN PHẢI: Kéo dần vào trung tâm để hiện trọn vẹn */}
      {preset.layeredImages.bottom && (
        <img src={preset.layeredImages.bottom} alt="Váy Quần" className="mannequin-layer" style={{ zIndex: 1, transform: 'translate(15%, 10%) scale(0.6)' }} />
      )}
      {preset.layeredImages.belt && (
        <img src={preset.layeredImages.belt} alt="Thắt lưng" className="mannequin-layer" style={{ zIndex: 4, transform: 'translate(20%, -2%) scale(0.5)' }} />
      )}
      {preset.layeredImages.shoes && (
        <img src={preset.layeredImages.shoes} alt="Giày" className="mannequin-layer" style={{ zIndex: 5, transform: 'translate(18%, 32%) scale(0.48)' }} />
      )}
      {preset.layeredImages.hat && (
        <img src={preset.layeredImages.hat} alt="Nón" className="mannequin-layer" style={{ zIndex: 6, transform: 'translate(20%, -25%) scale(0.5)' }} />
      )}
      {preset.layeredImages.bag && (
        <img src={preset.layeredImages.bag} alt="Túi xách" className="mannequin-layer" style={{ zIndex: 7, transform: 'translate(25%, 8%) scale(0.5)' }} />
      )}

    </div>
  );
}

export function TamTauLogo({
  size = 32,
  isDark,
  className = ''
}: {
  size?: number;
  isDark: boolean;
  className?: string;
}) {
  const logoColor = isDark ? '#F1E3C8' : '#9E2A2B';

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill={logoColor}
      className={className}
      style={{
        display: 'block',
        transition: 'fill 0.25s ease, filter 0.25s ease',
        filter: isDark
          ? 'drop-shadow(0 2px 8px rgba(241, 227, 200, 0.3))'
          : 'drop-shadow(0 2px 4px rgba(158, 42, 43, 0.2))'
      }}
    >
      <path d="M 4 4 L 96 4 L 96 28 L 46 28 L 46 64 L 22 64 L 22 28 L 4 28 Z" />
      <path d="M 54 36 L 78 36 L 78 72 L 96 72 L 96 96 L 4 96 L 4 72 L 54 72 Z" />
    </svg>
  );
}

export default function App() {
  const [page, setPage] = useState<'home' | 'chatbot' | 'result' | 'about'>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const isDark = theme === 'dark';
  const [catalog, setCatalog] = useState<Record<string, CatalogItem[]>>({
    'Trang phục': [],
    'Áo': [],
    'Váy/Quần': [],
    'Nón': [],
    'Túi xách': [],
    'Phụ kiện': [],
    'Giày': []
  });
  const [dataFiles, setDataFiles] = useState<string[]>([]);

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({
    'Trang phục': null,
    'Áo': null,
    'Váy/Quần': null,
    'Nón': null,
    'Túi xách': null,
    'Phụ kiện': [],
    'Giày': null
  });
  const [userGender, setUserGender] = useState<string | null>(null);
  const [userColor, setUserColor] = useState<string | null>(null);
  const [activeColorFilter, setActiveColorFilter] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'mannequin' | 'grid'>('mannequin');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hé lô bồ tèo! ✨ Tui là Stylist AI của Việt Phục Remix đây. Bồ có thể thoải mái hỏi thăm trò chuyện, hoặc chia sẻ dự định phối đồ để tui tư vấn nha!',
      options: [
        'Tư vấn cho Nữ',
        'Tư vấn cho Nam',
        'Gợi ý set đi chơi Tết',
        'Phối Áo Tấc dạo phố',
        'Xem set phối sẵn'
      ]
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Modals & Drawers
  const [detailModalItem, setDetailModalItem] = useState<CatalogItem | null>(null);
  const [selectedPresetDetail, setSelectedPresetDetail] = useState<PresetOutfit | null>(null);
  const [showPresetsModal, setShowPresetsModal] = useState<boolean>(false);

  // Result page states
  const [ootdDataUrl, setOotdDataUrl] = useState<string>('');
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'success' | 'warning'>('idle');

  const sliderRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/catalog')
      .then(r => r.json())
      .then(res => {
        if (res.catalog) setCatalog(res.catalog);
        if (res.dataFiles) setDataFiles(res.dataFiles);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function getDynamicImagePath(item: CatalogItem | null, gender: string | null, colorCode: string | null, overrideFilter?: string | null): string {
    if (!item || dataFiles.length === 0) return '';
    let prefix = item.file_prefix || '';
    
    // Xử lý ngoại lệ tên tiền tố
    if (prefix === 'chan_vay_xep_ly_dai') prefix = 'chan_vay_dap_ly';
    if (prefix === 'tui_mini_ngoc_trai') prefix = 'tui_mini_ngoc_trai';
    
    const gioiTinhList = item.gioi_tinh || [];
    const activeColor = overrideFilter !== undefined ? overrideFilter : (activeColorFilter || colorCode);

    // Ưu tiên tìm chính xác theo prefix trước
    const exactSimpleMatch = dataFiles.find(f => f === `${prefix}.png`);
    if (exactSimpleMatch) return `/data/${exactSimpleMatch}`;

    // Tìm theo màu (Bỏ qua giới tính)
    if (activeColor) {
      const matchColorOnly = dataFiles.find(f => f.startsWith(prefix) && f.endsWith('.png') && f.includes(`_${activeColor}`));
      if (matchColorOnly) return `/data/${matchColorOnly}`;
    }

    // Logic ghép giới tính và màu
    let genderTag = '';
    if (gioiTinhList.includes('Nam') && gioiTinhList.includes('Nữ')) genderTag = 'unisex';
    else if (gioiTinhList.includes('Nữ')) genderTag = 'nu';
    else if (gioiTinhList.includes('Nam')) genderTag = 'nam';

    if (genderTag && activeColor) {
      const exactFile = `${prefix}_${genderTag}_${activeColor}.png`;
      if (dataFiles.includes(exactFile)) return `/data/${exactFile}`;
    }

    if (genderTag) {
      const matchGender = dataFiles.find(f => f.startsWith(prefix) && f.endsWith('.png') && f.includes(`_${genderTag}_`));
      if (matchGender) return `/data/${matchGender}`;
    }

    const fallback = dataFiles.find(f => f.startsWith(prefix) && f.endsWith('.png'));
    return fallback ? `/data/${fallback}` : '';
  }

  // Áp dụng trọn vẹn một bộ phối sẵn vào phòng thử đồ
  function applyPresetOutfit(preset: PresetOutfit) {
    const newSelected: SelectedItems = {
      'Trang phục': null,
      'Áo': null,
      'Váy/Quần': null,
      'Nón': null,
      'Túi xách': null,
      'Phụ kiện': [],
      'Giày': null
    };

    if (preset.itemsConfig.trangPhucPrefix) {
      const match = catalog['Trang phục'].find(i => i.file_prefix === preset.itemsConfig.trangPhucPrefix);
      if (match) newSelected['Trang phục'] = match;
    }
    if (preset.itemsConfig.aoPrefix) {
      const match = catalog['Áo'].find(i => i.file_prefix === preset.itemsConfig.aoPrefix);
      if (match) newSelected['Áo'] = match;
    }
    if (preset.itemsConfig.vayQuanPrefix) {
      const match = catalog['Váy/Quần'].find(i =>
        i.file_prefix === preset.itemsConfig.vayQuanPrefix ||
        (preset.itemsConfig.vayQuanPrefix === 'chan_vay_xep_ly_dai' && (i.file_prefix === 'chan_vay_xep_ly_dai' || i.file_prefix === 'chan_vay_dap_ly')) ||
        (preset.itemsConfig.vayQuanPrefix === 'quan_linen' && i.file_prefix === 'quan_linen')
      );
      if (match) newSelected['Váy/Quần'] = match;
    }
    if (preset.itemsConfig.nonPrefix) {
      const match = catalog['Nón'].find(i => i.file_prefix === preset.itemsConfig.nonPrefix);
      if (match) newSelected['Nón'] = match;
    }
    if (preset.itemsConfig.tuiPrefix) {
      const match = catalog['Túi xách'].find(i => i.file_prefix === preset.itemsConfig.tuiPrefix);
      if (match) newSelected['Túi xách'] = match;
    }
    if (preset.itemsConfig.giayPrefix) {
      const match = catalog['Giày'].find(i => i.file_prefix === preset.itemsConfig.giayPrefix);
      if (match) newSelected['Giày'] = match;
    }
    if (preset.itemsConfig.phuKienPrefixes && preset.itemsConfig.phuKienPrefixes.length > 0) {
      const accMatches: CatalogItem[] = [];
      preset.itemsConfig.phuKienPrefixes.forEach(pfx => {
        const found = catalog['Phụ kiện'].find(i => i.file_prefix === pfx || (pfx === 'dai_lung' && i.file_prefix.includes('dai_lung')));
        if (found) accMatches.push(found);
      });
      newSelected['Phụ kiện'] = accMatches;
    }

    setSelectedItems(newSelected);
    setUserGender(preset.gender);
    setUserColor(preset.primaryColor);
    setActiveColorFilter(null);
    setPage('chatbot');
    setSelectedPresetDetail(null);
    setShowPresetsModal(false);

    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: `✨ Tui đã nạp trọn bộ **${preset.name}** (${preset.tag}) lên mannequin cho bồ rồi nè!\n\n👘 **Các món trong set gồm:**\n• ${preset.itemSummary.join('\n• ')}\n\n💡 **Lời khuyên phối đồ:** ${preset.styleAdvice}\n\nMannequin đã được tùy biến phom dáng chuẩn theo giới tính **${preset.gender}**. Bồ có thể bấm **Xuất kết quả** để xem poster OOTD ngay nha!`,
        options: [
          'Xuất kết quả OOTD ngay',
          'Đổi màu trang phục',
          'Tư vấn thêm phụ kiện',
          'Chọn set phối sẵn khác'
        ]
      }
    ]);
  }

  function chamDiemOutfit(sel: SelectedItems, uColor: string | null, currStep: string) {
    let diem = 0;
    const nhanXet: string[] = [];
    const goiYAi: string[] = [];
    const thieuSot: string[] = [];

    const topItem = sel['Trang phục'] || sel['Áo'];
    const hasTop = Boolean(topItem);
    const hasBottom = Boolean(sel['Váy/Quần']);
    const hasShoes = Boolean(sel['Giày']);
    const hasAcc = Boolean(sel['Nón'] || sel['Túi xách'] || (sel['Phụ kiện'] && sel['Phụ kiện'].length > 0));

    const colorsFound = new Set<string>();
    const danhSachMau = ['đỏ', 'xanh', 'vàng', 'đen', 'trắng', 'nâu', 'tím', 'cam', 'be', 'xám', 'hồng'];
    const mauBoQuaDem = new Set(['đen', 'trắng']);

    Object.values(sel).forEach(value => {
      if (value) {
        const items = Array.isArray(value) ? value : [value];
        items.forEach(item => {
          const chuoiNhanDien = `${item.name || ''} ${item.id || ''} ${item.file_prefix || ''}`.toLowerCase();
          danhSachMau.forEach(c => {
            if (chuoiNhanDien.includes(c)) colorsFound.add(c);
          });
        });
      }
    });

    if (uColor) {
      const label = COLOR_LABELS[uColor]?.toLowerCase() || uColor.toLowerCase();
      colorsFound.add(label);
    }

    let requiresBottom = false;
    if (hasTop && topItem) {
      const tenAo = (topItem.name || '').toLowerCase();
      if (['áo dài', 'bà ba', 'ngũ thân', 'tấc', 'nhật bình', 'giao lĩnh', 'viên lĩnh', 'đối khâm', 'tứ điên'].some(x => tenAo.includes(x))) {
        requiresBottom = true;
      }
    }

    let thoaDieuKienCoBan = true;
    if (!hasTop) {
      thoaDieuKienCoBan = false;
      thieuSot.push('Thiếu Áo hoặc Việt phục chính (-5đ)');
    }
    if (requiresBottom && !hasBottom && topItem) {
      thoaDieuKienCoBan = false;
      thieuSot.push(`Cổ phục '${topItem.name}' bắt buộc phải mặc kèm Váy/Quần (-5đ)`);
      goiYAi.push('💡 Bồ đang mặc áo mà quên chọn Váy/Quần! Chuyển sang tab [Váy/Quần] để hoàn thiện set đồ nhé.');
    }
    if (!hasShoes) {
      thoaDieuKienCoBan = false;
      thieuSot.push('Chưa chọn Giày/Hài/Guốc cho set đồ (-5đ)');
    }

    if (!thoaDieuKienCoBan) {
      return {
        diem: 0,
        nhanXet: ['Chưa đủ trang phục cơ bản (Áo, Váy/Quần, Giày)'],
        goiYAi,
        thieuSot
      };
    } else {
      diem += 5;
      nhanXet.push('Trang phục cơ bản đầy đủ và đúng quy chuẩn (+5đ)');
    }

    if (hasAcc) {
      diem += 2;
      nhanXet.push('Có phụ kiện điểm xuyết tạo dấu ấn cá nhân (+2đ)');
    } else {
      thieuSot.push('Thiếu điểm nhấn: Thêm Nón, Túi xách hoặc Trang sức (-2đ)');
    }

    const mauNoiBat = Array.from(colorsFound).filter(c => !mauBoQuaDem.has(c));
    let colorHarmony = false;

    if (colorsFound.size === 0) {
      diem += 2;
      nhanXet.push('Hòa sắc đồng điệu và an toàn (+2đ)');
      colorHarmony = true;
    } else if (mauNoiBat.length === 1) {
      diem += 3;
      nhanXet.push(`Hòa sắc Monochrome / Điểm nhấn màu ${mauNoiBat[0]} thanh lịch (+3đ)`);
      colorHarmony = true;
    } else if (mauNoiBat.length === 2) {
      const [m1, m2] = mauNoiBat;
      const hopNguHanh =
        (m1.includes('đỏ') && m2.includes('vàng')) ||
        (m1.includes('vàng') && m2.includes('đỏ')) ||
        (m1.includes('xanh') && m2.includes('đen')) ||
        (m1.includes('đen') && m2.includes('xanh')) ||
        (m1.includes('nâu') && m2.includes('vàng')) ||
        (m1.includes('vàng') && m2.includes('nâu'));

      if (hopNguHanh) {
        diem += 3;
        nhanXet.push(`Phối màu ${m1} và ${m2} chuẩn tương sinh Ngũ hành cổ truyền (+3đ)`);
        colorHarmony = true;
      } else {
        diem += 1;
        nhanXet.push(`Phối màu tương phản ${m1} & ${m2} cá tính (+1đ)`);
      }
    } else {
      diem += 0;
      nhanXet.push(`Set đồ có quá 3 tông màu sặc sỡ (${mauNoiBat.join(', ')}), dễ bị rối mắt (+0đ)`);
      goiYAi.push('💡 Bồ nên tinh giản bớt phụ kiện hoặc chọn phụ kiện màu trung tính (đen, trắng, bạc) để tổng thể hài hòa hơn.');
    }

    if (topItem) {
      const ten = topItem.name.toLowerCase();
      if (ten.includes('nhật bình')) {
        const bottom = sel['Váy/Quần'];
        if (bottom && bottom.name.toLowerCase().includes('dập ly')) {
          goiYAi.push('✨ Tuyệt chiêu: Nhật Bình phối chân váy dập ly là bản remix cung đình cực kỳ bay bổng và hợp xu hướng!');
        }
      } else if (ten.includes('ngũ thân')) {
        const bottom = sel['Váy/Quần'];
        if (bottom && bottom.name.toLowerCase().includes('jeans')) {
          goiYAi.push('🔥 Phong cách Streetwear: Áo ngũ thân tay chẽn đi cùng quần jeans ống rộng mang lại vẻ phóng khoáng Gen Z.');
        }
      }
    }

    return {
      diem: Math.min(10, diem),
      nhanXet,
      goiYAi,
      thieuSot
    };
  }

  const currentStep = STEPS[currentStepIndex];

  function kiemTraPhamQuyVanHoa(text: string, sel: SelectedItems): string | null {
    const t = text.toLowerCase();
    const topItem = sel['Trang phục'] || sel['Áo'];
    const tenTop = (topItem?.name || '').toLowerCase();
    const nonItem = sel['Nón'];
    const tenNon = (nonItem?.name || '').toLowerCase();
    const giayItem = sel['Giày'];
    const tenGiay = (giayItem?.name || '').toLowerCase();

    if (t.includes('nhật bình') || tenTop.includes('nhật bình')) {
      if (t.includes('nón ba tầm') || tenNon.includes('ba tầm')) {
        return 'Áo Nhật Bình là triều phục cung đình cao quý triều Nguyễn, trong khi Nón Ba Tầm (quai thao) là trang phục dân gian Kinh Bắc. Việc phối Nhật Bình với nón ba tầm bị coi là "râu ông nọ cắm cằm bà kia", sai lệch nghiêm trọng về phân cấp trang phục phong kiến.';
      }
      if (t.includes('khăn rằn') || tenNon.includes('khăn rằn')) {
        return 'Áo Nhật Bình là trang phục hoàng gia, không thể quàng Khăn Rằn (biểu trưng của người lao động bình dân Nam Bộ). Đây là sự lai tạp sai lệch bối cảnh văn hóa.';
      }
    }

    if (t.includes('áo tấc') || tenTop.includes('áo tấc') || tenTop.includes('ngũ thân')) {
      if (t.includes('mũ phượng') || tenNon.includes('mũ phượng')) {
        return 'Mũ Phượng chỉ dành riêng cho Hoàng hậu hoặc Công chúa khi mặc Đại triều phục/Nhật bình trong các đại lễ, không đội kèm với Áo Tấc thông thường hay Áo Ngũ Thân nam.';
      }
    }

    if (t.includes('bà ba') || tenTop.includes('bà ba')) {
      if (t.includes('mũ phượng') || tenNon.includes('mũ phượng') || t.includes('hài thêu phượng') || tenGiay.includes('thêu phượng')) {
        return 'Áo Bà Ba là trang phục dân dã phóng khoáng của miền Tây Nam Bộ, hoàn toàn cấm kỵ và tương phản gay gắt khi phối với Mũ Phượng hoặc Hài thêu cung đình.';
      }
    }

    if (t.includes('tứ thân') || tenTop.includes('tứ thân')) {
      if (t.includes('mũ phượng') || tenNon.includes('mũ phượng')) {
        return 'Áo Tứ Thân là trang phục phụ nữ bình dân Bắc Bộ, không thể đội Mũ Phượng cung đình.';
      }
    }

    if (t.includes('hài thêu phượng') && (userGender === 'Nam' || t.includes('cho nam'))) {
      return 'Hài thêu phượng chỉ dành cho Nữ giới quyền quý thời phong kiến. Nam giới cung đình hoặc nho sinh đi Giày Hia đen hoặc Giày Vải.';
    }

    return null;
  }

  async function sendMessageText(inputText: string) {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsSending(true);

    const cultureWarning = kiemTraPhamQuyVanHoa(inputText, selectedItems);

    const lower = inputText.toLowerCase();
    if (lower.includes('nữ') && !lower.includes('nam')) setUserGender('Nữ');
    else if (lower.includes('nam') && !lower.includes('nữ')) setUserGender('Nam');

    const colorCodes = Object.keys(COLOR_LABELS);
    for (const code of colorCodes) {
      const name = COLOR_LABELS[code].toLowerCase();
      if (lower.includes(name)) {
        setUserColor(code);
        break;
      }
    }

    if (lower.includes('set phối sẵn') || lower.includes('mẫu phối sẵn') || lower.includes('gợi ý set')) {
      setShowPresetsModal(true);
    }

    try {
      const selDescription = Object.entries(selectedItems)
        .filter(([_, v]) => v !== null && (Array.isArray(v) ? v.length > 0 : true))
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.map((i: any) => i.name).join(', ') : (v as any).name}`)
        .join('; ');

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputText,
          context: {
            selectedItems: selDescription,
            userGender,
            userColor: userColor ? COLOR_LABELS[userColor] : null,
            currentStep
          }
        })
      });

      const data = await res.json();
      let replyContent = data.reply || 'Stylist AI đã tiếp nhận ý kiến của bạn!';
      let replyOptions: string[] = [];

      try {
        const parsed = JSON.parse(replyContent);
        if (parsed.message) {
          replyContent = parsed.message;
          replyOptions = parsed.options || [];
        }
      } catch (e) {
        if (replyContent.includes('---OPTIONS---')) {
          const parts = replyContent.split('---OPTIONS---');
          replyContent = parts[0].trim();
          try {
            replyOptions = JSON.parse(parts[1].trim());
          } catch (_) {
            replyOptions = parts[1].split(',').map((s: string) => s.trim());
          }
        }
      }

      if (!replyOptions || replyOptions.length === 0) {
        if (!userGender) {
          replyOptions = ['Tôi là Nữ', 'Tôi là Nam', 'Tư vấn đồ Unisex'];
        } else if (!selectedItems['Trang phục']) {
          replyOptions = ['Chọn Áo Tấc', 'Chọn Áo Nhật Bình', 'Chọn Áo Ngũ Thân', 'Chọn Áo Dài Tân Thời'];
        } else if (!selectedItems['Váy/Quần']) {
          replyOptions = ['Phối Quần lụa trắng', 'Phối Chân váy dập ly', 'Phối Quần tây suông', 'Phối Quần Jeans ống rộng'];
        } else {
          replyOptions = ['Đi tiệc trang trọng', 'Dạo phố cuối tuần', 'Chụp ảnh Tết cổ truyền', 'Xuất kết quả OOTD'];
        }
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: replyContent,
          warning: cultureWarning,
          options: replyOptions
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Dạ Stylist đang bị quá tải nhẹ, nhưng bồ yên tâm! Hãy cho tui biết bồ muốn phối đồ cho dịp gì (Đi chơi, Đi tiệc, Chụp ảnh Tết...) và thích màu nào nha?',
          warning: cultureWarning,
          options: ['Tư vấn lại Áo Tấc', 'Tư vấn Áo Nhật Bình', 'Chọn đồ cho Nữ', 'Chọn đồ cho Nam', 'Xem set phối sẵn']
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    await sendMessageText(chatInput);
  }

  // Generate OOTD Canvas when entering 'result' page
  useEffect(() => {
    if (page !== 'result') return;

    const generateCanvas = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Nền Canvas
      ctx.fillStyle = isDark ? '#220808' : '#FAF6EE';
      ctx.fillRect(0, 0, 1080, 1350);

      // Chữ tiêu đề theo Font Elodie đồng bộ website
      ctx.fillStyle = isDark ? '#F1E3C8' : '#123C46';
      ctx.font = 'normal 56px Elodie, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GỢI Ý PHỐI ĐỒ / OOTD', 540, 80);

      const loadImage = (src: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
          if (!src) return resolve(null);
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
        });
      };

      // Hàm vẽ khung bo tròn cho ô grid
      const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, fillStyle: string) => {
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
      };

      const boxBg = isDark ? '#4A3030' : '#E0E0E0'; // Màu nền xám lót cho ô đồ

      // Hàm load và vẽ ảnh căn giữa ô lưới
      const drawSlot = async (item: CatalogItem | null | undefined, x: number, y: number, w: number, h: number) => {
        drawRoundedRect(x, y, w, h, 20, boxBg);
        if (!item) return;
        const src = getDynamicImagePath(item, userGender, userColor);
        if (!src) return;
        const img = await loadImage(src);
        if (img) {
          const imgAspect = img.width / img.height;
          const boxAspect = w / h;
          let drawW, drawH;
          if (imgAspect > boxAspect) {
            drawW = w * 0.85; // Cách lề 15%
            drawH = drawW / imgAspect;
          } else {
            drawH = h * 0.85;
            drawW = drawH * imgAspect;
          }
          const dx = x + (w - drawW) / 2;
          const dy = y + (h - drawH) / 2;
          ctx.drawImage(img, dx, dy, drawW, drawH);
        }
      };

      // Tách lọc phụ kiện
      const mainAccs = selectedItems['Phụ kiện'] || [];
      const nonItem = selectedItems['Nón'] || mainAccs.find(a => a.name.toLowerCase().includes('khăn') || a.name.toLowerCase().includes('trâm') || a.name.toLowerCase().includes('mũ'));
      const daiItem = mainAccs.find(a => a.name.toLowerCase().includes('thắt lưng') || a.name.toLowerCase().includes('đai')) || mainAccs.find(a => a.id !== nonItem?.id);

      // ================= LOGIC GRID ĐỘNG (TỰ ĐỘNG CO GIÃN) ================= //

      // 1. Ô Trái (Cố định cho Việt Phục)
      const mainOutfit = selectedItems['Trang phục'] || selectedItems['Áo'];
      if (mainOutfit) {
        await drawSlot(mainOutfit, 40, 140, 600, 830);
      }

      // 2. Cột Phải (Quần, Áo trong, Túi) - Lọc rỗng và chia đều chiều cao
      const rawRightItems = [
        selectedItems['Trang phục'] && selectedItems['Áo'] ? selectedItems['Áo'] : null,
        selectedItems['Váy/Quần'],
        selectedItems['Túi xách']
      ];
      const rightItems = rawRightItems.filter(Boolean); // Chỉ giữ các món có thật

      if (rightItems.length > 0) {
        const gap = 20;
        // Tổng chiều cao khung 830. Chia đều cho số lượng món có thật
        const totalGap = gap * (rightItems.length - 1);
        const slotH = (830 - totalGap) / rightItems.length;
        for (let i = 0; i < rightItems.length; i++) {
          await drawSlot(rightItems[i], 660, 140 + i * (slotH + gap), 380, slotH);
        }
      }

      // 3. Hàng Dưới (Giày, Nón, Đai/Phụ kiện) - Lọc rỗng và chia đều chiều rộng
      const rawBottomItems = [nonItem, selectedItems['Giày'], daiItem];
      const bottomItems = rawBottomItems.filter(Boolean); // Chỉ giữ các món có thật

      if (bottomItems.length > 0) {
        const gap = 20;
        const totalBottomW = 1000;
        // Chia đều chiều ngang 1000 cho số lượng món có thật
        const totalGap = gap * (bottomItems.length - 1);
        const slotW = (totalBottomW - totalGap) / bottomItems.length;
        for (let i = 0; i < bottomItems.length; i++) {
          await drawSlot(bottomItems[i], 40 + i * (slotW + gap), 990, slotW, 320);
        }
      }

      setOotdDataUrl(canvas.toDataURL('image/jpeg', 0.95));
    };

    generateCanvas();
  }, [page, selectedItems, userGender, userColor, isDark]);

  // Filtering products for current step
  const rawItemsForStep = catalog[currentStep] || [];
  const genderFilteredItems = rawItemsForStep.filter(item => {
    if (userGender) {
      const gList = item.gioi_tinh || [];
      if (gList.length > 0 && !gList.includes(userGender)) return false;
    }
    return true;
  });

  const availableColorsForStep = new Set<string>();
  genderFilteredItems.forEach(item => {
    (item.mau_sac || []).forEach(c => {
      if (getDynamicImagePath(item, userGender, c, c)) {
        availableColorsForStep.add(c);
      }
    });
  });

  const colorOptions = [
    { code: '', label: 'Tất cả' },
    ...Array.from(availableColorsForStep)
      .filter(c => COLOR_LABELS[c])
      .map(c => ({ code: c, label: COLOR_LABELS[c] }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'))
  ];

  let filteredItems = genderFilteredItems.filter(item => {
    if (activeColorFilter) {
      if (!(item.mau_sac || []).includes(activeColorFilter)) return false;
    }
    const imgPath = getDynamicImagePath(item, userGender, userColor);
    if (!imgPath) return false;
    return true;
  });

  if (currentStep === 'Váy/Quần') {
    const vayList = filteredItems.filter(i => i.name.toLowerCase().includes('váy') || i.name.toLowerCase().includes('đầm'));
    const quanList = filteredItems.filter(i => !i.name.toLowerCase().includes('váy') && !i.name.toLowerCase().includes('đầm'));
    filteredItems = [...vayList, ...quanList];
  }

  const scoreData = chamDiemOutfit(selectedItems, userColor, currentStep);
  const chuaChonTrangPhuc =
    selectedItems['Trang phục'] === null &&
    selectedItems['Áo'] === null &&
    selectedItems['Váy/Quần'] === null;

  const hasAnySelectedItem = Object.values(selectedItems).some(v => (Array.isArray(v) ? v.length > 0 : Boolean(v)));

  // Determine floating accessories vs main layered accessories
  const floatingAccs: CatalogItem[] = [];
  const mainAccs: CatalogItem[] = [];
  (selectedItems['Phụ kiện'] || []).forEach(acc => {
    const n = acc.name.toLowerCase();
    if (n.includes('thắt lưng') || n.includes('đai') || n.includes('khăn') || n.includes('trâm') || n.includes('mũ phượng')) {
      mainAccs.push(acc);
    } else {
      floatingAccs.push(acc);
    }
  });

  return (
    <div className={`app-container ${isDark ? 'theme-dark' : 'theme-light'}`}>
      <style>{`
        .app-container {
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
          padding: 1.25rem 2rem;
          transition: background 0.3s ease, color 0.3s ease;
        }
        .theme-dark {
          background: linear-gradient(180deg, #380b0b 0%, #1f0505 100%);
          color: #F1E3C8;
        }
        .theme-light {
          background-color: #F6F2E8;
          color: #123C46;
        }

        .content-wrapper {
          position: relative;
          z-index: 2;
          max-width: 1440px;
          margin: 0 auto;
        }

        /* ================= MAIN NAVBAR (TRỐNG ĐỒNG NẰM GỌN TRONG NAVBAR) ================= */
        .main-navbar-header {
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          padding: 0.85rem 1.75rem;
          margin-bottom: 2.25rem;
          border: 1.5px solid ${isDark ? 'rgba(241, 227, 200, 0.22)' : 'rgba(216, 90, 63, 0.28)'};
          background: ${isDark
            ? 'linear-gradient(135deg, rgba(48, 10, 10, 0.94) 0%, rgba(26, 5, 5, 0.97) 100%)'
            : 'linear-gradient(135deg, rgba(255, 252, 246, 0.96) 0%, rgba(247, 240, 228, 0.94) 100%)'};
          box-shadow: ${isDark
            ? '0 12px 32px -4px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(241, 227, 200, 0.12)'
            : '0 10px 25px -4px rgba(216, 90, 63, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)'};
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 25;
        }

        /* HOA VĂN CHÌM TRỐNG ĐỒNG NẰM GỌN TRONG THANH ĐIỀU HƯỚNG */
        .navbar-trongdong-bg {
          position: absolute;
          inset: 0;
          background-image: url('/trongdong.jpg');
          background-position: center;
          background-repeat: repeat-x;
          background-size: contain;
          pointer-events: none;
          z-index: 0;
          opacity: ${isDark ? '0.13' : '0.075'};
          mask-image: linear-gradient(90deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.95) 15%, rgba(0,0,0,0.95) 85%, rgba(0,0,0,0.15) 100%);
          -webkit-mask-image: linear-gradient(90deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.95) 15%, rgba(0,0,0,0.95) 85%, rgba(0,0,0,0.15) 100%);
        }

        .navbar-inner-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 1.5rem;
        }

        .nav-brand-container {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
          transition: transform 0.2s ease;
        }
        .nav-brand-container:hover {
          transform: translateY(-1px);
        }
        .brand-emblem {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${isDark ? 'rgba(241, 227, 200, 0.08)' : 'rgba(158, 42, 43, 0.06)'};
          border: 1.2px solid ${isDark ? 'rgba(241, 227, 200, 0.25)' : 'rgba(158, 42, 43, 0.2)'};
          box-shadow: ${isDark ? '0 4px 14px rgba(0,0,0,0.35)' : '0 2px 8px rgba(158, 42, 43, 0.1)'};
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nav-brand-container:hover .brand-emblem {
          transform: scale(1.06);
          border-color: ${isDark ? '#F1E3C8' : '#9E2A2B'};
          background: ${isDark ? 'rgba(241, 227, 200, 0.14)' : 'rgba(158, 42, 43, 0.12)'};
        }
        .brand-text-group {
          display: flex;
          flex-direction: column;
        }
        .brand-title {
          font-family: 'Elodie', sans-serif;
          font-size: 24px;
          font-weight: normal;
          letter-spacing: 1.5px;
          line-height: 1.15;
          color: ${isDark ? '#F1E3C8' : '#D85A3F'};
        }
        .brand-subtitle {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          opacity: 0.8;
          color: ${isDark ? '#6C854B' : '#335C67'};
        }

        /* NÚT ĐIỀU HƯỚNG HIỆN ĐẠI & THUẬN MẮT */
        .nav-tabs-container {
          display: flex;
          align-items: center;
          gap: 6px;
          background: ${isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(216, 90, 63, 0.06)'};
          padding: 5px;
          border-radius: 14px;
          border: 1px solid ${isDark ? 'rgba(241, 227, 200, 0.12)' : 'rgba(85, 158, 158, 0.2)'};
        }
        .nav-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 15px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid transparent;
          background: transparent;
          color: ${isDark ? '#DBCDB5' : '#123C46'};
          white-space: nowrap;
        }
        .nav-tab-btn:hover {
          color: ${isDark ? '#F1E3C8' : '#D85A3F'};
          background: ${isDark ? 'rgba(241, 227, 200, 0.08)' : 'rgba(216, 90, 63, 0.08)'};
        }
        .nav-tab-btn.active {
          background: ${isDark
            ? 'linear-gradient(135deg, rgba(241, 227, 200, 0.22) 0%, rgba(241, 227, 200, 0.12) 100%)'
            : 'linear-gradient(135deg, #D85A3F 0%, #BF482F 100%)'};
          color: ${isDark ? '#F1E3C8' : '#FFFFFF'};
          font-weight: 600;
          border-color: ${isDark ? 'rgba(241, 227, 200, 0.3)' : '#BF482F'};
          box-shadow: ${isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(216, 90, 63, 0.25)'};
        }
        .nav-tab-badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 700;
          background-color: ${isDark ? '#6C854B' : '#559E9E'};
          color: #FFF;
        }

        .nav-actions-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .nav-secondary-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 15px;
          border-radius: 11px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1.2px solid ${isDark ? 'rgba(241, 227, 200, 0.3)' : 'rgba(85, 158, 158, 0.45)'};
          background: ${isDark ? 'rgba(241, 227, 200, 0.06)' : 'rgba(255, 255, 255, 0.85)'};
          color: ${isDark ? '#F1E3C8' : '#123C46'};
        }
        .nav-secondary-btn:hover {
          border-color: ${isDark ? '#F1E3C8' : '#D85A3F'};
          background: ${isDark ? 'rgba(241, 227, 200, 0.15)' : '#FFFFFF'};
          color: ${isDark ? '#F1E3C8' : '#D85A3F'};
          transform: translateY(-1px);
        }

        /* NÚT ĐIỀU CHỈNH GIAO DIỆN SÁNG TỐI NỔI BẬT */
        .theme-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 16px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1.5px solid ${isDark ? '#E5C483' : '#D85A3F'};
          background: ${isDark ? 'rgba(229, 196, 131, 0.15)' : 'rgba(216, 90, 63, 0.1)'};
          color: ${isDark ? '#F1E3C8' : '#BF482F'};
          box-shadow: 0 2px 8px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(216,90,63,0.12)'};
        }
        .theme-toggle-btn:hover {
          background: ${isDark ? '#E5C483' : '#D85A3F'};
          color: ${isDark ? '#380B0B' : '#FFFFFF'};
          transform: translateY(-1px);
          box-shadow: 0 4px 12px ${isDark ? 'rgba(229,196,131,0.4)' : 'rgba(216,90,63,0.3)'};
        }

        .nav-primary-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          border: none;
          background: ${isDark
            ? 'linear-gradient(135deg, #7A9A55 0%, #5B723F 100%)'
            : 'linear-gradient(135deg, #E06349 0%, #C4442A 100%)'};
          color: #FFFFFF;
          box-shadow: ${isDark ? '0 4px 14px rgba(108, 133, 75, 0.4)' : '0 4px 14px rgba(216, 90, 63, 0.35)'};
        }
        .nav-primary-cta:hover:not(:disabled) {
          transform: translateY(-1.5px);
          filter: brightness(1.08);
          box-shadow: ${isDark ? '0 6px 18px rgba(108, 133, 75, 0.5)' : '0 6px 18px rgba(216, 90, 63, 0.45)'};
        }
        .nav-primary-cta:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* NÚT THƯỜNG / BUTTONS HỆ THỐNG */
        .st-btn {
          border-radius: 10px;
          transition: all 0.2s ease;
          padding: 8px 18px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          background-color: transparent;
          border: 1.5px solid ${isDark ? 'rgba(241, 227, 200, 0.4)' : 'rgba(216, 90, 63, 0.6)'};
          color: ${isDark ? '#F1E3C8' : '#D85A3F'};
        }
        .st-btn:hover:not(:disabled) {
          background-color: ${isDark ? '#F1E3C8' : '#D85A3F'};
          color: ${isDark ? '#781414' : '#FFFFFF'};
          border-color: ${isDark ? '#F1E3C8' : '#D85A3F'};
        }
        .st-btn.primary {
          background-color: ${isDark ? '#6C854B' : '#D85A3F'};
          border-color: ${isDark ? '#6C854B' : '#D85A3F'};
          color: #FFFFFF;
        }
        .st-btn.primary:hover:not(:disabled) {
          background-color: ${isDark ? '#5B723F' : '#BF482F'};
          border-color: ${isDark ? '#5B723F' : '#BF482F'};
          color: #FFFFFF;
        }
        .st-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .elodie-title {
          font-family: 'Elodie', sans-serif;
          letter-spacing: 1.5px;
          font-weight: normal;
          color: ${isDark ? '#F1E3C8' : '#D85A3F'};
        }
        .hero-line-1 {
          font-family: 'Elodie', sans-serif;
          font-size: 3.8rem;
          font-weight: normal;
          line-height: 1.15;
          margin-bottom: 6px;
          color: ${isDark ? '#6C854B' : '#D85A3F'};
        }
        .hero-line-2 {
          font-family: 'Elodie', sans-serif;
          font-size: 3.2rem;
          font-weight: normal;
          line-height: 1.15;
          margin-bottom: 24px;
          color: ${isDark ? '#F1E3C8' : '#123C46'};
        }
        .hero-desc {
          font-size: 1.15rem;
          margin-bottom: 30px;
          line-height: 1.65;
          color: ${isDark ? '#DBCDB5' : '#335C67'};
          max-width: 600px;
        }

        /* ================= CAROUSEL SET ĐỒ PHỐI SẴN (MANNEQUIN KHÔNG CÓ MẶT) ================= */
        .carousel-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          padding: 0 45px;
        }
        .slider-container {
          display: flex;
          overflow-x: auto;
          gap: 24px;
          padding: 12px 0 28px 0;
          scroll-behavior: smooth;
          scrollbar-width: none;
          width: 100%;
        }
        .slider-container::-webkit-scrollbar {
          display: none;
        }
        .preset-slider-item {
          flex: 0 0 320px;
          position: relative;
        }
        .preset-card {
          position: relative;
          width: 100%;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.22);
          background-color: ${isDark ? '#2B0808' : '#FFFFFF'};
          border: ${isDark ? '1.5px solid rgba(241, 227, 200, 0.2)' : '1.5px solid rgba(85, 158, 158, 0.35)'};
          display: flex;
          flex-direction: column;
          transition: all 0.25s ease;
        }
        .preset-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 32px rgba(0,0,0,0.3);
          border-color: ${isDark ? '#F1E3C8' : '#D85A3F'};
        }
        .preset-image-box {
          position: relative;
          height: 290px;
          background: ${isDark
            ? 'radial-gradient(circle at 50% 50%, rgba(108,133,75,0.15) 0%, rgba(20,4,4,0.7) 100%)'
            : 'radial-gradient(circle at 50% 50%, rgba(216,90,63,0.1) 0%, rgba(240,235,225,0.8) 100%)'};
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
        }
        .preset-tag-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background: ${isDark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.92)'};
          color: ${isDark ? '#F1E3C8' : '#D85A3F'};
          border: 1px solid ${isDark ? 'rgba(241,227,200,0.3)' : 'rgba(216,90,63,0.3)'};
          backdrop-filter: blur(6px);
          z-index: 10;
        }
        .preset-gender-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          background: ${isDark ? 'rgba(108,133,75,0.85)' : '#559E9E'};
          color: #FFF;
          z-index: 10;
        }
        .preset-body {
          padding: 16px 18px 20px 18px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .preset-title {
          font-family: 'Elodie', sans-serif;
          font-size: 1.35rem;
          margin: 0 0 4px 0;
          color: ${isDark ? '#F1E3C8' : '#123C46'};
        }
        .preset-subtitle {
          font-size: 12.5px;
          opacity: 0.8;
          margin-bottom: 12px;
          color: ${isDark ? '#DBCDB5' : '#335C67'};
        }
        .preset-items-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }
        .preset-item-pill {
          font-size: 11.5px;
          padding: 3px 8px;
          border-radius: 6px;
          background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
          border: 1px solid ${isDark ? 'rgba(241,227,200,0.12)' : 'rgba(0,0,0,0.08)'};
          color: ${isDark ? '#DBCDB5' : '#123C46'};
        }
        .preset-actions-row {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 8px;
          margin-top: auto;
        }

        .nav-arrow {
          position: absolute;
          top: 45%;
          transform: translateY(-50%);
          border-radius: 50%;
          width: 44px;
          height: 44px;
          font-size: 18px;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: ${isDark ? '#2E0909' : '#FFFFFF'};
          color: ${isDark ? '#F1E3C8' : '#123C46'};
          border: 1.5px solid ${isDark ? 'rgba(241, 227, 200, 0.4)' : '#559E9E'};
          box-shadow: 0 4px 14px rgba(0,0,0,0.2);
          transition: all 0.2s ease;
        }
        .nav-arrow:hover {
          transform: translateY(-50%) scale(1.08);
          background-color: ${isDark ? '#F1E3C8' : '#D85A3F'};
          color: ${isDark ? '#781414' : '#FFFFFF'};
          border-color: ${isDark ? '#F1E3C8' : '#D85A3F'};
        }
        .left-arrow { left: 0; }
        .right-arrow { right: 0; }

        /* MOCKUP REVIEW STYLING */
        .mockup-card-container {
          position: relative;
          border-radius: 20px;
          height: 530px;
          overflow: hidden;
          border: 1.5px solid ${isDark ? 'rgba(241, 227, 200, 0.2)' : 'rgba(85, 158, 158, 0.35)'};
          background: ${isDark ? 'radial-gradient(circle at 50% 40%, #3a0d0d 0%, #1c0404 100%)' : 'radial-gradient(circle at 50% 40%, #FFFFFF 0%, #EFE9DC 100%)'};
          box-shadow: inset 0 0 40px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.1);
        }
        .mockup-stage {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mockup-mannequin-frame {
          position: relative;
          width: 100%; /* Mở rộng toàn bộ khung */
          height: 480px;
          display: flex;
          justify-content: center;
        }
        .mannequin-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          transition: all 0.3s ease;
        }
        .mockup-grid-view {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 24px;
          height: 100%;
          overflow-y: auto;
        }
        .mockup-grid-cell {
          border-radius: 12px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)'};
          border: 1px solid ${isDark ? 'rgba(241,227,200,0.1)' : 'rgba(85,158,158,0.2)'};
        }
        .mockup-grid-cell img {
          width: 100%;
          height: 130px;
          object-fit: contain;
        }
        .mockup-grid-cell span {
          font-size: 12px;
          margin-top: 6px;
          font-weight: 600;
          text-align: center;
        }

        /* PRODUCT CARDS */
        .product-card {
          border-radius: 14px;
          padding: 12px;
          text-align: center;
          position: relative;
          height: 240px;
          transition: all 0.2s ease;
          border: 1.5px solid ${isDark ? 'rgba(241, 227, 200, 0.15)' : 'rgba(85, 158, 158, 0.25)'};
          background-color: ${isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF'};
          box-shadow: 0 4px 10px rgba(0,0,0,0.04);
        }
        .product-card:hover {
          border-color: ${isDark ? '#F1E3C8' : '#D85A3F'};
          transform: translateY(-2px);
        }
        .product-card.selected {
          border: 2px solid ${isDark ? '#F1E3C8' : '#D85A3F'};
          background-color: ${isDark ? 'rgba(241, 227, 200, 0.08)' : 'rgba(216, 90, 63, 0.06)'};
        }
        .product-card.selected::after {
          content: '✓';
          position: absolute;
          top: 8px;
          right: 10px;
          font-size: 16px;
          font-weight: bold;
          color: ${isDark ? '#F1E3C8' : '#D85A3F'};
        }
        .product-card img {
          width: 100%;
          height: 150px;
          object-fit: contain;
        }
        .product-name {
          margin-top: 10px;
          font-size: 13.5px;
          font-weight: 600;
          line-height: 1.35;
          color: ${isDark ? '#F1E3C8' : '#123C46'};
        }

        /* CHAT STYLING */
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 530px;
          border-radius: 18px;
          padding: 20px;
          border: 1.5px solid ${isDark ? 'rgba(241, 227, 200, 0.2)' : 'rgba(85, 158, 158, 0.35)'};
          background-color: ${isDark ? 'rgba(36, 6, 6, 0.65)' : '#FFFFFF'};
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        .chat-row {
          display: flex;
          width: 100%;
          margin-bottom: 14px;
        }
        .chat-row.user {
          justify-content: flex-end;
          padding-left: 15%;
        }
        .chat-row.bot {
          justify-content: flex-start;
          padding-right: 15%;
        }
        .chat-bubble {
          padding: 12px 18px;
          font-size: 14.5px;
          line-height: 1.55;
        }
        .chat-bubble.user {
          background-color: ${isDark ? '#6C854B' : '#123C46'};
          color: #FFFFFF;
          border-radius: 18px 18px 4px 18px;
        }
        .chat-bubble.bot {
          background-color: ${isDark ? 'rgba(241, 227, 200, 0.08)' : 'rgba(85, 158, 158, 0.12)'};
          border: 1px solid ${isDark ? 'rgba(241, 227, 200, 0.15)' : 'rgba(85, 158, 158, 0.25)'};
          color: ${isDark ? '#F1E3C8' : '#123C46'};
          border-radius: 18px 18px 18px 4px;
        }

        /* STEP TABS TRONG BỘ CHỌN ĐỒ */
        .step-tabs-bar {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 6px;
        }
        .step-tab-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1.2px solid ${isDark ? 'rgba(241,227,200,0.2)' : 'rgba(85,158,158,0.3)'};
          background: ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)'};
          color: ${isDark ? '#DBCDB5' : '#123C46'};
          white-space: nowrap;
        }
        .step-tab-chip:hover {
          border-color: ${isDark ? '#F1E3C8' : '#D85A3F'};
          color: ${isDark ? '#F1E3C8' : '#D85A3F'};
        }
        .step-tab-chip.active {
          background: ${isDark
            ? 'linear-gradient(135deg, rgba(241,227,200,0.22), rgba(241,227,200,0.1))'
            : 'linear-gradient(135deg, #D85A3F, #BF482F)'};
          color: ${isDark ? '#F1E3C8' : '#FFFFFF'};
          border-color: ${isDark ? '#F1E3C8' : '#BF482F'};
          box-shadow: 0 2px 8px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(216,90,63,0.25)'};
        }
        .step-selected-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: #4CAF50;
          display: inline-block;
        }

        .content-box {
          background-color: ${isDark ? 'rgba(46, 9, 9, 0.85)' : '#FFFFFF'};
          color: ${isDark ? '#F1E3C8' : '#123C46'};
          border: 1.5px solid ${isDark ? 'rgba(241, 227, 200, 0.25)' : 'rgba(85, 158, 158, 0.35)'};
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 24px;
        }
      `}</style>

      <div className="content-wrapper">
        {/* ================= THANH ĐIỀU HƯỚNG PHÍA TRÊN CÙNG (HOA VĂN TRỐNG ĐỒNG NẰM GỌN TRONG NAVBAR) ================= */}
        <header className="main-navbar-header">
          {/* Hoa văn chìm trống đồng nằm gọn trong thanh điều hướng phía trên cùng */}
          <div className="navbar-trongdong-bg" />

          <div className="navbar-inner-content">
            {/* Logo Thương Hiệu */}
            <div className="nav-brand-container" onClick={() => setPage('home')}>
              <div className="brand-emblem">
                <TamTauLogo size={28} isDark={isDark} />
              </div>
              <div className="brand-text-group">
                <span className="brand-title">Tam Tấu</span>
                <span className="brand-subtitle">Việt Phục Remix</span>
              </div>
            </div>

            {/* Các Nút Điều Hướng Trung Tâm */}
            <nav className="nav-tabs-container">
              <button
                className={`nav-tab-btn ${page === 'home' ? 'active' : ''}`}
                onClick={() => setPage('home')}
              >
                <span>🏛️</span>
                <span>Trang chủ</span>
              </button>
              <button
                className={`nav-tab-btn ${page === 'chatbot' ? 'active' : ''}`}
                onClick={() => setPage('chatbot')}
              >
                <span>✨</span>
                <span>Stylist AI &amp; Phối đồ</span>
              </button>
              <button
                className={`nav-tab-btn ${page === 'result' ? 'active' : ''}`}
                onClick={() => setPage('result')}
              >
                <span>📜</span>
                <span>Bảng OOTD</span>
                {hasAnySelectedItem && <span className="nav-tab-badge">Đã phối</span>}
              </button>
              <button
                className={`nav-tab-btn ${page === 'about' ? 'active' : ''}`}
                onClick={() => setPage('about')}
              >
                <span>📖</span>
                <span>Thông tin dự án</span>
              </button>
            </nav>

            {/* Cụm Nút Tác Vụ Bên Phải */}
            <div className="nav-actions-container">

              {/* NÚT ĐIỀU CHỈNH GIAO DIỆN SÁNG TỐI */}
              <button
                className="theme-toggle-btn"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                title={isDark ? 'Bấm để đổi sang Giao diện Sáng' : 'Bấm để đổi sang Giao diện Tối'}
              >
                <span style={{ fontSize: '16px' }}>{isDark ? '🌙' : '☀️'}</span>
                <span>{isDark ? 'Chế độ Tối' : 'Chế độ Sáng'}</span>
              </button>

              {/* Nút Kêu Gọi Hành Động Chính */}
              {page === 'home' ? (
                null
              ) : page === 'chatbot' ? (
                <button
                  className="nav-primary-cta"
                  disabled={chuaChonTrangPhuc}
                  onClick={() => setPage('result')}
                  title={chuaChonTrangPhuc ? 'Hãy chọn áo hoặc Việt phục trước khi xuất kết quả' : 'Xuất poster OOTD'}
                >
                  <span>Xuất kết quả</span>
                  <span>✦</span>
                </button>
              ) : (
                <button className="nav-primary-cta" onClick={() => setPage('chatbot')}>
                  <span>Chỉnh sửa tiếp</span>
                  <span>↺</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ================= HOME PAGE ================= */}
        {page === 'home' && (
          <div style={{ marginTop: '2.5rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 0.9fr',
              gap: '3.5rem',
              alignItems: 'center',
              marginBottom: '4.5rem'
            }}>
              <div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  marginBottom: '1rem',
                  color: isDark ? '#6C854B' : '#559E9E'
                }}>
                  DI SẢN TRUYỀN THỐNG · PHONG CÁCH ĐƯƠNG ĐẠI
                </div>
                <div className="hero-line-1">Việt Phục Remix</div>
                <div className="hero-line-2">Sáng tạo set đồ độc bản</div>
                <p className="hero-desc">
                  Khám phá vẻ đẹp cổ phục triều Nguyễn, thời Lê - Trần qua lăng kính thời trang đương đại. Tự do phối Áo Tấc, Nhật Bình, Áo Dài cùng sneaker, mũ bucket, khăn quàng hay phụ kiện hiện đại với sự đồng hành của Stylist AI.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button className="nav-primary-cta" style={{ padding: '12px 28px', fontSize: '16px' }} onClick={() => setPage('chatbot')}>
                    <span>Bắt đầu tự phối đồ</span>
                    <span>✨</span>
                  </button>
                </div>
              </div>

              {/* Mannequin Nữ Mặc Áo Nhật Bình Minh Họa Hero */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  position: 'relative',
                  width: '380px',
                  height: '480px',
                  borderRadius: '24px',
                  padding: '16px',
                  background: isDark
                    ? 'radial-gradient(circle at 50% 50%, rgba(108,133,75,0.2) 0%, rgba(36,6,6,0.8) 100%)'
                    : 'radial-gradient(circle at 50% 50%, rgba(216,90,63,0.12) 0%, rgba(255,255,255,0.85) 100%)',
                  border: `1.5px solid ${isDark ? 'rgba(241, 227, 200, 0.2)' : 'rgba(85, 158, 158, 0.35)'}`,
                  boxShadow: '0 16px 36px rgba(0,0,0,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Mannequin không có mặt mặc đồ */}
                  <PresetMannequinPreview preset={PRESET_OUTFITS[0]} isDark={isDark} size="large" />

                  <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '20px',
                    right: '20px',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    backgroundColor: isDark ? 'rgba(20, 4, 4, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${isDark ? 'rgba(241, 227, 200, 0.15)' : 'rgba(85, 158, 158, 0.25)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 10
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Áo Nhật Bình · Cung Đình Triều Nguyễn</span>
                    <span style={{ fontSize: '12px', color: isDark ? '#6C854B' : '#D85A3F', fontWeight: 700 }}>Mannequin Nữ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= KHÁM PHÁ CÁC SET ĐỒ PHỐI SẴN (MINH HỌA MANNEQUIN MẶC ĐỒ) ================= */}
            <div style={{ marginBottom: '4.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{
                    fontSize: '12.5px',
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    color: isDark ? '#6C854B' : '#559E9E',
                    marginBottom: '4px'
                  }}>
                    BỘ SƯU TẬP GỢI Ý TỪ STYLIST
                  </div>
                  <h3 className="elodie-title" style={{ fontSize: '2.4rem', margin: 0 }}>
                    Khám phá các set đồ phối sẵn
                  </h3>
                  <p style={{ margin: '6px 0 0 0', opacity: 0.8, fontSize: '14.5px' }}>
                    Minh họa trực quan trên mannequin không có mặt, giữ nguyên 100% chi tiết hoa văn và màu sắc trang phục thực tế.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="st-btn"
                    onClick={() => {
                      if (sliderRef.current) sliderRef.current.scrollLeft -= 340;
                    }}
                    style={{ padding: '8px 14px' }}
                  >
                    ❮
                  </button>
                  <button
                    className="st-btn"
                    onClick={() => {
                      if (sliderRef.current) sliderRef.current.scrollLeft += 340;
                    }}
                    style={{ padding: '8px 14px' }}
                  >
                    ❯
                  </button>
                </div>
              </div>

              <div className="carousel-wrapper">
                <button
                  className="nav-arrow left-arrow"
                  onClick={() => {
                    if (sliderRef.current) sliderRef.current.scrollLeft -= 340;
                  }}
                  aria-label="Previous"
                >
                  ❮
                </button>

                <div className="slider-container" ref={sliderRef}>
                  {PRESET_OUTFITS.map(preset => (
                    <div className="preset-slider-item" key={preset.id}>
                      <div className="preset-card">
                        {/* HÌNH NỀN MINH HỌA MANNEQUIN MẶC ĐỒ (KHÔNG CÓ MẶT) */}
                        <div className="preset-image-box">
                          <span className="preset-tag-badge">{preset.tag}</span>
                          <span className="preset-gender-badge">{preset.gender}</span>
                          <PresetMannequinPreview preset={preset} isDark={isDark} />
                        </div>

                        <div className="preset-body">
                          <h4 className="preset-title">{preset.name}</h4>
                          <div className="preset-subtitle">{preset.subtitle}</div>

                          <div className="preset-items-pills">
                            {preset.itemSummary.slice(0, 4).map((m, idx) => (
                              <span key={idx} className="preset-item-pill">• {m}</span>
                            ))}
                            {preset.itemSummary.length > 4 && (
                              <span className="preset-item-pill">+{preset.itemSummary.length - 4} phụ kiện</span>
                            )}
                          </div>

                          <div className="preset-actions-row">
                            <button
                              className="st-btn primary"
                              onClick={() => applyPresetOutfit(preset)}
                              style={{ padding: '8px 12px', fontSize: '13px' }}
                              title="Tải toàn bộ set đồ này vào phòng thử"
                            >
                              Thử set này ⚡
                            </button>
                            <button
                              className="st-btn"
                              onClick={() => setSelectedPresetDetail(preset)}
                              style={{ padding: '8px 10px', fontSize: '13px' }}
                            >
                              Chi tiết 🔍
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="nav-arrow right-arrow"
                  onClick={() => {
                    if (sliderRef.current) {
                      const s = sliderRef.current;
                      if (s.scrollLeft + s.clientWidth >= s.scrollWidth - 10) s.scrollLeft = 0;
                      else s.scrollLeft += 340;
                    }
                  }}
                  aria-label="Next"
                >
                  ❯
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TRANG THÔNG TIN CƠ BẢN VỀ DỰ ÁN (ABOUT PAGE) ================= */}
        {page === 'about' && (
          <div style={{ marginTop: '2.5rem', maxWidth: '1080px', margin: '2.5rem auto 4rem auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                marginBottom: '16px',
                background: isDark ? 'rgba(241, 227, 200, 0.08)' : 'rgba(158, 42, 43, 0.06)',
                border: `1.5px solid ${isDark ? 'rgba(241, 227, 200, 0.3)' : 'rgba(158, 42, 43, 0.25)'}`,
                boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 4px 16px rgba(158, 42, 43, 0.12)'
              }}>
                <TamTauLogo size={42} isDark={isDark} />
              </div>
              <div style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: isDark ? '#6C854B' : '#559E9E',
                marginBottom: '8px'
              }}>
                HỒ SƠ DỰ ÁN VĂN HÓA &amp; THỜI TRANG ĐƯƠNG ĐẠI
              </div>
              <h1 className="elodie-title" style={{ fontSize: '3.4rem', margin: '0 0 16px 0' }}>
                Tam Tấu · Việt Phục Remix
              </h1>
              <p style={{ maxWidth: '760px', margin: '0 auto', fontSize: '16.5px', lineHeight: 1.65, opacity: 0.9 }}>
                Dự án kết nối di sản trang phục cổ truyền Việt Nam qua lăng kính thời trang thế kỷ 21, mang lại trải nghiệm phối đồ trực quan, đúng chuẩn quy tắc văn hóa cùng sự đồng hành của Stylist AI.
              </p>
            </div>

            {/* Khái Niệm "Tam Tấu" */}
            <div className="content-box">
              <h3 className="elodie-title" style={{ fontSize: '2rem', marginTop: 0, marginBottom: '16px' }}>
                1. Triết Lý Sáng Tạo: Khái Niệm "Tam Tấu"
              </h3>
              <p style={{ lineHeight: 1.7, fontSize: '15px', marginBottom: '20px' }}>
                <b>Tam Tấu</b> là sự hòa âm của 3 yếu tố cốt lõi: <b>Cổ Phục (Di sản)</b> - <b>Đương Đại (Remix)</b> - <b>Công Nghệ (AI &amp; Số hóa)</b>:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  borderRadius: '14px',
                  backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${isDark ? 'rgba(241,227,200,0.15)' : 'rgba(85,158,158,0.2)'}`
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>👘</div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: isDark ? '#6C854B' : '#D85A3F' }}>
                    Tôn Trọng Nguyên Bản Cổ Phục
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, opacity: 0.85 }}>
                    Mỗi phom dáng (Nhật Bình, Áo Tấc, Giao Lĩnh, Ngũ Thân...) đều giữ trọn tỷ lệ may đo, nẹp cổ, hàng cúc và vạt áo chuẩn mực của từng triều đại, không lai tạp biến dạng.
                  </p>
                </div>

                <div style={{
                  padding: '20px',
                  borderRadius: '14px',
                  backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${isDark ? 'rgba(241,227,200,0.15)' : 'rgba(85,158,158,0.2)'}`
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>👟</div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: isDark ? '#6C854B' : '#D85A3F' }}>
                    Hơi Thở Thời Trang Gen Z
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, opacity: 0.85 }}>
                    Cổ phục không phải đồ trưng bày trong tủ kính. Khi phối cùng sneaker, chân váy dập ly, túi kẹp nách hay chelsea boots, Việt phục bước vào cuộc sống thường nhật tự tin và sống động.
                  </p>
                </div>

                <div style={{
                  padding: '20px',
                  borderRadius: '14px',
                  backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${isDark ? 'rgba(241,227,200,0.15)' : 'rgba(85,158,158,0.2)'}`
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🤖</div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: isDark ? '#6C854B' : '#D85A3F' }}>
                    Stylist AI &amp; Chuẩn Mực Văn Hóa
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, opacity: 0.85 }}>
                    AI đóng vai trò như một người bạn am hiểu cổ phục: gợi ý phối màu ngũ hành, cảnh báo ngay khi người dùng vô tình ghép món đồ sai lệch thứ bậc cung đình (tránh râu ông nọ cắm cằm bà kia).
                  </p>
                </div>
              </div>
            </div>

            {/* Cam Kết Không Dùng AI Bóp Méo Chi Tiết */}
            <div className="content-box">
              <h3 className="elodie-title" style={{ fontSize: '2rem', marginTop: 0, marginBottom: '16px' }}>
                2. Cam Kết Bảo Tồn Chi Tiết Thực Tế (Không Dùng AI Ảo Hóa)
              </h3>
              <p style={{ lineHeight: 1.7, fontSize: '15px' }}>
                Rất nhiều ứng dụng hiện nay sử dụng Generative AI để tạo ảnh người mặc đồ, vô tình làm biến dạng hoa văn rồng phượng, sai lệch cấu trúc cổ áo chữ nhật của Nhật Bình hoặc nẹp áo Ngũ Thân.
              </p>
              <div style={{
                padding: '16px 20px',
                borderRadius: '12px',
                backgroundColor: isDark ? 'rgba(108,133,75,0.18)' : 'rgba(85,158,158,0.15)',
                borderLeft: `4px solid ${isDark ? '#6C854B' : '#559E9E'}`,
                lineHeight: 1.65,
                fontSize: '14.5px'
              }}>
                <b>✨ Nguyên tắc của Việt Phục Remix:</b> Toàn bộ trang phục và phụ kiện trên ứng dụng đều được số hóa từ các bộ phục dựng cổ phục thật, giữ nguyên đường kim mũi chỉ, chất liệu lụa, gấm, sa, đũi. Cốt mannequin hiển thị là loại <b>mannequin thời trang không có mặt</b>, tự động thay đổi phom dáng Nam / Nữ để tôn vinh bộ trang phục mà không bị xao lãng bởi nét mặt ảo.
              </div>
            </div>

            {/* Các Dòng Cổ Phục Nổi Bật Trong Ứng Dụng */}
            <div className="content-box">
              <h3 className="elodie-title" style={{ fontSize: '2rem', marginTop: 0, marginBottom: '18px' }}>
                3. Các Dòng Cổ Phục Tiêu Biểu Trong Dự Án
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${isDark ? 'rgba(241,227,200,0.15)' : 'rgba(85,158,158,0.2)'}` }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: isDark ? '#F1E3C8' : '#123C46' }}>
                    Áo Nhật Bình (Triều Nguyễn)
                  </h4>
                  <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, opacity: 0.85 }}>
                    Áo thường triều của Hoàng hậu, Công chúa và mệnh phụ quý tộc. Đặc trưng với cổ áo hình chữ nhật viền hoa văn tinh xảo và dải ngũ sắc ngũ hành tượng trưng cho trời đất.
                  </p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${isDark ? 'rgba(241,227,200,0.15)' : 'rgba(85,158,158,0.2)'}` }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: isDark ? '#F1E3C8' : '#123C46' }}>
                    Áo Tấc (Áo Thụng Ngũ Thân)
                  </h4>
                  <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, opacity: 0.85 }}>
                    Lễ phục trang trọng bậc nhất thời Nguyễn cho cả nam và nữ trong dịp hôn lễ, cúng tế, đại lễ. Ống tay thụng rộng dài uy nghiêm, phong thái đường bàng trang nhã.
                  </p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${isDark ? 'rgba(241,227,200,0.15)' : 'rgba(85,158,158,0.2)'}` }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: isDark ? '#F1E3C8' : '#123C46' }}>
                    Áo Ngũ Thân Tay Chẽn
                  </h4>
                  <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, opacity: 0.85 }}>
                    Tiền thân trực tiếp của Áo Dài hiện đại. Với ống tay bó gọn gàng và 5 thân áo che chở cho đạo làm người (Tứ thân phụ mẫu + thân con), đây là y phục thường nhật nho nhã, tôn dáng.
                  </p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${isDark ? 'rgba(241,227,200,0.15)' : 'rgba(85,158,158,0.2)'}` }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: isDark ? '#F1E3C8' : '#123C46' }}>
                    Áo Dài Lemur Tân Thời (1930s)
                  </h4>
                  <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, opacity: 0.85 }}>
                    Dấu mốc cách tân thời trang rực rỡ của nhóm Tự Lực Văn Đoàn và họa sĩ Cát Tường. Chiết eo tôn dáng, tay bồng thanh nhã, biểu tượng của người con gái Hà Thành đài các.
                  </p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${isDark ? 'rgba(241,227,200,0.15)' : 'rgba(85,158,158,0.2)'}` }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: isDark ? '#F1E3C8' : '#123C46' }}>
                    Áo Giao Lĩnh (Thời Lê Sơ)
                  </h4>
                  <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, opacity: 0.85 }}>
                    Dạng áo cổ giao chéo thanh thoát thời Hậu Lê. Vạt trái đè lên vạt phải buông dài thướt tha, mang tinh thần thanh cao của nho sĩ và các bậc quý tộc thời xưa.
                  </p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${isDark ? 'rgba(241,227,200,0.15)' : 'rgba(85,158,158,0.2)'}` }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: isDark ? '#F1E3C8' : '#123C46' }}>
                    Áo Tứ Thân &amp; Áo Bà Ba
                  </h4>
                  <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, opacity: 0.85 }}>
                    Đại diện cho vẻ đẹp bình dân hai đầu đất nước: Nét duyên thầm Kinh Bắc với nón thúng quai thao ngày hội Lim, và nét phóng khoáng sông nước Nam Bộ với chiếc khăn rằn quấn cổ.
                  </p>
                </div>
              </div>
            </div>

            {/* Hướng Dẫn Sử Dụng & Trải Nghiệm */}
            <div className="content-box">
              <h3 className="elodie-title" style={{ fontSize: '2rem', marginTop: 0, marginBottom: '16px' }}>
                4. Hướng Dẫn Trải Nghiệm
              </h3>
              <ol style={{ paddingLeft: '20px', lineHeight: 1.8, fontSize: '15px', margin: 0 }}>
                <li><b>Trang chủ:</b> Xem các bộ sưu tập giới thiệu và cuộn qua 8 set phối sẵn trên cốt mannequin thời trang.</li>
                <li><b>Thử set phối sẵn:</b> Bấm nút "Thử set này ⚡" để tự động đưa toàn bộ các món vào mannequin thử đồ.</li>
                <li><b>Tự phối theo ý thích:</b> Chọn giới tính Nam / Nữ để mannequin tự điều chỉnh phom dáng; sau đó duyệt qua từng tab Áo, Váy/Quần, Nón, Túi, Giày, Phụ kiện.</li>
                <li><b>Chat với Stylist AI:</b> Trò chuyện, hỏi ý kiến phối màu hoặc kiểm tra xem set đồ có vi phạm quy chuẩn văn hóa hay không.</li>
                <li><b>Xuất poster OOTD:</b> Tải ảnh poster tỷ lệ 4:5 chất lượng cao để chia sẻ lên mạng xã hội hoặc lưu trữ kỷ niệm.</li>
              </ol>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="nav-primary-cta" style={{ padding: '12px 28px', fontSize: '15.5px' }} onClick={() => setPage('chatbot')}>
                  Bắt đầu phối đồ ngay →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL CHI TIẾT SET PHỐI SẴN (MINH HỌA MANNEQUIN) ================= */}
        {selectedPresetDetail && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.78)',
              backdropFilter: 'blur(6px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setSelectedPresetDetail(null)}
          >
            <div
              style={{
                backgroundColor: isDark ? '#2B0808' : '#FFFFFF',
                color: isDark ? '#F1E3C8' : '#123C46',
                border: `1.5px solid ${isDark ? 'rgba(241, 227, 200, 0.3)' : 'rgba(85, 158, 158, 0.4)'}`,
                borderRadius: '20px',
                maxWidth: '780px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '32px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.5)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span className="preset-tag-badge" style={{ position: 'static' }}>{selectedPresetDetail.tag}</span>
                    <span className="preset-gender-badge" style={{ position: 'static' }}>{selectedPresetDetail.gender}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.8, padding: '4px 8px', borderRadius: '12px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}>
                      Màu chủ đạo: {selectedPresetDetail.colorName}
                    </span>
                  </div>
                  <h2 className="elodie-title" style={{ fontSize: '2.4rem', margin: 0 }}>
                    {selectedPresetDetail.name}
                  </h2>
                  <div style={{ fontSize: '14.5px', opacity: 0.85, marginTop: '4px' }}>
                    {selectedPresetDetail.subtitle}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPresetDetail(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: isDark ? '#F1E3C8' : '#123C46',
                    padding: '4px'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* KHU VỰC MANNEQUIN KHÔNG CÓ MẶT MẶC TOÀN BỘ SET ĐỒ TRONG MODAL */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '260px 1fr',
                gap: '24px',
                alignItems: 'center',
                margin: '1.5rem 0',
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)'
              }}>
                <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PresetMannequinPreview preset={selectedPresetDetail} isDark={isDark} size="normal" />
                </div>

                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: isDark ? '#6C854B' : '#D85A3F' }}>
                    Các món phụ kiện &amp; trang phục mặc trên mannequin:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8, fontSize: '14px' }}>
                    {selectedPresetDetail.itemSummary.map((it, idx) => (
                      <li key={idx}><b>{it}</b></li>
                    ))}
                  </ul>
                  <div style={{ marginTop: '12px', fontSize: '12px', opacity: 0.75, fontStyle: 'italic' }}>
                    * Mannequin tự động tùy biến theo dáng {selectedPresetDetail.gender}, bảo tồn 100% chi tiết thật.
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.2rem', lineHeight: 1.65 }}>
                <strong style={{ color: isDark ? '#6C854B' : '#D85A3F' }}>Ý tưởng thiết kế:</strong>
                <p style={{ margin: '4px 0 0 0' }}>{selectedPresetDetail.description}</p>
              </div>

              <div style={{ marginBottom: '1.8rem', lineHeight: 1.65 }}>
                <strong style={{ color: isDark ? '#6C854B' : '#D85A3F' }}>Lời khuyên phối đồ từ Stylist:</strong>
                <p style={{ margin: '4px 0 0 0' }}>{selectedPresetDetail.styleAdvice}</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="st-btn" onClick={() => setSelectedPresetDetail(null)}>
                  Đóng
                </button>
                <button className="st-btn primary" onClick={() => applyPresetOutfit(selectedPresetDetail)}>
                  Áp dụng set này vào phòng thử đồ ⚡
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL DANH SÁCH 8 SET PHỐI SẴN ================= */}
        {showPresetsModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(6px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px'
            }}
            onClick={() => setShowPresetsModal(false)}
          >
            <div
              style={{
                backgroundColor: isDark ? '#270707' : '#FFFFFF',
                color: isDark ? '#F1E3C8' : '#123C46',
                border: `1.5px solid ${isDark ? 'rgba(241, 227, 200, 0.3)' : 'rgba(85, 158, 158, 0.4)'}`,
                borderRadius: '22px',
                maxWidth: '1000px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '32px',
                boxShadow: '0 24px 50px rgba(0,0,0,0.5)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 className="elodie-title" style={{ fontSize: '2.2rem', margin: 0 }}>
                    Chọn Set Đồ Phối Sẵn
                  </h2>
                  <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '14.5px' }}>
                    Chọn một bộ yêu thích để Stylist AI tự động mặc thử toàn bộ trang phục và phụ kiện vào mannequin.
                  </p>
                </div>
                <button
                  onClick={() => setShowPresetsModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: isDark ? '#F1E3C8' : '#123C46'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: '20px'
              }}>
                {PRESET_OUTFITS.map(p => (
                  <div
                    key={p.id}
                    style={{
                      border: `1.5px solid ${isDark ? 'rgba(241,227,200,0.18)' : 'rgba(85,158,158,0.3)'}`,
                      borderRadius: '16px',
                      padding: '16px',
                      backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.8 }}>{p.tag}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: isDark ? '#6C854B' : '#D85A3F' }}>{p.gender}</span>
                      </div>
                      <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                        <PresetMannequinPreview preset={p} isDark={isDark} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{p.name}</div>
                      <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '10px' }}>{p.subtitle}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button
                        className="st-btn primary"
                        style={{ flex: 1, padding: '7px 10px', fontSize: '12.5px' }}
                        onClick={() => applyPresetOutfit(p)}
                      >
                        Thử ngay ⚡
                      </button>
                      <button
                        className="st-btn"
                        style={{ padding: '7px 10px', fontSize: '12.5px' }}
                        onClick={() => setSelectedPresetDetail(p)}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= CHATBOT & CUSTOMIZER DRESSING ROOM ================= */}
        {page === 'chatbot' && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.15fr 1fr',
              gap: '2.5rem',
              alignItems: 'start'
            }}>
              {/* CỘT TRÁI: KHU VỰC THỬ ĐỒ & ĐÁNH GIÁ ĐIỂM */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 className="elodie-title" style={{ fontSize: '1.6rem', margin: 0 }}>
                      Phòng Thử Đồ Mannequin
                    </h3>
                    {/* Đã xóa badge Cốt Mannequin ở đây */}
                  </div>

                  {/* Nút Chuyển Chế Độ & Chọn Set Phối Sẵn Nhanh */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="st-btn"
                      onClick={() => setShowPresetsModal(true)}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      title="Nạp một trong 8 set phối sẵn"
                    >
                      <span>👘 Mẫu phối sẵn</span>
                    </button>
                    <button
                      className="st-btn"
                      onClick={() => setPreviewMode(previewMode === 'mannequin' ? 'grid' : 'mannequin')}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      {/* Đổi 'Xem Mannequin' thành 'Xem đồ đang thử', giữ nguyên 'Xem lưới món' */}
                      {previewMode === 'mannequin' ? '▦ Xem lưới món' : '👤 Xem đồ đang thử'}
                    </button>
                    <button
                      className="st-btn"
                      onClick={() => {
                        setSelectedItems({
                          'Trang phục': null,
                          'Áo': null,
                          'Váy/Quần': null,
                          'Nón': null,
                          'Túi xách': null,
                          'Phụ kiện': [],
                          'Giày': null
                        });
                      }}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      title="Đặt lại các món đồ đã chọn"
                    >
                      ↺ Đặt lại
                    </button>
                  </div>
                </div>

                {/* SÂN KHẤU MANNEQUIN TÙY BIẾN THEO GIỚI TÍNH (KHÔNG CÓ MẶT) */}
                <div className="mockup-card-container">
                  {chuaChonTrangPhuc ? (
                    <div style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      textAlign: 'center',
                      padding: '20px'
                    }}>
                      {/* Đã xóa component <FacelessMannequinBody /> ở đây */}
                      <div style={{
                        position: 'relative',
                        zIndex: 2,
                        backgroundColor: isDark ? 'rgba(20,4,4,0.85)' : 'rgba(255,255,255,0.9)',
                        padding: '16px 24px',
                        borderRadius: '16px',
                        border: `1px solid ${isDark ? 'rgba(241,227,200,0.2)' : 'rgba(85,158,158,0.3)'}`
                      }}>
                        <div style={{ fontSize: '32px', marginBottom: '6px' }}>✨</div>
                        <b>Hãy tự do sáng tạo set đồ của riêng bạn</b>
                      </div>
                    </div>
                  ) : previewMode === 'mannequin' ? (
                    <div className="mockup-stage">
                      <div className="mockup-mannequin-frame">

                        {/* NHÓM BÊN TRÁI: Thu nhỏ một chút để không mất mép áo */}
                        {selectedItems['Áo'] && (
                          <img src={getDynamicImagePath(selectedItems['Áo'], userGender, userColor)} alt={selectedItems['Áo'].name} className="mannequin-layer" style={{ zIndex: 2, transform: 'translate(-15%, 0%) scale(0.75)' }} />
                        )}
                        {selectedItems['Trang phục'] && (
                          <img src={getDynamicImagePath(selectedItems['Trang phục'], userGender, userColor)} alt={selectedItems['Trang phục'].name} className="mannequin-layer" style={{ zIndex: 3, transform: 'translate(-15%, 0%) scale(0.75)' }} />
                        )}

                        {/* NHÓM BÊN PHẢI: Kéo dần vào trung tâm để hiện trọn vẹn */}
                        {selectedItems['Váy/Quần'] && (
                          <img src={getDynamicImagePath(selectedItems['Váy/Quần'], userGender, userColor)} alt={selectedItems['Váy/Quần'].name} className="mannequin-layer" style={{ zIndex: 1, transform: 'translate(15%, 10%) scale(0.6)' }} />
                        )}
                        {mainAccs.map(acc => {
                          const n = acc.name.toLowerCase();
                          if (n.includes('thắt lưng') || n.includes('đai')) {
                            return <img key={acc.id} src={getDynamicImagePath(acc, userGender, userColor)} alt={acc.name} className="mannequin-layer" style={{ zIndex: 4, transform: 'translate(20%, -2%) scale(0.5)' }} />;
                          }
                          return null;
                        })}
                        {selectedItems['Giày'] && (
                          <img src={getDynamicImagePath(selectedItems['Giày'], userGender, userColor)} alt={selectedItems['Giày'].name} className="mannequin-layer" style={{ transform: 'translate(18%, 32%) scale(0.48)', zIndex: 5 }} />
                        )}
                        {selectedItems['Nón'] && (
                          <img src={getDynamicImagePath(selectedItems['Nón'], userGender, userColor)} alt={selectedItems['Nón'].name} className="mannequin-layer" style={{ transform: 'translate(20%, -25%) scale(0.5)', zIndex: 6 }} />
                        )}
                        {mainAccs.map(acc => {
                          const n = acc.name.toLowerCase();
                          if (n.includes('khăn') || n.includes('trâm') || n.includes('mũ phượng')) {
                            return <img key={acc.id} src={getDynamicImagePath(acc, userGender, userColor)} alt={acc.name} className="mannequin-layer" style={{ transform: 'translate(20%, -15%) scale(0.5)', zIndex: 6 }} />;
                          }
                          return null;
                        })}
                        {selectedItems['Túi xách'] && (
                          <img src={getDynamicImagePath(selectedItems['Túi xách'], userGender, userColor)} alt={selectedItems['Túi xách'].name} className="mannequin-layer" style={{ transform: 'translate(25%, 8%) scale(0.5)', zIndex: 7 }} />
                        )}
                      </div>

                      {/* Phụ Kiện Nhỏ Điểm Xuyết (Kính, Khuyên tai, Nhẫn, Đồng hồ) */}
                      {floatingAccs.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '18px',
                          right: '18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          zIndex: 15
                        }}>
                          {floatingAccs.map(acc => (
                            <div
                              key={acc.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 12px',
                                borderRadius: '12px',
                                backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.92)',
                                border: `1px solid ${isDark ? 'rgba(241,227,200,0.2)' : 'rgba(85,158,158,0.3)'}`,
                                boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                              }}
                            >
                              <img
                                src={getDynamicImagePath(acc, userGender, userColor)}
                                alt={acc.name}
                                style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                              />
                              <span style={{ fontSize: '12px', fontWeight: 600 }}>{acc.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Chế độ xem dạng lưới các món đang chọn */
                    <div className="mockup-grid-view">
                      {Object.entries(selectedItems).map(([category, value]) => {
                        if (!value) return null;
                        const items = Array.isArray(value) ? value : [value];
                        return items.map((item: CatalogItem) => (
                          <div key={item.id} className="mockup-grid-cell">
                            <img src={getDynamicImagePath(item, userGender, userColor)} alt={item.name} />
                            <span>{item.name}</span>
                            <span style={{ fontSize: '10px', opacity: 0.6 }}>{category}</span>
                          </div>
                        ));
                      })}
                    </div>
                  )}
                </div>

                {/* BẢNG ĐIỂM & PHÂN TÍCH HÒA SẮC CỦA STYLIST */}
                <div style={{
                  marginTop: '1.5rem',
                  padding: '20px',
                  borderRadius: '16px',
                  border: `1.5px solid ${isDark ? 'rgba(241, 227, 200, 0.15)' : 'rgba(85, 158, 158, 0.25)'}`,
                  backgroundColor: isDark ? 'rgba(36, 6, 6, 0.55)' : '#FFFFFF',
                  display: 'grid',
                  gridTemplateColumns: '2.5fr 4.5fr',
                  gap: '24px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.7 }}>
                      Điểm hài hòa Stylist
                    </div>
                    <div style={{ fontSize: '38px', fontWeight: 800, margin: '2px 0 10px 0', fontFamily: 'sans-serif' }}>
                      {scoreData.diem}<span style={{ fontSize: '20px', fontWeight: 400, opacity: 0.7 }}>/10</span>
                    </div>

                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '12px'
                    }}>
                      <div
                        style={{
                          width: `${(scoreData.diem / 10) * 100}%`,
                          height: '100%',
                          backgroundColor: scoreData.diem === 10 ? '#4CAF50' : (scoreData.diem >= 7 ? '#6C854B' : '#D85A3F'),
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>

                    {scoreData.diem === 10 ? (
                      <div style={{ color: '#81C784', fontSize: '13px', fontWeight: 600 }}>
                        ✓ Set đồ hoàn chỉnh và tinh tế!
                      </div>
                    ) : (
                      <div style={{ fontSize: '12.5px', color: isDark ? '#E57373' : '#D32F2F', lineHeight: 1.5 }}>
                        {scoreData.thieuSot.map((loi, i) => (
                          <div key={i}>• {loi}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                      Phân tích set đồ:
                    </div>
                    {scoreData.nhanXet.map((nx, i) => (
                      <div key={i} style={{ fontSize: '13px', marginBottom: '4px', opacity: 0.9 }}>
                        • {nx}
                      </div>
                    ))}

                    {scoreData.goiYAi.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {scoreData.goiYAi.map((gy, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: '12.5px',
                              lineHeight: 1.45,
                              padding: '8px 12px',
                              borderRadius: '8px',
                              backgroundColor: isDark ? 'rgba(108, 133, 75, 0.2)' : 'rgba(216, 90, 63, 0.1)',
                              color: isDark ? '#C8E6C9' : '#BF482F',
                              fontWeight: 500,
                              marginBottom: '6px'
                            }}
                          >
                            {gy}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: CHATBOT STYLIST AI */}
              <div className="chat-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>✨</span>
                    <span className="elodie-title" style={{ fontSize: '22px', margin: 0 }}>
                      Stylist AI Tư Vấn
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', opacity: 0.7 }}>Trực tuyến · Tư vấn chuẩn mực</span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px', marginBottom: '14px' }}>
                  {messages.map((msg, idx) => {
                    const roleClass = msg.role === 'user' ? 'user' : 'bot';
                    return (
                      <div key={idx} className={`chat-row ${roleClass}`}>
                        <div className={`chat-bubble ${roleClass}`} style={{ whiteSpace: 'pre-line' }}>
                          {msg.warning && (
                            <div style={{
                              marginBottom: '10px',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              backgroundColor: isDark ? 'rgba(211, 47, 47, 0.25)' : 'rgba(216, 90, 63, 0.12)',
                              border: `1.5px solid ${isDark ? '#EF5350' : '#D85A3F'}`,
                              color: isDark ? '#FFCDD2' : '#C62828',
                              fontSize: '13.5px',
                              lineHeight: 1.5
                            }}>
                              <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <span>⚠️ CẢNH BÁO CHUẨN MỰC VĂN HÓA:</span>
                              </div>
                              {msg.warning}
                            </div>
                          )}

                          <div>
                            {msg.content.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                              part.startsWith('**') && part.endsWith('**') ? (
                                <strong key={i} style={{ color: isDark ? '#6C854B' : '#D85A3F' }}>
                                  {part.slice(2, -2)}
                                </strong>
                              ) : (
                                <span key={i}>{part}</span>
                              )
                            )}
                          </div>

                          {msg.options && msg.options.length > 0 && (
                            <div style={{
                              marginTop: '12px',
                              paddingTop: '10px',
                              borderTop: `1px dashed ${isDark ? 'rgba(241, 227, 200, 0.25)' : 'rgba(85, 158, 158, 0.35)'}`,
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '8px'
                            }}>
                              {msg.options.map((opt, optIdx) => (
                                <button
                                  key={optIdx}
                                  className="st-btn"
                                  onClick={() => sendMessageText(opt)}
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '12.5px',
                                    borderRadius: '18px',
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)'
                                  }}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {isSending && (
                    <div className="chat-row bot">
                      <div className="chat-bubble bot">Stylist AI đang suy nghĩ câu trả lời...</div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Hỏi stylist: Áo tấc nên phối quần gì? Set này đi tiệc được không?..."
                    style={{
                      flex: 1,
                      padding: '11px 16px',
                      borderRadius: '12px',
                      border: `1.5px solid ${isDark ? 'rgba(241, 227, 200, 0.25)' : 'rgba(85, 158, 158, 0.4)'}`,
                      backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : '#FFFFFF',
                      color: isDark ? '#F1E3C8' : '#123C46',
                      fontSize: '14.5px',
                      outline: 'none'
                    }}
                  />
                  <button type="submit" className="st-btn primary" style={{ padding: '0 20px', borderRadius: '12px' }}>
                    Gửi
                  </button>
                </form>
              </div>
            </div>

            {/* ================= PHẦN DƯỚI: THANH ĐIỀU HƯỚNG TỪNG BƯỚC & DANH SÁCH MÓN ĐỒ ================= */}
            <div style={{
              marginTop: '3rem',
              paddingTop: '2rem',
              borderTop: `1px solid ${isDark ? 'rgba(241, 227, 200, 0.15)' : 'rgba(85, 158, 158, 0.2)'}`
            }}>
              {/* THANH ĐIỀU HƯỚNG BƯỚC CHỌN (STEP CHIPS) */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
              }}>
                <button
                  className="st-btn"
                  disabled={currentStepIndex === 0}
                  onClick={() => setCurrentStepIndex(i => Math.max(0, i - 1))}
                  style={{ padding: '8px 16px' }}
                >
                  ❮ Bước trước
                </button>

                <div className="step-tabs-bar">
                  {STEPS.map((stepName, realIndex) => {
                    const isActive = realIndex === currentStepIndex;
                    const hasSelected = selectedItems[stepName] !== null &&
                      (Array.isArray(selectedItems[stepName]) ? (selectedItems[stepName] as any[]).length > 0 : true);

                    return (
                      <button
                        key={stepName}
                        className={`step-tab-chip ${isActive ? 'active' : ''}`}
                        onClick={() => setCurrentStepIndex(realIndex)}
                      >
                        <span>{STEP_ICONS[stepName] || '✦'}</span>
                        <span>{stepName}</span>
                        {hasSelected && <span className="step-selected-dot" title="Đã chọn món cho bước này" />}
                      </button>
                    );
                  })}
                </div>

                <button
                  className="st-btn"
                  disabled={currentStepIndex === STEPS.length - 1}
                  onClick={() => setCurrentStepIndex(i => Math.min(STEPS.length - 1, i + 1))}
                  style={{ padding: '8px 16px' }}
                >
                  Bước tiếp theo ❯
                </button>
              </div>

              {/* THANH TIÊU ĐỀ & BỘ LỌC MÀU SẮC / GIỚI TÍNH CỐT MANNEQUIN */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div>
                  <h3 className="elodie-title" style={{ fontSize: '1.8rem', margin: 0 }}>
                    Chọn {currentStep} {STEP_ICONS[currentStep]}
                  </h3>
                  <span style={{ fontSize: '13px', opacity: 0.75 }}>
                    {filteredItems.length} sản phẩm phù hợp phom dáng
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Lọc Màu Sắc */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', opacity: 0.8 }}>Lọc màu:</span>
                    <select
                      value={activeColorFilter || ''}
                      onChange={e => setActiveColorFilter(e.target.value || null)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: `1.5px solid ${isDark ? 'rgba(241, 227, 200, 0.25)' : 'rgba(85, 158, 158, 0.4)'}`,
                        backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : '#FFFFFF',
                        color: isDark ? '#F1E3C8' : '#123C46',
                        fontSize: '13.5px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {colorOptions.map(c => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Lọc Giới Tính Mannequin */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', opacity: 0.8 }}>Phom Mannequin:</span>
                    {['Tất cả', 'Nữ', 'Nam'].map(g => {
                      const val = g === 'Tất cả' ? null : g;
                      const isSel = userGender === val;
                      return (
                        <button
                          key={g}
                          className={`st-btn ${isSel ? 'primary' : ''}`}
                          onClick={() => setUserGender(val)}
                          style={{ padding: '4px 11px', fontSize: '12.5px', borderRadius: '8px' }}
                          title={`Tùy chỉnh cốt mannequin theo phom ${g}`}
                        >
                          {g === 'Nữ' ? '👗 Nữ' : g === 'Nam' ? '👔 Nam' : 'Tất cả'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* LƯỚI DANH SÁCH SẢN PHẨM */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '2.5rem'
              }}>
                {filteredItems.map(item => {
                  let isSelected = false;
                  if (currentStep === 'Phụ kiện') {
                    isSelected = selectedItems['Phụ kiện'].some(i => i.id === item.id);
                  } else {
                    isSelected = selectedItems[currentStep]?.id === item.id;
                  }

                  const imgPath = getDynamicImagePath(item, userGender, userColor);

                  return (
                    <div
                      key={item.id}
                      className={`product-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (currentStep === 'Phụ kiện') {
                          setSelectedItems(prev => ({
                            ...prev,
                            'Phụ kiện': isSelected
                              ? prev['Phụ kiện'].filter(i => i.id !== item.id)
                              : [...prev['Phụ kiện'], item]
                          }));
                        } else {
                          setSelectedItems(prev => ({
                            ...prev,
                            [currentStep]: isSelected ? null : item
                          }));
                        }
                      }}
                    >
                      <img src={imgPath} alt={item.name} />
                      <div className="product-name">{item.name}</div>
                      <button
                        className={`st-btn ${isSelected ? 'primary' : ''}`}
                        onClick={e => {
                          e.stopPropagation();
                          if (currentStep === 'Phụ kiện') {
                            setSelectedItems(prev => ({
                              ...prev,
                              'Phụ kiện': isSelected
                                ? prev['Phụ kiện'].filter(i => i.id !== item.id)
                                : [...prev['Phụ kiện'], item]
                            }));
                          } else {
                            setSelectedItems(prev => ({
                              ...prev,
                              [currentStep]: isSelected ? null : item
                            }));
                          }
                        }}
                        style={{ marginTop: '8px', padding: '6px 12px', fontSize: '12.5px', borderRadius: '8px' }}
                      >
                        {isSelected ? '✓ Đã chọn (Bỏ)' : 'Chọn món này'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* THANH ĐIỀU HƯỚNG DƯỚI CÙNG TIỆN LỢI */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderRadius: '16px',
                backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)',
                border: `1px solid ${isDark ? 'rgba(241, 227, 200, 0.15)' : 'rgba(85, 158, 158, 0.25)'}`,
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    className="st-btn"
                    disabled={currentStepIndex === 0}
                    onClick={() => setCurrentStepIndex(i => Math.max(0, i - 1))}
                  >
                    ❮ Quay lại bước trước
                  </button>
                  <span style={{ fontSize: '13px', opacity: 0.8 }}>
                    Bước {currentStepIndex + 1} / {STEPS.length} · <b>{currentStep}</b>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {currentStepIndex < STEPS.length - 1 ? (
                    <button
                      className="st-btn primary"
                      onClick={() => setCurrentStepIndex(i => Math.min(STEPS.length - 1, i + 1))}
                    >
                      Tiếp theo: {STEPS[currentStepIndex + 1]} ❯
                    </button>
                  ) : null}

                  <button
                    className="nav-primary-cta"
                    disabled={chuaChonTrangPhuc}
                    onClick={() => setPage('result')}
                  >
                    <span>Hoàn tất &amp; Xuất bảng OOTD</span>
                    <span>✦</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= FINAL RESULT OOTD ================= */}
        {page === 'result' && (
          <div style={{ marginTop: '2.5rem', maxWidth: '1200px', margin: '2.5rem auto 0 auto' }}>
            <h1 className="elodie-title" style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '8px' }}>
              Bảng Tổng Hợp OOTD Việt Phục
            </h1>
            <p style={{ textAlign: 'center', opacity: 0.8, fontSize: '15px', marginBottom: '2.5rem' }}>
              Tác phẩm phối đồ của bạn đã được xuất thành poster chuẩn tỷ lệ thời trang.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: '3.5rem', alignItems: 'start' }}>
              {/* Bên Trái: Poster Đã Ghép */}
              <div>
                {ootdDataUrl ? (
                  <img
                    src={ootdDataUrl}
                    alt="OOTD Poster"
                    style={{
                      width: '100%',
                      borderRadius: '18px',
                      boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
                      border: `1.5px solid ${isDark ? 'rgba(241, 227, 200, 0.2)' : 'rgba(85, 158, 158, 0.3)'}`
                    }}
                  />
                ) : (
                  <div style={{
                    height: '600px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDark ? '#2E0909' : '#FFFFFF',
                    borderRadius: '18px'
                  }}>
                    Đang kết xuất poster...
                  </div>
                )}
              </div>

              {/* Bên Phải: Nhận Xét Stylist & Tác Vụ */}
              <div>
                <div className="content-box">
                  <h3 className="elodie-title" style={{ fontSize: '1.8rem', marginTop: 0, marginBottom: '14px' }}>
                    Nhận xét Stylist &amp; Ý nghĩa
                  </h3>

                  <div style={{ marginBottom: '14px', lineHeight: 1.6, fontSize: '14.5px' }}>
                    {selectedItems['Trang phục'] && (
                      <p><b>Trang phục chủ đạo:</b> {selectedItems['Trang phục'].name}</p>
                    )}
                    {messages.length > 1 ? (
                      <div style={{ whiteSpace: 'pre-line' }}>
                        {(() => {
                          const content = typeof messages[messages.length - 1].content === 'string'
                            ? messages[messages.length - 1].content
                            : JSON.stringify(messages[messages.length - 1].content);

                          // Cắt và tách chuỗi để in đậm phần kẹp giữa **
                          return content.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                            part.startsWith('**') && part.endsWith('**') ? (
                              <strong key={i} style={{ color: isDark ? '#6C854B' : '#D85A3F' }}>
                                {part.slice(2, -2)}
                              </strong>
                            ) : (
                              <span key={i}>{part}</span>
                            )
                          );
                        })()}
                      </div>
                    ) : (
                      <p style={{ opacity: 0.85 }}>
                        Set đồ giao thoa hài hòa giữa di sản cổ truyền và nhịp sống trẻ trung. Sự kết hợp thể hiện gu thẩm mỹ tinh tế và cá tính tự tin của người mặc.
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '2rem' }}>
                  <a
                    href={ootdDataUrl}
                    download={`${selectedItems['Trang phục'] ? selectedItems['Trang phục'].name.replace(/[\\/*?:"<>|]/g, '').replace(/\s+/g, '_') : 'OOTD'}_remix.jpg`}
                    className="st-btn primary"
                    style={{ textDecoration: 'none', padding: '12px', textAlign: 'center' }}
                  >
                    ⬇ Tải ảnh OOTD
                  </a>

                  <button className="st-btn" onClick={() => setPage('chatbot')} style={{ padding: '12px' }}>
                    ✏ Quay lại chỉnh sửa
                  </button>
                </div>

                {/* Đánh Giá Trải Nghiệm */}
                <div style={{
                  padding: '24px',
                  borderRadius: '16px',
                  border: `1px solid ${isDark ? 'rgba(241, 227, 200, 0.15)' : 'rgba(85, 158, 158, 0.25)'}`,
                  backgroundColor: isDark ? 'rgba(36, 6, 6, 0.5)' : '#FFFFFF'
                }}>
                  <h4 className="elodie-title" style={{ fontSize: '20px', textAlign: 'center', marginTop: 0, marginBottom: '8px' }}>
                    Đánh giá trải nghiệm của bạn
                  </h4>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontSize: '28px',
                          cursor: 'pointer',
                          color: (rating && rating >= star) ? '#FFD700' : 'rgba(128,128,128,0.4)',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Bạn thấy set đồ remix này thế nào? Hãy chia sẻ cảm nghĩ nhé..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: `1px solid ${isDark ? 'rgba(241, 227, 200, 0.25)' : 'rgba(85, 158, 158, 0.35)'}`,
                      backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#FFFFFF',
                      color: isDark ? '#F1E3C8' : '#123C46',
                      fontSize: '14px',
                      marginBottom: '12px',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="st-btn primary"
                      onClick={() => {
                        if (!rating) {
                          setFeedbackStatus('warning');
                          return;
                        }
                        setFeedbackStatus('success');
                      }}
                    >
                      Gửi phản hồi
                    </button>
                  </div>

                  {feedbackStatus === 'success' && (
                    <div style={{ marginTop: '12px', color: '#4CAF50', fontSize: '14px', textAlign: 'center', fontWeight: 600 }}>
                      ✓ Cảm ơn bạn đã đóng góp ý kiến cho Việt Phục Remix!
                    </div>
                  )}
                  {feedbackStatus === 'warning' && (
                    <div style={{ marginTop: '12px', color: '#E57373', fontSize: '14px', textAlign: 'center' }}>
                      Vui lòng chọn số sao đánh giá trước khi gửi nhé!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}