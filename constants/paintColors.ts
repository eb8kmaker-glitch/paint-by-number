export interface PaintColor {
  id: number;
  name: string;
  nameKo: string;
  hex: string;
  rgb: [number, number, number];
}

export const PAINT_COLORS: PaintColor[] = [
  { id: 1,  name: 'Titanium White',       nameKo: '티타늄 화이트',     hex: '#FFFFFF', rgb: [255, 255, 255] },
  { id: 2,  name: 'Chinese White',         nameKo: '차이니즈 화이트',   hex: '#F5F5F5', rgb: [245, 245, 245] },
  { id: 3,  name: 'Ivory Black',           nameKo: '아이보리 블랙',     hex: '#1C1C1C', rgb: [28,  28,  28]  },
  { id: 4,  name: 'Cadmium Red',           nameKo: '카드뮴 레드',       hex: '#E32636', rgb: [227, 38,  54]  },
  { id: 5,  name: 'Vermilion',             nameKo: '버밀리언',           hex: '#E34234', rgb: [227, 66,  52]  },
  { id: 6,  name: 'Cadmium Orange',        nameKo: '카드뮴 오렌지',     hex: '#ED872D', rgb: [237, 135, 45]  },
  { id: 7,  name: 'Cadmium Yellow',        nameKo: '카드뮴 옐로우',     hex: '#FFF44F', rgb: [255, 244, 79]  },
  { id: 8,  name: 'Naples Yellow',         nameKo: '나폴리 옐로우',     hex: '#FADA5E', rgb: [250, 218, 94]  },
  { id: 9,  name: 'Yellow Ochre',          nameKo: '옐로우 오커',       hex: '#CC7722', rgb: [204, 119, 34]  },
  { id: 10, name: 'Raw Sienna',            nameKo: '로 시에나',          hex: '#C68642', rgb: [198, 134, 66]  },
  { id: 11, name: 'Burnt Sienna',          nameKo: '번트 시에나',        hex: '#882D17', rgb: [136, 45,  23]  },
  { id: 12, name: 'Raw Umber',             nameKo: '로 엄버',            hex: '#826644', rgb: [130, 102, 68]  },
  { id: 13, name: 'Burnt Umber',           nameKo: '번트 엄버',          hex: '#6B3A2A', rgb: [107, 58,  42]  },
  { id: 14, name: 'Sap Green',             nameKo: '샙 그린',            hex: '#507D2A', rgb: [80,  125, 42]  },
  { id: 15, name: 'Viridian',              nameKo: '비리디안',           hex: '#4D9B7A', rgb: [77,  155, 122] },
  { id: 16, name: "Hooker's Green",        nameKo: '후커즈 그린',        hex: '#49796B', rgb: [73,  121, 107] },
  { id: 17, name: 'Phthalo Green',         nameKo: '프탈로 그린',        hex: '#123524', rgb: [18,  53,  36]  },
  { id: 18, name: 'Phthalo Blue',          nameKo: '프탈로 블루',        hex: '#000F89', rgb: [0,   15,  137] },
  { id: 19, name: 'Ultramarine Blue',      nameKo: '울트라마린 블루',   hex: '#4169E1', rgb: [65,  105, 225] },
  { id: 20, name: 'Cobalt Blue',           nameKo: '코발트 블루',        hex: '#0047AB', rgb: [0,   71,  171] },
  { id: 21, name: 'Cerulean Blue',         nameKo: '세룰리안 블루',      hex: '#2A52BE', rgb: [42,  82,  190] },
  { id: 22, name: 'Dioxazine Purple',      nameKo: '다이옥사진 퍼플',   hex: '#612F6E', rgb: [97,  47,  110] },
  { id: 23, name: 'Quinacridone Magenta',  nameKo: '퀴나크리돈 마젠타', hex: '#8B1A4A', rgb: [139, 26,  74]  },
  { id: 24, name: "Payne's Gray",          nameKo: '페인즈 그레이',      hex: '#536878', rgb: [83,  104, 120] },
];
