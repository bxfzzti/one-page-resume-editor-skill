import {
  SERVICE_CATALOG,
  type ServiceKind,
} from "@/lib/service-catalog";

export function quoteService(serviceKind: ServiceKind): number {
  return SERVICE_CATALOG[serviceKind].points;
}
