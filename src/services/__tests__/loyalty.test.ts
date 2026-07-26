import { beforeEach, describe, expect, it, vi } from "vitest";
import { loyaltyService } from "@/services/loyalty";

const { mockApiService } = vi.hoisted(() => ({
  mockApiService: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({
  apiService: mockApiService,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loyaltyService.completeAppointmentForDevelopment", () => {
  it("completes the selected appointment through the development endpoint", async () => {
    const completion = {
      appointment: { id: 42, state: "COMPLETED" as const },
      loyalty: {
        cardCreated: true,
        stampsApplied: 1,
        rewardsGenerated: 0,
        notificationAttempted: true,
      },
    };
    mockApiService.post.mockResolvedValue({ data: completion });

    await expect(
      loyaltyService.completeAppointmentForDevelopment("local-1", 42),
    ).resolves.toEqual(completion);
    expect(mockApiService.post).toHaveBeenCalledWith(
      "/loyalty/local/local-1/dev/complete-appointment/42",
    );
  });
});

describe("loyaltyService.validateBookingCoupon", () => {
  it("validates a coupon without sending an email or reward id", async () => {
    const validation = {
      valid: true as const,
      benefit: "20% de descuento",
      type: "PERCENTAGE_DISCOUNT" as const,
      discountAmount: 200,
      finalAmount: 800,
      expiresAt: null,
      serviceName: null,
    };
    mockApiService.post.mockResolvedValue({ data: validation });

    await expect(
      loyaltyService.validateBookingCoupon({
        localId: "local-1",
        serviceId: 10,
        code: "coupon123",
      }),
    ).resolves.toEqual(validation);
    expect(mockApiService.post).toHaveBeenCalledWith(
      "/loyalty/booking/coupon/validate",
      {
        localId: "local-1",
        serviceId: 10,
        code: "coupon123",
      },
    );
  });
});
