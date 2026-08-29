export const SERVICE_CATALOG = {
  diagnosis: { label: "看看简历问题", points: 5 },
  one_page: { label: "整理成一页纸", points: 15 },
  jd_tailoring: { label: "按 JD 定制", points: 12 },
  multi_jd: { label: "多个 JD 分版本定制", points: 20 },
  interview_review: { label: "检查简历和准备面试", points: 8 },
  deep_follow_up: { label: "基于当前结果继续追问", points: 3 },
} as const;

export type ServiceKind = keyof typeof SERVICE_CATALOG;

export const PRIMARY_SERVICE_KINDS = [
  "diagnosis",
  "one_page",
  "jd_tailoring",
  "interview_review",
] as const satisfies readonly ServiceKind[];
