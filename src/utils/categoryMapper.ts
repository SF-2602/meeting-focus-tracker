export function mapBackendCategoryToTimelineCategory(backendCategory: string): 
  "meeting" | "media" | "dev" | "office" | "social" | "other" {
  switch (backendCategory) {
    case "meeting":
      return "meeting";
    case "work_related":
 
      return "dev"; 
    case "distraction":

      return "media";
    case "other":
    default:
      return "other";
  }
}