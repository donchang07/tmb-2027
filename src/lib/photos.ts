// 임시 사진: 화면 설계 목업이 쓴 Mont Blanc Treks 갤러리 이미지를 직접 연결한다.
// 상업 이용 허가가 없으므로 팀 소유 사진으로 교체해야 한다(PRD 9장). 교체는 이 파일만 고치면 된다.
const BASE = "https://montblanctreks.com.au/wp-content/uploads/";

const u = (path: string): string => `${BASE}${path}`;

export const DAY_PHOTOS: Record<string, string> = {
  "d2027-08-03": u("2013/10/cable-car-1.jpg"),
  "d2027-08-04": u("2013/10/Bionnassay-1.jpg"),
  "d2027-08-05": u("2013/10/MG_8872-1-1.jpg"),
  "d2027-08-06": u("2013/10/Ascending-Col-Du-Bonhomme-1-1.jpg"),
  "d2027-08-07": u("2013/10/Col-De-Seigne-1-1.jpg"),
  "d2027-08-08": u("2013/10/MG_8968.jpg"),
  "d2027-08-09": u("2013/10/IMG_9117-1.jpg"),
  "d2027-08-10": u("2013/10/IMG_9128-1.jpg"),
  "d2027-08-11": u("2013/10/MG_9157-1.jpg"),
  "d2027-08-12": u("2013/10/IMG_9184-1.jpg"),
  "d2027-08-13": u("2014/07/IMG_19401-e1405664837580.jpg"),
  "d2027-08-14": u("2013/10/IMG_9329-1.jpg"),
  "d2027-08-15": u("2014/07/IMG_2040.jpg"),
  "d2027-08-16": u("2013/10/bigstock-Aiguille-Du-Midi-Mont-blanc-8807989-1.jpg"),
  "d2027-08-17": u("2013/10/Chamonix-mural-1.jpg"),
};

export const PHOTOS = {
  hero: u("2013/10/MG_8965-1-1.jpg"),
  itinerary: u("2013/10/Refugio-Elizabetta-1-1.jpg"),
  budget: u("2013/10/Outdoor-dining-Truc.jpg"),
  map: u("2013/10/IMG_9309-1.jpg"),
  packing: u("2013/10/Hikers-1.jpg"),
  journal: u("2013/10/IMG_9271.jpg"),
  journalLink: u("2013/10/IMG_9342-1.jpg"),
  lodging: u("2013/10/chamonix-street-2.jpg"),
  routeA: u("2013/10/MG_8940.gif"),
  routeB: u("2013/10/Refugio-Elizabetta-1-1-600x380.jpg"),
  routeC: u("2013/10/MG_8965-1-1-600x380.jpg"),
  admin: u("2013/10/MG_9209-1.jpg"),
  login: u("2013/10/Flowers3-1-1.jpg"),
  signup: u("2013/10/flowers-1-1.jpg"),
  teamLogin: u("2013/10/IMG_9342-1.jpg"),
  offline: u("2013/10/IMG_9243-1.jpg"),
  notFound: u("2013/10/IMG_9243-1.jpg"),
} as const;

export function dayPhoto(dayId: string): string | undefined {
  return DAY_PHOTOS[dayId];
}
