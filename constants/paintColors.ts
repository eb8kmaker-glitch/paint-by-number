export interface PaintColor {
  id: number;
  name: string;
  nameKo: string;
  hex: string;
  rgb: [number, number, number];
}

export const PAINT_COLORS: PaintColor[] = [
  // ── Whites & Blacks ──────────────────────────────────────────
  { id: 1,  name: 'Titanium White',        nameKo: '티타늄 화이트',     hex: '#FFFFFF', rgb: [255, 255, 255] },
  { id: 2,  name: 'Zinc White',            nameKo: '징크 화이트',       hex: '#FAFAFA', rgb: [250, 250, 250] },
  { id: 3,  name: 'Ivory Black',           nameKo: '아이보리 블랙',     hex: '#1C1C1C', rgb: [28,  28,  28]  },
  { id: 4,  name: 'Lamp Black',            nameKo: '램프 블랙',         hex: '#0A0A0A', rgb: [10,  10,  10]  },
  // ── Reds ─────────────────────────────────────────────────────
  { id: 5,  name: 'Cadmium Red',           nameKo: '카드뮴 레드',       hex: '#E32636', rgb: [227, 38,  54]  },
  { id: 6,  name: 'Vermilion',             nameKo: '버밀리언',           hex: '#E34234', rgb: [227, 66,  52]  },
  { id: 7,  name: 'Rose Madder',           nameKo: '로즈 매더',         hex: '#E32636', rgb: [227, 38,  54]  },
  { id: 8,  name: 'Quinacridone Rose',     nameKo: '퀴나크리돈 로즈',   hex: '#C92D53', rgb: [201, 45,  83]  },
  { id: 9,  name: 'Coral',                 nameKo: '코랄',               hex: '#FF6B6B', rgb: [255, 107, 107] },
  { id: 10, name: 'Maroon',               nameKo: '마룬',               hex: '#800000', rgb: [128, 0,   0]   },
  // ── Oranges & Yellows ────────────────────────────────────────
  { id: 11, name: 'Cadmium Orange',        nameKo: '카드뮴 오렌지',     hex: '#ED872D', rgb: [237, 135, 45]  },
  { id: 12, name: 'Peach',                 nameKo: '피치',               hex: '#FFDAB9', rgb: [255, 218, 185] },
  { id: 13, name: 'Flesh Tint',            nameKo: '플레시 틴트',       hex: '#FFCBA4', rgb: [255, 203, 164] },
  { id: 14, name: 'Cadmium Yellow',        nameKo: '카드뮴 옐로우',     hex: '#FFF44F', rgb: [255, 244, 79]  },
  { id: 15, name: 'Lemon Yellow',          nameKo: '레몬 옐로우',       hex: '#FFF44F', rgb: [255, 250, 100] },
  { id: 16, name: 'Naples Yellow',         nameKo: '나폴리 옐로우',     hex: '#FADA5E', rgb: [250, 218, 94]  },
  // ── Browns & Ochres ──────────────────────────────────────────
  { id: 17, name: 'Yellow Ochre',          nameKo: '옐로우 오커',       hex: '#CC7722', rgb: [204, 119, 34]  },
  { id: 18, name: 'Gold Ochre',            nameKo: '골드 오커',         hex: '#CC7A00', rgb: [204, 122, 0]   },
  { id: 19, name: 'Tan',                   nameKo: '탠',                 hex: '#D2B48C', rgb: [210, 180, 140] },
  { id: 20, name: 'Raw Sienna',            nameKo: '로 시에나',          hex: '#C68642', rgb: [198, 134, 66]  },
  { id: 21, name: 'Burnt Sienna',          nameKo: '번트 시에나',        hex: '#882D17', rgb: [136, 45,  23]  },
  { id: 22, name: 'Raw Umber',             nameKo: '로 엄버',            hex: '#826644', rgb: [130, 102, 68]  },
  { id: 23, name: 'Burnt Umber',           nameKo: '번트 엄버',          hex: '#6B3A2A', rgb: [107, 58,  42]  },
  // ── Greens ───────────────────────────────────────────────────
  { id: 24, name: 'Lemon Green',           nameKo: '레몬 그린',         hex: '#9ACD32', rgb: [154, 205, 50]  },
  { id: 25, name: 'Yellow Green',          nameKo: '옐로우 그린',       hex: '#9ACD32', rgb: [154, 205, 50]  },
  { id: 26, name: 'Sap Green',             nameKo: '샙 그린',            hex: '#507D2A', rgb: [80,  125, 42]  },
  { id: 27, name: 'Olive Green',           nameKo: '올리브 그린',       hex: '#6B6B2A', rgb: [107, 107, 42]  },
  { id: 28, name: 'Forest Green',          nameKo: '포레스트 그린',     hex: '#228B22', rgb: [34,  139, 34]  },
  { id: 29, name: 'Viridian',              nameKo: '비리디안',           hex: '#4D9B7A', rgb: [77,  155, 122] },
  { id: 30, name: "Hooker's Green",        nameKo: '후커즈 그린',        hex: '#49796B', rgb: [73,  121, 107] },
  { id: 31, name: 'Phthalo Green',         nameKo: '프탈로 그린',        hex: '#123524', rgb: [18,  53,  36]  },
  { id: 32, name: 'Cobalt Teal',           nameKo: '코발트 틸',         hex: '#008080', rgb: [0,   128, 128] },
  { id: 33, name: 'Turquoise',             nameKo: '터쿼이즈',           hex: '#40E0D0', rgb: [64,  224, 208] },
  // ── Blues ────────────────────────────────────────────────────
  { id: 34, name: 'Sky Blue',              nameKo: '스카이 블루',       hex: '#87CEEB', rgb: [135, 206, 235] },
  { id: 35, name: 'Cerulean Blue Hue',     nameKo: '세룰리안 블루 휴',  hex: '#9BC4E2', rgb: [155, 196, 226] },
  { id: 36, name: 'Cerulean Blue',         nameKo: '세룰리안 블루',      hex: '#2A52BE', rgb: [42,  82,  190] },
  { id: 37, name: 'Cobalt Blue',           nameKo: '코발트 블루',        hex: '#0047AB', rgb: [0,   71,  171] },
  { id: 38, name: 'Ultramarine Blue',      nameKo: '울트라마린 블루',   hex: '#4169E1', rgb: [65,  105, 225] },
  { id: 39, name: 'Phthalo Blue',          nameKo: '프탈로 블루',        hex: '#000F89', rgb: [0,   15,  137] },
  { id: 40, name: 'Prussian Blue',         nameKo: '프러시안 블루',     hex: '#003153', rgb: [0,   49,  83]  },
  { id: 41, name: 'Indigo',               nameKo: '인디고',             hex: '#4B0082', rgb: [75,  0,   130] },
  // ── Purples & Violets ────────────────────────────────────────
  { id: 42, name: 'Lavender',              nameKo: '라벤더',             hex: '#967BB6', rgb: [150, 123, 182] },
  { id: 43, name: 'Slate Blue',            nameKo: '슬레이트 블루',     hex: '#6A5ACD', rgb: [106, 90,  205] },
  { id: 44, name: 'Dioxazine Purple',      nameKo: '다이옥사진 퍼플',   hex: '#612F6E', rgb: [97,  47,  110] },
  { id: 45, name: 'Quinacridone Magenta',  nameKo: '퀴나크리돈 마젠타', hex: '#8B1A4A', rgb: [139, 26,  74]  },
  // ── Grays ────────────────────────────────────────────────────
  { id: 46, name: 'Warm Gray',             nameKo: '웜 그레이',         hex: '#808069', rgb: [128, 128, 105] },
  { id: 47, name: 'Cool Gray',             nameKo: '쿨 그레이',         hex: '#8C8C99', rgb: [140, 140, 153] },
  { id: 48, name: "Payne's Gray",          nameKo: '페인즈 그레이',      hex: '#536878', rgb: [83,  104, 120] },
];
