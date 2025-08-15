import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
  functions: {
    invoke: vi.fn(),
  },
};

vi.mock("https://esm.sh/@supabase/supabase-js@2.45.0", () => ({
  createClient: () => mockSupabaseClient,
}));

// Mock other dependencies
vi.mock("../utils.ts", () => ({
  generateXrplCurrencyCode: (symbol: string) => symbol.length <= 3 ? symbol : `HEX${symbol}`,
}));

vi.mock("../_shared/rateLimit.ts", () => ({
  rateLimit: () => null,
}));

vi.mock("../_shared/cors.ts", () => ({
  getCorsHeaders: () => ({ "Access-Control-Allow-Origin": "*" }),
}));

describe("tokenize-asset function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up environment variables
    Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
    Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-key");
    Deno.env.set("ALLOWED_ORIGIN", "*");
  });

  it("should return 403 for users without KYC verification", async () => {
    // Mock user authentication but failed KYC
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "test-user-id" } },
      error: null,
    });

    // Mock profile with pending KYC status
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { 
              subscription_tier: "standard", 
              kyc_status: "pending" 
            },
            error: null,
          }),
        }),
      }),
    });
    mockSupabaseClient.from.mockImplementation(mockFrom);

    const request = new Request("https://test.com", {
      method: "POST",
      headers: {
        "Authorization": "Bearer test-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        asset_name: "Test Asset",
        asset_symbol: "TEST",
        total_supply: 1000,
      }),
    });

    // Import the function module
    const module = await import("../../supabase/functions/tokenize-asset/index.ts");
    const response = await module.default(request);

    expect(response.status).toBe(403);
    
    const responseData = await response.json();
    expect(responseData.error).toBe("KYC verification required");
    expect(responseData.kyc_status).toBe("pending");
  });

  it("should return 403 for users with rejected KYC status", async () => {
    // Mock user authentication
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "test-user-id" } },
      error: null,
    });

    // Mock profile with rejected KYC status
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { 
              subscription_tier: "standard", 
              kyc_status: "rejected" 
            },
            error: null,
          }),
        }),
      }),
    });
    mockSupabaseClient.from.mockImplementation(mockFrom);

    const request = new Request("https://test.com", {
      method: "POST",
      headers: {
        "Authorization": "Bearer test-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        asset_name: "Test Asset",
        asset_symbol: "TEST",
        total_supply: 1000,
      }),
    });

    const module = await import("../../supabase/functions/tokenize-asset/index.ts");
    const response = await module.default(request);

    expect(response.status).toBe(403);
    
    const responseData = await response.json();
    expect(responseData.error).toBe("KYC verification required");
    expect(responseData.kyc_status).toBe("rejected");
  });

  it("should succeed for users with approved KYC status", async () => {
    // Mock user authentication
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "test-user-id" } },
      error: null,
    });

    // Mock database operations
    let callCount = 0;
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      callCount++;
      
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { 
                  subscription_tier: "standard", 
                  kyc_status: "approved" 
                },
                error: null,
              }),
            }),
          }),
        };
      }
      
      if (table === "tokenized_assets") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "asset-id",
                  asset_name: "Test Asset",
                  asset_symbol: "TEST",
                  total_supply: 1000,
                  xrpl_currency_code: "TEST",
                  xrpl_issuer_address: "rTEST123",
                },
                error: null,
              }),
            }),
          }),
        };
      }
      
      // For other tables (tokenization_events, asset_holdings, user_behavior_log)
      return {
        insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      };
    });
    
    mockSupabaseClient.from.mockImplementation(mockFrom);

    const request = new Request("https://test.com", {
      method: "POST",
      headers: {
        "Authorization": "Bearer test-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        asset_name: "Test Asset",
        asset_symbol: "TEST",
        total_supply: 1000,
      }),
    });

    const module = await import("../../supabase/functions/tokenize-asset/index.ts");
    const response = await module.default(request);

    expect(response.status).toBe(200);
    
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.asset.asset_symbol).toBe("TEST");
  });

  it("should return 400 for users with free subscription tier", async () => {
    // Mock user authentication
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "test-user-id" } },
      error: null,
    });

    // Mock profile with free tier
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { 
              subscription_tier: "free", 
              kyc_status: "approved" 
            },
            error: null,
          }),
        }),
      }),
    });
    mockSupabaseClient.from.mockImplementation(mockFrom);

    const request = new Request("https://test.com", {
      method: "POST",
      headers: {
        "Authorization": "Bearer test-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        asset_name: "Test Asset",
        asset_symbol: "TEST",
        total_supply: 1000,
      }),
    });

    const module = await import("../../supabase/functions/tokenize-asset/index.ts");
    const response = await module.default(request);

    expect(response.status).toBe(500);
    
    const responseData = await response.json();
    expect(responseData.error).toBe("Standard subscription required for tokenization");
  });

  it("should validate input data and return 400 for invalid requests", async () => {
    // Mock user authentication
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "test-user-id" } },
      error: null,
    });

    // Mock profile with approved status
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { 
              subscription_tier: "standard", 
              kyc_status: "approved" 
            },
            error: null,
          }),
        }),
      }),
    });
    mockSupabaseClient.from.mockImplementation(mockFrom);

    const request = new Request("https://test.com", {
      method: "POST",
      headers: {
        "Authorization": "Bearer test-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Missing required fields
        asset_name: "",
        total_supply: -1,
      }),
    });

    const module = await import("../../supabase/functions/tokenize-asset/index.ts");
    const response = await module.default(request);

    expect(response.status).toBe(400);
    
    const responseData = await response.json();
    expect(responseData.error).toBe("Invalid request data");
    expect(responseData.details).toContain("Asset name is required");
  });
});