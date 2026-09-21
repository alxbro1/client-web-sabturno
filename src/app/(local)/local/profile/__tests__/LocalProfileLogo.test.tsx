import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LocalProfilePage from "../page";

const {
  mockGetLocal,
  mockInvalidateQueries,
  mockUpdateLocal,
  mockUploadLocalLogo,
  mockUpdateUserProfile,
} = vi.hoisted(() => ({
  mockGetLocal: vi.fn(),
  mockInvalidateQueries: vi.fn(),
  mockUpdateLocal: vi.fn(),
  mockUploadLocalLogo: vi.fn(),
  mockUpdateUserProfile: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "local-1", name: "Peluqueria Centro" },
    updateUserProfile: mockUpdateUserProfile,
  }),
}));

vi.mock("@/features/local/services/local.service", () => ({
  localService: { getLocal: mockGetLocal, updateLocal: mockUpdateLocal },
}));

vi.mock("@/features/local/services/localImages.service", () => ({
  localImagesService: { uploadLocalLogo: mockUploadLocalLogo },
}));

// `compressImage` usa <canvas> y el evento load de una <img>, que jsdom no
// implementa: sin este mock la promesa nunca resuelve y el test cuelga.
vi.mock("@/features/local/utils/imageUploadUtils", () => ({
  imageUploadUtils: { compressImage: vi.fn(async (uri: string) => uri) },
}));

function localFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "local-1",
    name: "Peluqueria Centro",
    email: "peluqueria.centro@dev.sabturno",
    province: "Buenos Aires",
    city: "CABA",
    address: "Calle 123",
    phone: "1122334455",
    isActive: true,
    notifyNewAppointmentWhatsapp: false,
    imageProfile: null,
    ...overrides,
  };
}

function imageFile(name = "logo.png", size = 1024) {
  const file = new File(["x"], name, { type: "image/png" });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function logoInput() {
  return document.getElementById("local-logo-input") as HTMLInputElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateLocal.mockResolvedValue(localFixture());
});

describe("LocalProfilePage logo upload", () => {
  it("muestra el logo actual del local cuando ya tiene uno", async () => {
    mockGetLocal.mockResolvedValue(
      localFixture({ imageProfile: "https://cdn.test/logo.png" }),
    );

    render(<LocalProfilePage />);

    const logo = await screen.findByAltText("Logo del local");
    expect(logo).toHaveAttribute("src", "https://cdn.test/logo.png");
    expect(screen.getByText("Este es el logo actual.")).toBeInTheDocument();
  });

  it("rechaza un archivo de mas de 5MB sin llamar al endpoint", async () => {
    mockGetLocal.mockResolvedValue(localFixture());

    render(<LocalProfilePage />);
    await screen.findByText("Todavía no cargaste un logo.");

    fireEvent.change(logoInput(), {
      target: { files: [imageFile("grande.png", 6 * 1024 * 1024)] },
    });

    expect(
      await screen.findByText("La imagen no puede pesar mas de 5MB."),
    ).toBeInTheDocument();
    expect(mockUploadLocalLogo).not.toHaveBeenCalled();
  });

  it("sube el logo elegido y refresca el cache del local", async () => {
    mockGetLocal.mockResolvedValue(localFixture());
    mockUploadLocalLogo.mockResolvedValue({
      image: "https://cdn.test/nuevo.png",
    });

    render(<LocalProfilePage />);
    await screen.findByText("Todavía no cargaste un logo.");

    fireEvent.change(logoInput(), { target: { files: [imageFile()] } });

    const save = await screen.findByRole("button", { name: "Guardar logo" });
    expect(screen.getByText("Imagen nueva sin guardar.")).toBeInTheDocument();

    fireEvent.click(save);

    await waitFor(() => expect(mockUploadLocalLogo).toHaveBeenCalledTimes(1));
    expect(mockUploadLocalLogo.mock.calls[0][0]).toBe("local-1");
    expect(mockUploadLocalLogo.mock.calls[0][1].uri).toMatch(/^data:image\//);

    expect(await screen.findByText("Logo actualizado")).toBeInTheDocument();
    expect(mockUpdateUserProfile).toHaveBeenCalledWith({
      imageProfile: "https://cdn.test/nuevo.png",
    });
    expect(mockInvalidateQueries).toHaveBeenCalled();
  });

  it("muestra un error cuando el endpoint falla", async () => {
    mockGetLocal.mockResolvedValue(localFixture());
    mockUploadLocalLogo.mockResolvedValue(null);

    render(<LocalProfilePage />);
    await screen.findByText("Todavía no cargaste un logo.");

    fireEvent.change(logoInput(), { target: { files: [imageFile()] } });
    fireEvent.click(await screen.findByRole("button", { name: "Guardar logo" }));

    expect(
      await screen.findByText("No pudimos subir el logo. Proba de nuevo."),
    ).toBeInTheDocument();
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });
});
