import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useFileUpload } from "../src/hooks/use-file-upload";

// Mock Supabase
const mockSupabase = {
  storage: {
    listBuckets: vi.fn(),
    createBucket: vi.fn(),
    from: vi.fn(() => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
      createSignedUrl: vi.fn(),
    })),
  },
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

describe("useFileUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful bucket operations
    mockSupabase.storage.listBuckets.mockResolvedValue({
      data: [{ name: "test-bucket", public: true }],
    });
    
    const mockFrom = {
      upload: vi.fn().mockResolvedValue({
        data: { path: "test-path/file.jpg" },
        error: null,
      }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: "https://example.com/file.jpg" },
      }),
      createSignedUrl: vi.fn().mockResolvedValue({
        data: { signedUrl: "https://example.com/signed-file.jpg" },
        error: null,
      }),
    };
    
    mockSupabase.storage.from.mockReturnValue(mockFrom);
  });

  it("initializes with correct default state", () => {
    const { result } = renderHook(() => useFileUpload());

    expect(result.current.uploading).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.uploadFiles).toBe("function");
  });

  it("validates file types", async () => {
    const { result } = renderHook(() => useFileUpload());

    // Create invalid file
    const invalidFile = new File(["test"], "test.exe", {
      type: "application/x-executable",
    });

    await expect(
      result.current.uploadFiles([invalidFile])
    ).rejects.toThrow("File type application/x-executable is not allowed");
  });

  it("validates file sizes", async () => {
    const { result } = renderHook(() => useFileUpload());

    // Create oversized file (100MB)
    const oversizedFile = new File([new ArrayBuffer(100 * 1024 * 1024)], "large.jpg", {
      type: "image/jpeg",
    });

    await expect(
      result.current.uploadFiles([oversizedFile])
    ).rejects.toThrow("exceeds maximum size");
  });

  it("uploads valid files successfully", async () => {
    const { result } = renderHook(() => useFileUpload());

    const validFile = new File(["test content"], "test.jpg", {
      type: "image/jpeg",
    });

    let uploadResult;
    await act(async () => {
      uploadResult = await result.current.uploadFiles([validFile]);
    });

    expect(uploadResult).toHaveLength(1);
    expect(uploadResult[0]).toEqual({
      name: "test.jpg",
      url: "https://example.com/file.jpg",
      size: validFile.size,
      type: "image/jpeg",
    });
  });

  it("uses signed URLs for private buckets", async () => {
    // Mock private bucket
    mockSupabase.storage.listBuckets.mockResolvedValue({
      data: [{ name: "test-bucket", public: false }],
    });

    const { result } = renderHook(() => useFileUpload());

    const validFile = new File(["test content"], "test.jpg", {
      type: "image/jpeg",
    });

    let uploadResult;
    await act(async () => {
      uploadResult = await result.current.uploadFiles([validFile]);
    });

    expect(uploadResult[0].url).toBe("https://example.com/signed-file.jpg");
  });

  it("generates crypto-secure filenames", async () => {
    const { result } = renderHook(() => useFileUpload());

    const validFile = new File(["test content"], "test.jpg", {
      type: "image/jpeg",
    });

    // Mock crypto.randomUUID
    const mockUUID = "123e4567-e89b-12d3-a456-426614174000";
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => mockUUID),
    });

    await act(async () => {
      await result.current.uploadFiles([validFile]);
    });

    // Check that the upload was called with UUID-based filename
    expect(mockSupabase.storage.from().upload).toHaveBeenCalledWith(
      `${mockUUID}.jpg`,
      validFile,
      expect.any(Object)
    );
  });

  it("handles upload errors gracefully", async () => {
    const mockFrom = {
      upload: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Upload failed" },
      }),
      getPublicUrl: vi.fn(),
      createSignedUrl: vi.fn(),
    };
    
    mockSupabase.storage.from.mockReturnValue(mockFrom);

    const { result } = renderHook(() => useFileUpload());

    const validFile = new File(["test content"], "test.jpg", {
      type: "image/jpeg",
    });

    await expect(
      result.current.uploadFiles([validFile])
    ).rejects.toThrow("Failed to upload test.jpg: Upload failed");
  });
});