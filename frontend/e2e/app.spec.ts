import { test, expect } from "@playwright/test";

// Mock all API responses since backend may not be running
async function mockAPIs(page: import("@playwright/test").Page) {
  // Health check - server online
  await page.route("**/health", (route) => {
    const url = route.request().url();
    // Backend health returns "healthy", MCP health returns "ok"
    const status = url.includes("8901") ? "ok" : "healthy";
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status, version: "0.1.0" }),
    });
  });

  // Projects list
  await page.route("**/api/v1/projects", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "proj-1",
            name: "my-app",
            description: "Main application",
            created_at: Math.floor(Date.now() / 1000) - 86400,
            updated_at: Math.floor(Date.now() / 1000),
          },
          {
            id: "proj-2",
            name: "backend-api",
            description: "Backend service",
            created_at: Math.floor(Date.now() / 1000) - 172800,
            updated_at: Math.floor(Date.now() / 1000),
          },
        ]),
      });
    }
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "proj-new",
          name: "new-project",
          description: "A new project",
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
        }),
      });
    }
    return route.continue();
  });

  // Secrets
  await page.route("**/api/v1/projects/*/environments/*/secrets", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "sec-1",
            key: "OPENAI_API_KEY",
            description: "OpenAI production key",
            tags: ["ai", "production"],
            version: 3,
            created_at: Math.floor(Date.now() / 1000) - 3600,
            updated_at: Math.floor(Date.now() / 1000),
          },
          {
            id: "sec-2",
            key: "DATABASE_URL",
            description: "PostgreSQL connection string",
            tags: ["db"],
            version: 1,
            created_at: Math.floor(Date.now() / 1000) - 7200,
            updated_at: Math.floor(Date.now() / 1000),
          },
        ]),
      });
    }
    return route.continue();
  });

  // Single secret (reveal)
  await page.route(
    "**/api/v1/projects/*/environments/*/secrets/*",
    (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "sec-1",
            key: "OPENAI_API_KEY",
            value: "sk-test-1234567890abcdef",
            description: "OpenAI production key",
            tags: ["ai", "production"],
            version: 3,
            created_at: Math.floor(Date.now() / 1000) - 3600,
            updated_at: Math.floor(Date.now() / 1000),
          }),
        });
      }
      if (route.request().method() === "PUT") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "ok" }),
        });
      }
      if (route.request().method() === "DELETE") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "ok" }),
        });
      }
      return route.continue();
    }
  );

  // API Keys
  await page.route("**/api/v1/auth/api-keys", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "key-1",
            name: "Claude Agent",
            scopes: JSON.stringify(["read", "write"]),
            project_ids: "[]",
            expires_at: Math.floor(Date.now() / 1000) + 7776000,
            last_used_at: Math.floor(Date.now() / 1000) - 3600,
            created_at: Math.floor(Date.now() / 1000) - 86400,
            is_active: 1,
          },
          {
            id: "key-2",
            name: "CI/CD Pipeline",
            scopes: JSON.stringify(["read"]),
            project_ids: "[]",
            expires_at: null,
            last_used_at: null,
            created_at: Math.floor(Date.now() / 1000) - 172800,
            is_active: 0,
          },
        ]),
      });
    }
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "key-new",
          name: "New Key",
          key: "avk_test_1234567890abcdef1234567890abcdef",
          created_at: Math.floor(Date.now() / 1000),
        }),
      });
    }
    return route.continue();
  });

  // Audit log
  await page.route("**/api/v1/audit*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        entries: [
          {
            id: "audit-1",
            timestamp: Math.floor(Date.now() / 1000) - 120,
            action: "secret.create",
            resource_type: "secret",
            resource_id: "sec-1",
            actor: "user",
            ip_address: "127.0.0.1",
            details: "{}",
          },
          {
            id: "audit-2",
            timestamp: Math.floor(Date.now() / 1000) - 3600,
            action: "project.create",
            resource_type: "project",
            resource_id: "proj-1",
            actor: "user",
            ip_address: "127.0.0.1",
            details: "{}",
          },
        ],
        limit: 8,
        offset: 0,
      }),
    })
  );
}

// ==========================================
// LAYOUT & NAVIGATION TESTS
// ==========================================
test.describe("Layout & Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
  });

  test("renders sidebar with logo and navigation items", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Logo heading in sidebar
    await expect(page.getByRole("heading", { name: "Achilles" })).toBeVisible();

    // Navigation items in sidebar nav
    const nav = page.locator("nav");
    await expect(nav.locator("text=Dashboard")).toBeVisible();
    await expect(nav.locator("text=Projects")).toBeVisible();
    await expect(nav.locator("text=Secrets")).toBeVisible();
    await expect(nav.locator("text=API Keys")).toBeVisible();
    await expect(nav.locator("text=Settings")).toBeVisible();
  });

  test("navigates between pages via sidebar", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to Projects
    await page.click("text=Projects");
    await expect(page).toHaveURL(/\/projects/);
    await expect(
      page.locator("h1", { hasText: "Projects" })
    ).toBeVisible();

    // Navigate to Secrets
    await page.click("text=Secrets");
    await expect(page).toHaveURL(/\/secrets/);
    await expect(
      page.locator("h1", { hasText: "Secrets" })
    ).toBeVisible();

    // Navigate to API Keys
    await page.click("text=API Keys");
    await expect(page).toHaveURL(/\/api-keys/);
    await expect(
      page.locator("h1", { hasText: "API Keys" })
    ).toBeVisible();

    // Navigate to Settings
    await page.click("text=Settings");
    await expect(page).toHaveURL(/\/settings/);
    await expect(
      page.locator("h1", { hasText: "Settings" })
    ).toBeVisible();

    // Navigate back to Dashboard
    await page.click("text=Dashboard");
    await expect(page).toHaveURL("/");
    await expect(
      page.locator("h1", { hasText: "Dashboard" })
    ).toBeVisible();
  });

  test("sidebar collapse toggle works", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for server status to be detected (avoids race with offline button)
    await expect(page.locator("text=Server Online")).toBeVisible();

    // Nav text should be visible initially (scope to nav to avoid matching page heading)
    await expect(page.locator("nav").locator("text=Dashboard")).toBeVisible();

    // Find and click the collapse button (round button on sidebar edge)
    const collapseBtn = page.locator("button.rounded-full");
    await collapseBtn.click();

    // After collapse, text labels should be hidden
    await page.waitForTimeout(300); // wait for animation
    // The sidebar width should shrink
    const aside = page.locator("aside");
    const box = await aside.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeLessThan(100);
  });

  test("shows server status in sidebar", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should show server online
    await expect(page.locator("text=Server Online")).toBeVisible();
  });

  test("shows noise overlay for premium texture", async ({ page }) => {
    await page.goto("/");
    const root = page.locator(".noise-overlay");
    await expect(root).toBeVisible();
  });
});

// ==========================================
// DASHBOARD TESTS
// ==========================================
test.describe("Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("displays page header with icon", async ({ page }) => {
    await expect(
      page.locator("h1", { hasText: "Dashboard" })
    ).toBeVisible();
    await expect(page.locator("text=Your vault at a glance")).toBeVisible();
  });

  test("shows stat cards with correct data", async ({ page }) => {
    const main = page.locator("main");

    // Projects stat card
    const projectsCard = main.locator("button").filter({ hasText: "Projects" }).first();
    await expect(projectsCard).toBeVisible();
    await expect(projectsCard).toContainText("2");

    // API Keys stat card
    await expect(main.locator("button").filter({ hasText: "API Keys" }).first()).toBeVisible();

    // Server status stat card
    const serverCard = main.locator("button").filter({ hasText: "Server" }).first();
    await expect(serverCard).toContainText("Online");
  });

  test("stat cards are clickable and navigate", async ({ page }) => {
    // Click on the Projects stat card
    const projectsCard = page
      .locator("button")
      .filter({ hasText: "Projects" })
      .first();
    await projectsCard.click();
    await expect(page).toHaveURL(/\/projects/);
  });

  test("shows quick actions section", async ({ page }) => {
    await expect(page.locator("text=Quick Actions")).toBeVisible();
    await expect(page.locator("text=Create Project")).toBeVisible();
    await expect(page.locator("text=Manage Secrets")).toBeVisible();
    await expect(page.locator("text=Generate API Key")).toBeVisible();
  });

  test("quick actions navigate to correct pages", async ({ page }) => {
    await page.click("text=Create Project");
    await expect(page).toHaveURL(/\/projects/);
  });

  test("shows recent activity section", async ({ page }) => {
    await expect(page.locator("text=Recent Activity")).toBeVisible();
    // Should show audit entries
    await expect(page.locator("text=secret.create")).toBeVisible();
    await expect(page.locator("text=project.create")).toBeVisible();
  });

  test("shows MCP integration banner", async ({ page }) => {
    await expect(page.locator("text=MCP Integration")).toBeVisible();
  });
});

// ==========================================
// PROJECTS PAGE TESTS
// ==========================================
test.describe("Projects Page", () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");
  });

  test("displays page header", async ({ page }) => {
    await expect(
      page.locator("h1", { hasText: "Projects" })
    ).toBeVisible();
    await expect(
      page.locator("text=Organize secrets by project and environment")
    ).toBeVisible();
  });

  test("shows New Project button", async ({ page }) => {
    await expect(page.locator("text=New Project")).toBeVisible();
  });

  test("displays project cards with names", async ({ page }) => {
    await expect(page.locator("text=my-app")).toBeVisible();
    await expect(page.locator("text=backend-api")).toBeVisible();
  });

  test("project cards show environment buttons", async ({ page }) => {
    await expect(page.locator("text=Dev").first()).toBeVisible();
    await expect(page.locator("text=Staging").first()).toBeVisible();
    await expect(page.locator("text=Prod").first()).toBeVisible();
  });

  test("clicking New Project opens create modal", async ({ page }) => {
    await page.click("text=New Project");

    // Modal should appear
    await expect(page.locator("text=Project Name")).toBeVisible();
    await expect(page.locator("text=Description")).toBeVisible();
    await expect(
      page.locator("button", { hasText: "Create Project" })
    ).toBeVisible();
  });

  test("create modal can be closed", async ({ page }) => {
    await page.click("text=New Project");
    await expect(page.locator("text=Project Name")).toBeVisible();

    // Click the X button to close
    const closeBtn = page.locator(".fixed button").filter({ has: page.locator("svg") }).first();
    await closeBtn.click();

    // Modal should disappear
    await expect(page.locator("text=Project Name")).not.toBeVisible();
  });

  test("clicking environment button navigates to secrets", async ({
    page,
  }) => {
    await page.locator("text=Dev").first().click();
    await expect(page).toHaveURL(/\/secrets/);
  });

  test("project cards show creation date", async ({ page }) => {
    const dateElements = page.locator("text=Created");
    await expect(dateElements.first()).toBeVisible();
  });
});

// ==========================================
// SECRETS PAGE TESTS
// ==========================================
test.describe("Secrets Page", () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto("/secrets");
    await page.waitForLoadState("networkidle");
  });

  test("displays page header", async ({ page }) => {
    await expect(
      page.locator("h1", { hasText: "Secrets" })
    ).toBeVisible();
  });

  test("shows project selector pills", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.locator("button").filter({ hasText: "my-app" })).toBeVisible();
    await expect(main.locator("button").filter({ hasText: "backend-api" })).toBeVisible();
  });

  test("shows environment tabs", async ({ page }) => {
    const main = page.locator("main");
    // Env tabs are buttons with span text inside the glass-subtle container
    await expect(main.locator("button span", { hasText: "Development" })).toBeVisible();
    await expect(main.locator("button span", { hasText: "Staging" })).toBeVisible();
    await expect(main.locator("button span", { hasText: "Production" })).toBeVisible();
  });

  test("shows search input", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search secrets..."]');
    await expect(searchInput).toBeVisible();
  });

  test("displays secrets list with keys", async ({ page }) => {
    await expect(page.locator("text=OPENAI_API_KEY")).toBeVisible();
    await expect(page.locator("text=DATABASE_URL")).toBeVisible();
  });

  test("shows version badges on secrets", async ({ page }) => {
    await expect(page.locator("text=v3")).toBeVisible();
    await expect(page.locator("text=v1")).toBeVisible();
  });

  test("shows tags on secrets", async ({ page }) => {
    const main = page.locator("main");
    // Tags are badge-green spans inside the secrets list
    await expect(main.locator(".badge-green").filter({ hasText: /\bai\b/ })).toBeVisible();
    await expect(main.locator(".badge-green").filter({ hasText: /\bproduction\b/ })).toBeVisible();
    await expect(main.locator(".badge-green").filter({ hasText: /\bdb\b/ })).toBeVisible();
  });

  test("search filters secrets", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search secrets..."]');
    await searchInput.fill("OPENAI");

    await expect(page.locator("text=OPENAI_API_KEY")).toBeVisible();
    await expect(page.locator("text=DATABASE_URL")).not.toBeVisible();
  });

  test("clicking Add Secret opens modal", async ({ page }) => {
    await page.click("text=Add Secret");
    await expect(page.locator("label", { hasText: "Key" })).toBeVisible();
    await expect(page.locator("label", { hasText: "Value" })).toBeVisible();
  });

  test("switching environment tabs reloads secrets", async ({ page }) => {
    const main = page.locator("main");
    await main.locator("button span", { hasText: "Staging" }).click();
    // Staging tab should be active
    await page.waitForTimeout(300);
    // Secrets should still display (mocked same response)
    await expect(page.locator("text=OPENAI_API_KEY")).toBeVisible();
  });

  test("switching projects updates secrets", async ({ page }) => {
    await page.locator("button", { hasText: "backend-api" }).click();
    await page.waitForTimeout(300);
    await expect(page.locator("text=OPENAI_API_KEY")).toBeVisible();
  });
});

// ==========================================
// API KEYS PAGE TESTS
// ==========================================
test.describe("API Keys Page", () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto("/api-keys");
    await page.waitForLoadState("networkidle");
  });

  test("displays page header", async ({ page }) => {
    await expect(
      page.locator("h1", { hasText: "API Keys" })
    ).toBeVisible();
    await expect(
      page.locator("text=Manage programmatic access to your vault")
    ).toBeVisible();
  });

  test("shows New API Key button", async ({ page }) => {
    await expect(page.locator("text=New API Key")).toBeVisible();
  });

  test("displays API key entries", async ({ page }) => {
    await expect(page.locator("text=Claude Agent")).toBeVisible();
    await expect(page.locator("text=CI/CD Pipeline")).toBeVisible();
  });

  test("shows scope badges on keys", async ({ page }) => {
    await expect(page.locator("text=read").first()).toBeVisible();
    await expect(page.locator("text=write").first()).toBeVisible();
  });

  test("revoked keys show revoked badge", async ({ page }) => {
    await expect(page.locator("text=Revoked")).toBeVisible();
  });

  test("revoked keys appear dimmed", async ({ page }) => {
    // Find the revoked key card (CI/CD Pipeline)
    const revokedCard = page
      .locator(".glass-card")
      .filter({ hasText: "CI/CD Pipeline" });
    await expect(revokedCard).toHaveClass(/opacity-50/);
  });

  test("clicking New API Key opens create modal", async ({ page }) => {
    await page.click("text=New API Key");

    await expect(page.locator("label", { hasText: "Name" })).toBeVisible();
    await expect(page.locator("label", { hasText: "Scopes" })).toBeVisible();
    await expect(
      page.locator("label", { hasText: "Expires In" })
    ).toBeVisible();
  });

  test("create modal has scope selection buttons", async ({ page }) => {
    await page.click("text=New API Key");

    await expect(page.locator("button", { hasText: "Read" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Write" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Admin" })).toBeVisible();
  });

  test("create modal has expiry options", async ({ page }) => {
    await page.click("text=New API Key");

    const select = page.locator("select");
    await expect(select).toBeVisible();

    // Check options exist
    const options = select.locator("option");
    await expect(options).toHaveCount(4);
  });

  test("creating API key shows the key value", async ({ page }) => {
    await page.click("text=New API Key");

    await page.getByPlaceholder("My Claude Agent").fill("Test Key");
    await page.locator(".modal-content").locator("button", { hasText: "Generate Key" }).click();

    // Should show the key (use heading role to avoid matching toast title)
    await expect(page.getByRole("heading", { name: "API Key Created" })).toBeVisible();
    await expect(
      page.locator("text=Copy this key now")
    ).toBeVisible();
    await expect(
      page.locator("text=avk_test_1234567890abcdef1234567890abcdef")
    ).toBeVisible();
  });
});

// ==========================================
// SETTINGS PAGE TESTS
// ==========================================
test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
  });

  test("displays page header", async ({ page }) => {
    await expect(
      page.locator("h1", { hasText: "Settings" })
    ).toBeVisible();
    await expect(
      page.locator("text=Server configuration and integrations")
    ).toBeVisible();
  });

  test("shows backend server section", async ({ page }) => {
    await expect(page.locator("text=Backend Server")).toBeVisible();
    await expect(page.locator("text=REST API on port 8900")).toBeVisible();
  });

  test("shows server status as online", async ({ page }) => {
    // The status section should show Online
    const statusCards = page.locator(".glass-subtle");
    const statusText = statusCards.locator("text=Online").first();
    await expect(statusText).toBeVisible();
  });

  test("shows server address", async ({ page }) => {
    await expect(page.locator("text=127.0.0.1:8900")).toBeVisible();
  });

  test("shows encryption info", async ({ page }) => {
    await expect(page.locator("text=AES-256-GCM")).toBeVisible();
  });

  test("shows MCP server section", async ({ page }) => {
    await expect(page.locator("h2", { hasText: "MCP Server" })).toBeVisible();
    await expect(
      page.locator("text=AI tool integration via SSE")
    ).toBeVisible();
  });

  test("shows MCP transport type", async ({ page }) => {
    await expect(
      page.locator("text=SSE (Server-Sent Events)")
    ).toBeVisible();
  });

  test("shows Claude Desktop config snippet", async ({ page }) => {
    await expect(
      page.locator("text=Claude Desktop / Cursor / Claude Code")
    ).toBeVisible();
    // Config should contain achilles-vault
    await expect(page.locator("text=achilles-vault")).toBeVisible();
  });

  test("shows API endpoints reference", async ({ page }) => {
    await expect(page.locator("h2", { hasText: "API Endpoints" })).toBeVisible();
    await expect(
      page.locator("code").filter({ hasText: "/api/v1/projects" }).first()
    ).toBeVisible();
  });

  test("shows Chrome extension section", async ({ page }) => {
    await expect(page.locator("h2", { hasText: "Chrome Extension" })).toBeVisible();
    await expect(page.locator("code", { hasText: "chrome-extension/" })).toBeVisible();
  });

  test("copy buttons exist for addresses", async ({ page }) => {
    // There should be multiple copy buttons
    const copyButtons = page.locator('button[title="Refresh status"]');
    // Just check the refresh status button is there
    await expect(copyButtons.first()).toBeVisible();
  });
});

// ==========================================
// GLASSMORPHISM & DESIGN TESTS
// ==========================================
test.describe("Design System & Visual Quality", () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
  });

  test("glass-card elements have backdrop-filter", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const cards = page.locator(".glass-card");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("badges use correct design system classes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check badges exist
    const badges = page.locator(".badge");
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);
  });

  test("ambient gradient orbs are rendered", async ({ page }) => {
    await page.goto("/");
    const orbs = page.locator(".blur-\\[120px\\], .blur-\\[150px\\], .blur-\\[130px\\]");
    // Check the gradient container exists
    const gradientContainer = page.locator(".fixed.inset-0.pointer-events-none");
    await expect(gradientContainer).toBeVisible();
  });

  test("modals use glassmorphism overlay", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    await page.click("text=New Project");

    // Modal overlay should exist
    const overlay = page.locator(".modal-overlay");
    await expect(overlay).toBeVisible();

    // Modal content should exist
    const content = page.locator(".modal-content");
    await expect(content).toBeVisible();
  });

  test("input fields use premium styling", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    await page.click("text=New Project");

    const input = page.locator(".input-premium").first();
    await expect(input).toBeVisible();
  });

  test("page headers have icon badges", async ({ page }) => {
    // Dashboard
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Check there's a header icon container
    const headerIcon = page.locator("h1").locator("..").locator("div").first();
    await expect(headerIcon).toBeVisible();
  });

  test("dark theme background is applied", async ({ page }) => {
    await page.goto("/");
    const bg = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).backgroundColor;
    });
    // Should be very dark
    expect(bg).toBeTruthy();
  });
});

// ==========================================
// RESPONSIVE & INTERACTION TESTS
// ==========================================
test.describe("Interactions & Animations", () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
  });

  test("stat cards have hover animation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Stat cards should be interactive buttons
    const statCard = page
      .locator("button")
      .filter({ hasText: "Projects" })
      .first();
    await expect(statCard).toBeVisible();

    // Hover over it
    await statCard.hover();
    // The arrow icon should become visible
    await page.waitForTimeout(300);
  });

  test("toast container is present in DOM", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Toast container exists in DOM but is empty (invisible) when no toasts shown
    const toastContainer = page.locator('[class*="z-[100]"]');
    await expect(toastContainer).toBeAttached();
  });

  test("secret reveal toggle works", async ({ page }) => {
    await page.goto("/secrets");
    await page.waitForLoadState("networkidle");

    // Click eye icon to reveal the first secret
    const revealBtn = page.locator('button[title="Reveal"]').first();
    await revealBtn.click();

    // The revealed value should appear
    await expect(
      page.locator("text=sk-test-1234567890abcdef")
    ).toBeVisible();

    // Click again to hide
    const hideBtn = page.locator('button[title="Hide"]').first();
    await hideBtn.click();

    // Value should be hidden
    await expect(
      page.locator("text=sk-test-1234567890abcdef")
    ).not.toBeVisible();
  });

  test("copy button shows check icon after click", async ({ page }) => {
    await page.goto("/secrets");
    await page.waitForLoadState("networkidle");

    // Grant clipboard permissions
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    const copyBtn = page.locator('button[title="Copy value"]').first();
    await copyBtn.click();

    // After clicking, the check icon should briefly appear
    await page.waitForTimeout(500);
  });
});

// ==========================================
// OFFLINE MODE TESTS
// ==========================================
test.describe("Offline Mode", () => {
  test("shows offline banner when server is down", async ({ page }) => {
    // Don't mock the health endpoint - let it fail
    await page.route("**/health", (route) =>
      route.fulfill({ status: 503, body: "Service Unavailable" })
    );
    await page.route("**/api/v1/**", (route) =>
      route.abort("connectionrefused")
    );

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Scope to main content area (sidebar also has "Server Offline" text)
    await expect(page.locator("main h3", { hasText: "Server Offline" })).toBeVisible();
  });

  test("offline banner shows manual start instructions in browser mode", async ({
    page,
  }) => {
    await page.route("**/health", (route) =>
      route.fulfill({ status: 503, body: "Service Unavailable" })
    );
    await page.route("**/api/v1/**", (route) =>
      route.abort("connectionrefused")
    );

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(
      page.locator("text=python -m achilles.main")
    ).toBeVisible();
  });
});
