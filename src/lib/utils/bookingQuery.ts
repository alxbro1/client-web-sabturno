import type { LoyaltyReward } from "@/lib/types/loyalty";

type BookingQueryPayload = {
  localId?: string | null;
  serviceId?: number | null;
  coupon?: string | null;
  rewardId?: string | null;
};

function toBase64Url(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  return atob(`${normalized}${"=".repeat(padding)}`);
}

function parseServiceId(raw: string | null) {
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function parseBookingQuery(searchParams: URLSearchParams) {
  const token = searchParams.get("bk");
  if (token) {
    try {
      const decoded = JSON.parse(fromBase64Url(token)) as { l?: unknown; s?: unknown };
      const localId = typeof decoded.l === "string" && decoded.l.trim() ? decoded.l.trim() : null;
      const serviceId =
        typeof decoded.s === "number" && Number.isInteger(decoded.s) && decoded.s > 0
          ? decoded.s
          : null;

      return {
        localId,
        serviceId,
        coupon: searchParams.get("coupon")?.trim() || null,
        rewardId: searchParams.get("reward")?.trim() || null,
      };
    } catch {
      // Fall back to legacy params when token is malformed.
    }
  }

  return {
    localId: searchParams.get("localId")?.trim() || null,
    serviceId: parseServiceId(searchParams.get("serviceId")),
    coupon: searchParams.get("coupon")?.trim() || null,
    rewardId: searchParams.get("reward")?.trim() || null,
  };
}

export function buildBookingSearch(payload: BookingQueryPayload) {
  const localId = payload.localId?.trim() || null;
  const serviceId =
    typeof payload.serviceId === "number" && Number.isInteger(payload.serviceId) && payload.serviceId > 0
      ? payload.serviceId
      : null;
  const coupon = payload.coupon?.trim() || null;
  const rewardId = payload.rewardId?.trim() || null;

  if (!localId && !serviceId && !coupon && !rewardId) {
    return "";
  }

  const encoded = toBase64Url(
    JSON.stringify({
      ...(localId ? { l: localId } : {}),
      ...(serviceId ? { s: serviceId } : {}),
    }),
  );

  const params = new URLSearchParams();
  params.set("bk", encoded);
  if (coupon) params.set("coupon", coupon);
  if (rewardId) params.set("reward", rewardId);
  return params.toString();
}

const SELECT_SERVICE_PATH = "/booking/select-service";

/**
 * Public deep link that opens the booking flow already scoped to one local
 * (skips "Elegí un local"). Returns the bare path when there is no usable id.
 */
export function buildLocalBookingPath(localId: string) {
  const query = buildBookingSearch({ localId });
  return query ? `${SELECT_SERVICE_PATH}?${query}` : SELECT_SERVICE_PATH;
}

/**
 * Logged-in client deep link: opens the booking flow on one local (and the
 * reward's service when it has one) carrying the reward id to apply at payment.
 */
export function buildUserRewardBookingPath(
  reward: Pick<LoyaltyReward, "id" | "serviceId">,
  localId: string,
) {
  const query = buildBookingSearch({
    localId,
    serviceId: reward.serviceId ?? null,
    rewardId: reward.id,
  });
  return query ? `${SELECT_SERVICE_PATH}?${query}` : SELECT_SERVICE_PATH;
}

/** Guest deep link: same shape, but carries the reward code as a coupon. */
export function buildGuestRewardBookingPath(
  reward: Pick<LoyaltyReward, "code" | "serviceId">,
  localId: string,
) {
  const query = buildBookingSearch({
    localId,
    serviceId: reward.serviceId ?? null,
    coupon: reward.code,
  });
  return query ? `${SELECT_SERVICE_PATH}?${query}` : SELECT_SERVICE_PATH;
}
