export interface HaryanaDistrict {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const HARYANA_DISTRICTS: HaryanaDistrict[] = [
  { id: "HR-AM", name: "Ambala", lat: 30.3782, lng: 76.7767 },
  { id: "HR-BW", name: "Bhiwani", lat: 28.7932, lng: 76.1390 },
  { id: "HR-CD", name: "Charkhi Dadri", lat: 28.5921, lng: 76.2653 },
  { id: "HR-FA", name: "Faridabad", lat: 28.4089, lng: 77.3178 },
  { id: "HR-FT", name: "Fatehabad", lat: 29.5133, lng: 75.4528 },
  { id: "HR-GU", name: "Gurugram", lat: 28.4595, lng: 77.0266 },
  { id: "HR-HI", name: "Hisar", lat: 29.1492, lng: 75.7217 },
  { id: "HR-JJ", name: "Jhajjar", lat: 28.6063, lng: 76.6565 },
  { id: "HR-JH", name: "Jind", lat: 29.3167, lng: 76.3167 },
  { id: "HR-KT", name: "Kaithal", lat: 29.8015, lng: 76.3996 },
  { id: "HR-KR", name: "Karnal", lat: 29.6857, lng: 76.9905 },
  { id: "HR-KU", name: "Kurukshetra", lat: 29.9695, lng: 76.8783 },
  { id: "HR-MA", name: "Mahendragarh", lat: 28.0444, lng: 76.1089 },
  { id: "HR-NU", name: "Nuh", lat: 28.1070, lng: 77.0150 },
  { id: "HR-PW", name: "Palwal", lat: 27.9962, lng: 77.3695 },
  { id: "HR-PK", name: "Panchkula", lat: 30.6942, lng: 76.8606 },
  { id: "HR-PP", name: "Panipat", lat: 29.3909, lng: 76.9635 },
  { id: "HR-RE", name: "Rewari", lat: 28.1833, lng: 76.6167 },
  { id: "HR-RO", name: "Rohtak", lat: 28.8955, lng: 76.6066 },
  { id: "HR-SI", name: "Sirsa", lat: 29.5321, lng: 75.0318 },
  { id: "HR-SO", name: "Sonipat", lat: 28.9931, lng: 77.0151 },
  { id: "HR-YN", name: "Yamunanagar", lat: 30.1727, lng: 77.2989 },
];

export const HARYANA_DEPARTMENTS = [
  { id: "DEPT-PWD", name: "Public Works Department (B&R)" },
  { id: "DEPT-POWER", name: "Haryana Vidyut Prasaran Nigam (HVPNL / UHBVN / DHBVN)" },
  { id: "DEPT-HEALTH", name: "Department of Health & Family Welfare" },
  { id: "DEPT-DISASTER", name: "Revenue & Disaster Management Department" },
  { id: "DEPT-POLICE", name: "Haryana Police & Traffic Enforcement" },
  { id: "DEPT-MUNICIPAL", name: "Urban Local Bodies (ULB) & Municipal Corporation" },
];

export const COMPLAINT_CATEGORIES = [
  { id: "URBAN_FLOODING", label: "Urban Flooding & Waterlogging / जलभराव", defaultDept: "DEPT-PWD" },
  { id: "ROAD_BLOCKAGE", label: "Road Damage & Potholes / गड्ढे व सड़क अवरोध", defaultDept: "DEPT-PWD" },
  { id: "ELECTRICAL_HAZARD", label: "Electrical Sparking & Power Outage / बिजली समस्या", defaultDept: "DEPT-POWER" },
  { id: "SEWERAGE_OVERFLOW", label: "Sewerage Overflow & Drainage / सीवर ओवरफ्लो", defaultDept: "DEPT-PWD" },
  { id: "HEALTH_HAZARD", label: "Contaminated Water & Health Hazard / दूषित पेयजल व स्वास्थ्य", defaultDept: "DEPT-HEALTH" },
  { id: "CIVIL_INFRASTRUCTURE", label: "Infrastructure Damage & Structural Risk / संरचनात्मक क्षति", defaultDept: "DEPT-PWD" },
  { id: "HAZARD_MATERIALS", label: "Chemical / Hazardous Material / खतरनाक रसायन रिसाव", defaultDept: "DEPT-DISASTER" },
];

export function findNearestHaryanaDistrict(lat: number, lng: number): HaryanaDistrict {
  let minDistance = Infinity;
  let nearest = HARYANA_DISTRICTS[0];

  for (const d of HARYANA_DISTRICTS) {
    const dLat = (d.lat - lat) * (Math.PI / 180);
    const dLng = (d.lng - lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat * (Math.PI / 180)) *
        Math.cos(d.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (dist < minDistance) {
      minDistance = dist;
      nearest = d;
    }
  }

  return nearest;
}
