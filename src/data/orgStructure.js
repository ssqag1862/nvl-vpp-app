export const VUNG_STRUCTURE = {
  "MIỀN BẮC": ["SÔNG ĐÀ", "HÀ NỘI", "CÁC TỈNH MIỀN BẮC", "TT1 (TRUNG TÂM 1)"],
  "MIỀN TRUNG & MIỀN NAM": ["POD MIỀN NAM", "LONG AN", "TIỀN GIANG", "VĂN PHÒNG HCM", "MIỀN TÂY"],
};

export const VUNG_LIST = Object.keys(VUNG_STRUCTURE);

// phong_ban = [] means no sub-department selection needed (just khu vuc is enough)
export const ORG_STRUCTURE = {
  "SÔNG ĐÀ":              ["KẾ TOÁN", "PHÁP CHẾ", "P. HÀNH CHÍNH NS", "DVKH", "KINH DOANH", "BIỂN", "ĐÀO TẠO"],
  "HÀ NỘI":               ["CẦU GIẤY + HMI", "ĐÓNG HÀNG", "KIỂM SOÁT", "CSKH", "LÁI XE", "GIAO DỊCH", "KHO PANA HNI", "PANA ĐÔNG ANH", "KẾ TOÁN HN", "TEAM LG", "TEAM BEKO", "TRẠM SAMSUNG", "HAI BÀ TRƯNG", "HNI"],
  "CÁC TỈNH MIỀN BẮC":   ["BẮC NINH", "SS TÂN HỒNG", "HÀ NAM", "HẢI DƯƠNG", "HẢI PHÒNG", "HƯNG YÊN", "NAM ĐỊNH", "NGHỆ AN", "PODS MB", "THANH HÓA", "BẮC GIANG", "QUẢNG NINH", "VĨNH PHÚC", "THÁI NGUYÊN"],
  "TT1 (TRUNG TÂM 1)":   ["HCNS", "ĐÓNG HÀNG TT1", "TỔ LÀM ĐÊM", "KS CA NGÀY", "LÁI XE", "KHO LB"],
  "POD MIỀN NAM":         ["BC Q.GV", "BCQ12", "ĐÔNG NAM BỘ", "TÂY NAM BỘ"],
  "LONG AN":              [],
  "TIỀN GIANG":           [],
  "VĂN PHÒNG HCM":        ["VPP CHUNG", "HCNS", "KẾ TOÁN", "CSKH", "KINH DOANH", "PHÁP CHẾ"],
  "MIỀN TÂY":             ["TT4", "CẦN THƠ", "KIÊN GIANG", "ĐTTH"],
};

export const KHU_VUC_LIST = Object.keys(ORG_STRUCTURE);

// Maps each khu vực to its parent vùng — includes old names for backward compat with old submissions
export const REGION_MAP = {
  "SÔNG ĐÀ":             "MIỀN BẮC",
  "HÀ NỘI":              "MIỀN BẮC",
  "CÁC TỈNH MIỀN BẮC":  "MIỀN BẮC",
  "TT1 (TRUNG TÂM 1)":  "MIỀN BẮC",
  // old names kept for backward compat
  "HN":                  "MIỀN BẮC",
  "MIỀN BẮC":            "MIỀN BẮC",
  "TT1":                 "MIỀN BẮC",
  "POD MIỀN NAM":        "MIỀN TRUNG & MIỀN NAM",
  "LONG AN":             "MIỀN TRUNG & MIỀN NAM",
  "LONG HẬU":            "MIỀN TRUNG & MIỀN NAM",
  "TIỀN GIANG":          "MIỀN TRUNG & MIỀN NAM",
  "VĂN PHÒNG HCM":       "MIỀN TRUNG & MIỀN NAM",
  "MIỀN TÂY":            "MIỀN TRUNG & MIỀN NAM",
};
