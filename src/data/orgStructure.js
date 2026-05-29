export const VUNG_STRUCTURE = {
  "MIỀN BẮC": [
    "SÔNG ĐÀ",
    "HÀ NỘI",
    "CÁC TỈNH MIỀN BẮC",
    "TT1 (TRUNG TÂM 1)",
  ],
  "MIỀN TRUNG": [
    "TRUNG TÂM 3",
    "ĐÀ NẴNG",
    "QUẢNG NGÃI",
    "BÌNH ĐỊNH",
    "DAKLAK",
    "KHÁNH HOÀ",
    "LÂM ĐỒNG",
    "POD + DTTH MIỀN TRUNG",
    "POD + DTTH TÂY NGUYÊN",
  ],
  "MIỀN NAM": [
    "BDG",
    "TT2",
    "VTU",
    "DNI",
    "BƯU CỤC GÒ VẤP",
    "BCQ12",
    "QUẢN LÝ POD",
    "POD MIỀN NAM",
    "LONG AN",
    "TIỀN GIANG",
    "VĂN PHÒNG HCM",
    "MIỀN TÂY",
  ],
};

export const VUNG_LIST = Object.keys(VUNG_STRUCTURE);

// [] means no phòng ban selection needed for that khu vực
export const ORG_STRUCTURE = {
  // MIỀN BẮC
  "SÔNG ĐÀ":              ["KẾ TOÁN", "PHÁP CHẾ", "P. HÀNH CHÍNH NS", "DVKH", "KINH DOANH", "BIỂN", "ĐÀO TẠO"],
  "HÀ NỘI":               ["CẦU GIẤY + HMI", "ĐÓNG HÀNG", "KIỂM SOÁT", "CSKH", "LÁI XE", "GIAO DỊCH", "KHO PANA HNI", "PANA ĐÔNG ANH", "KẾ TOÁN HN", "TEAM LG", "TEAM BEKO", "TRẠM SAMSUNG", "HAI BÀ TRƯNG", "HNI"],
  "CÁC TỈNH MIỀN BẮC":   ["BẮC NINH", "SS TÂN HỒNG", "HÀ NAM", "HẢI DƯƠNG", "HẢI PHÒNG", "HƯNG YÊN", "NAM ĐỊNH", "NGHỆ AN", "PODS MB", "THANH HÓA", "BẮC GIANG", "QUẢNG NINH", "VĨNH PHÚC", "THÁI NGUYÊN"],
  "TT1 (TRUNG TÂM 1)":   ["HCNS", "ĐÓNG HÀNG TT1", "TỔ LÀM ĐÊM", "KS CA NGÀY", "LÁI XE", "KHO LB"],

  // MIỀN TRUNG — không có phòng ban
  "TRUNG TÂM 3":          [],
  "ĐÀ NẴNG":              [],
  "QUẢNG NGÃI":           [],
  "BÌNH ĐỊNH":            [],
  "DAKLAK":               [],
  "KHÁNH HOÀ":            [],
  "LÂM ĐỒNG":             [],
  "POD + DTTH MIỀN TRUNG": [],
  "POD + DTTH TÂY NGUYÊN": [],

  // MIỀN NAM
  "BDG":                  ["HCNS", "KẾ TOÁN", "KINH DOANH", "CSKH - CSKH ĐT", "ADMIN BDG", "GIAO DỊCH", "KHAI THÁC SS"],
  "TT2":                  ["TỔ XE", "TỔ CA NGÀY - CA ĐÊM", "KHAI THÁC"],
  "VTU":                  [],
  "DNI":                  [],
  "BƯU CỤC GÒ VẤP":      [],
  "BCQ12":                [],
  "QUẢN LÝ POD":          [],
  "POD MIỀN NAM":         ["ĐÔNG NAM BỘ", "TÂY NAM BỘ"],
  "LONG AN":              [],
  "TIỀN GIANG":           [],
  "VĂN PHÒNG HCM":        ["VPP CHUNG", "HCNS", "KẾ TOÁN", "CSKH", "KINH DOANH", "PHÁP CHẾ"],
  "MIỀN TÂY":             ["TT4", "CẦN THƠ", "KIÊN GIANG", "ĐTTH"],
};

export const KHU_VUC_LIST = Object.keys(ORG_STRUCTURE);

// Maps each khu vực to its parent vùng (used for report grouping)
export const REGION_MAP = {
  // MIỀN BẮC
  "SÔNG ĐÀ":                  "MIỀN BẮC",
  "HÀ NỘI":                   "MIỀN BẮC",
  "CÁC TỈNH MIỀN BẮC":       "MIỀN BẮC",
  "TT1 (TRUNG TÂM 1)":       "MIỀN BẮC",
  "HN":                        "MIỀN BẮC",   // backward compat
  "MIỀN BẮC":                  "MIỀN BẮC",
  "TT1":                       "MIỀN BẮC",   // backward compat

  // MIỀN TRUNG
  "TRUNG TÂM 3":               "MIỀN TRUNG",
  "ĐÀ NẴNG":                   "MIỀN TRUNG",
  "QUẢNG NGÃI":                "MIỀN TRUNG",
  "BÌNH ĐỊNH":                 "MIỀN TRUNG",
  "DAKLAK":                    "MIỀN TRUNG",
  "KHÁNH HOÀ":                 "MIỀN TRUNG",
  "LÂM ĐỒNG":                  "MIỀN TRUNG",
  "POD + DTTH MIỀN TRUNG":     "MIỀN TRUNG",
  "POD + DTTH TÂY NGUYÊN":    "MIỀN TRUNG",

  // MIỀN NAM
  "BDG":                       "MIỀN NAM",
  "TT2":                       "MIỀN NAM",
  "VTU":                       "MIỀN NAM",
  "DNI":                       "MIỀN NAM",
  "BƯU CỤC GÒ VẤP":           "MIỀN NAM",
  "BCQ12":                     "MIỀN NAM",
  "QUẢN LÝ POD":               "MIỀN NAM",
  "POD MIỀN NAM":              "MIỀN NAM",
  "LONG AN":                   "MIỀN NAM",
  "LONG HẬU":                  "MIỀN NAM",   // backward compat
  "TIỀN GIANG":                "MIỀN NAM",
  "VĂN PHÒNG HCM":             "MIỀN NAM",
  "MIỀN TÂY":                  "MIỀN NAM",
  "MIỀN TRUNG & MIỀN NAM":     "MIỀN NAM",   // backward compat for old submissions
};
